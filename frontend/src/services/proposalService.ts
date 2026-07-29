// src/services/proposalService.ts
// Agent 3 — Proposal Intelligence Service API Client

import api from './api';
import type { ProposalSummary, AssignProjectResponse, FreelancerAssignmentNotification } from '@/types/proposal';

export const proposalService = {
  /**
   * Fetch AI proposal summaries for accepted freelancers of a project
   */
  async getProposals(projectId: string): Promise<ProposalSummary[]> {
    const response = await api.get<ProposalSummary[]>(`/api/projects/${projectId}/proposals`);
    return response.data;
  },

  /**
   * Assign project to selected freelancer
   */
  async assignProject(projectId: string, freelancerId: string): Promise<AssignProjectResponse> {
    const response = await api.post<AssignProjectResponse>(`/api/projects/${projectId}/assign`, {
      freelancer_id: freelancerId,
    });
    return response.data;
  },

  /**
   * Get active project assignment notification for logged-in freelancer
   */
  async getFreelancerAssignment(): Promise<FreelancerAssignmentNotification> {
    const token = localStorage.getItem('freelancer_token');
    const response = await api.get<FreelancerAssignmentNotification>('/api/freelancer/assignment', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
