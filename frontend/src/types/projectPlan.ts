// src/types/projectPlan.ts
// Agent 5 — Project Planning Intelligence Types

export interface Milestone {
  phase_name: string;
  duration_days: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  tasks: string[];
  deliverable: string;
}

export interface ProjectPlanDetail {
  overview: string;
  estimated_completion_days: number;
  phases: Milestone[];
  testing_phase?: string;
  deployment_phase?: string;
  suggested_daily_progress: number;
  potential_risks: string[];
  recommendations: string[];
}

export interface ProjectPlan {
  id: string;
  project_id: string;
  overview: string;
  estimated_completion_days: number;
  plan_json: ProjectPlanDetail;
  created_at: string;
  updated_at: string;
}
