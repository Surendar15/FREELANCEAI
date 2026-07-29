// src/hooks/useBudgetIntelligence.ts
// Hook for Agent 4 budget recommendations, live range validation, and offer sending

import { useState, useEffect, useCallback } from 'react';
import { budgetService } from '@/services/budgetService';
import type { BudgetRecommendation, SendBudgetOfferResponse } from '@/types/budget';

export function useBudgetIntelligence(projectId: string | undefined) {
  const [recommendation, setRecommendation] = useState<BudgetRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enteredBudget, setEnteredBudget] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offerResult, setOfferResult] = useState<SendBudgetOfferResponse | null>(null);

  const fetchRecommendation = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await budgetService.getBudgetRecommendation(projectId);
      setRecommendation(data);
      if (data && data.client_entered_budget) {
        setEnteredBudget(data.client_entered_budget.toString());
      } else if (data) {
        setEnteredBudget(data.recommended_budget.toString());
      }
    } catch (err: unknown) {
      setError('Failed to load AI budget recommendation.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  // Real-time Validation Rules
  const numBudget = parseFloat(enteredBudget) || 0;
  let validationType: 'valid' | 'low' | 'high' | null = null;
  let validationMessage: string | null = null;
  let isValidRange = false;

  if (recommendation && numBudget > 0) {
    const min = recommendation.minimum_budget;
    const max = recommendation.maximum_budget;

    if (numBudget < min) {
      validationType = 'low';
      validationMessage = `The entered budget is lower than the AI recommended range ($${min.toLocaleString()} – $${max.toLocaleString()}) and may reduce the chances of freelancer acceptance.`;
      isValidRange = false;
    } else if (numBudget > max) {
      validationType = 'high';
      validationMessage = `The entered budget exceeds the AI recommended range ($${min.toLocaleString()} – $${max.toLocaleString()}). Please review before sending.`;
      isValidRange = false;
    } else {
      validationType = 'valid';
      validationMessage = 'Budget Accepted Range';
      isValidRange = true;
    }
  }

  const sendOffer = useCallback(async (): Promise<boolean> => {
    if (!projectId || !recommendation || !isValidRange) return false;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await budgetService.sendBudgetOffer(projectId, numBudget);
      setOfferResult(result);
      setRecommendation(prev => prev ? { ...prev, budget_status: 'OFFERED', client_entered_budget: numBudget } : null);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send budget offer. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [projectId, recommendation, numBudget, isValidRange]);

  return {
    recommendation,
    isLoading,
    error,
    enteredBudget,
    setEnteredBudget,
    validationType,
    validationMessage,
    isValidRange,
    isSubmitting,
    offerResult,
    sendOffer,
    refetchRecommendation: fetchRecommendation,
  };
}
