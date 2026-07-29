// src/pages/ProjectDetailPage.tsx
// Individual project detail view

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Brain, FolderOpen, Calendar, DollarSign,
  Clock, AlertCircle, Loader2, PlusCircle,
} from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import DashboardLayout from '@/layouts/DashboardLayout';
import { TalentDiscoverySection } from '@/components/talent/TalentDiscoverySection';
import { ProposalIntelligenceSection } from '@/components/proposal/ProposalIntelligenceSection';
import { BudgetIntelligenceSection } from '@/components/budget/BudgetIntelligenceSection';
import { ProjectPlanningSection } from '@/components/planning/ProjectPlanningSection';
import { ClientProgressTracker } from '@/components/progress/ClientProgressTracker';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, isLoading, error } = useProject(id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 size={36} className="text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading project...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'This project could not be loaded.'}</p>
          <Link to="/dashboard/projects" className="btn-secondary">
            Back to Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center">
            <FolderOpen size={22} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.title}</h1>
            <p className="text-gray-400 text-sm">
              Created {new Date(project.created_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {project.budget && (
          <div className="glass-card p-4">
            <DollarSign size={16} className="text-emerald-400 mb-2" />
            <p className="text-gray-500 text-xs">Budget</p>
            <p className="text-white font-bold">₹{project.budget.toLocaleString()}</p>
          </div>
        )}
        {project.deadline && (
          <div className="glass-card p-4">
            <Calendar size={16} className="text-amber-400 mb-2" />
            <p className="text-gray-500 text-xs">Deadline</p>
            <p className="text-white font-bold">
              {new Date(project.deadline).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
        )}
        {project.analysis_completed_at && (
          <div className="glass-card p-4">
            <Clock size={16} className="text-blue-400 mb-2" />
            <p className="text-gray-500 text-xs">Analysed At</p>
            <p className="text-white font-bold">
              {new Date(project.analysis_completed_at).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-white font-bold mb-3">Project Description</h2>
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
      </div>

      {/* AI Analysis Link */}
      {project.ai_analysis ? (
        <div className="glass-card p-6 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Brain size={20} className="text-blue-400" />
            <h2 className="text-white font-bold">AI Analysis Available</h2>
            <span className="badge-green ml-auto">Completed</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            The Requirement Intelligence Agent has analysed this project.
            View the full structured analysis including technologies, features, risks, and estimates.
          </p>
          <button
            onClick={() =>
              navigate('/dashboard/analysis/result', {
                state: {
                  result: {
                    project,
                    analysis: project.ai_analysis,
                    message: 'Loaded from saved project',
                  },
                },
              })
            }
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Brain size={16} />
            View Full AI Analysis
          </button>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <Brain size={20} className="text-gray-600" />
            <h2 className="text-gray-400 font-bold">No AI Analysis</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            This project has not been analysed yet.
          </p>
          <Link to="/dashboard/add" className="btn-secondary text-sm inline-flex items-center gap-2">
            <PlusCircle size={16} />
            Analyse New Project
          </Link>
        </div>
      )}

      {/* Talent Discovery Agent (Agent 2) & Agents 3, 4, 5, 6 */}
      {project.ai_analysis && (
        <>
          <TalentDiscoverySection projectId={project.id} />
          <ProposalIntelligenceSection projectId={project.id} />
          <BudgetIntelligenceSection projectId={project.id} />
          <ProjectPlanningSection projectId={project.id} />
          <ClientProgressTracker projectId={project.id} />
        </>
      )}
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
