// src/types/project.ts
// Project and AI analysis TypeScript types — mirrors backend schemas exactly

export type ProjectStatus =
  | 'draft'
  | 'analyzing'
  | 'analyzed'
  | 'published'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'enterprise';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface RequiredTechnologies {
  programming_languages: string[];
  frameworks: string[];
  databases: string[];
  cloud_services: string[];
  tools: string[];
}

export interface Feature {
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Risk {
  risk: string;
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface BudgetRange {
  min_usd: number;
  max_usd: number;
  currency: string;
}

export interface AIAnalysisResult {
  project_title: string;
  project_type: string;
  domain: string;
  required_technologies: RequiredTechnologies;
  required_skills: string[];
  nice_to_have_skills: string[];
  core_features: Feature[];
  optional_features: Feature[];
  estimated_complexity: ComplexityLevel;
  suggested_team_size: number;
  priority_level: PriorityLevel;
  estimated_timeline_weeks: number;
  suggested_budget_range: BudgetRange;
  potential_risks: Risk[];
  deliverables: string[];
  dependencies: string[];
  analysis_confidence: ConfidenceLevel;
  analysis_notes: string | null;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget: number | null;
  deadline: string | null;
  status: ProjectStatus;
  ai_analysis: AIAnalysisResult | null;
  ai_model_used: string | null;
  analysis_completed_at: string | null;
  supporting_file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyzeProjectRequest {
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
}

export interface AnalyzeResponse {
  project: Project;
  analysis: AIAnalysisResult;
  message: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  per_page: number;
}
