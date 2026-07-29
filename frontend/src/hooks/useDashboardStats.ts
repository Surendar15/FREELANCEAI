// src/hooks/useDashboardStats.ts
// Dashboard statistics fetching hook

import { useState, useEffect } from 'react';
import { projectService } from '@/services/projectService';
import type { DashboardStats } from '@/types/auth';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    projectService.getDashboardStats()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard statistics.'))
      .finally(() => setIsLoading(false));
  }, []);

  return { stats, isLoading, error };
}
