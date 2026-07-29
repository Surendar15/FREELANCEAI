// src/services/projectPlanService.ts
// Agent 5 — Project Planning Intelligence Service API Client

import api from './api';
import type { ProjectPlan } from '@/types/projectPlan';

export const projectPlanService = {
  /**
   * Fetch stored project execution plan from PostgreSQL
   */
  async getPlan(projectId: string): Promise<ProjectPlan | null> {
    const response = await api.get<ProjectPlan | null>(`/api/projects/${projectId}/plan`);
    return response.data;
  },

  /**
   * Trigger Agent 5 generation of project execution roadmap once
   */
  async generatePlan(projectId: string): Promise<ProjectPlan> {
    const response = await api.post<ProjectPlan>(`/api/projects/${projectId}/generate-plan`);
    return response.data;
  },
};
