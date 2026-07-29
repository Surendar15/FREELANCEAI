// src/layouts/FreelancerLayout.tsx
// Dedicated Freelancer Portal Layout with Sidebar & Header Navigation

import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  FolderKanban,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Zap,
  ChevronRight,
  Star,
  CheckCircle2
} from 'lucide-react';
import { useFreelancerAuth } from '@/hooks/useFreelancerAuth';
import weblogo from '@/assets/weblogo.jpeg';
import clsx from 'clsx';

interface FreelancerLayoutProps {
  children: React.ReactNode;
}

const freelancerNavItems = [
  { to: '/freelancer/dashboard', icon: LayoutDashboard, label: 'Dashboard & Invitations' },
  { to: '/freelancer/profile', icon: User, label: 'Freelancer Profile & Skills' },
];

export const FreelancerLayout: React.FC<FreelancerLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { freelancer, logout } = useFreelancerAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/freelancer/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-dark-900 border-r border-white/10">
      {/* Brand Logo */}
      <div className="p-5 border-b border-white/10">
        <Link to="/freelancer/dashboard" className="flex items-center gap-3">
          <img src={weblogo} alt="Logo" className="w-9 h-9 rounded-xl object-cover border border-purple-500/30" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-xs tracking-tight">AI FREELANCING PLATFORM</span>
            </div>
            <span className="badge-purple text-[10px] font-bold uppercase px-2 py-0.5 mt-0.5 inline-block">
              Freelancer Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
          Freelancer Portal Navigation
        </div>
        {freelancerNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              className={clsx(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0 text-purple-400" size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Freelancer Profile Card & Logout */}
      <div className="p-4 border-t border-white/10">
        {freelancer && (
          <div className="glass-card p-3 mb-3 border border-purple-500/20 flex items-center gap-3">
            <img
              src={freelancer.profile_image}
              alt={freelancer.name}
              className="w-9 h-9 rounded-xl object-cover border border-purple-500/40"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(freelancer.name)}&background=6366F1&color=fff`;
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{freelancer.name}</p>
              <p className="text-purple-400 text-[11px] font-medium truncate">{freelancer.title}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-gray-400 text-xs font-bold transition-colors hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
        >
          <LogOut size={16} />
          <span>Log Out Account</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-950 flex text-gray-100 font-sans">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb-purple w-[600px] h-[600px] -top-40 -left-40 opacity-15" />
        <div className="orb-blue w-[500px] h-[500px] bottom-0 right-0 opacity-15" />
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:block w-64 flex-shrink-0 relative z-20">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-dark-900 z-50">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header Bar */}
        <header className="border-b border-white/10 bg-dark-900/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="flex items-center gap-2">
                <span className="badge-purple text-xs font-bold px-2.5 py-0.5">Freelancer Workspace</span>
                <span className="badge-green text-xs font-bold px-2.5 py-0.5 hidden sm:inline-flex">● Active Account</span>
              </div>
            </div>

            {/* Quick Header Nav Links */}
            <div className="flex items-center gap-4">
              <Link
                to="/freelancer/dashboard"
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/freelancer/dashboard' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/freelancer/profile"
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/freelancer/profile' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                Profile
              </Link>

              {freelancer && (
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                  <img
                    src={freelancer.profile_image}
                    alt={freelancer.name}
                    className="w-8 h-8 rounded-lg object-cover border border-purple-500/40"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(freelancer.name)}&background=6366F1&color=fff`;
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 text-center text-xs text-gray-500">
          AgentVerse — AI-Powered Freelancing Platform • Freelancer Portal
        </footer>
      </div>
    </div>
  );
};
