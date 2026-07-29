// src/types/budget.ts
// Agent 4 — Budget Intelligence Types

export interface BudgetRecommendation {
  id: string;
  project_id: string;
  minimum_budget: number;
  maximum_budget: number;
  recommended_budget: number;
  budget_reason: string;
  client_entered_budget?: number;
  budget_status: 'RECOMMENDED' | 'OFFERED' | 'ACCEPTED' | 'DECLINED';
  created_at: string;
  updated_at: string;
}

export interface SendBudgetOfferResponse {
  project_id: string;
  offered_budget: number;
  budget_status: string;
  message: string;
}

export interface RespondBudgetOfferResponse {
  project_id: string;
  action: 'START' | 'DECLINE';
  budget_status: string;
  match_status: string;
  message: string;
  remaining_candidates_count: number;
  retriggered_discovery: boolean;
}

export interface FreelancerBudgetOfferNotification {
  has_offer: boolean;
  project_id?: string;
  project_title?: string;
  client_name?: string;
  client_company?: string;
  offered_budget?: number;
  deadline?: string;
  timeline_weeks?: number;
  budget_status?: string;
}
