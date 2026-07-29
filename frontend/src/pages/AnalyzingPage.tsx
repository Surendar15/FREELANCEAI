// src/pages/AnalyzingPage.tsx
// Animated AI analysis loading screen

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, CheckCircle2, Loader2, Sparkles, Zap } from 'lucide-react';
import { projectService } from '@/services/projectService';
import type { AnalyzeProjectRequest } from '@/types/project';

const ANALYSIS_STEPS = [
  { id: 1, label: 'Reading Project Description',   duration: 800 },
  { id: 2, label: 'Understanding Client Intent',    duration: 1200 },
  { id: 3, label: 'Extracting Technologies',         duration: 1000 },
  { id: 4, label: 'Extracting Required Skills',      duration: 900 },
  { id: 5, label: 'Identifying Core Features',       duration: 1100 },
  { id: 6, label: 'Estimating Project Complexity',   duration: 800 },
  { id: 7, label: 'Generating Structured JSON',      duration: 600 },
];

type StepStatus = 'pending' | 'active' | 'completed';

interface StepState {
  id: number;
  label: string;
  status: StepStatus;
}

const AnalyzingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectData = location.state?.projectData as AnalyzeProjectRequest | undefined;

  const [steps, setSteps] = useState<StepState[]>(
    ANALYSIS_STEPS.map(s => ({ id: s.id, label: s.label, status: 'pending' }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const apiCalledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step Animation (independent of API call) ───────────────────────────
  useEffect(() => {
    if (!projectData) {
      navigate('/dashboard/add');
      return;
    }

    let stepIdx = 0;

    const advanceStep = () => {
      if (stepIdx >= ANALYSIS_STEPS.length) return;

      setCurrentStepIndex(stepIdx);
      setSteps(prev =>
        prev.map((s, i) => ({
          ...s,
          status:
            i < stepIdx ? 'completed' :
            i === stepIdx ? 'active' :
            'pending',
        }))
      );

      const duration = ANALYSIS_STEPS[stepIdx].duration;
      stepIdx++;

      if (stepIdx < ANALYSIS_STEPS.length) {
        setTimeout(advanceStep, duration);
      } else {
        // Mark last step as complete after its duration
        setTimeout(() => {
          setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
        }, duration);
      }
    };

    // Start animations
    setTimeout(advanceStep, 300);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── API Call (Guaranteed single execution using useRef) ─────────────────
  useEffect(() => {
    if (!projectData || apiCalledRef.current) return;
    apiCalledRef.current = true;

    projectService
      .analyzeProject(projectData)
      .then((result) => {
        // Wait for at least 3 seconds of animation before navigating
        const minDelay = 3000;
        setTimeout(() => {
          navigate('/dashboard/analysis/result', { state: { result } });
        }, minDelay);
      })
      .catch((err) => {
        const message =
          err?.response?.data?.message ||
          'AI analysis failed. Please try again.';
        setError(message);
      });
  }, [projectData, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progress = (completedCount / steps.length) * 100;

  // ── Error State ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Zap size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard/add')}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Loading State ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="orb-blue w-[600px] h-[600px] top-[-200px] left-[-200px] opacity-20 animate-pulse" />
      <div className="orb-purple w-[500px] h-[500px] bottom-[-200px] right-[-200px] opacity-15 animate-pulse" />

      <div className="max-w-lg w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Animated Brain Icon */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 animate-ping opacity-30" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 animate-spin-slow" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-brand-lg">
              <Brain size={32} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Requirement Intelligence Agent
            <span className="text-blue-400"> Working</span>
            <span className="animate-typing-blink">...</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Analysing your project description with AI
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Analysis Progress</span>
            <span className="text-blue-400 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="glass-card p-5 space-y-2.5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                step.status === 'active'
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : step.status === 'completed'
                  ? 'bg-emerald-500/5 border border-emerald-500/10'
                  : 'bg-white/5 border border-transparent'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : step.status === 'active' ? (
                  <Loader2 size={18} className="text-blue-400 animate-spin" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-700" />
                )}
              </div>

              {/* Label */}
              <span className={`text-sm font-medium transition-colors ${
                step.status === 'active'     ? 'text-blue-300' :
                step.status === 'completed'  ? 'text-emerald-300' :
                'text-gray-600'
              }`}>
                {step.label}
              </span>

              {/* Active Indicator */}
              {step.status === 'active' && (
                <div className="ml-auto flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-center gap-2 mt-6 text-gray-600 text-xs">
          <Sparkles size={12} />
          <span>Powered by AI via OpenRouter — Analysis takes 15–30 seconds</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyzingPage;
