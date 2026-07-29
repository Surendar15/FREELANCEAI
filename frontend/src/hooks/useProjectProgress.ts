// src/hooks/useProjectProgress.ts
// Hook for Agent 6 project progress overview, delay recovery, and milestone updates

import { useState, useEffect, useCallback } from 'react';
import { progressService } from '@/services/progressService';
import type {
  ProjectProgressOverview,
  UploadProgressRequest,
  SubmitProjectRequest,
} from '@/types/progress';

export function useProjectProgress(projectId: string | undefined) {
  const [overview, setOverview] = useState<ProjectProgressOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await progressService.getProgress(projectId);
      setOverview(data);
    } catch (err: unknown) {
      setError('Failed to load project progress.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const uploadProgress = async (req: UploadProgressRequest) => {
    if (!projectId) return;
    setIsUpdating(true);
    try {
      const updated = await progressService.uploadProgress(projectId, req);
      setOverview(updated);
      return true;
    } catch (err: unknown) {
      setError('Failed to upload progress proof.');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const markTaskComplete = async (taskId: string) => {
    if (!projectId) return;
    setIsUpdating(true);
    try {
      const updated = await progressService.markTaskComplete(projectId, taskId);
      setOverview(updated);
      return true;
    } catch (err: unknown) {
      setError('Failed to mark task complete.');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelayAction = async (action: 'CONTINUE' | 'CANCEL_REASSIGN') => {
    if (!projectId) return;
    setIsUpdating(true);
    try {
      const updated = await progressService.handleDelayAction(projectId, action);
      setOverview(updated);
      return true;
    } catch (err: unknown) {
      setError('Failed to process delay recovery action.');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const submitFinalProject = async (req: SubmitProjectRequest) => {
    if (!projectId) return;
    setIsUpdating(true);
    try {
      await progressService.submitProject(projectId, req);
      await fetchProgress();
      return true;
    } catch (err: unknown) {
      setError('Failed to submit final project deliverables.');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const acceptSubmission = async () => {
    if (!projectId) return;
    setIsUpdating(true);
    try {
      await progressService.acceptSubmission(projectId);
      await fetchProgress();
      return true;
    } catch (err: unknown) {
      setError('Failed to accept final submission.');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    overview,
    isLoading,
    isUpdating,
    error,
    refetchProgress: fetchProgress,
    uploadProgress,
    markTaskComplete,
    handleDelayAction,
    submitFinalProject,
    acceptSubmission,
  };
}
