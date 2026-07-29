// src/services/freelancerService.ts
// Freelancer Portal API Client

import api from './api';
import type { Freelancer, MatchStatus, ProjectMatch } from '@/types/talent';

export interface FreelancerLoginResponse {
  access_token: string;
  token_type: string;
  freelancer: Freelancer;
}

export interface FreelancerRegisterData {
  full_name: string;
  email: string;
  password: string;
  title: string;
  skills: string;
  experience?: number;
  bio?: string;
}

export interface ProjectInvitation {
  match: ProjectMatch;
  project_title: string;
  project_description: string;
  client_name: string;
  client_company?: string;
  budget?: number;
  deadline?: string;
  project_status?: string;
}

export const freelancerService = {
  /**
   * Log in as a freelancer with email and password
   */
  async login(credentials: { email: string; password: string }): Promise<FreelancerLoginResponse> {
    const response = await api.post<FreelancerLoginResponse>('/api/freelancer/login', credentials);
    return response.data;
  },

  /**
   * Register a new freelancer account
   */
  async register(data: FreelancerRegisterData): Promise<FreelancerLoginResponse> {
    const response = await api.post<FreelancerLoginResponse>('/api/freelancer/register', data);
    return response.data;
  },

  /**
   * Save freelancer JWT token and profile data in localStorage
   */
  saveAuthData(data: FreelancerLoginResponse) {
    localStorage.setItem('freelancer_token', data.access_token);
    localStorage.setItem('freelancer_profile', JSON.stringify(data.freelancer));
  },

  /**
   * Check if freelancer is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('freelancer_token');
  },

  /**
   * Get saved freelancer profile
   */
  getSavedFreelancer(): Freelancer | null {
    const raw = localStorage.getItem('freelancer_profile');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Clear freelancer auth data
   */
  clearAuthData() {
    localStorage.removeItem('freelancer_token');
    localStorage.removeItem('freelancer_profile');
  },

  /**
   * Fetch project invitations for authenticated freelancer
   */
  async getInvitations(): Promise<ProjectInvitation[]> {
    const token = localStorage.getItem('freelancer_token');
    const response = await api.get<ProjectInvitation[]>('/api/freelancer/invitations', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Respond to project invitation (Accept or Decline)
   */
  async respondToInvitation(matchId: string, status: MatchStatus): Promise<ProjectMatch> {
    const token = localStorage.getItem('freelancer_token');
    const response = await api.post<ProjectMatch>(
      `/api/freelancer/invitations/${matchId}/respond`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};
