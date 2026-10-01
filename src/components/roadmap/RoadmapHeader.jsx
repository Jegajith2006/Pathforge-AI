import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitFork,
  RefreshCw,
  Compass,
  Target,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const RoadmapHeader = ({
  targetRole = 'Machine Learning Engineer',
  timeline = '6 months',
  overallProgress = 42,
  completedPhases = 1,
  totalPhases = 5,
  estimatedRemainingTime = '~14 weeks',
  lastUpdated = 'Today · Real-time Sync',
  onRecalculate,
  isRecalculating = false,
}) => {
  const navigate = useNavigate();

  return (
    <div
      id="roadmap-header"
      className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative overflow-hidden transition-colors"
    >
      {/* Subtle background ambient gradient accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Column: Title & Description */}
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Adaptive Career Journey
            </span>
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {lastUpdated}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[var(--text-primary)]">
            Your Career Roadmap
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            A personalized step-by-step path designed to close your skill gaps and prepare you for your target career.
          </p>

          {/* Key Metadata Row */}
          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                Target role:{' '}
                <strong className="text-[var(--text-primary)] font-semibold">{targetRole}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>
                Timeline:{' '}
                <strong className="text-[var(--text-primary)] font-semibold">{timeline}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Completed phases:{' '}
                <strong className="text-[var(--text-primary)] font-semibold">
                  {completedPhases} of {totalPhases}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)]">
              <span>Remaining: {estimatedRemainingTime}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <button
            id="recalculate-roadmap-btn"
            type="button"
            onClick={onRecalculate}
            disabled={isRecalculating}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
              isRecalculating
                ? 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)] cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500/40 hover:shadow-indigo-500/20 active:scale-[0.98]'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin text-indigo-400' : ''}`}
            />
            {isRecalculating ? 'Recalculating Path...' : 'Recalculate Roadmap'}
          </button>

          <button
            id="update-career-goal-btn"
            type="button"
            onClick={() => navigate('/career-selection')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-500" />
            Update Career Goal
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapHeader;
