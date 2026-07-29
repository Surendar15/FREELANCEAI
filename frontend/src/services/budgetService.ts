// src/services/budgetService.ts
// Agent 4 — Budget Intelligence Service API Client

import api from './api';
import type {
  BudgetRecommendation,
  SendBudgetOfferResponse,
  RespondBudgetOfferResponse,
  FreelancerBudgetOfferNotification,
} from '@/types/budget';

export const budgetService = {
  /**
   * Fetch AI budget recommendation for project
   */
  async getBudgetRecommendation(projectId: string): Promise<BudgetRecommendation | null> {
    const response = await api.get<BudgetRecommendation | null>(`/api/projects/${projectId}/budget-recommendation`);
    return response.data;
  },

  /**
   * Client sends final validated budget offer to selected freelancer
   */
  async sendBudgetOffer(projectId: string, offeredBudget: number): Promise<SendBudgetOfferResponse> {
    const response = await api.post<SendBudgetOfferResponse>(`/api/projects/${projectId}/send-budget-offer`, {
      offered_budget: offeredBudget,
    });
    return response.data;
  },

  /**
   * Freelancer responds to budget offer (START or DECLINE)
   */
  async respondBudgetOffer(projectId: string, action: 'START' | 'DECLINE'): Promise<RespondBudgetOfferResponse> {
    const token = localStorage.getItem('freelancer_token');
    const response = await api.post<RespondBudgetOfferResponse>(
      `/api/projects/${projectId}/respond-budget-offer`,
      { action },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Get active budget offer notification for logged-in freelancer
   */
  async getFreelancerBudgetOffer(): Promise<FreelancerBudgetOfferNotification> {
    const token = localStorage.getItem('freelancer_token');
    const response = await api.get<FreelancerBudgetOfferNotification>('/api/freelancer/budget-offer', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
