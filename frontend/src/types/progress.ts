// src/types/progress.ts
// Agent 6 — Progress Monitoring & Recovery Intelligence Types

export interface ProgressTask {
  id: string;
  project_id: string;
  milestone_number: number;
  task_name: string;
  description?: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_completion_date?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'FAILED';
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadProgressRequest {
  task_id: string;
  description?: string;
  github_commit_url?: string;
  file_path?: string;
}

export interface SubmitProjectRequest {
  github_url?: string;
  zip_file_path?: string;
  deployment_url?: string;
  documentation_path?: string;
}

export interface ProjectSubmission {
  id: string;
  project_id: string;
  github_url?: string;
  zip_file_path?: string;
  deployment_url?: string;
  documentation_path?: string;
  submitted_at: string;
  approved_at?: string;
}

export interface CompletionReport {
  total_duration_days: number;
  approved_budget: number;
  freelancer_name: string;
  freelancer_title: string;
  milestones_completed_count: number;
  completion_date: string;
}

export interface ProjectProgressOverview {
  project_id: string;
  overall_progress_percentage: number;
  completed_tasks_count: number;
  pending_tasks_count: number;
  overdue_tasks_count: number;
  current_milestone_number: number;
  remaining_days: number;
  delay_warning?: string;
  ai_recovery_summary?: string;
  is_delay_failed?: boolean;
  tasks: ProgressTask[];
  submission?: ProjectSubmission;
  completion_report?: CompletionReport;
  message?: string;
}
