// src/services/talentService.ts
// Talent Discovery Agent API calls

import api from './api';
import type { ProjectMatch, TalentDiscoveryResponse, MatchStatus } from '@/types/talent';

export const talentService = {
  /**
   * Run Talent Discovery Agent for a project.
   * Compares Agent 1 structured output with freelancer DB and saves Top 3 matches.
   */
  async discoverTalent(projectId: string): Promise<TalentDiscoveryResponse> {
    const response = await api.post<TalentDiscoveryResponse>('/api/agents/talent-discovery', {
      project_id: projectId,
    });
    return response.data;
  },

  /**
   * Get existing freelancer matches for a project
   */
  async getProjectMatches(projectId: string): Promise<ProjectMatch[]> {
    const response = await api.get<ProjectMatch[]>(`/api/projects/${projectId}/matches`);
    return response.data;
  },

  /**
   * Update invitation status for a freelancer match (ACCEPTED or DECLINED)
   */
  async updateMatchStatus(matchId: string, status: MatchStatus): Promise<ProjectMatch> {
    const response = await api.patch<ProjectMatch>(`/api/projects/matches/${matchId}/status`, {
      status,
    });
    return response.data;
  },
};
