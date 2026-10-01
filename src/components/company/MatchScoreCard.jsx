import React from 'react';
import {
  MapPin,
  DollarSign,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { ReadinessBadge } from './ReadinessBadge';

/**
 * MatchScoreCard component
 * Prominent summary card featuring circular radial score indicator and key metrics.
 */
export const MatchScoreCard = ({
  match,
  className = '',
}) => {
  if (!match) return null;

  const {
    company,
    role,
    logoText,
    team,
    location,
    salaryRange,
    matchScore = 0,
    readinessLevel,
    requiredSkillCount = 0,
    matchedSkillCount = 0,
    missingSkillCount = 0,
    priorityGapCount = 0,
    estimatedPreparationPriority = 'Moderate Priority',
    hiringStage,
    jobDescriptionSummary,
  } = match;

  // Circular gauge calculations
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchScore / 100) * circumference;

  // Determine gauge color scheme based on score
  const getGaugeColors = (score) => {
    if (score >= 80) {
      return {
        stroke: 'stroke-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]',
      };
    }
    if (score >= 60) {
      return {
        stroke: 'stroke-cyan-500 dark:stroke-cyan-400',
        text: 'text-cyan-600 dark:text-cyan-400',
        glow: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.35)]',
      };
    }
    if (score >= 40) {
      return {
        stroke: 'stroke-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]',
      };
    }
    return {
      stroke: 'stroke-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      glow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.35)]',
    };
  };

  const gaugeColors = getGaugeColors(matchScore);

  return (
    <div
      className={`
        p-6
        sm:p-8
        rounded-2xl
        bg-[var(--card-bg)]
        border
        border-[var(--card-border)]
        shadow-md
        shadow-slate-900/5
        dark:shadow-slate-950/40
        relative
        overflow-hidden
        transition-colors
        duration-200
        ${className}
      `}
    >
      {/* Background soft ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
        {/* Left Side: Role details & context */}
        <div className="space-y-4 flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center text-white font-extrabold font-display text-lg shadow-md shadow-indigo-950/40 shrink-0">
              {logoText || company.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold font-display text-[var(--text-secondary)]">
                  {company}
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <ReadinessBadge tier={readinessLevel} score={matchScore} size="sm" />
                {hiringStage && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                    {hiringStage}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[var(--text-primary)] tracking-tight mt-0.5">
                {role}
              </h1>
            </div>
          </div>

          {/* Description & Team */}
          {team && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
              <span className="font-semibold text-[var(--text-primary)]">{team}: </span>
              {jobDescriptionSummary}
            </p>
          )}

          {/* Location & Compensation Chips */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--text-secondary)] pt-1">
            {location && (
              <span className="flex items-center gap-1.5 bg-[var(--surface-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
                <span>{location}</span>
              </span>
            )}
            {salaryRange && (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-semibold">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{salaryRange}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Clock className="w-3.5 h-3.5" />
              <span>Target Priority: <strong className="text-[var(--text-primary)]">{estimatedPreparationPriority}</strong></span>
            </span>
          </div>
        </div>

        {/* Right Side: Circular Gauge & Vital Stat Grid */}
        <div className="flex flex-col sm:flex-row items-center gap-6 xl:gap-8 w-full xl:w-auto shrink-0 pt-4 xl:pt-0 border-t xl:border-t-0 border-[var(--border)]">
          {/* Circular Progress Gauge */}
          <div className="relative flex flex-col items-center justify-center shrink-0">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background track */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-[var(--surface-tertiary)]"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Active progress arc */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className={`${gaugeColors.stroke} transition-all duration-1000 ease-out ${gaugeColors.glow}`}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Centered Score */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-3xl font-black font-display tracking-tight ${gaugeColors.text}`}>
                  {matchScore}%
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold mt-0.5">
                  Match Score
                </span>
              </div>
            </div>

            <div className="mt-2 text-center">
              <span className="text-xs font-bold text-[var(--text-primary)] font-display">
                {readinessLevel}
              </span>
            </div>
          </div>

          {/* Metric Pills Grid */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-60">
            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1 font-semibold uppercase">
                <Layers className="w-3 h-3 text-indigo-500 dark:text-cyan-400" />
                <span>Required</span>
              </span>
              <p className="text-lg font-extrabold font-display text-[var(--text-primary)]">
                {requiredSkillCount} <span className="text-xs font-normal text-[var(--text-muted)]">Skills</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold uppercase">
                <CheckCircle2 className="w-3 h-3" />
                <span>Matched</span>
              </span>
              <p className="text-lg font-extrabold font-display text-emerald-600 dark:text-emerald-400">
                {matchedSkillCount} <span className="text-xs font-normal text-[var(--text-muted)]">Skills</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold uppercase">
                <AlertCircle className="w-3 h-3" />
                <span>Priority Gaps</span>
              </span>
              <p className="text-lg font-extrabold font-display text-rose-600 dark:text-rose-400">
                {priorityGapCount} <span className="text-xs font-normal text-[var(--text-muted)]">Gaps</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold uppercase">
                <Sparkles className="w-3 h-3" />
                <span>Missing</span>
              </span>
              <p className="text-lg font-extrabold font-display text-amber-600 dark:text-amber-400">
                {missingSkillCount} <span className="text-xs font-normal text-[var(--text-muted)]">Skills</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScoreCard;
