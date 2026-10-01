import React from 'react';
import {
  TrendingUp,
  Layers,
  Calendar,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const RoadmapProgressHeader = ({
  progress = 42,
  completedPhases = 1,
  totalPhases = 5,
  currentPhaseName = 'Machine Learning Core',
  currentPhaseNumber = 2,
  estimatedDuration = '6 months',
}) => {
  // SVG circular progress math
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      id="roadmap-progress-visual"
      className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs transition-colors relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Interactive Progress Ring & Headline */}
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                className="text-[var(--surface-secondary)]"
              />
              {/* Foreground progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#roadmapProgressGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="roadmapProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="60%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Ring Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold font-display text-[var(--text-primary)]">
                {progress}%
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Complete
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Paced Progression
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-xs text-[var(--text-secondary)]">
                {completedPhases} of {totalPhases} Phases Done
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold font-display text-[var(--text-primary)] tracking-tight">
              Overall Roadmap Completion: {progress}%
            </h3>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Currently progressing through{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                Phase {currentPhaseNumber}: {currentPhaseName}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Telemetry Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
          <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-500" />
              Active Phase
            </span>
            <span className="text-sm font-bold text-[var(--text-primary)] block truncate">
              Phase {currentPhaseNumber}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] block">65% active sprint</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-500" />
              Target Velocity
            </span>
            <span className="text-sm font-bold text-[var(--text-primary)] block">
              {estimatedDuration}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
              On Schedule
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Next Milestone
            </span>
            <span className="text-sm font-bold text-[var(--text-primary)] block truncate">
              Phase 3: Deep Learning
            </span>
            <span className="text-[11px] text-[var(--text-muted)] block font-mono">
              Unlocks at 100% Ph. 2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapProgressHeader;
