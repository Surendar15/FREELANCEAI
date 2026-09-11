// src/pages/freelancer/FreelancerDashboardPage.tsx
// Freelancer Dashboard — Project Invitations, Assignment & Budget Offer Management

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, CheckCircle2, X, Clock, DollarSign, Calendar,
  Sparkles, Loader2, AlertCircle, Building, User, Trophy, ArrowRight,
  Calculator, Play, ShieldAlert
} from 'lucide-react';
import { useFreelancerAuth } from '@/hooks/useFreelancerAuth';
import { useFreelancerInvitations } from '@/hooks/useFreelancerInvitations';
import { proposalService } from '@/services/proposalService';
import { budgetService } from '@/services/budgetService';
import { FreelancerLayout } from '@/layouts/FreelancerLayout';
import { ProjectPlanningSection } from '@/components/planning/ProjectPlanningSection';
import { FreelancerProgressTracker } from '@/components/progress/FreelancerProgressTracker';
import type { FreelancerAssignmentNotification } from '@/types/proposal';
import type { FreelancerBudgetOfferNotification } from '@/types/budget';

export const FreelancerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { freelancer, isAuthenticated } = useFreelancerAuth();
  const { invitations, isLoading, error, respondingId, respond } = useFreelancerInvitations();
  const [assignment, setAssignment] = useState<FreelancerAssignmentNotification | null>(null);
  const [assignmentAccepted, setAssignmentAccepted] = useState(false);

  const [budgetOffer, setBudgetOffer] = useState<FreelancerBudgetOfferNotification | null>(null);
  const [isRespondingBudget, setIsRespondingBudget] = useState(false);
  const [budgetResponseState, setBudgetResponseState] = useState<'STARTED' | 'DECLINED' | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      proposalService
        .getFreelancerAssignment()
        .then(setAssignment)
        .catch(() => { });

      budgetService
        .getFreelancerBudgetOffer()
        .then(setBudgetOffer)
        .catch(() => { });
    }
  }, [isAuthenticated]);

  const handleRespondBudget = async (action: 'START' | 'DECLINE') => {
    if (!budgetOffer?.project_id) return;
    setIsRespondingBudget(true);
    try {
      const res = await budgetService.respondBudgetOffer(budgetOffer.project_id, action);
      if (action === 'START') {
        setBudgetResponseState('STARTED');
      } else {
        setBudgetResponseState('DECLINED');
        setBudgetOffer(null);
      }
    } catch (err: unknown) {
      alert('Failed to respond to budget offer. Please try again.');
    } finally {
      setIsRespondingBudget(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <FreelancerLayout>
        <div className="text-center py-20">
          <Briefcase size={48} className="text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Freelancer Authentication Required</h2>
          <p className="text-gray-400 mb-6">Log in as a freelancer to view your project invitations.</p>
          <button onClick={() => navigate('/freelancer/login')} className="btn-primary">
            Log In as Freelancer
          </button>
        </div>
      </FreelancerLayout>
    );
  }

  return (
    <FreelancerLayout>
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={freelancer?.profile_image}
              alt={freelancer?.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/40 shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(freelancer?.name || 'F')}&background=6366F1&color=fff`;
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">Welcome back, {freelancer?.name}!</h1>
                <span className="badge-purple text-xs font-semibold px-2.5 py-0.5">Freelancer Portal</span>
              </div>
              <p className="text-purple-300 text-sm mt-0.5">{freelancer?.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 💰 AGENT 4 BUDGET OFFER SECTION */}
      {budgetOffer?.has_offer && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-teal-950/80 to-dark-950 border-2 border-emerald-500/50 shadow-2xl mb-8 relative overflow-hidden animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-lg">
                <Calculator size={30} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-green text-xs font-bold px-2.5 py-0.5">Agent 4 Budget Offer</span>
                  <h2 className="text-xl font-extrabold text-white">New Budget Offer Received!</h2>
                </div>
                <p className="text-emerald-300 text-sm font-bold mb-2">
                  Project: <span className="text-white font-extrabold">{budgetOffer.project_title}</span>
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-gray-300 mt-2">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-base bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    <DollarSign size={16} />
                    Offered Budget: ₹{budgetOffer.offered_budget?.toLocaleString()} INR
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-purple-400" />
                    Client: <strong className="text-white">{budgetOffer.client_name}</strong> {budgetOffer.client_company && `(${budgetOffer.client_company})`}
                  </span>
                  {budgetOffer.timeline_weeks && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-400" />
                      Timeline: <strong className="text-white">{budgetOffer.timeline_weeks} weeks</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Start Project vs Decline Budget */}
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              {budgetResponseState === 'STARTED' ? (
                <div className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={16} />
                  <span>Project Started Successfully ✓</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleRespondBudget('START')}
                    disabled={isRespondingBudget}
                    className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    {isRespondingBudget ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Play size={16} />
                        <span>Start Project</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRespondBudget('DECLINE')}
                    disabled={isRespondingBudget}
                    className="py-3 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-gray-400 border border-white/10"
                  >
                    {isRespondingBudget ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <X size={16} />
                        <span>Decline Budget</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🎉 ASSIGNMENT CONGRATULATIONS NOTIFICATION BANNER */}
      {assignment?.has_assignment && !budgetOffer?.has_offer && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-purple-950/80 border-2 border-emerald-500/40 shadow-2xl mb-8 relative overflow-hidden animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-lg">
                <Trophy size={30} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🎉</span>
                  <h2 className="text-xl font-extrabold text-white">Congratulations! You Have Been Selected!</h2>
                </div>
                <p className="text-emerald-300 text-sm font-semibold mb-2">
                  Project: <span className="text-white font-bold">{assignment.project_title}</span>
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-emerald-400" />
                    Client: <strong className="text-white">{assignment.client_name}</strong> {assignment.client_company && `(${assignment.client_company})`}
                  </span>
                  {assignment.assigned_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-amber-400" />
                      Assigned Date: <strong className="text-white">{new Date(assignment.assigned_at).toLocaleDateString()}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setAssignmentAccepted(true)}
              disabled={assignmentAccepted}
              className={`btn-primary font-bold text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg flex-shrink-0 transition-all ${assignmentAccepted
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                }`}
            >
              <CheckCircle2 size={16} />
              <span>{assignmentAccepted ? 'Assignment Accepted ✓' : 'Accept Assignment'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Overview Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4">
          <p className="text-gray-400 text-xs font-medium">Rating</p>
          <p className="text-amber-400 font-extrabold text-xl mt-1">⭐ {freelancer?.rating.toFixed(1)}</p>
        </div>

        <div className="glass-card p-4">
          <p className="text-gray-400 text-xs font-medium">Completed Projects</p>
          <p className="text-white font-extrabold text-xl mt-1">{freelancer?.completed_projects}</p>
        </div>

        <div className="glass-card p-4">
          <p className="text-gray-400 text-xs font-medium">Experience</p>
          <p className="text-purple-400 font-extrabold text-xl mt-1">{freelancer?.experience} Years</p>
        </div>

        <div className="glass-card p-4">
          <p className="text-gray-400 text-xs font-medium">Total Invitations</p>
          <p className="text-emerald-400 font-extrabold text-xl mt-1">{invitations.length}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
          <AlertCircle size={18} className="text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Invitations List Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Project Invitations</span>
              <span className="badge-purple text-xs font-semibold px-2 py-0.5">{invitations.length}</span>
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">Projects matched to your profile by the Talent Discovery Agent.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="skeleton h-48 rounded-2xl" />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="glass-card p-12 text-center my-4">
            <Briefcase size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Invitations Yet</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-2">
              When clients submit project requirements, matched invitations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {invitations.map((inv) => {
              const match = inv.match;
              const isUpdating = respondingId === match.id;

              return (
                <div
                  key={match.id}
                  className={`glass-card p-6 border transition-all duration-300 ${match.status === 'STARTED' || match.status === 'ASSIGNED'
                      ? 'border-emerald-500/60 bg-emerald-950/30 shadow-2xl shadow-emerald-500/10'
                      : match.status === 'ACCEPTED'
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : match.status === 'DECLINED' || match.status === 'DECLINED_BUDGET' || match.status === 'NOT_SELECTED'
                          ? 'border-red-500/20 bg-red-950/10 opacity-75'
                          : 'border-white/10 hover:border-purple-500/30'
                    }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left Info Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="badge-purple font-bold text-xs flex items-center gap-1.5">
                          <Sparkles size={12} className="text-purple-300" />
                          {match.match_score}% Compatibility Match
                        </span>

                        {inv.client_company && (
                          <span className="badge-gray text-xs flex items-center gap-1">
                            <Building size={12} />
                            {inv.client_company}
                          </span>
                        )}

                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User size={12} />
                          Posted by {inv.client_name}
                        </span>
                      </div>

                      <h3 className="text-white font-bold text-xl mb-2">{inv.project_title}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap line-clamp-3">
                        {inv.project_description}
                      </p>

                      {/* Project Meta Info */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                        {inv.budget && (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <DollarSign size={14} />
                            <span>₹{inv.budget.toLocaleString()} INR</span>
                          </div>
                        )}

                        {inv.deadline && (
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <Calendar size={14} />
                            <span>Deadline: {new Date(inv.deadline).toLocaleDateString()}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Clock size={14} />
                          <span>Matched {new Date(match.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5">
                        <button
                          onClick={() => navigate(`/freelancer/projects/${match.project_id}`)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>View Full Project Roadmap & AI Intelligence</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Right Action Column */}
                    <div className="lg:w-72 flex flex-col justify-between pt-4 lg:pt-0 lg:border-l border-white/10 lg:pl-6">
                      <div className="mb-4">
                        <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
                          Invitation Status
                        </p>

                        {match.status === 'NOTIFIED' && (
                          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                            <p className="font-semibold flex items-center gap-2 mb-1">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                              </span>
                              Invitation Received
                            </p>
                            <p className="text-gray-400 text-[11px]">Please accept or decline this project proposal.</p>
                          </div>
                        )}

                        {match.status === 'ACCEPTED' && (
                          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                            <p className="font-bold flex items-center gap-1.5 mb-1">
                              <CheckCircle2 size={16} className="text-emerald-400" />
                              You Accepted This Project
                            </p>
                            <p className="text-emerald-400/80 text-[11px]">Client notified. Awaiting AI selection decision.</p>
                          </div>
                        )}

                        {match.status === 'ASSIGNED' && (
                          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
                            <p className="font-extrabold text-sm flex items-center gap-1.5 mb-1">
                              <Trophy size={16} className="text-emerald-400 animate-pulse" />
                              Selected & Assigned!
                            </p>
                            <p className="text-emerald-300/90 text-[11px]">Awaiting client budget offer.</p>
                          </div>
                        )}

                        {inv.project_status === 'completed' || (match.status as string) === 'COMPLETED' ? (
                          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
                            <p className="font-extrabold text-sm flex items-center gap-1.5 mb-1">
                              <CheckCircle2 size={16} className="text-emerald-400" />
                              🎉 Project Completed & Delivered
                            </p>
                            <p className="text-emerald-300/90 text-[11px]">Final project deliverables submitted and completed.</p>
                          </div>
                        ) : (match.status === 'STARTED' || (match.status as string) === 'SUBMITTED') && (
                          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
                            <p className="font-extrabold text-sm flex items-center gap-1.5 mb-1">
                              <Play size={16} className="text-emerald-400" />
                              Project In Progress
                            </p>
                            <p className="text-emerald-300/90 text-[11px]">You accepted the budget offer and started this project.</p>
                          </div>
                        )}

                        {match.status === 'DECLINED' && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                            <p className="font-bold flex items-center gap-1.5 mb-1">
                              <X size={16} className="text-red-400" />
                              You Declined This Project
                            </p>
                          </div>
                        )}

                        {match.status === 'DECLINED_BUDGET' && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                            <p className="font-bold flex items-center gap-1.5 mb-1">
                              <X size={16} className="text-red-400" />
                              Declined Budget Offer
                            </p>
                          </div>
                        )}

                        {match.status === 'NOT_SELECTED' && (
                          <div className="p-3 rounded-xl bg-gray-500/10 border border-white/10 text-gray-400 text-xs">
                            <p className="font-bold mb-1">Not Selected</p>
                            <p className="text-gray-500 text-[11px]">Another candidate was selected for this project.</p>
                          </div>
                        )}
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="space-y-2">
                        {match.status === 'NOTIFIED' && (
                          <>
                            <button
                              onClick={() => respond(match.id, 'ACCEPTED')}
                              disabled={isUpdating}
                              className="w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                            >
                              {isUpdating && respondingId === match.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 size={16} />
                                  <span>Accept Project</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => respond(match.id, 'DECLINED')}
                              disabled={isUpdating}
                              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-gray-400 border border-white/10"
                            >
                              {isUpdating && respondingId === match.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <>
                                  <X size={16} />
                                  <span>Decline Project</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {match.status === 'ACCEPTED' && (
                          <div className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <span>Accepted</span>
                          </div>
                        )}

                        {match.status === 'ASSIGNED' && (
                          <div className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-emerald-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                            <Trophy size={16} />
                            <span>Project Assigned ✓</span>
                          </div>
                        )}

                        {inv.project_status === 'completed' || (match.status as string) === 'COMPLETED' ? (
                          <div className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-emerald-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 size={16} />
                            <span>🎉 Project Completed & Delivered ✓</span>
                          </div>
                        ) : match.status === 'STARTED' ? (
                          <div className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-emerald-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                            <Play size={16} />
                            <span>Project Started ✓</span>
                          </div>
                        ) : null}

                        {(match.status === 'DECLINED' || match.status === 'DECLINED_BUDGET') && (
                          <div className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-red-600/20 text-red-300 border border-red-500/40 flex items-center justify-center gap-2">
                            <X size={16} className="text-red-400" />
                            <span>Declined</span>
                          </div>
                        )}

                        {match.status === 'NOT_SELECTED' && (
                          <div className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-white/5 text-gray-500 border border-white/5 flex items-center justify-center">
                            <span>Not Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Render Agent 5 Project Plan & Agent 6 Progress Tracker ONLY after freelancer starts project */}
                  {(match.status === 'STARTED' || budgetResponseState === 'STARTED' || inv.project_status === 'in_progress') && inv.project_status !== 'completed' && (match.status as string) !== 'COMPLETED' && (
                    <>
                      <ProjectPlanningSection projectId={match.project_id} isFreelancerView={true} />
                      <FreelancerProgressTracker projectId={match.project_id} />
                    </>
                  )}

                  {/* Render Project Completed Card if project IS completed */}
                  {(inv.project_status === 'completed' || (match.status as string) === 'COMPLETED') && (
                    <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-teal-950/60 to-dark-950 border-2 border-emerald-500/50 shadow-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 size={28} />
                        </div>
                        <div>
                          <span className="badge-green text-xs font-extrabold px-2.5 py-0.5 mb-1 inline-block">PROJECT COMPLETED & DELIVERED ✓</span>
                          <h4 className="text-white font-extrabold text-lg">Project Completed & Final Deliverables Submitted</h4>
                          <p className="text-emerald-300 text-xs">All milestone tasks finished and deliverables completed successfully.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FreelancerLayout>
  );
};
