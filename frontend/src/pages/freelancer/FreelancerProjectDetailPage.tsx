// src/pages/freelancer/FreelancerProjectDetailPage.tsx
// Full Project & AI Execution Roadmap View for Freelancers

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Brain, Code2, Users, Clock, DollarSign,
  CheckCircle2, Star, Zap, Database, Globe, Target,
  Loader2, Briefcase, Calendar, ShieldCheck, Rocket, ChevronRight
} from 'lucide-react';
import { FreelancerLayout } from '@/layouts/FreelancerLayout';
import { useFreelancerAuth } from '@/hooks/useFreelancerAuth';
import api from '@/services/api';
import { TalentDiscoverySection } from '@/components/talent/TalentDiscoverySection';
import { ProposalIntelligenceSection } from '@/components/proposal/ProposalIntelligenceSection';
import { BudgetIntelligenceSection } from '@/components/budget/BudgetIntelligenceSection';
import { ProjectPlanningSection } from '@/components/planning/ProjectPlanningSection';
import { FreelancerProgressTracker } from '@/components/progress/FreelancerProgressTracker';
import type { Project, Feature } from '@/types/project';

export const FreelancerProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useFreelancerAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'requirements' | 'talent' | 'proposal' | 'budget' | 'planning' | 'progress'>('all');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    api.get<Project>(`/api/projects/${id}`)
      .then(res => setProject(res.data))
      .catch(() => setError('Failed to load project details.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (!isAuthenticated) {
    return (
      <FreelancerLayout>
        <div className="text-center py-20">
          <Briefcase size={48} className="text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Freelancer Authentication Required</h2>
          <p className="text-gray-400 mb-6">Log in as a freelancer to view project details.</p>
          <button onClick={() => navigate('/freelancer/login')} className="btn-primary">
            Log In as Freelancer
          </button>
        </div>
      </FreelancerLayout>
    );
  }

  if (isLoading) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 size={36} className="text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Loading project roadmap...</p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  if (error || !project) {
    return (
      <FreelancerLayout>
        <div className="text-center py-20">
          <Brain size={48} className="text-red-500/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The requested project could not be found.'}</p>
          <button onClick={() => navigate('/freelancer/dashboard')} className="btn-secondary">
            Back to Freelancer Dashboard
          </button>
        </div>
      </FreelancerLayout>
    );
  }

  const analysis = project.ai_analysis;
  const tech = analysis?.required_technologies;
  const isCompleted = (project.status as string) === 'completed';

  return (
    <FreelancerLayout>
      {/* Header Bar */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/freelancer/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          Back to Freelancer Dashboard
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="badge-purple text-xs font-semibold px-2.5 py-0.5">Freelancer Portal</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isCompleted ? 'badge-green' : 'badge-blue'
              }`}>
                {isCompleted
                  ? '🎉 Project Completed & Delivered'
                  : (project.status as string) === 'submitted'
                  ? '🚀 Project Submitted'
                  : project.status === 'in_progress'
                  ? 'Project In Progress'
                  : project.status.toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">{project.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{project.description}</p>
          </div>

          <div className="flex gap-4 text-xs text-gray-300 self-start md:self-auto">
            {project.budget && (
              <div className="glass-card px-4 py-2 text-center">
                <p className="text-gray-500 text-[10px] uppercase font-bold">Budget</p>
                <p className="text-emerald-400 font-extrabold text-sm">₹{project.budget.toLocaleString()}</p>
              </div>
            )}
            {analysis?.estimated_timeline_weeks && (
              <div className="glass-card px-4 py-2 text-center">
                <p className="text-gray-500 text-[10px] uppercase font-bold">Timeline</p>
                <p className="text-purple-400 font-extrabold text-sm">{analysis.estimated_timeline_weeks} Weeks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Splits / Section Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 p-1.5 rounded-2xl bg-dark-900/60 border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All Modules
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'requirements' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Requirement Scope
        </button>
        <button
          onClick={() => setActiveTab('talent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'talent' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Talent Matching
        </button>
        <button
          onClick={() => setActiveTab('proposal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'proposal' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Proposal Intelligence
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'budget' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Budget Offer
        </button>

        {!isCompleted ? (
          <>
            <button
              onClick={() => setActiveTab('planning')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'planning' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Project Plan
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'progress' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Progress & Deliverables
            </button>
          </>
        ) : (
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'progress' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            Completed Deliverables ✓
          </button>
        )}
      </div>

      {/* AGENT 1: AI REQUIREMENT ANALYSIS BREAKDOWN */}
      {analysis && (activeTab === 'all' || activeTab === 'requirements') && (
        <div className="glass-card p-6 border border-purple-500/20 mb-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Brain size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Requirement Intelligence Analysis (Agent 1)</h2>
              <p className="text-gray-400 text-xs">AI-extracted technical requirements and feature scope</p>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <p className="text-gray-500 text-xs font-medium">Domain</p>
              <p className="text-white font-bold text-sm mt-0.5">{analysis.domain || 'Software'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <p className="text-gray-500 text-xs font-medium">Complexity</p>
              <p className="text-amber-400 font-bold text-sm mt-0.5">{analysis.estimated_complexity || 'Medium'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <p className="text-gray-500 text-xs font-medium">Suggested Team Size</p>
              <p className="text-blue-400 font-bold text-sm mt-0.5">{analysis.suggested_team_size || 1} Developers</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <p className="text-gray-500 text-xs font-medium">Target Timeline</p>
              <p className="text-purple-400 font-bold text-sm mt-0.5">{analysis.estimated_timeline_weeks || 4} Weeks</p>
            </div>
          </div>

          {/* Tech Stack Pills */}
          {tech && (
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Required Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {tech.programming_languages?.map((l: string) => (
                  <span key={l} className="badge-blue text-xs font-semibold px-3 py-1 rounded-lg">
                    {l}
                  </span>
                ))}
                {tech.frameworks?.map((f: string) => (
                  <span key={f} className="badge-purple text-xs font-semibold px-3 py-1 rounded-lg">
                    {f}
                  </span>
                ))}
                {tech.databases?.map((d: string) => (
                  <span key={d} className="badge-green text-xs font-semibold px-3 py-1 rounded-lg">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features List */}
          {analysis.core_features && analysis.core_features.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Core Features Breakdown</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {analysis.core_features.map((feat: Feature, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300 flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-semibold">{feat.name}</strong>
                      <span className="text-gray-400 text-[11px]">{feat.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AGENT 2: TALENT DISCOVERY */}
      {(activeTab === 'all' || activeTab === 'talent') && (
        <TalentDiscoverySection projectId={project.id} />
      )}

      {/* AGENT 3: PROPOSAL INTELLIGENCE */}
      {(activeTab === 'all' || activeTab === 'proposal') && (
        <ProposalIntelligenceSection projectId={project.id} />
      )}

      {/* AGENT 4: BUDGET INTELLIGENCE */}
      {(activeTab === 'all' || activeTab === 'budget') && (
        <BudgetIntelligenceSection projectId={project.id} />
      )}

      {/* AGENT 5: PROJECT PLANNING INTELLIGENCE ROADMAP (HIDDEN IF PROJECT COMPLETED) */}
      {!isCompleted && (activeTab === 'all' || activeTab === 'planning') && (
        <ProjectPlanningSection projectId={project.id} isFreelancerView={true} />
      )}

      {/* AGENT 6: PROGRESS MONITORING & DELIVERY */}
      {(activeTab === 'all' || activeTab === 'progress') && (
        <FreelancerProgressTracker projectId={project.id} />
      )}
    </FreelancerLayout>
  );
};
