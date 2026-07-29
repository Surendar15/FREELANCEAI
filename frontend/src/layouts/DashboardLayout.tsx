// src/layouts/DashboardLayout.tsx
// Sidebar + main content layout for authenticated pages

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Brain,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { authService } from '@/services/authService';
import weblogo from '@/assets/weblogo.jpeg';
import clsx from 'clsx';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/add',      icon: PlusCircle,       label: 'Add Project' },
  { to: '/dashboard/projects', icon: FolderOpen,       label: 'My Projects' },
  { to: '/dashboard/analysis', icon: Brain,            label: 'AI Analysis' },
  { to: '/dashboard/profile',  icon: User,             label: 'Profile' },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const client = authService.getSavedClient();

  const handleLogout = () => {
    authService.clearAuthData();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={weblogo} alt="Logo" className="w-9 h-9 rounded-xl object-cover border border-purple-500/30" />
          <div>
            <p className="font-extrabold text-white text-xs tracking-tight">AI FREELANCING PLATFORM</p>
            <p className="text-gray-500 text-[10px] uppercase font-bold">Client Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/20 shadow-glow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )
            }
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile + Logout */}
      <div className="p-4 border-t border-white/5">
        {client && (
          <div className="glass-card p-3 mb-3">
            <p className="text-white text-sm font-medium truncate">{client.full_name}</p>
            <p className="text-gray-500 text-xs truncate">{client.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 text-sm font-medium transition-all duration-200 hover:text-red-400 hover:bg-red-500/5"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar-gradient border-r border-white/5 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-dark-900 border-r border-white/10 z-50 lg:hidden',
          'transform transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-dark-950/80 backdrop-blur-md border-b border-white/5">
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
            <span>AgentVerse</span>
            <ChevronRight size={14} />
            <span className="text-gray-300">Dashboard</span>
          </div>

          {/* AI Status Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">AI Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
