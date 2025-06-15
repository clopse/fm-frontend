// src/services/userService.ts
import { User, UserCreate, UserUpdate, LoginRequest, LoginResponse, UserStats } from '../types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Enhanced types for secure auth
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  expires_in: number;
}

interface StandardResponse {
  message: string;
  success: boolean;
}

// Secure token management
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static USER_KEY = 'user';
  private static TOKEN_EXPIRY_KEY = 'token_expiry';

  static setTokens(tokenResponse: TokenResponse): void {
    if (typeof window === 'undefined') return;
    
    try {
      const expiryTime = Date.now() + (tokenResponse.expires_in * 1000);
      
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokenResponse.access_token);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(tokenResponse.user));
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  static isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;
      
      return Date.now() > parseInt(expiryTime) - 60000; // 1 minute buffer
    } catch {
      return true;
    }
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
}

// Helper function to check if current path is training
function isTrainingPath(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.pathname.includes('/training/');
  }
  return false;
}

// Enhanced fetch wrapper with automatic token refresh
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // First attempt with current token
  let token = TokenManager.getAccessToken();
  
  // If token is expired, try to refresh
  if (token && TokenManager.isTokenExpired()) {
    try {
      await refreshAccessToken();
      token = TokenManager.getAccessToken();
    } catch (error) {
      // Refresh failed, clear tokens and redirect to login
      TokenManager.clearTokens();
      if (typeof window !== 'undefined' && !isTrainingPath()) {
        window.location.href = '/login';
      }
      throw new Error('Authentication expired');
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options?.headers || {}),
    },
  });

  // Handle token expiry during request
  if (res.status === 401 && token) {
    try {
      await refreshAccessToken();
      const newToken = TokenManager.getAccessToken();
      
      // Retry the original request with new token
      const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(newToken && { Authorization: `Bearer ${newToken}` }),
          ...(options?.headers || {}),
        },
      });

      if (!retryRes.ok) {
        const errorData = await retryRes.json().catch(() => ({ detail: 'Authentication failed' }));
        throw new Error(errorData.detail || `API error: ${retryRes.status}`);
      }

      return retryRes.json();
    } catch (refreshError) {
      TokenManager.clearTokens();
      if (typeof window !== 'undefined' && !isTrainingPath()) {
        window.location.href = '/login';
      }
      throw new Error('Authentication expired');
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// Refresh token function
async function refreshAccessToken(): Promise<void> {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const tokenResponse: TokenResponse = await response.json();
  TokenManager.setTokens(tokenResponse);
}

class UserService {
  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(errorData.detail || 'Login failed');
      }

      const tokenResponse: TokenResponse = await response.json();
      TokenManager.setTokens(tokenResponse);
      
      return {
        access_token: tokenResponse.access_token,
        token_type: tokenResponse.token_type,
        user: tokenResponse.user
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiFetch<StandardResponse>('/api/users/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenManager.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  getCurrentUser(): User | null {
    return TokenManager.getUser();
  }

  isAuthenticated(): boolean {
    // BYPASS AUTH FOR TRAINING PAGES
    if (isTrainingPath()) {
      return true;
    }

    if (typeof window === 'undefined') {
      return false;
    }

    const token = TokenManager.getAccessToken();
    const user = TokenManager.getUser();
    
    return !!(token && user && !TokenManager.isTokenExpired());
  }

  // User CRUD operations - All require admin privileges
  async getUsers(filters?: {
    role?: string;
    hotel?: string;
    status?: string;
    search?: string;
  }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.hotel && filters.hotel !== 'All Hotels') params.append('hotel', filters.hotel);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    return apiFetch<User[]>(`/api/users/?${params}`);
  }

  async getUser(userId: string): Promise<User> {
    return apiFetch<User>(`/api/users/${userId}`);
  }

  async createUser(userData: UserCreate): Promise<User> {
    return apiFetch<User>('/api/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: UserUpdate): Promise<User> {
    return apiFetch<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<StandardResponse> {
    return apiFetch<StandardResponse>(`/api/users/${userId}`, { 
      method: 'DELETE' 
    });
  }

  async resetPassword(userId: string, newPassword: string): Promise<StandardResponse> {
    return apiFetch<StandardResponse>(`/api/users/${userId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({
        password: newPassword
      }),
    });
  }

  async activateUser(userId: string): Promise<StandardResponse> {
    return apiFetch<StandardResponse>(`/api/users/${userId}/activate`, { 
      method: 'POST' 
    });
  }

  async getUserStats(): Promise<UserStats> {
    return apiFetch<UserStats>('/api/users/stats/summary');
  }

  // New audit log functionality for admins
  async getAuditLogs(limit: number = 100, eventType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (eventType) params.append('event_type', eventType);
    
    return apiFetch<any[]>(`/api/users/audit/logs?${params}`);
  }

  // Token refresh method (called automatically by apiFetch)
  async refreshToken(): Promise<void> {
    await refreshAccessToken();
  }

  // Check if user has admin privileges
  hasAdminPrivileges(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const adminRoles = ['system admin', 'administrator', 'admin'];
    return adminRoles.some(role => user.role.toLowerCase().includes(role.toLowerCase()));
  }

  // Check if user has manager or admin privileges
  hasManagerPrivileges(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const privilegedRoles = ['system admin', 'administrator', 'admin', 'manager', 'boss', 'director'];
    return privilegedRoles.some(role => user.role.toLowerCase().includes(role.toLowerCase()));
  }
}

export const userService = new UserService();
