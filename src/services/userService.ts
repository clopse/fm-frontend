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
      // Stop idle tracking - will be handled by IdleWrapper component
      
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

  async deleteUser(userId: string): Promise<void> {
    await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
  }

  // FIXED: Send correct format for password reset
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    await apiFetch(`/api/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({
        password: newPassword  // Changed from 'new_password' to 'password'
      }),
    });
  }

  async activateUser(userId: string): Promise<void> {
    await apiFetch(`/api/users/${userId}/activate`, { method: 'POST' });
  }

  async getUserStats(): Promise<UserStats> {
    return apiFetch<UserStats>('/api/users/stats/summary');
  }
}

export const userService = new UserService();
