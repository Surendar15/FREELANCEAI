// src/components/budget/BudgetIntelligenceSection.tsx
// Agent 4 — Budget Intelligence Agent UI Section (Client View)

import React from 'react';
import {
  Calculator, Sparkles, DollarSign, CheckCircle2, AlertTriangle,
  Loader2, Send, ShieldCheck, Info, ArrowUpRight, TrendingUp, Lock
} from 'lucide-react';
import { useBudgetIntelligence } from '@/hooks/useBudgetIntelligence';

interface BudgetIntelligenceSectionProps {
  projectId: string;
}

export const BudgetIntelligenceSection: React.FC<BudgetIntelligenceSectionProps> = ({ projectId }) => {
  const {
    recommendation,
    isLoading,
    error,
    enteredBudget,
    setEnteredBudget,
    validationType,
    validationMessage,
    isValidRange,
    isSubmitting,
    offerResult,
    sendOffer,
  } = useBudgetIntelligence(projectId);

  if (!isLoading && !recommendation) {
    return null;
  }

  const isOffered = recommendation?.budget_status === 'OFFERED' || recommendation?.budget_status === 'ACCEPTED' || !!offerResult;

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Calculator size={24} className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">🤖 Budget Intelligence Agent</h2>
              <span className="badge-green text-xs font-semibold px-2.5 py-0.5">Agent 4 Active</span>
            </div>
            <p className="text-gray-400 text-sm mt-1 max-w-3xl">
              Our AI has analyzed your project complexity, timeline, required technologies, and market rates to recommend a professional budget range.
            </p>
          </div>
        </div>

        {isOffered && (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 self-start md:self-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Budget Offer Sent to Freelancer</span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : recommendation ? (
        <div className="glass-card p-6 md:p-8 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
          {/* Top 3 Budget Recommendation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Minimum Budget Card */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Minimum Budget</p>
                <p className="text-2xl font-black text-white">₹{recommendation.minimum_budget.toLocaleString()}</p>
              </div>
              <p className="text-gray-500 text-[11px] mt-2">Lowest floor for basic deliverables</p>
            </div>

            {/* Recommended Budget Card (Featured) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-teal-950/60 border-2 border-emerald-500/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-dark-950 font-black text-[10px] uppercase rounded-bl-xl tracking-wider">
                AI Target
              </div>
              <div>
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Recommended Budget
                </p>
                <p className="text-3xl font-black text-emerald-400">₹{recommendation.recommended_budget.toLocaleString()}</p>
              </div>
              <p className="text-emerald-300/80 text-[11px] font-medium mt-2">Optimal price for highest quality delivery</p>
            </div>

            {/* Maximum Budget Card */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Maximum Budget</p>
                <p className="text-2xl font-black text-white">₹{recommendation.maximum_budget.toLocaleString()}</p>
              </div>
              <p className="text-gray-500 text-[11px] mt-2">Upper ceiling for premium features</p>
            </div>
          </div>

          {/* AI Explanation Paragraph */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 mb-8">
            <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Info size={14} />
              AI Budget Calculation Breakdown
            </p>
            <p className="text-gray-200 text-xs leading-relaxed font-normal">
              "{recommendation.budget_reason}"
            </p>
          </div>

          {/* Budget Input & Validation Controls */}
          {isOffered ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white mb-1">Budget Offer Sent</h3>
              <p className="text-gray-300 text-xs mb-3">
                You offered <strong className="text-emerald-400 font-bold">₹{recommendation.client_entered_budget?.toLocaleString()} INR</strong> to the selected freelancer.
              </p>
              <p className="text-gray-400 text-[11px]">The freelancer is reviewing your budget offer on their dashboard.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-white font-bold text-sm">
                Enter Final Budget (₹ INR)
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                  <input
                    type="number"
                    value={enteredBudget}
                    onChange={(e) => setEnteredBudget(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <button
                  onClick={sendOffer}
                  disabled={!isValidRange || isSubmitting}
                  className={`btn-primary font-bold text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isValidRange
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                      : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send Budget Offer</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real-time Validation Banners */}
              {validationType === 'valid' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>✓ {validationMessage}</span>
                </div>
              )}

              {validationType === 'low' && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
                  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{validationMessage}</span>
                </div>
              )}

              {validationType === 'high' && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs leading-relaxed">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{validationMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
