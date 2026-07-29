// src/components/talent/TalentDiscoverySection.tsx
// Agent 2 — Talent Discovery Agent UI Section (Client View)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CheckCircle2, Loader2, Sparkles, Star,
  Briefcase, Bell, RefreshCw, Send, AlertCircle, ExternalLink, X
} from 'lucide-react';
import { useTalentDiscovery } from '@/hooks/useTalentDiscovery';

interface TalentDiscoverySectionProps {
  projectId: string;
}

const TALENT_STEPS = [
  { id: 1, label: 'Analyzing project requirements...', duration: 600 },
  { id: 2, label: 'Searching freelancer database...', duration: 800 },
  { id: 3, label: 'Comparing technical skills...', duration: 700 },
  { id: 4, label: 'Calculating compatibility score...', duration: 600 },
  { id: 5, label: 'Selecting Top 3 freelancers...', duration: 500 },
  { id: 6, label: 'Sending project notifications...', duration: 600 },
];

export const TalentDiscoverySection: React.FC<TalentDiscoverySectionProps> = ({ projectId }) => {
  const {
    matches,
    isLoading,
    error,
    runDiscovery,
    refetchMatches,
  } = useTalentDiscovery(projectId);

  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Trigger loading animation simulation when discovery starts or no matches exist
  const handleStartDiscovery = () => {
    setIsSimulating(true);
    setCompletedSteps([]);
    setCurrentStepIndex(0);

    let step = 0;
    const interval = setInterval(() => {
      setCompletedSteps(prev => [...prev, step]);
      step += 1;
      if (step < TALENT_STEPS.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsSimulating(false);
          runDiscovery();
        }, 400);
      }
    }, 600);
  };

  return (
    <div className="mt-10 pt-8 border-t border-white/10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Users size={22} className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">🤖 Talent Discovery Agent</h2>
              <span className="badge-green text-xs font-semibold px-2.5 py-0.5">Agent 2 Active</span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">
              Based on your project requirements, our AI has identified the three most suitable freelancers.
            </p>
          </div>
        </div>

        {matches.length > 0 && !isSimulating && (
          <button
            onClick={handleStartDiscovery}
            disabled={isLoading}
            className="btn-secondary text-xs flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Re-run Discovery
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading & Step Animation */}
      {(isSimulating || (isLoading && matches.length === 0)) ? (
        <div className="glass-card p-8 text-center max-w-xl mx-auto my-4 gradient-border">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-600/30 to-teal-600/30 animate-ping opacity-30" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Users size={28} className="text-white" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            Talent Discovery Agent Working<span className="animate-pulse">...</span>
          </h3>
          <p className="text-gray-400 text-xs mb-6">Evaluating candidate skill matrix against project requirements</p>

          <div className="space-y-2.5 text-left max-w-md mx-auto">
            {TALENT_STEPS.map((step, idx) => {
              const isDone = completedSteps.includes(idx);
              const isActive = currentStepIndex === idx;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : isDone
                      ? 'bg-white/5 border border-white/5'
                      : 'opacity-40'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                  ) : isActive ? (
                    <Loader2 size={16} className="text-emerald-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-700 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${isDone ? 'text-emerald-300' : isActive ? 'text-white' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Top 3 Freelancer Cards View (Client View - Clean & Read-Only) */
        <div>
          {/* Notification Summary Banner */}
          {matches.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-500/20 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-emerald-300 text-sm font-semibold flex items-center gap-2">
                    Project Invitations Sent
                  </p>
                  <p className="text-gray-300 text-xs mt-0.5">
                    Invitations dispatched to <strong className="text-white">{matches.map(m => m.freelancer.name).join(', ')}</strong>. Awaiting response from candidates.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400/80 font-medium self-end sm:self-auto">
                <Send size={14} />
                <span>Real-time Response Tracking</span>
              </div>
            </div>
          )}

          {/* Section Sub-title for Client View */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>Top Matching Freelancers</span>
              <span className="text-xs text-gray-400 font-normal">(Client View)</span>
            </h3>
            <button
              onClick={refetchMatches}
              className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} />
              <span>Refresh Statuses</span>
            </button>
          </div>

          {/* 3 Freelancer Cards Grid (CLIENT VIEW - Clean & Read Only) */}
          {(() => {
            const isAnyAssigned = matches.some(m => m.status === 'ASSIGNED');
            const displayedMatches = isAnyAssigned ? matches.filter(m => m.status === 'ASSIGNED') : matches;
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {displayedMatches.map((match) => {
              const f = match.freelancer;
              const breakdown = match.score_breakdown;

              return (
                <div
                  key={match.id}
                  className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 ${
                    match.status === 'ACCEPTED'
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : match.status === 'DECLINED'
                      ? 'border-red-500/20 bg-red-950/10 opacity-75'
                      : ''
                  }`}
                >
                  {/* Top Match Score Pill & Availability */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                      <Sparkles size={12} className="text-emerald-400" />
                      <span>{match.match_score}% Match</span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        f.availability.toLowerCase().includes('available')
                          ? 'badge-green'
                          : 'badge-yellow'
                      }`}
                    >
                      {f.availability}
                    </span>
                  </div>

                  {/* Profile Info Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={f.profile_image}
                        alt={f.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=0D8ABC&color=fff`;
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-dark-900 flex items-center justify-center" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-bold text-base truncate">{f.name}</h3>
                      <p className="text-emerald-400 text-xs font-medium truncate mt-0.5">{f.title}</p>
                      
                      {/* Rating & Projects */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          ⭐ {f.rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>{f.experience} yrs exp</span>
                        <span>•</span>
                        <span>{f.completed_projects} projects</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {f.bio && (
                    <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2">
                      {f.bio}
                    </p>
                  )}

                  {/* Skills Match Tags */}
                  <div className="mb-5">
                    <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
                      Matching Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(breakdown?.matching_skills?.length
                        ? breakdown.matching_skills
                        : f.skills.slice(0, 5)
                      ).map((skill) => (
                        <span
                          key={skill}
                          className="badge-blue text-xs font-medium px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Notification Status Badge (CLIENT VIEW ONLY - Read Only) */}
                  <div className="pt-4 border-t border-white/5 mt-auto">
                    {match.status === 'NOTIFIED' && (
                      <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                          </span>
                          Project Invitation Sent
                        </span>
                        <span className="text-gray-400 font-medium text-[11px]">Waiting for Response</span>
                      </div>
                    )}

                    {match.status === 'ACCEPTED' && (
                      <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-emerald-400" />
                          Invitation Accepted
                        </span>
                        <span className="badge-green text-[11px] px-2.5 py-0.5">ACCEPTED</span>
                      </div>
                    )}

                    {match.status === 'DECLINED' && (
                      <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold">
                        <span className="flex items-center gap-2">
                          <X size={18} className="text-red-400" />
                          Invitation Declined
                        </span>
                        <span className="badge-red text-[11px] px-2.5 py-0.5">DECLINED</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}
        </div>
      )}
    </div>
  );
};
