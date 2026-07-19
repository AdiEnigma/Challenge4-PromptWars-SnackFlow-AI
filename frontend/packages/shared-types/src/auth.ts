export type UserRole = 'fan' | 'vendor' | 'manager';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferredLanguage: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role: UserRole;
  preferredLanguage?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}
