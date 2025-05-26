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
