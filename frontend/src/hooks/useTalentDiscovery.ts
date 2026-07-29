// src/hooks/useTalentDiscovery.ts
// Talent discovery state and interaction hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { talentService } from '@/services/talentService';
import type { ProjectMatch, MatchStatus } from '@/types/talent';

export function useTalentDiscovery(projectId: string | undefined) {
  const [matches, setMatches] = useState<ProjectMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimationRunning, setIsAnimationRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingMatchId, setUpdatingMatchId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchMatches = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await talentService.getProjectMatches(projectId);
      setMatches(data);
    } catch (err: unknown) {
      setError('Failed to fetch talent discovery matches.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const runDiscovery = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setIsAnimationRunning(true);
    setError(null);
    try {
      const res = await talentService.discoverTalent(projectId);
      setMatches(res.matches);
    } catch (err: unknown) {
      setError('Talent discovery failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const updateStatus = useCallback(async (matchId: string, status: MatchStatus) => {
    setUpdatingMatchId(matchId);
    try {
      const updatedMatch = await talentService.updateMatchStatus(matchId, status);
      setMatches(prev => prev.map(m => (m.id === matchId ? updatedMatch : m)));
    } catch (err: unknown) {
      setError('Failed to update freelancer status.');
    } finally {
      setUpdatingMatchId(null);
    }
  }, []);

  useEffect(() => {
    if (!projectId || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchMatches();
  }, [projectId, fetchMatches]);

  return {
    matches,
    isLoading,
    isAnimationRunning,
    setIsAnimationRunning,
    error,
    updatingMatchId,
    runDiscovery,
    updateStatus,
    refetchMatches: fetchMatches,
  };
}
