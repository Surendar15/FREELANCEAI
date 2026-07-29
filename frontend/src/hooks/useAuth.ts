// src/hooks/useAuth.ts
// Authentication state management hook

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import type { Client, LoginRequest, RegisterRequest } from '@/types/auth';

export interface UseAuthReturn {
  client: Client | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(() => authService.getSavedClient());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      authService.saveAuthData(response);
      setClient(response.client);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      authService.saveAuthData(response);
      setClient(response.client);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    authService.clearAuthData();
    setClient(null);
    navigate('/');
  }, [navigate]);

  const clearError = useCallback(() => setError(null), []);

  return {
    client,
    isLoading,
    error,
    isAuthenticated: !!client && authService.isAuthenticated(),
    login,
    register,
    logout,
    clearError,
  };
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred. Please try again.';
}
