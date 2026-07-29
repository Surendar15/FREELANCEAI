// src/pages/DashboardPage.tsx
// Main client dashboard with stats cards and recent projects

import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, Zap, Brain, Bell, PlusCircle,
  ArrowRight, TrendingUp, Clock, CheckCircle2,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useProjects } from '@/hooks/useProjects';
import { authService } from '@/services/authService';
import DashboardLayout from '@/layouts/DashboardLayout';
import type { Project } from '@/types/project';

// ── Stats Card ─────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  iconColor: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label, value, icon: Icon, gradient, borderColor, iconColor, description,
}) => (
  <div className={`stat-card bg-gradient-to-br ${gradient} border ${borderColor}`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-xl bg-white/5 ${iconColor}`}>
        <Icon size={20} />
      </div>
      <TrendingUp size={14} className="text-gray-600" />
    </div>
    <div className="text-3xl font-black text-white mb-1">{value}</div>
    <div className="text-white font-semibold text-sm">{label}</div>
    <div className="text-gray-500 text-xs mt-1">{description}</div>
  </div>
);

// ── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = {
    draft:       { label: 'Draft',       cls: 'badge-gray' },
    analyzing:   { label: 'Analyzing',   cls: 'badge-blue' },
    analyzed:    { label: 'Analyzed',    cls: 'badge-green' },
    published:   { label: 'Published',   cls: 'badge-purple' },
    in_progress: { label: 'Active',      cls: 'badge-yellow' },
    completed:   { label: 'Completed',   cls: 'badge-green' },
    cancelled:   { label: 'Cancelled',   cls: 'badge-red' },
  } as Record<string, { label: string; cls: string }>;

  const { label, cls } = config[status] || { label: status, cls: 'badge-gray' };
  return <span className={cls}>{label}</span>;
};

// ── Project Row ────────────────────────────────────────────────────────────
const ProjectRow: React.FC<{ project: Project }> = ({ project }) => (
  <Link
    to={`/dashboard/projects/${project.id}`}
    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200 group"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
        <FolderOpen size={16} className="text-blue-400" />
      </div>
      <div>
        <p className="text-white font-medium text-sm">{project.title}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          {new Date(project.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <StatusBadge status={project.status} />
      <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
    </div>
  </Link>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { projects, isLoading: projectsLoading } = useProjects();
  const client = authService.getSavedClient();

  const STAT_CARDS: StatCardProps[] = [
    {
      label: 'Total Projects',
      value: statsLoading ? '—' : (stats?.total_projects ?? 0),
      icon: FolderOpen,
      gradient: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-500/15',
      iconColor: 'text-blue-400',
      description: 'Projects created',
    },
    {
      label: 'Active Projects',
      value: statsLoading ? '—' : (stats?.active_projects ?? 0),
      icon: Zap,
      gradient: 'from-yellow-500/10 to-orange-600/5',
      borderColor: 'border-yellow-500/15',
      iconColor: 'text-yellow-400',
      description: 'Currently in progress',
    },
    {
      label: 'AI Analyses',
      value: statsLoading ? '—' : (stats?.ai_analyses_completed ?? 0),
      icon: Brain,
      gradient: 'from-purple-500/10 to-purple-600/5',
      borderColor: 'border-purple-500/15',
      iconColor: 'text-purple-400',
      description: 'Requirement analyses done',
    },
    {
      label: 'Notifications',
      value: statsLoading ? '—' : (stats?.notifications ?? 0),
      icon: Bell,
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-500/15',
      iconColor: 'text-emerald-400',
      description: 'Unread notifications',
    },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome back, {client?.full_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-gray-400 mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-bold text-lg">Recent Projects</h2>
              <p className="text-gray-500 text-xs mt-0.5">Your latest project activity</p>
            </div>
            <Link
              to="/dashboard/projects"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          {projectsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No projects yet</p>
              <p className="text-gray-600 text-sm mb-4">Create your first project to get AI-powered analysis</p>
              <Link to="/dashboard/add" className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2">
                <PlusCircle size={16} />
                Add Project
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 6).map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + AI Status */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h2 className="text-white font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/dashboard/add"
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-600/15 to-purple-600/15 border border-blue-500/20 hover:from-blue-600/25 hover:to-purple-600/25 transition-all duration-200 group"
              >
                <PlusCircle size={18} className="text-blue-400" />
                <div>
                  <p className="text-white text-sm font-medium">Add New Project</p>
                  <p className="text-gray-500 text-xs">Start AI analysis</p>
                </div>
                <ArrowRight size={14} className="text-gray-600 ml-auto group-hover:text-blue-400 transition-colors" />
              </Link>

              <Link
                to="/dashboard/projects"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-200 group"
              >
                <FolderOpen size={18} className="text-purple-400" />
                <div>
                  <p className="text-white text-sm font-medium">View Projects</p>
                  <p className="text-gray-500 text-xs">Manage all projects</p>
                </div>
                <ArrowRight size={14} className="text-gray-600 ml-auto group-hover:text-purple-400 transition-colors" />
              </Link>

              <Link
                to="/dashboard/analysis"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-200 group"
              >
                <Brain size={18} className="text-emerald-400" />
                <div>
                  <p className="text-white text-sm font-medium">AI Analyses</p>
                  <p className="text-gray-500 text-xs">Review AI reports</p>
                </div>
                <ArrowRight size={14} className="text-gray-600 ml-auto group-hover:text-emerald-400 transition-colors" />
              </Link>
            </div>
          </div>

          {/* Agent Status */}
          <div className="glass-card p-6">
            <h2 className="text-white font-bold mb-4">Agent Status</h2>
            <div className="space-y-2.5">
              {[
                { name: 'Requirement Agent', status: 'active', phase: 'Phase 1' },
                { name: 'Talent Discovery', status: 'active', phase: 'Phase 2' },
                { name: 'Budget Intelligence', status: 'active', phase: 'Phase 3' },
                { name: 'Proposal Agent', status: 'active', phase: 'Phase 4' },
                { name: 'Planning Agent', status: 'active', phase: 'Phase 5' },
                { name: 'Progress Monitor', status: 'active', phase: 'Phase 6' },
              ].map((agent) => (
                <div key={agent.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-700'
                    }`} />
                    <span className={agent.status === 'active' ? 'text-white' : 'text-gray-500'}>
                      {agent.name}
                    </span>
                  </div>
                  <span className={`text-xs ${agent.status === 'active' ? 'text-emerald-400' : 'text-gray-600'}`}>
                    {agent.phase}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
