import Cookies from 'js-cookie';
import { User, UserCreate, UserUpdate, LoginRequest, LoginResponse, TokenResponse, UserStats } from '../types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const ACCESS_KEY   = 'access_token';
const REFRESH_KEY  = 'refresh_token';
const COOKIE_TOKEN = 'jmk_access_token';
const COOKIE_USER  = 'jmk_user';

// ─── JWT helpers ─────────────────────────────────────────────────────────────

function getJwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isExpiredOrNear(token: string, bufferSeconds = 300): boolean {
  const exp = getJwtExpiry(token);
  if (exp === null) return true;
  return exp - bufferSeconds < Math.floor(Date.now() / 1000);
}

// Leading-dot domain so the cookie is shared across all *.jmkfacilities.ie
// subdomains. Returns undefined on localhost so the cookie still sets
// (scoped to localhost) without throwing.
function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.hostname.endsWith('jmkfacilities.ie')
    ? '.jmkfacilities.ie'
    : undefined;
}

function cookieOptions(expires?: Date): Cookies.CookieAttributes {
  return {
    domain:   getCookieDomain(),
    path:     '/',
    secure:   typeof window !== 'undefined' && window.location.protocol === 'https:',
    sameSite: 'lax',
    expires,
  };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function getStoredTokens() {
  return {
    access:  localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  };
}

function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY,  accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);

  // Mirror the access token in a cross-subdomain cookie
  const exp     = getJwtExpiry(accessToken);
  const expires = exp ? new Date(exp * 1000) : undefined;
  Cookies.set(COOKIE_TOKEN, accessToken, cookieOptions(expires));
}

function storeUserCookie(user: User): void {
  // Store minimal user data so subdomains can hydrate localStorage
  Cookies.set(COOKIE_USER, JSON.stringify(user), cookieOptions(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  ));
}

function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('user');

  const opts = { domain: getCookieDomain(), path: '/' };
  Cookies.remove(COOKIE_TOKEN, opts);
  Cookies.remove(COOKIE_USER,  opts);
}

function redirectToLogin(): void {
  const redirect = window.location.pathname + window.location.search;
  window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
}

// ─── Standalone exports (used by RouteGuard & projects layout) ────────────────

export async function silentRefresh(): Promise<boolean> {
  const { refresh } = getStoredTokens();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data: TokenResponse = await res.json();
    storeTokens(data.access_token, data.refresh_token);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      storeUserCookie(data.user);
    }
    return true;
  } catch {
    return false;
  }
}

// Authentication is determined ONLY by a present, non-expired access token.
// Public areas (login, password reset, /training/) are handled by RouteGuard's
// public-path allowlist — they must never be treated as "authenticated", or an
// unauthenticated visitor would inherit a logged-in session everywhere.
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const { access } = getStoredTokens();
  if (!access) return false;
  return !isExpiredOrNear(access, 0);
}

// Module-level apiFetch — returns raw Response; re-exported by utils/api.ts
export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  let { access } = getStoredTokens();

  console.log('[apiFetch] token present:', !!access, '| url:', input.toString().split('?')[0]);

  if (access && isExpiredOrNear(access)) {
    const ok = await silentRefresh();
    if (!ok) { clearTokens(); redirectToLogin(); throw new Error('Session expired'); }
    access = getStoredTokens().access;
  }

  // For FormData bodies, omit Content-Type so the browser sets the multipart
  // boundary itself — forcing application/json would corrupt file uploads.
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;

  const buildHeaders = (token: string | null): Record<string, string> => ({
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> || {}),
  });

  let res = await fetch(input, { ...init, headers: buildHeaders(access) });

  if (res.status === 401) {
    const ok = await silentRefresh();
    if (!ok) { clearTokens(); redirectToLogin(); throw new Error('Unauthorized'); }
    access = getStoredTokens().access;
    res = await fetch(input, { ...init, headers: buildHeaders(access) });
  }

  if (res.status === 401) { clearTokens(); redirectToLogin(); throw new Error('Unauthorized'); }

  if (res.status === 403 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jmk:forbidden', {
      detail: { message: "You don't have access to this resource" },
    }));
  }

  return res;
}

// ─── Internal JSON fetch used by UserService class methods ───────────────────

async function classFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await apiFetch(`${API_BASE_URL}${endpoint}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Result type for user creation with email status ─────────────────────────

interface CreateUserResult {
  user:        User;
  emailSent:   boolean;
  emailError?: string;
}

// ─── UserService class ───────────────────────────────────────────────────────

class UserService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/api/users/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid credentials');
    }
    const data: TokenResponse = await res.json();
    storeTokens(data.access_token, data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    storeUserCookie(data.user);
    return data;
  }

  async logout(): Promise<void> {
    try {
      await classFetch('/api/users/auth/logout', { method: 'POST' });
    } finally {
      clearTokens(); // clears localStorage + both cookies
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return isAuthenticated();
  }

  async getUsers(filters?: {
    role?:   string;
    hotel?:  string;
    status?: string;
    search?: string;
  }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.role)                           params.append('role',   filters.role);
    if (filters?.hotel && filters.hotel !== 'All Hotels') params.append('hotel', filters.hotel);
    if (filters?.status)                         params.append('status', filters.status);
    if (filters?.search)                         params.append('search', filters.search);
    return classFetch<User[]>(`/api/users/?${params}`);
  }

  async getUser(userId: string): Promise<User> {
    return classFetch<User>(`/api/users/${userId}`);
  }

  async createUser(userData: UserCreate, sendWelcomeEmail = false): Promise<CreateUserResult> {
    const user = await classFetch<User>('/api/users/', {
      method: 'POST',
      body:   JSON.stringify(userData),
    });

    let emailSent  = false;
    let emailError: string | undefined;

    if (sendWelcomeEmail) {
      try {
        await this.sendWelcomeEmail(user.id.toString());
        emailSent = true;
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Failed to send welcome email';
      }
    }

    return { user, emailSent, emailError };
  }

  async updateUser(userId: string, userData: UserUpdate): Promise<User> {
    return classFetch<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body:   JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await classFetch(`/api/users/${userId}`, { method: 'DELETE' });
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    await classFetch(`/api/users/${userId}/reset-password`, {
      method: 'POST',
      body:   JSON.stringify({ email: '', new_password: newPassword }),
    });
  }

  async activateUser(userId: string): Promise<void> {
    await classFetch(`/api/users/${userId}/activate`, { method: 'POST' });
  }

  async getUserStats(): Promise<UserStats> {
    return classFetch<UserStats>('/api/users/stats/summary');
  }

  async sendWelcomeEmail(userId: string): Promise<void> {
    await classFetch(`/api/users/auth/send-welcome-email/${userId}`, { method: 'POST' });
  }
}

export const userService = new UserService();
