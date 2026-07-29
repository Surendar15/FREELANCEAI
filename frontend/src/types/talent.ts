// src/types/talent.ts
// Talent Discovery Agent (Agent 2) Types

export type MatchStatus = 'NOTIFIED' | 'ACCEPTED' | 'DECLINED' | 'ASSIGNED' | 'NOT_SELECTED' | 'STARTED' | 'DECLINED_BUDGET';

export interface Freelancer {
  id: string;
  name: string;
  email: string;
  profile_image: string;
  title: string;
  skills: string[];
  experience: number;
  rating: number;
  completed_projects: number;
  availability: string;
  status: string;
  bio?: string;
}

export interface ScoreBreakdown {
  skill_match: number;
  experience_match: number;
  rating_match: number;
  availability_match: number;
  completed_projects_match: number;
  matching_skills: string[];
}

export interface ProjectMatch {
  id: string;
  project_id: string;
  freelancer_id: string;
  match_score: number;
  status: MatchStatus;
  score_breakdown?: ScoreBreakdown;
  created_at: string;
  updated_at: string;
  freelancer: Freelancer;
}

export interface TalentDiscoveryResponse {
  project_id: string;
  matches: ProjectMatch[];
  message: string;
}
