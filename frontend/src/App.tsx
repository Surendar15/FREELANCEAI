// src/App.tsx
// Main application with React Router routing and protected route guards

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from '@/services/authService';

// Pages
import LandingPage        from '@/pages/LandingPage';
import LoginPage          from '@/pages/LoginPage';
import RegisterPage       from '@/pages/RegisterPage';
import DashboardPage      from '@/pages/DashboardPage';
import AddProjectPage     from '@/pages/AddProjectPage';
import AnalyzingPage      from '@/pages/AnalyzingPage';
import AnalysisResultPage from '@/pages/AnalysisResultPage';
import MyProjectsPage     from '@/pages/MyProjectsPage';
import ProjectDetailPage  from '@/pages/ProjectDetailPage';
import AIAnalysisPage     from '@/pages/AIAnalysisPage';
import ProfilePage        from '@/pages/ProfilePage';

// Freelancer Portal Pages
import { FreelancerLoginPage }     from '@/pages/freelancer/FreelancerLoginPage';
import { FreelancerRegisterPage }  from '@/pages/freelancer/FreelancerRegisterPage';
import { FreelancerDashboardPage } from '@/pages/freelancer/FreelancerDashboardPage';
import { FreelancerProjectDetailPage } from '@/pages/freelancer/FreelancerProjectDetailPage';
import { FreelancerProfilePage } from '@/pages/freelancer/FreelancerProfilePage';

// ── Protected Route Guard (Client) ─────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// ── Public Route Guard (Client) ────────────────────────────────────────────
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (authService.isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// ── App ────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Routes ───────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* ── Freelancer Portal Routes ─────────────────────────────────── */}
        <Route path="/freelancer/login" element={<FreelancerLoginPage />} />
        <Route path="/freelancer/register" element={<FreelancerRegisterPage />} />
        <Route path="/freelancer/dashboard" element={<FreelancerDashboardPage />} />
        <Route path="/freelancer/profile" element={<FreelancerProfilePage />} />
        <Route path="/freelancer/projects/:id" element={<FreelancerProjectDetailPage />} />

        {/* ── Protected Client Routes ──────────────────────────────────── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/add"
          element={
            <ProtectedRoute>
              <AddProjectPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/analyzing"
          element={
            <ProtectedRoute>
              <AnalyzingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/analysis/result"
          element={
            <ProtectedRoute>
              <AnalysisResultPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/projects"
          element={
            <ProtectedRoute>
              <MyProjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/analysis"
          element={
            <ProtectedRoute>
              <AIAnalysisPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ── Catch All ────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
