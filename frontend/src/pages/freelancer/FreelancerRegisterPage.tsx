// src/pages/freelancer/FreelancerRegisterPage.tsx
// Professional Freelancer Registration Page

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Code, Award, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useFreelancerAuth } from '@/hooks/useFreelancerAuth';
import AuthLayout from '@/layouts/AuthLayout';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One digit', test: (p: string) => /\d/.test(p) },
];

export const FreelancerRegisterPage: React.FC = () => {
  const { register, isLoading, error, clearError } = useFreelancerAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    title: '',
    skills: '',
    experience: 3,
    bio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({
      full_name: formData.full_name,
      email: formData.email,
      password: formData.password,
      title: formData.title,
      skills: formData.skills,
      experience: Number(formData.experience) || 1,
      bio: formData.bio || undefined,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    clearError();
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <AuthLayout>
      <div className="glass-card gradient-border p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <Briefcase size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create Freelancer Account</h1>
          <p className="text-gray-400 text-sm">Join AgentVerse to receive AI-matched project invitations</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="input-label">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Rahul Sharma"
                className="input-field pl-11"
                required
                minLength={2}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="input-label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="rahul@example.com"
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          {/* Professional Title */}
          <div>
            <label htmlFor="title" className="input-label">Professional Title</label>
            <div className="relative">
              <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="E.g., Senior Full-Stack Python Architect"
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          {/* Skills & Experience Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="skills" className="input-label">Technical Skills (comma separated)</label>
              <div className="relative">
                <Code size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="skills"
                  name="skills"
                  type="text"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="React, Python, FastAPI, PostgreSQL"
                  className="input-field pl-11 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="experience" className="input-label">Exp (Years)</label>
              <div className="relative">
                <Award size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="experience"
                  name="experience"
                  type="number"
                  value={formData.experience}
                  onChange={handleChange}
                  className="input-field pl-11 text-xs"
                  min={0}
                  max={40}
                  step={0.5}
                  required
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="input-label">Bio / Profile Summary</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Short description of your technical expertise and project history..."
              className="input-field h-20 py-2.5 text-xs resize-none"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="input-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field pl-11 pr-12"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Rules */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(formData.password);
                  return (
                    <div key={rule.label} className={`flex items-center gap-2 text-xs ${passed ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <CheckCircle size={12} className={passed ? 'text-emerald-400' : 'text-gray-600'} />
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-purple-500/20"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Freelancer Account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/freelancer/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
