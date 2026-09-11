// src/pages/AnalysisResultPage.tsx
// Full structured AI analysis display page

import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Brain, Code2, Users, Clock, DollarSign, AlertTriangle,
  CheckCircle2, Star, Zap, ArrowLeft, PlusCircle,
  Database, Globe, Wrench, Target, Package, Shield,
  ChevronRight, BarChart3,
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import type { AnalyzeResponse, Feature, Risk } from '@/types/project';
import { TalentDiscoverySection } from '@/components/talent/TalentDiscoverySection';
import { ProposalIntelligenceSection } from '@/components/proposal/ProposalIntelligenceSection';
import { BudgetIntelligenceSection } from '@/components/budget/BudgetIntelligenceSection';
import { ProjectPlanningSection } from '@/components/planning/ProjectPlanningSection';
import { ClientProgressTracker } from '@/components/progress/ClientProgressTracker';

// ── Complexity Badge ───────────────────────────────────────────────────────
const ComplexityBadge: React.FC<{ level: string }> = ({ level }) => {
  const config = {
    simple:     { cls: 'badge-green',  label: 'Simple' },
    moderate:   { cls: 'badge-blue',   label: 'Moderate' },
    complex:    { cls: 'badge-yellow', label: 'Complex' },
    enterprise: { cls: 'badge-red',    label: 'Enterprise' },
  } as Record<string, { cls: string; label: string }>;

  const { cls, label } = config[level] || { cls: 'badge-gray', label: level };
  return <span className={cls}>{label}</span>;
};

// ── Priority Badge ─────────────────────────────────────────────────────────
const PriorityBadge: React.FC<{ level: string }> = ({ level }) => {
  const config = {
    low:      { cls: 'badge-gray',   label: '🔵 Low' },
    medium:   { cls: 'badge-blue',   label: '🟡 Medium' },
    high:     { cls: 'badge-yellow', label: '🟠 High' },
    critical: { cls: 'badge-red',    label: '🔴 Critical' },
  } as Record<string, { cls: string; label: string }>;

  const { cls, label } = config[level] || { cls: 'badge-gray', label: level };
  return <span className={cls}>{label}</span>;
};

// ── Impact Badge ───────────────────────────────────────────────────────────
const ImpactBadge: React.FC<{ level: string }> = ({ level }) => {
  const config = {
    low:    { cls: 'badge-green',  label: 'Low Impact' },
    medium: { cls: 'badge-yellow', label: 'Med Impact' },
    high:   { cls: 'badge-red',    label: 'High Impact' },
  } as Record<string, { cls: string; label: string }>;

  const { cls, label } = config[level] || { cls: 'badge-gray', label: level };
  return <span className={cls}>{label}</span>;
};

// ── Skill Tag ──────────────────────────────────────────────────────────────
const SkillTag: React.FC<{ label: string; variant?: 'blue' | 'purple' | 'gray' }> = ({
  label, variant = 'blue',
}) => (
  <span className={`badge-${variant} text-xs`}>{label}</span>
);

// ── Section Card ───────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, iconColor, children, className = '' }) => (
  <div className={`glass-card p-6 ${className}`}>
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
      <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
        <Icon size={18} />
      </div>
      <h3 className="text-white font-bold">{title}</h3>
    </div>
    {children}
  </div>
);

// ── Feature Card ───────────────────────────────────────────────────────────
const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => {
  const priorityColor = {
    high:   'border-l-blue-500',
    medium: 'border-l-yellow-500',
    low:    'border-l-gray-600',
  }[feature.priority] || 'border-l-gray-600';

  return (
    <div className={`p-4 rounded-xl bg-white/5 border border-white/5 border-l-2 ${priorityColor}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-white text-sm font-semibold">{feature.name}</p>
        <span className={`badge text-xs ${
          feature.priority === 'high' ? 'badge-blue' :
          feature.priority === 'medium' ? 'badge-yellow' : 'badge-gray'
        }`}>
          {feature.priority}
        </span>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed">{feature.description}</p>
    </div>
  );
};

// ── Risk Card ──────────────────────────────────────────────────────────────
const RiskCard: React.FC<{ risk: Risk }> = ({ risk }) => (
  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
    <div className="flex items-start gap-3">
      <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <p className="text-white text-sm font-semibold">{risk.risk}</p>
          <ImpactBadge level={risk.impact} />
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">
          <span className="text-emerald-400 font-medium">Mitigation: </span>
          {risk.mitigation}
        </p>
      </div>
    </div>
  </div>
);

// ── Main Result Page ───────────────────────────────────────────────────────
const AnalysisResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as AnalyzeResponse | undefined;

  if (!result) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <Brain size={48} className="text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Analysis Found</h2>
          <p className="text-gray-400 mb-6">Navigate here after analysing a project.</p>
          <Link to="/dashboard/add" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle size={16} />
            Add Project
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { project, analysis } = result;
  const tech = analysis.required_technologies;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/projects')}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center">
                <Brain size={20} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{analysis.project_title}</h1>
                <p className="text-gray-400 text-sm">AI Requirement Analysis — Completed</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            <ComplexityBadge level={analysis.estimated_complexity} />
            <PriorityBadge level={analysis.priority_level} />
            <span className="badge-green">✓ Analysis Complete</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: Users,
            label: 'Team Size',
            value: `${analysis.suggested_team_size} devs`,
            color: 'text-blue-400',
          },
          {
            icon: Clock,
            label: 'Timeline',
            value: `${analysis.estimated_timeline_weeks} weeks`,
            color: 'text-purple-400',
          },
          {
            icon: DollarSign,
            label: 'Budget Range',
            value: `₹${analysis.suggested_budget_range.min_usd.toLocaleString()} – ₹${analysis.suggested_budget_range.max_usd.toLocaleString()}`,
            color: 'text-emerald-400',
          },
          {
            icon: Target,
            label: 'Domain',
            value: analysis.domain,
            color: 'text-amber-400',
          },
        ].map((item) => (
          <div key={item.label} className="glass-card p-4">
            <item.icon size={18} className={`${item.color} mb-2`} />
            <p className="text-gray-500 text-xs">{item.label}</p>
            <p className="text-white font-bold text-sm mt-0.5 truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Technologies */}
        <SectionCard title="Required Technologies" icon={Code2} iconColor="text-blue-400">
          <div className="space-y-4">
            {tech.programming_languages.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Code2 size={12} />
                  Programming Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {tech.programming_languages.map(l => <SkillTag key={l} label={l} variant="blue" />)}
                </div>
              </div>
            )}
            {tech.frameworks.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Zap size={12} />
                  Frameworks
                </p>
                <div className="flex flex-wrap gap-2">
                  {tech.frameworks.map(f => <SkillTag key={f} label={f} variant="purple" />)}
                </div>
              </div>
            )}
            {tech.databases.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Database size={12} />
                  Databases
                </p>
                <div className="flex flex-wrap gap-2">
                  {tech.databases.map(d => <SkillTag key={d} label={d} variant="gray" />)}
                </div>
              </div>
            )}
            {tech.cloud_services.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Globe size={12} />
                  Cloud Services
                </p>
                <div className="flex flex-wrap gap-2">
                  {tech.cloud_services.map(c => <SkillTag key={c} label={c} variant="blue" />)}
                </div>
              </div>
            )}
            {tech.tools.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Wrench size={12} />
                  Tools
                </p>
                <div className="flex flex-wrap gap-2">
                  {tech.tools.map(t => <SkillTag key={t} label={t} variant="gray" />)}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Skills */}
        <SectionCard title="Required Skills" icon={Star} iconColor="text-amber-400">
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-2">Core Skills</p>
              <div className="flex flex-wrap gap-2">
                {analysis.required_skills.map(s => <SkillTag key={s} label={s} variant="blue" />)}
              </div>
            </div>
            {analysis.nice_to_have_skills.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs font-medium mb-2">Nice to Have</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.nice_to_have_skills.map(s => <SkillTag key={s} label={s} variant="gray" />)}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Core Features */}
      <SectionCard title="Core Features" icon={CheckCircle2} iconColor="text-emerald-400" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {analysis.core_features.map((f, i) => <FeatureCard key={i} feature={f} />)}
        </div>
      </SectionCard>

      {/* Optional Features */}
      {analysis.optional_features.length > 0 && (
        <SectionCard title="Optional Features" icon={Package} iconColor="text-purple-400" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {analysis.optional_features.map((f, i) => <FeatureCard key={i} feature={f} />)}
          </div>
        </SectionCard>
      )}

      {/* Risks + Deliverables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Risks */}
        <SectionCard title="Potential Risks" icon={Shield} iconColor="text-red-400">
          <div className="space-y-3">
            {analysis.potential_risks.map((r, i) => <RiskCard key={i} risk={r} />)}
          </div>
        </SectionCard>

        {/* Deliverables + Dependencies */}
        <div className="space-y-6">
          <SectionCard title="Deliverables" icon={Target} iconColor="text-emerald-400">
            <ul className="space-y-2">
              {analysis.deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  {d}
                </li>
              ))}
            </ul>
          </SectionCard>

          {analysis.dependencies.length > 0 && (
            <SectionCard title="Dependencies" icon={Package} iconColor="text-amber-400">
              <ul className="space-y-2">
                {analysis.dependencies.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <ChevronRight size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Analysis Notes */}
      {analysis.analysis_notes && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={18} className="text-blue-400" />
            <h3 className="text-white font-bold">AI Analysis Notes</h3>
            <span className={`badge text-xs ml-auto ${
              analysis.analysis_confidence === 'high' ? 'badge-green' :
              analysis.analysis_confidence === 'medium' ? 'badge-yellow' : 'badge-red'
            }`}>
              {analysis.analysis_confidence} confidence
            </span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{analysis.analysis_notes}</p>
        </div>
      )}

      {/* Talent Discovery Agent (Agent 2) */}
      <TalentDiscoverySection projectId={project.id} />

      {/* Proposal Intelligence Agent (Agent 3) */}
      <ProposalIntelligenceSection projectId={project.id} />

      {/* Budget Intelligence Agent (Agent 4) */}
      <BudgetIntelligenceSection projectId={project.id} />

      {/* Project Planning (Agent 5) & Progress Tracker (Agent 6) — rendered only after project start */}
      {(project.status === 'in_progress' || project.status === 'completed') && (
        <>
          <ProjectPlanningSection projectId={project.id} />
          <ClientProgressTracker projectId={project.id} />
        </>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="text-gray-500 text-xs">
          Analysed with: <span className="text-gray-400">{project.ai_model_used}</span>
          {' · '}
          Project ID: <span className="text-gray-400 font-mono">{project.id.slice(0, 8)}...</span>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/add" className="btn-secondary flex items-center gap-2 text-sm">
            <PlusCircle size={16} />
            New Project
          </Link>
          <Link to="/dashboard/projects" className="btn-primary flex items-center gap-2 text-sm">
            <BarChart3 size={16} />
            All Projects
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalysisResultPage;
