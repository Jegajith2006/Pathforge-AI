import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/ToastContainer';
import { ProtectedLayout } from './layouts/ProtectedLayout';

// Public Marketing & Auth Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Authenticated OS & Telemetry Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CareerSelection from './pages/CareerSelection';
import SkillGap from './pages/SkillGap';
import Courses from './pages/Courses';
import Projects from './pages/Projects';
import Roadmap from './pages/Roadmap';
import Progress from './pages/Progress';
import Evidence from './pages/Evidence';
import MentorFeedback from './pages/MentorFeedback';
import Readiness from './pages/Readiness';
import CompanyMatch from './pages/CompanyMatch';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <ToastContainer />
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated Platform Shell Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/career-selection" element={<CareerSelection />} />
              <Route path="/skill-gap" element={<SkillGap />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="/evidence-vault" element={<Evidence />} />
              <Route path="/mentor-feedback" element={<MentorFeedback />} />
              <Route path="/readiness" element={<Readiness />} />
              <Route path="/company-match" element={<CompanyMatch />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Alias for legacy /app routes */}
            <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}
