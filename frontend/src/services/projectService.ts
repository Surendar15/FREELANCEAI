// src/services/projectService.ts
// Project API calls

import api from './api';
import type {
  AnalyzeProjectRequest,
  AnalyzeResponse,
  Project,
  ProjectListResponse,
} from '@/types/project';
import type { DashboardStats } from '@/types/auth';

export const projectService = {
  /**
   * Analyze a project with the AI Requirement Intelligence Agent.
   * This creates the project and runs AI analysis in one step.
   */
  async analyzeProject(data: AnalyzeProjectRequest): Promise<AnalyzeResponse> {
    const response = await api.post<AnalyzeResponse>('/api/projects/analyze', data);
    return response.data;
  },

  /**
   * Get all projects for the current client
   */
  async getProjects(page = 1, perPage = 20): Promise<ProjectListResponse> {
    const response = await api.get<ProjectListResponse>('/api/projects', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  /**
   * Get a specific project by ID (with AI analysis)
   */
  async getProject(id: string): Promise<Project> {
    const response = await api.get<Project>(`/api/projects/${id}`);
    return response.data;
  },

  /**
   * Get dashboard statistics for the current client
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
  },
};
