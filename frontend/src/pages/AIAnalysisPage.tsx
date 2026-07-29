// src/pages/AIAnalysisPage.tsx
// All AI analyses list page

import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, FolderOpen, ArrowRight, Zap, PlusCircle } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import DashboardLayout from '@/layouts/DashboardLayout';

const AIAnalysisPage: React.FC = () => {
  const { projects, isLoading } = useProjects();
  const analysedProjects = projects.filter(p => p.ai_analysis);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Analyses</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {analysedProjects.length} project{analysedProjects.length !== 1 ? 's' : ''} analysed
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : analysedProjects.length === 0 ? (
        <div className="text-center py-20">
          <Brain size={48} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No analyses yet</h3>
          <p className="text-gray-400 text-sm mb-6">
            Analyse a project to see AI-generated requirement breakdowns here.
          </p>
          <Link to="/dashboard/add" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle size={16} />
            Add & Analyse Project
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {analysedProjects.map(project => {
            const analysis = project.ai_analysis!;
            return (
              <div key={project.id} className="glass-card-hover p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Brain size={18} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold truncate">{project.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Zap size={10} className="text-blue-400" />
                          {analysis.project_type}
                        </span>
                        <span>•</span>
                        <span>{analysis.estimated_complexity} complexity</span>
                        <span>•</span>
                        <span>{analysis.suggested_team_size} developers</span>
                        <span>•</span>
                        <span>{analysis.estimated_timeline_weeks} weeks</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {analysis.required_technologies.programming_languages.slice(0, 4).map(l => (
                          <span key={l} className="badge-blue text-xs">{l}</span>
                        ))}
                        {analysis.required_technologies.frameworks.slice(0, 3).map(f => (
                          <span key={f} className="badge-purple text-xs">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      window.location.href = `/dashboard/analysis/result`;
                    }}
                    className="btn-secondary text-xs px-4 py-2 flex items-center gap-2 flex-shrink-0"
                  >
                    View Analysis
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AIAnalysisPage;
