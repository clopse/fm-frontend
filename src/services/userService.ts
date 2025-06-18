// FILE: src/services/userService.ts
import { User, UserCreate, UserUpdate, LoginRequest, LoginResponse, UserStats } from '../types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to check if current path is training
function isTrainingPath(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.pathname.includes('/training/');
  }
  return false;
}

// Generic fetch wrapper with auth
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options?.headers || {}),
    },
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${res.status}`);
  }
  
  return res.json();
}

// ADDED: Result interface for user creation with email status
interface CreateUserResult {
  user: User;
  emailSent: boolean;
  emailError?: string;
}

class UserService {
  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const data = await apiFetch<LoginResponse>('/api/users/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Store token and user
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async logout(): Promise<void> {
    try {
      await apiFetch('/api/users/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    // BYPASS AUTH FOR TRAINING PAGES
    if (isTrainingPath()) {
      return true; // Always return true for training pages
    }
    
    // Normal auth check for other pages
    if (typeof window === 'undefined') {
      return false; // Server-side, assume not authenticated
    }
    
    try {
      return !!localStorage.getItem('access_token');
    } catch (error) {
      console.error('localStorage access error:', error);
      return false;
    }
  }

  // User CRUD operations
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

  // MODIFIED: Updated createUser method with email support
  async createUser(userData: UserCreate, sendWelcomeEmail: boolean = false): Promise<CreateUserResult> {
    let user: User;
    let emailSent = false;
    let emailError: string | undefined;

    try {
      // Step 1: Create the user first (this always happens)
      user = await apiFetch<User>('/api/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Step 2: If email is requested, try to send it
      if (sendWelcomeEmail) {
        try {
          await this.sendWelcomeEmail(user.id.toString());
          emailSent = true;
        } catch (emailErr) {
          // Email failed but user was created successfully
          emailError = emailErr instanceof Error ? emailErr.message : 'Failed to send welcome email';
          console.warn('User created but welcome email failed:', emailError);
        }
      }

      return {
        user,
        emailSent,
        emailError
      };

    } catch (userCreationError) {
      // If user creation fails, throw the error
      throw userCreationError;
    }
  }

  async updateUser(userId: string, userData: UserUpdate): Promise<User> {
    return apiFetch<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    await apiFetch(`/api/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({
        email: '',
        new_password: newPassword,
      }),
    });
  }

  async activateUser(userId: string): Promise<void> {
    await apiFetch(`/api/users/${userId}/activate`, { method: 'POST' });
  }

  async getUserStats(): Promise<UserStats> {
    return apiFetch<UserStats>('/api/users/stats/summary');
  }

  // ADDED: Separate method for sending welcome emails
  async sendWelcomeEmail(userId: string): Promise<void> {
    await apiFetch(`/api/users/auth/send-welcome-email/${userId}`, {
      method: 'POST',
    });
  }
}

export const userService = new UserService();
