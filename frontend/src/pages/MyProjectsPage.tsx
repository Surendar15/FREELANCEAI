// src/pages/MyProjectsPage.tsx
// Full projects list with status filters

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, PlusCircle, Search, Brain,
  ArrowRight, Calendar, DollarSign, Filter,
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import DashboardLayout from '@/layouts/DashboardLayout';
import type { Project, ProjectStatus } from '@/types/project';

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Analyzed', value: 'analyzed' },
  { label: 'Active', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Draft', value: 'draft' },
];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    draft:       { label: 'Draft',      cls: 'badge-gray' },
    analyzing:   { label: 'Analyzing',  cls: 'badge-blue' },
    analyzed:    { label: 'Analyzed',   cls: 'badge-green' },
    published:   { label: 'Published',  cls: 'badge-purple' },
    in_progress: { label: 'Active',     cls: 'badge-yellow' },
    completed:   { label: 'Completed',  cls: 'badge-green' },
    cancelled:   { label: 'Cancelled',  cls: 'badge-red' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'badge-gray' };
  return <span className={cls}>{label}</span>;
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
  <Link
    to={`/dashboard/projects/${project.id}`}
    className="glass-card-hover p-5 block group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
          <FolderOpen size={16} className="text-blue-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-sm truncate group-hover:gradient-text transition-all">
            {project.title}
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">
            {new Date(project.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>
      </div>
      <StatusBadge status={project.status} />
    </div>

    <p className="text-gray-400 text-xs leading-relaxed truncate-2 mb-4">
      {project.description}
    </p>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {project.budget && (
          <span className="flex items-center gap-1">
            <DollarSign size={11} />
            ₹{project.budget.toLocaleString()}
          </span>
        )}
        {project.deadline && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {project.ai_analysis && (
          <span className="flex items-center gap-1 text-blue-400">
            <Brain size={11} />
            AI Analysed
          </span>
        )}
      </div>
      <ArrowRight size={14} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
    </div>
  </Link>
);

const MyProjectsPage: React.FC = () => {
  const { projects, isLoading, error } = useProjects();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  const filtered = projects
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p =>
      search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Projects</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/dashboard/add" className="btn-primary text-sm flex items-center gap-2">
          <PlusCircle size={16} />
          Add Project
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="input-field pl-11"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === f.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-400">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={48} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            {search || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {search || statusFilter !== 'all'
              ? 'Try a different search term or filter.'
              : 'Create your first project and let AI analyse it.'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link to="/dashboard/add" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle size={16} />
              Add First Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyProjectsPage;
