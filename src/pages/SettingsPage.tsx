import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  Compass,
  Bell,
  Sliders,
  Shield,
  Save,
  Trash2,
  Server,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateCareerGoal } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || 'Jegajith');
  const [email, setEmail] = useState(user?.email || 'jegajithjothivel@gmail.com');
  const [targetCareer, setTargetCareer] = useState(user?.targetCareer || 'Data Analyst');
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(15);
  const [useMock, setUseMock] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [mentorAlerts, setMentorAlerts] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCareerGoal(targetCareer);
    addToast('Settings Saved', 'Profile, target benchmarks, and notification preferences updated.', 'success');
  };

  const handleToggleMock = () => {
    const nextVal = !useMock;
    setUseMock(nextVal);
    addToast(
      'Data Architecture Mode Switched',
      nextVal
        ? 'Using optimized client-side mock intelligence dataset.'
        : 'Connecting to local FastAPI server endpoint (http://localhost:8000/api).',
      nextVal ? 'info' : 'warning'
    );
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Command Center Preferences & Configuration"
        subtitle="Manage personal target benchmarks, notification pipelines, and FastAPI server integration."
        badge="System Config"
      />

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Information */}
        <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <User className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-display">User Profile Details</h3>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40"
            />
            <div>
              <p className="text-xs font-bold text-white">{name}</p>
              <p className="text-[11px] text-slate-400">Current Level: {user?.currentLevelName}</p>
              <button
                type="button"
                onClick={() => addToast('Avatar Updated', 'New profile image synchronized.', 'info')}
                className="mt-2 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Change Avatar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Career & Study Goals */}
        <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Compass className="w-4 h-4 text-sky-400" />
            <h3 className="text-base font-bold text-white font-display">Target Career Benchmarks</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Active Career Role
              </label>
              <select
                value={targetCareer}
                onChange={(e) => setTargetCareer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="Data Analyst">Data Analyst</option>
                <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                <option value="Analytics Engineer">Analytics Engineer</option>
                <option value="Business Intelligence Architect">BI Architect</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Weekly Study Target (Hours)
              </label>
              <input
                type="number"
                min={5}
                max={40}
                value={weeklyGoalHours}
                onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* FastAPI / Architecture Data Layer Toggle */}
        <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-display">
              FastAPI & Data Source Architecture
            </h3>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <p className="text-xs font-bold text-white">Use Client Mock Intelligence (USE_MOCK = true)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Toggle between embedded realistic ML mock models or calling live FastAPI `/api/*` endpoints.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleMock}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                useMock
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-amber-600 text-white shadow-sm'
              }`}
            >
              {useMock ? 'USE_MOCK: ON' : 'FASTAPI: ON'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white font-display">Notification Subscriptions</h3>
          </div>

          <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={mentorAlerts}
              onChange={(e) => setMentorAlerts(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            />
            Notify me immediately when senior mentor code reviews are completed
          </label>

          <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            />
            Weekly progress report & skill gap recalibration digest
          </label>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-950/40"
          >
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
