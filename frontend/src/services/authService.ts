// src/services/authService.ts
// Authentication API calls

import api from './api';
import type { LoginRequest, RegisterRequest, LoginResponse, Client } from '@/types/auth';

export const authService = {
  /**
   * Register a new client account
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', data);
    return response.data;
  },

  /**
   * Get the currently authenticated client profile
   */
  async getMe(): Promise<Client> {
    const response = await api.get<Client>('/api/auth/me');
    return response.data;
  },

  /**
   * Save auth data to localStorage
   */
  saveAuthData(data: LoginResponse): void {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('client', JSON.stringify(data.client));
  },

  /**
   * Clear auth data from localStorage
   */
  clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('client');
  },

  /**
   * Get saved client from localStorage
   */
  getSavedClient(): Client | null {
    const saved = localStorage.getItem('client');
    if (!saved) return null;
    try {
      return JSON.parse(saved) as Client;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },
};
