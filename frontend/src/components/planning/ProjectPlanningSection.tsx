// src/components/planning/ProjectPlanningSection.tsx
// Agent 5 — Project Planning Intelligence Agent UI Section (Client & Freelancer View)

import React from 'react';
import {
  Kanban, Sparkles, Clock, CheckCircle2, AlertCircle, Loader2,
  FileText, Database, Layout, ShieldCheck, Rocket, ChevronRight,
  TrendingUp, AlertTriangle, Lightbulb, Calendar, Play, Check
} from 'lucide-react';
import { useProjectPlan, AI_PLANNING_STEPS } from '@/hooks/useProjectPlan';
import type { Milestone } from '@/types/projectPlan';

interface ProjectPlanningSectionProps {
  projectId: string;
  isFreelancerView?: boolean;
}

const getPhaseIcon = (index: number) => {
  switch (index % 5) {
    case 0: return FileText;
    case 1: return Database;
    case 2: return Layout;
    case 3: return ShieldCheck;
    case 4: return Rocket;
    default: return Kanban;
  }
};

export const ProjectPlanningSection: React.FC<ProjectPlanningSectionProps> = ({
  projectId,
  isFreelancerView = false,
}) => {
  const {
    plan,
    isLoading,
    isGenerating,
    currentStepIndex,
    error,
    generatePlan,
  } = useProjectPlanning(projectId);

  // Helper hook execution
  function useProjectPlanning(pId: string) {
    return useProjectPlan(pId);
  }

  // Don't render section if no stored plan and not loading/generating
  if (!isLoading && !isGenerating && !plan) {
    return null;
  }

  const detail = plan?.plan_json;
  const phases = detail?.phases || [];
  const totalDays = plan?.estimated_completion_days || 23;
  const dailyProgress = detail?.suggested_daily_progress || (100 / totalDays).toFixed(1);

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Kanban size={24} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">🤖 Project Planning Intelligence Agent</h2>
              <span className="badge-blue text-xs font-semibold px-2.5 py-0.5">Agent 5 Active</span>
            </div>
            <p className="text-gray-400 text-sm mt-1 max-w-3xl">
              Our AI has generated an official, structured execution roadmap based on the approved budget, deadline, and technical requirements.
            </p>
          </div>
        </div>

        {plan && (
          <div className="px-4 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-2 self-start md:self-auto shadow-lg shadow-blue-500/10">
            <CheckCircle2 size={16} className="text-blue-400" />
            <span>Official Roadmap Active • Stored in Database</span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Animated AI Loading Sequence */}
      {isGenerating ? (
        <div className="glass-card p-10 text-center border border-blue-500/30 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-6 text-blue-400 shadow-xl shadow-blue-500/10">
            <Loader2 size={36} className="animate-spin" />
          </div>

          <h3 className="text-xl font-extrabold text-white mb-2">Generating Project Execution Plan</h3>
          <p className="text-blue-400 font-semibold text-sm mb-6 animate-pulse">
            {AI_PLANNING_STEPS[currentStepIndex]}
          </p>

          {/* Animated Progress Bar */}
          <div className="w-full max-w-md mx-auto bg-white/10 rounded-full h-2.5 overflow-hidden mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${((currentStepIndex + 1) / AI_PLANNING_STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs font-mono">Step {currentStepIndex + 1} of {AI_PLANNING_STEPS.length}</p>
        </div>
      ) : isLoading ? (
        <div className="skeleton h-96 rounded-2xl" />
      ) : plan && detail ? (
        /* Main Roadmap Grid */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Vertical Timeline & Milestone Cards (2 Columns Wide) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Overview Banner */}
            <div className="glass-card p-5 border border-blue-500/20 bg-blue-950/20">
              <p className="text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles size={13} />
                Executive Project Overview
              </p>
              <p className="text-gray-200 text-xs leading-relaxed font-normal">
                "{plan.overview}"
              </p>
            </div>

            {/* Vertical Timeline Milestone Cards */}
            <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-indigo-500 before:to-emerald-500">
              {phases.map((phase, idx) => {
                const IconComponent = getPhaseIcon(idx);
                const isFirst = idx === 0;

                return (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Ring */}
                    <div className="absolute -left-6 top-5 -translate-x-1/2 w-7 h-7 rounded-full bg-dark-950 border-2 border-blue-400 flex items-center justify-center text-blue-400 shadow-md group-hover:scale-110 transition-transform">
                      <IconComponent size={14} />
                    </div>

                    {/* Milestone Card */}
                    <div className="glass-card p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-base">{phase.phase_name}</h3>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                              phase.status === 'Completed'
                                ? 'badge-green'
                                : phase.status === 'In Progress'
                                ? 'badge-blue'
                                : 'badge-gray'
                            }`}>
                              {phase.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1 text-blue-400 font-semibold">
                            <Clock size={13} />
                            {phase.duration_days} Days
                          </span>
                          <span>•</span>
                          <span>{phase.tasks.length} Tasks</span>
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div className="mb-4">
                        <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
                          Key Milestone Tasks
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {phase.tasks.map((task, tIdx) => (
                            <div key={tIdx} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
                              <Check size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                              <span>{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deliverable Tag */}
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between">
                        <span className="text-gray-400 font-medium">Deliverable:</span>
                        <span className="text-blue-300 font-bold flex items-center gap-1">
                          📦 {phase.deliverable}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Execution Metrics & Recommendations */}
          <div className="space-y-6">
            {/* Project Metrics Summary Card */}
            <div className="glass-card p-6 border border-blue-500/20 shadow-xl space-y-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider pb-3 border-b border-white/5 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-400" />
                Execution Metrics
              </h3>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-gray-400 text-xs">Total Duration</p>
                <p className="text-white font-black text-2xl mt-1">{totalDays} Days</p>
                <p className="text-gray-500 text-[11px] mt-0.5">Estimated roadmap completion</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-gray-400 text-xs">Target Daily Progress</p>
                <p className="text-emerald-400 font-black text-2xl mt-1">{dailyProgress}% / day</p>
                <p className="text-gray-500 text-[11px] mt-0.5">Recommended daily completion velocity</p>
              </div>
            </div>

            {/* Testing Strategy */}
            {detail.testing_phase && (
              <div className="glass-card p-6 border border-purple-500/20 space-y-2">
                <h4 className="text-purple-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-purple-400" />
                  Testing & QA Strategy
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed">{detail.testing_phase}</p>
              </div>
            )}

            {/* Deployment Strategy */}
            {detail.deployment_phase && (
              <div className="glass-card p-6 border border-teal-500/20 space-y-2">
                <h4 className="text-teal-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Rocket size={14} className="text-teal-400" />
                  Deployment & Launch
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed">{detail.deployment_phase}</p>
              </div>
            )}

            {/* Identified Risks */}
            {detail.potential_risks && detail.potential_risks.length > 0 && (
              <div className="glass-card p-6 border border-amber-500/20 space-y-3">
                <h4 className="text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-400" />
                  Identified Risks
                </h4>
                <div className="space-y-1.5">
                  {detail.potential_risks.map((risk, rIdx) => (
                    <div key={rIdx} className="text-xs text-amber-200/90 flex items-start gap-1.5">
                      <span>•</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {detail.recommendations && detail.recommendations.length > 0 && (
              <div className="glass-card p-6 border border-blue-500/20 space-y-3">
                <h4 className="text-blue-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-blue-400" />
                  AI Recommendations
                </h4>
                <div className="space-y-1.5">
                  {detail.recommendations.map((rec, rcIdx) => (
                    <div key={rcIdx} className="text-xs text-blue-200/90 flex items-start gap-1.5">
                      <span>✓</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
