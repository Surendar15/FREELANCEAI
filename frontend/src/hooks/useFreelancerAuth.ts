// src/hooks/useFreelancerAuth.ts
// Freelancer authentication state hook

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { freelancerService, type FreelancerRegisterData } from '@/services/freelancerService';
import type { Freelancer } from '@/types/talent';

export function useFreelancerAuth() {
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState<Freelancer | null>(() =>
    freelancerService.getSavedFreelancer()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await freelancerService.login(credentials);
        freelancerService.saveAuthData(res);
        setFreelancer(res.freelancer);
        navigate('/freelancer/dashboard');
      } catch (err: unknown) {
        const msg = extractErrorMessage(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const register = useCallback(
    async (data: FreelancerRegisterData) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await freelancerService.register(data);
        freelancerService.saveAuthData(res);
        setFreelancer(res.freelancer);
        navigate('/freelancer/dashboard');
      } catch (err: unknown) {
        const msg = extractErrorMessage(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    freelancerService.clearAuthData();
    setFreelancer(null);
    navigate('/freelancer/login');
  }, [navigate]);

  return {
    freelancer,
    isLoading,
    error,
    isAuthenticated: freelancerService.isAuthenticated() && !!freelancer,
    login,
    register,
    logout,
    clearError: () => setError(null),
  };
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string; detail?: string } } }).response;
    if (response?.data?.message) return response.data.message;
    if (response?.data?.detail) return response.data.detail;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected authentication error occurred.';
}
