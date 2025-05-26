// FILE: src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  hotel: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  last_login: string | null;
}

export interface UserCreate {
  name: string;
  email: string;
  role: string;
  hotel: string;
  password: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  role?: string;
  hotel?: string;
  status?: 'Active' | 'Inactive';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  roles: Record<string, number>;
  hotels: Record<string, number>;
}

// FILE: src/services/userService.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
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
}

export const userService = new UserService();
