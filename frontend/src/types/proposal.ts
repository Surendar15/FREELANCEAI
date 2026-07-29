// src/types/proposal.ts
// Agent 3 — Proposal Intelligence Types

import type { Freelancer } from './talent';

export interface ProposalSummary {
  id: string;
  match_id: string;
  project_id: string;
  freelancer_id: string;
  ai_summary: string;
  why_matched?: string;
  strengths: string[];
  confidence_score: number;
  recommendation_badge: string;
  selection_status: 'PENDING' | 'ASSIGNED' | 'NOT_SELECTED' | 'STARTED' | 'DECLINED_BUDGET';
  created_at: string;
  updated_at: string;
  freelancer: Freelancer;
}

export interface AssignProjectResponse {
  project_id: string;
  assigned_freelancer_id: string;
  freelancer_name: string;
  project_status: string;
  message: string;
}

export interface FreelancerAssignmentNotification {
  has_assignment: boolean;
  project_id?: string;
  project_title?: string;
  client_name?: string;
  client_company?: string;
  assigned_at?: string;
  match_score?: number;
}
