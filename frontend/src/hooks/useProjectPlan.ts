// src/hooks/useProjectPlan.ts
// Hook for Agent 5 project plan roadmap with step-by-step loading animation

import { useState, useEffect, useCallback, useRef } from 'react';
import { projectPlanService } from '@/services/projectPlanService';
import type { ProjectPlan } from '@/types/projectPlan';

export const AI_PLANNING_STEPS = [
  'Analyzing project requirements...',
  'Reviewing approved budget...',
  'Understanding technology stack...',
  'Planning milestones...',
  'Estimating timelines...',
  'Preparing execution roadmap...',
  'Generating project plan...',
];

export function useProjectPlan(projectId: string | undefined) {
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stepIntervalRef = useRef<any>(null);

  const fetchPlan = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const storedPlan = await projectPlanService.getPlan(projectId);
      if (storedPlan) {
        setPlan(storedPlan);
      }
    } catch (err: unknown) {
      setError('Failed to load project plan.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const triggerGeneratePlan = useCallback(async () => {
    if (!projectId) return;
    setIsGenerating(true);
    setCurrentStepIndex(0);
    setError(null);

    // Step-by-step animation sequence interval
    stepIntervalRef.current = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < AI_PLANNING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    try {
      const newPlan = await projectPlanService.generatePlan(projectId);
      setPlan(newPlan);
    } catch (err: unknown) {
      setError('Failed to generate project execution plan.');
    } finally {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
      setIsGenerating(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPlan();
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, [fetchPlan]);

  return {
    plan,
    isLoading,
    isGenerating,
    currentStepIndex,
    error,
    generatePlan: triggerGeneratePlan,
    refetchPlan: fetchPlan,
  };
}
