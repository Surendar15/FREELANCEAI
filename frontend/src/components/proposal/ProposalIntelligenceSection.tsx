// src/components/proposal/ProposalIntelligenceSection.tsx
// Agent 3 — Proposal Intelligence Agent UI Section (Client View)

import React, { useState } from 'react';
import {
  Brain, Sparkles, CheckCircle2, Star, ShieldCheck, UserCheck,
  AlertCircle, Loader2, Award, Zap, Building, Check, ArrowRight
} from 'lucide-react';
import { useProposalIntelligence } from '@/hooks/useProposalIntelligence';
import type { ProposalSummary } from '@/types/proposal';

interface ProposalIntelligenceSectionProps {
  projectId: string;
}

export const ProposalIntelligenceSection: React.FC<ProposalIntelligenceSectionProps> = ({ projectId }) => {
  const {
    proposals,
    isLoading,
    error,
    assigningId,
    assignmentResult,
    assignProject,
  } = useProposalIntelligence(projectId);

  const [confirmModalFreelancer, setConfirmModalFreelancer] = useState<ProposalSummary | null>(null);

  const handleConfirmAssignment = async () => {
    if (!confirmModalFreelancer) return;
    const success = await assignProject(confirmModalFreelancer.freelancer_id);
    if (success) {
      setConfirmModalFreelancer(null);
    }
  };

  // If no accepted proposals exist, don't show section
  if (!isLoading && proposals.length === 0) {
    return null;
  }

  const isAssigned = proposals.some(p => p.selection_status === 'ASSIGNED' || p.selection_status === 'STARTED') || !!assignmentResult;

  // Filter proposals: If assigned, ELIMINATE non-assigned candidates from display!
  const displayedProposals = isAssigned
    ? proposals.filter(p => p.selection_status === 'ASSIGNED' || p.selection_status === 'STARTED')
    : proposals;

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Brain size={24} className="text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">🤖 Proposal Intelligence Agent</h2>
              <span className="badge-purple text-xs font-semibold px-2.5 py-0.5">Agent 3 Active</span>
            </div>
            <p className="text-gray-400 text-sm mt-1 max-w-3xl">
              {isAssigned
                ? 'Your project has been assigned. The selected freelancer is preparing for project kickoff.'
                : 'The following freelancers have accepted your project invitation. Our AI has analyzed each candidate to help you make the best decision.'}
            </p>
          </div>
        </div>

        {isAssigned && (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 self-start md:self-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Project In Progress • Assigned Successfully</span>
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

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="skeleton h-60 rounded-2xl" />
          ))}
        </div>
      ) : (
        /* Displayed Proposals Grid (Non-selected candidates eliminated when assigned) */
        <div className="space-y-6">
          {displayedProposals.map((prop) => {
            const f = prop.freelancer;
            const isThisAssigned = prop.selection_status === 'ASSIGNED' || prop.selection_status === 'STARTED';

            return (
              <div
                key={prop.id}
                className={`glass-card p-6 border transition-all duration-300 relative overflow-hidden ${
                  isThisAssigned
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-2xl shadow-emerald-500/10'
                    : 'border-purple-500/20 hover:border-purple-500/40 shadow-xl'
                }`}
              >
                {/* Top Badge Banner */}
                <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="badge-purple font-bold text-xs px-3 py-1 flex items-center gap-1.5 shadow-sm">
                      <Sparkles size={12} className="text-purple-300" />
                      {prop.recommendation_badge}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center gap-1">
                      <Zap size={12} className="text-indigo-400" />
                      {prop.confidence_score}% AI Confidence
                    </span>
                  </div>

                  {isThisAssigned ? (
                    <span className="badge-green text-xs font-bold px-3 py-1 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Assigned Freelancer
                    </span>
                  ) : (
                    <span className="badge-green text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Invitation Accepted
                    </span>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left Column: Candidate & AI Summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={f.profile_image}
                        alt={f.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/40 shadow-md flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=6366F1&color=fff`;
                        }}
                      />
                      <div>
                        <h3 className="text-white font-bold text-lg leading-snug">{f.name}</h3>
                        <p className="text-purple-400 text-xs font-medium">{f.title}</p>
                        
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            ⭐ {f.rating.toFixed(1)}
                          </span>
                          <span>•</span>
                          <span>{f.experience} yrs exp</span>
                          <span>•</span>
                          <span>{f.completed_projects} projects completed</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Generated Summary Box */}
                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 mb-4">
                      <p className="text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Brain size={13} className="text-purple-400" />
                        AI Executive Recommendation Summary
                      </p>
                      <p className="text-gray-200 text-xs leading-relaxed font-normal">
                        "{prop.ai_summary}"
                      </p>
                    </div>

                    {/* Key Strengths Tags */}
                    {prop.strengths && prop.strengths.length > 0 && (
                      <div>
                        <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
                          Key Strengths & Advantages
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {prop.strengths.map((str, idx) => (
                            <span key={idx} className="badge-blue text-xs font-medium px-2.5 py-1 rounded-lg">
                              ✓ {str}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Assign Action */}
                  <div className="lg:w-64 flex flex-col justify-between pt-4 lg:pt-0 lg:border-l border-white/10 lg:pl-6">
                    <div className="mb-4">
                      <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
                        Assignment Action
                      </p>

                      {isThisAssigned ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center">
                          <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                          <p className="font-bold text-sm">Assigned Successfully</p>
                          <p className="text-emerald-400/80 text-[11px] mt-1">Project is in progress with this candidate.</p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs mb-3">
                          <p className="font-semibold mb-0.5">Ready for Assignment</p>
                          <p className="text-gray-400 text-[11px]">Clicking Assign will lock this candidate and notify them instantly.</p>
                        </div>
                      )}
                    </div>

                    {!isAssigned && (
                      <button
                        onClick={() => setConfirmModalFreelancer(prop)}
                        disabled={!!assigningId}
                        className="btn-primary w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        {assigningId === prop.freelancer_id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <UserCheck size={16} />
                            <span>Assign Project</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalFreelancer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card gradient-border p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <UserCheck size={24} />
            </div>

            <h3 className="text-xl font-extrabold text-white text-center mb-2">Confirm Project Assignment</h3>
            <p className="text-gray-300 text-sm text-center mb-6 leading-relaxed">
              Are you sure you want to assign this project to <strong className="text-white font-bold">{confirmModalFreelancer.freelancer.name}</strong>?
            </p>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-6 text-xs text-gray-400 space-y-1.5">
              <p className="flex items-center gap-2 text-white font-semibold">
                <Check size={14} className="text-emerald-400" />
                Project status will update to <span className="text-emerald-400 font-bold">IN PROGRESS</span>.
              </p>
              <p className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400" />
                Selected freelancer will receive an instant notification.
              </p>
              <p className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400" />
                Unselected candidates will be eliminated from display.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModalFreelancer(null)}
                disabled={!!assigningId}
                className="btn-secondary flex-1 text-xs py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={!!assigningId}
                className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {assigningId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>Confirm Assignment</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
