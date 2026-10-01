import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { mockSettingsData } from '../data/mockSettings';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Shield,
  Key,
  CheckCircle2,
  Download,
  Sliders,
  Palette,
  BookOpen,
  Briefcase,
  Lock,
  User,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const Settings = () => {
  const { user, setUser, theme, toggleTheme, setTheme } = useApp();

  // Active section tab
  const [activeTab, setActiveTab] = useState('account');

  // Account State
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  // Appearance State
  const [accentColor, setAccentColor] = useState('indigo');
  const [compactMode, setCompactMode] = useState(false);

  // Learning Preferences State
  const [weeklyHoursGoal, setWeeklyHoursGoal] = useState(16);
  const [sprintPace, setSprintPace] = useState('balanced');
  const [difficultyCurve, setDifficultyCurve] = useState('rigorous');
  const [preferredFormat, setPreferredFormat] = useState('Hands-on Production Code & CI/CD Pipelines');

  // Career Preferences State
  const [targetIndustry, setTargetIndustry] = useState('Tech & High Growth FinTech');
  const [matchAlertThreshold, setMatchAlertThreshold] = useState(80);
  const [openToRelocation, setOpenToRelocation] = useState(true);
  const [remotePreference, setRemotePreference] = useState('Remote or Hybrid');
  const [targetSalaryRange, setTargetSalaryRange] = useState('$140k - $175k');

  // Notification Alerts State
  const [notifRoadmap, setNotifRoadmap] = useState(true);
  const [notifMentor, setNotifMentor] = useState(true);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifRecalibration, setNotifRecalibration] = useState(true);
  const [notifEmailDigest, setNotifEmailDigest] = useState(true);

  // Privacy & Security State
  const [publicEvidence, setPublicEvidence] = useState(true);
  const [shareBenchmarks, setShareBenchmarks] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Feedback State
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const triggerSaveNotification = (message = 'Configuration saved successfully!') => {
    setSaveMessage(message);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    setUser((prev) => ({ ...prev, name, email }));
    triggerSaveNotification('Account details updated!');
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Settings & Preferences"
        description="Configure your account, visual appearance, machine learning sprint pace, employer match alerts, and privacy rules."
        badge="System Config"
        badgeVariant="indigo"
      />

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{saveMessage}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] overflow-x-auto shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex
                items-center
                gap-2
                px-4
                py-2.5
                rounded-xl
                text-xs
                font-semibold
                transition-all
                cursor-pointer
                whitespace-nowrap
                ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Account Section */}
      {activeTab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <SectionCard
              title="Candidate Profile Credentials"
              subtitle="Personal identifiers linked to your PathForge verified credentials."
            >
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="sm">
                    Save Account Changes
                  </Button>
                </div>
              </form>
            </SectionCard>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <SectionCard
              title="Account Status"
              subtitle="Membership role and session security details."
            >
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Member Tier</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400">PathForge Candidate</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Registered Since</span>
                  <span className="font-mono text-[var(--text-primary)]">July 2026</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Active Device Sessions</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">1 Active (This Container)</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* 2. Appearance Section */}
      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <SectionCard
              title="Color Theme"
              subtitle="Choose your preferred display palette. PathForge AI adheres to strict WCAG contrast standards in both modes."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dark Mode Card */}
                  <div
                    onClick={() => setTheme('dark')}
                    className={`
                      p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3
                      ${
                        theme === 'dark'
                          ? 'border-indigo-500 bg-slate-900/60 ring-2 ring-indigo-500/30'
                          : 'border-[var(--border)] bg-[var(--surface-secondary)] hover:border-indigo-500/40'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Moon className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm font-bold text-slate-100 font-display">Dark-First</span>
                      </div>
                      {theme === 'dark' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Deep slate backgrounds with cyan and indigo neon accents for focused deep-work sessions.
                    </p>
                  </div>

                  {/* Light Mode Card */}
                  <div
                    onClick={() => setTheme('light')}
                    className={`
                      p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3
                      ${
                        theme === 'light'
                          ? 'border-indigo-500 bg-white ring-2 ring-indigo-500/30'
                          : 'border-[var(--border)] bg-[var(--surface-secondary)] hover:border-indigo-500/40'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Sun className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-bold text-slate-900 font-display">Light Mode</span>
                      </div>
                      {theme === 'light' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Crisp, high-contrast daylight aesthetic with clean typography and soft surface borders.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    size="sm"
                    leftIcon={theme === 'dark' ? Sun : Moon}
                  >
                    Toggle Currently Active Theme ({theme === 'dark' ? 'Dark' : 'Light'})
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <SectionCard
              title="Interface Density"
              subtitle="Adjust UI sizing and telemetry spacing."
            >
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Compact Layout</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Slightly denser table padding and card margins</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => {
                      setCompactMode(e.target.checked);
                      triggerSaveNotification('Density mode updated');
                    }}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* 3. Learning Preferences */}
      {activeTab === 'learning' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <SectionCard
              title="Sprint Calibration & Weekly Goal"
              subtitle="PathForge adjusts recommended courses and project milestones to your available study bandwidth."
            >
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Weekly Dedicated Study Bandwidth</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400 text-sm">
                      {weeklyHoursGoal} Hours / Week
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={weeklyHoursGoal}
                    onChange={(e) => setWeeklyHoursGoal(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1">
                    <span>5h (Casual)</span>
                    <span>16h (Recommended)</span>
                    <span>40h (Bootcamp)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Sprint Progression Pace
                  </label>
                  <select
                    value={sprintPace}
                    onChange={(e) => setSprintPace(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--input-text)] focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="accelerated">Accelerated (Shorter deadlines, 2 projects/sprint)</option>
                    <option value="balanced">Balanced (Optimal retention, 1 project + 2 lab quizzes)</option>
                    <option value="relaxed">Relaxed (Extended review periods)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Curriculum Difficulty Curve
                  </label>
                  <select
                    value={difficultyCurve}
                    onChange={(e) => setDifficultyCurve(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--input-text)] focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="rigorous">Rigorous (Production constraints, strict code reviews)</option>
                    <option value="standard">Standard (Industry standard baseline)</option>
                    <option value="foundations">Foundations (Step-by-step guidance)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => triggerSaveNotification('Learning preferences calibrated!')}
                    variant="primary"
                    size="sm"
                  >
                    Save Learning Preferences
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <SectionCard
              title="Methodology Profile"
              subtitle="Your active learning framework mode."
            >
              <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-indigo-500/20 space-y-2 text-xs">
                <span className="font-mono text-[10px] text-indigo-600 dark:text-cyan-400 uppercase font-bold tracking-wider">
                  Active Mode
                </span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] font-display">
                  {preferredFormat}
                </h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Focuses on building verifiable GitHub repositories, containerized microservices, and end-to-end evaluation suites over passive video lectures.
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* 4. Career Preferences */}
      {activeTab === 'career' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <SectionCard
              title="Target Trajectory & Role Criteria"
              subtitle="Calibrate target employer filters, location preferences, and minimum match thresholds."
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Target Industry Focus
                  </label>
                  <input
                    type="text"
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--input-text)] focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Target Compensation Band
                  </label>
                  <input
                    type="text"
                    value={targetSalaryRange}
                    onChange={(e) => setTargetSalaryRange(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--input-text)] focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Work Location Preference
                  </label>
                  <select
                    value={remotePreference}
                    onChange={(e) => setRemotePreference(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--input-text)] focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Remote or Hybrid">Remote or Hybrid</option>
                    <option value="Remote Only">Remote Only</option>
                    <option value="On-site / In-Office">On-site / In-Office</option>
                  </select>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">
                      Minimum Company Match Alert Threshold
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400 text-sm">
                      {matchAlertThreshold}% Fit
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={matchAlertThreshold}
                    onChange={(e) => setMatchAlertThreshold(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    PathForge will notify you as soon as your verified skill index meets or exceeds {matchAlertThreshold}% at any monitored firm.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => triggerSaveNotification('Career search parameters saved!')}
                    variant="primary"
                    size="sm"
                  >
                    Save Career Settings
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <SectionCard
              title="Relocation & Mobility"
              subtitle="Candidate availability status for recruiters."
            >
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Open to Relocation</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Highlights your profile for roles outside San Francisco</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={openToRelocation}
                    onChange={(e) => setOpenToRelocation(e.target.checked)}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* 5. Notifications Section */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <SectionCard
              title="Notification Alert Preferences"
              subtitle="Control which automated events trigger in-app alerts and notifications."
            >
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Roadmap Velocity Alerts</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Notify when milestones unlock or enter deficit status</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifRoadmap}
                    onChange={(e) => setNotifRoadmap(e.target.checked)}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Staff Mentor Reviews</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Instant alerts when code rubrics and PR feedback are published</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifMentor}
                    onChange={(e) => setNotifMentor(e.target.checked)}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Company Match Recalibration</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Alert when match score jumps at Stripe, Spotify, Google, etc.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifMatch}
                    onChange={(e) => setNotifMatch(e.target.checked)}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Readiness Index Recalibration</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Alert whenever test runs or evidence changes the composite score</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifRecalibration}
                    onChange={(e) => setNotifRecalibration(e.target.checked)}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => triggerSaveNotification('Notification alert channels saved!')}
                    variant="primary"
                    size="sm"
                  >
                    Save Alert Rules
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <SectionCard
              title="Digest Delivery"
              subtitle="External notification summaries."
            >
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Weekly Telemetry Digest</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Weekly breakdown of hours, closed gaps & new proofs</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifEmailDigest}
                    onChange={(e) => setNotifEmailDigest(e.target.checked)}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* 6. Privacy & Security */}
      {activeTab === 'privacy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <SectionCard
              title="Evidence Vault Privacy & Sharing"
              subtitle="Control who can verify your cryptographic repository proofs and code audit trails."
            >
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Public Evidence Vault</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Allow prospective employers to view verified SHA-256 artifacts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={publicEvidence}
                    onChange={(e) => setPublicEvidence(e.target.checked)}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Anonymous Peer Benchmarking</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Contribute anonymized skill proficiency data to aggregate hiring percentiles</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareBenchmarks}
                    onChange={(e) => setShareBenchmarks(e.target.checked)}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Two-Factor Authentication (2FA)</span>
                    <span className="text-[var(--text-muted)] text-[11px]">Protect your verified credential keys with hardware/TOTP auth</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactorAuth}
                    onChange={(e) => {
                      setTwoFactorAuth(e.target.checked);
                      triggerSaveNotification(e.target.checked ? '2FA protection enabled' : '2FA protection disabled');
                    }}
                    className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <SectionCard
              title="Data Export & Reset"
              subtitle="Export or purge candidate diagnostic logs."
            >
              <div className="space-y-3 text-xs">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Export complete verified skill assessment, SHA-256 evidence logs, and mentor rubrics as a portable JSON telemetry bundle.
                </p>

                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  leftIcon={Download}
                  onClick={() => triggerSaveNotification('Downloading Cryptographic Telemetry Archive...')}
                >
                  Export Telemetry Archive
                </Button>

                <div className="pt-3 border-t border-[var(--border)]">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftIcon={RotateCcw}
                    className="text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                    onClick={() => {
                      if (window.confirm('Reset all demo candidate telemetry back to baseline?')) {
                        triggerSaveNotification('All candidate telemetry reset to baseline.');
                      }
                    }}
                  >
                    Reset Telemetry Baseline
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
