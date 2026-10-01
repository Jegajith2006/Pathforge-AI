import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Target, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { mockCareerProfile, mockUserData } from '../../data/mockData';

export const WelcomeHeader = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const userName = user?.name || mockUserData.name || 'Jegajith';
  const targetRole = user?.targetCareer || mockCareerProfile.targetRole || 'Machine Learning Engineer';

  // Format current date nicely
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-7 shadow-sm transition-all duration-200">
      {/* Background ambient gradient accents */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left text block */}
        <div className="space-y-2.5 max-w-3xl">
          {/* Top badges bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Trajectory: {targetRole}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-[var(--text-muted)] bg-[var(--surface-secondary)] border border-[var(--border)]">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{dateFormatted}</span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Readiness +6% this sprint</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] font-display">
            Good morning, <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">{userName}</span>
          </h1>

          {/* Subtitle & Motivational message */}
          <p className="text-base sm:text-lg text-[var(--text-secondary)] font-normal leading-relaxed">
            Continue building your path toward becoming a{' '}
            <span className="font-semibold text-[var(--text-primary)]">{targetRole}</span>.
          </p>

          <p className="text-xs sm:text-sm text-[var(--text-muted)] flex items-center gap-2 pt-0.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              You are on track to complete Phase 2 this sprint. Model validation proofs will unlock your next +4 readiness points.
            </span>
          </p>
        </div>

        {/* Right CTA button */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => navigate('/career-selection')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border)] hover:border-indigo-500/40 shadow-xs transition-all duration-200 cursor-pointer group"
          >
            <Target className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform duration-200" />
            <span>Update career goal</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
