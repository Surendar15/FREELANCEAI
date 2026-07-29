// src/hooks/useProposalIntelligence.ts
// Hook for Agent 3 proposal summaries and project assignment

import { useState, useEffect, useCallback } from 'react';
import { proposalService } from '@/services/proposalService';
import type { ProposalSummary, AssignProjectResponse } from '@/types/proposal';

export function useProposalIntelligence(projectId: string | undefined) {
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignmentResult, setAssignmentResult] = useState<AssignProjectResponse | null>(null);

  const fetchProposals = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await proposalService.getProposals(projectId);
      setProposals(data);
    } catch (err: unknown) {
      setError('Failed to load proposal intelligence summaries.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const assignProject = useCallback(async (freelancerId: string): Promise<boolean> => {
    if (!projectId) return false;
    setAssigningId(freelancerId);
    setError(null);
    try {
      const result = await proposalService.assignProject(projectId, freelancerId);
      setAssignmentResult(result);
      setProposals(prev =>
        prev.map(p => ({
          ...p,
          selection_status: p.freelancer_id === freelancerId ? 'ASSIGNED' : 'NOT_SELECTED',
        }))
      );
      return true;
    } catch (err: unknown) {
      setError('Failed to assign project. Please try again.');
      return false;
    } finally {
      setAssigningId(null);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    isLoading,
    error,
    assigningId,
    assignmentResult,
    assignProject,
    refetchProposals: fetchProposals,
  };
}
