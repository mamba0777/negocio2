export type UserRole = 'admin' | 'editor' | 'viewer' | 'customer';

export const ROLES = {
  ADMIN: 'admin' as UserRole,
  EDITOR: 'editor' as UserRole,
  VIEWER: 'viewer' as UserRole,
  CUSTOMER: 'customer' as UserRole
} as const;

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role?: UserRole;
  avatar?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}
