// src/pages/RegisterPage.tsx
// Client registration page

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Building, Eye, EyeOff, Zap, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AuthLayout from '@/layouts/AuthLayout';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One digit', test: (p: string) => /\d/.test(p) },
];

const RegisterPage: React.FC = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    company_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.company_name) delete (payload as Record<string, unknown>).company_name;
    await register(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <AuthLayout>
      <div className="glass-card gradient-border p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-brand">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-gray-400 text-sm">Join AgentVerse — AI-powered freelancing</p>
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
                placeholder="John Doe"
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
                placeholder="john@example.com"
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          {/* Company (optional) */}
          <div>
            <label htmlFor="company_name" className="input-label">
              Company <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="company_name"
                name="company_name"
                type="text"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Acme Inc."
                className="input-field pl-11"
              />
            </div>
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
              <div className="mt-3 space-y-1.5">
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
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
