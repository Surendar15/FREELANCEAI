// src/pages/freelancer/FreelancerProfilePage.tsx
// Freelancer Profile & Skill Settings Page

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Briefcase, Mail, Star, Award, CheckCircle2,
  Code2, Clock, Sparkles, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { FreelancerLayout } from '@/layouts/FreelancerLayout';
import { useFreelancerAuth } from '@/hooks/useFreelancerAuth';

export const FreelancerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { freelancer, isAuthenticated } = useFreelancerAuth();

  if (!isAuthenticated || !freelancer) {
    return (
      <FreelancerLayout>
        <div className="text-center py-20">
          <Briefcase size={48} className="text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please log in to view your freelancer profile.</p>
          <button onClick={() => navigate('/freelancer/login')} className="btn-primary">
            Log In as Freelancer
          </button>
        </div>
      </FreelancerLayout>
    );
  }

  const rawSkills = freelancer.skills as string | string[] | undefined;
  const skillsList: string[] = Array.isArray(rawSkills)
    ? rawSkills
    : typeof rawSkills === 'string'
    ? rawSkills.split(',').map((s: string) => s.trim())
    : ['React', 'TypeScript', 'Node.js', 'Python', 'FastAPI'];

  return (
    <FreelancerLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate('/freelancer/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Freelancer Dashboard
        </button>

        {/* Profile Card Header */}
        <div className="glass-card p-6 md:p-8 gradient-border relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <img
              src={freelancer.profile_image}
              alt={freelancer.name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-purple-500/40 shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(freelancer.name)}&background=6366F1&color=fff&size=128`;
              }}
            />

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="badge-purple text-xs font-extrabold px-3 py-1">Verified Freelancer Profile</span>
                <span className="badge-green text-xs font-extrabold px-3 py-1 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  ● Operational & Available
                </span>
              </div>

              <h1 className="text-2xl font-black text-white">{freelancer.name}</h1>
              <p className="text-purple-400 font-bold text-sm">{freelancer.title}</p>
              <p className="text-gray-300 text-xs flex items-center justify-center md:justify-start gap-2">
                <Mail size={14} className="text-gray-400" />
                {freelancer.email}
              </p>

              {freelancer.bio && (
                <p className="text-gray-300 text-xs leading-relaxed max-w-2xl pt-2">
                  "{freelancer.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="p-3.5 rounded-xl bg-white/5 text-center">
              <Star size={18} className="text-amber-400 fill-amber-400 mx-auto mb-1" />
              <p className="text-white font-extrabold text-sm">{freelancer.rating || '5.0'} / 5.0</p>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Client Rating</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 text-center">
              <Award size={18} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-emerald-400 font-extrabold text-sm">{freelancer.completed_projects || 0} Delivered</p>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Completed Projects</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 text-center">
              <Clock size={18} className="text-purple-400 mx-auto mb-1" />
              <p className="text-purple-300 font-extrabold text-sm">{freelancer.experience || 3}+ Years</p>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Experience</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 text-center">
              <Sparkles size={18} className="text-blue-400 mx-auto mb-1" />
              <p className="text-blue-300 font-extrabold text-sm">Top Rated</p>
              <p className="text-gray-500 text-[10px] uppercase font-bold">AI Skill Score</p>
            </div>
          </div>
        </div>

        {/* Technical Skills & Capabilities */}
        <div className="glass-card p-6 border border-purple-500/20 space-y-4">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Code2 size={20} className="text-purple-400" />
            Verified Technical Skills & Stack
          </h3>
          <p className="text-gray-400 text-xs">
            These skills are automatically matched against client project requirements by Talent Discovery Agent 2.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {skillsList.map((skill: string, i: number) => (
              <span
                key={i}
                className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={12} className="text-emerald-400" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </FreelancerLayout>
  );
};
