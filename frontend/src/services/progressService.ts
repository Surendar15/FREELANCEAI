// src/services/progressService.ts
// Agent 6 — Progress Monitoring Intelligence Service API Client

import api from './api';
import type {
  ProjectProgressOverview,
  UploadProgressRequest,
  SubmitProjectRequest,
  ProjectSubmission,
} from '@/types/progress';

export const progressService = {
  async getProgress(projectId: string): Promise<ProjectProgressOverview> {
    const response = await api.get<ProjectProgressOverview>(`/api/projects/${projectId}/progress`);
    return response.data;
  },

  async uploadProgress(projectId: string, req: UploadProgressRequest): Promise<ProjectProgressOverview> {
    const response = await api.post<ProjectProgressOverview>(`/api/projects/${projectId}/progress`, req);
    return response.data;
  },

  async markTaskComplete(projectId: string, taskId: string): Promise<ProjectProgressOverview> {
    const response = await api.post<ProjectProgressOverview>(
      `/api/projects/${projectId}/mark-task-complete`,
      null,
      { params: { task_id: taskId } }
    );
    return response.data;
  },

  async handleDelayAction(projectId: string, action: 'CONTINUE' | 'CANCEL_REASSIGN'): Promise<ProjectProgressOverview> {
    const response = await api.post<ProjectProgressOverview>(
      `/api/projects/${projectId}/handle-delay-action`,
      { action }
    );
    return response.data;
  },

  async submitProject(projectId: string, req: SubmitProjectRequest): Promise<ProjectSubmission> {
    const response = await api.post<ProjectSubmission>(`/api/projects/${projectId}/submit`, req);
    return response.data;
  },

  async getSubmission(projectId: string): Promise<ProjectSubmission | null> {
    const response = await api.get<ProjectSubmission | null>(`/api/projects/${projectId}/submission`);
    return response.data;
  },

  async acceptSubmission(projectId: string): Promise<ProjectSubmission> {
    const response = await api.post<ProjectSubmission>(`/api/projects/${projectId}/accept-submission`);
    return response.data;
  },
};
