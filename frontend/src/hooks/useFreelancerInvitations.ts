// src/hooks/useFreelancerInvitations.ts
// Hook for fetching and responding to freelancer project invitations

import { useState, useEffect, useCallback } from 'react';
import { freelancerService, type ProjectInvitation } from '@/services/freelancerService';
import type { MatchStatus } from '@/types/talent';

export function useFreelancerInvitations() {
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await freelancerService.getInvitations();
      setInvitations(data);
    } catch (err: unknown) {
      setError('Failed to load project invitations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const respond = useCallback(async (matchId: string, status: MatchStatus) => {
    setRespondingId(matchId);
    try {
      const updatedMatch = await freelancerService.respondToInvitation(matchId, status);
      setInvitations(prev =>
        prev.map(item =>
          item.match.id === matchId ? { ...item, match: updatedMatch } : item
        )
      );
    } catch (err: unknown) {
      setError('Failed to update invitation response.');
    } finally {
      setRespondingId(null);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    isLoading,
    error,
    respondingId,
    respond,
    refetchInvitations: fetchInvitations,
  };
}
