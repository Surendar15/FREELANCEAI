// src/types/auth.ts
// Authentication-related TypeScript types

export interface Client {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  company_name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  client: Client;
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  ai_analyses_completed: number;
  notifications: number;
}
