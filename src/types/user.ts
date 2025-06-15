// src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  hotel: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  last_login: string | null;
  failed_login_attempts?: number;
  locked_until?: string | null;
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

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  expires_in: number;
}

export interface StandardResponse {
  message: string;
  success: boolean;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  roles: Record<string, number>;
  hotels: Record<string, number>;
}

export interface AuditLog {
  timestamp: string;
  event_type: string;
  user_id: string;
  ip_address?: string;
  details: Record<string, any>;
}

// Password validation configuration
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// Authentication context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasAdminPrivileges: () => boolean;
  hasManagerPrivileges: () => boolean;
}

// Error types for better error handling
export interface ApiError {
  detail: string;
  error_code: number;
}

export interface ValidationError {
  detail: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}
