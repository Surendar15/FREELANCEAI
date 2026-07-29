// src/hooks/useProjects.ts
// Projects data fetching hook

import { useState, useEffect, useCallback } from 'react';
import { projectService } from '@/services/projectService';
import type { Project, ProjectListResponse } from '@/types/project';

export function useProjects() {
  const [data, setData] = useState<ProjectListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await projectService.getProjects(page);
      setData(result);
    } catch (err: unknown) {
      setError('Failed to load projects. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects: data?.projects ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch: fetchProjects,
  };
}

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    projectService.getProject(id)
      .then(setProject)
      .catch(() => setError('Project not found.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { project, isLoading, error };
}
