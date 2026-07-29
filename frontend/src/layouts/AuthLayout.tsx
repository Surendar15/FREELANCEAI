// src/layouts/AuthLayout.tsx
// Minimal centered layout for authentication pages

import React from 'react';
import { Link } from 'react-router-dom';
import weblogo from '@/assets/weblogo.jpeg';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background orbs */}
      <div className="orb-blue w-[500px] h-[500px] top-[-200px] left-[-200px] opacity-40" />
      <div className="orb-purple w-[400px] h-[400px] bottom-[-150px] right-[-150px] opacity-30" />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={weblogo} alt="Logo" className="w-9 h-9 rounded-xl object-cover border border-purple-500/30" />
          <span className="font-extrabold text-sm gradient-text">AI FREELANCING PLATFORM</span>
        </Link>
        <Link
          to="/"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center p-6 text-gray-600 text-xs">
        © 2024 AgentVerse. AI-Powered Freelancing Platform.
      </footer>
    </div>
  );
};

export default AuthLayout;
