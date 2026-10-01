import React from 'react';
import { Flame, Clock, CheckCircle2, BookOpen, Target, Sparkles } from 'lucide-react';

/**
 * CourseProgressCard
 * Displays user's current learning telemetry and momentum stats
 */
export const CourseProgressCard = ({
  targetRole = 'Machine Learning Engineer',
  streakDays = 14,
  totalHours = 142.5,
  inProgressCount = 3,
  completedCount = 2,
  recommendedCount = 8,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {/* Target Career Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)] font-medium">Target Role</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate" title={targetRole}>
            {targetRole}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium mt-0.5">
            <Sparkles className="w-3 h-3" />
            {recommendedCount} tailored recommendations
          </span>
        </div>
      </div>

      {/* Learning Streak */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)] font-medium">Learning Streak</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            {streakDays} <span className="text-xs font-normal text-[var(--text-muted)]">Days</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            Active daily study momentum
          </span>
        </div>
      </div>

      {/* Total Learning Hours */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)] font-medium">Study Hours</span>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            {totalHours} <span className="text-xs font-normal text-[var(--text-muted)]">Hrs</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            16.5 hrs this week (82% of goal)
          </span>
        </div>
      </div>

      {/* Course Completion */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)] font-medium">Course Status</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg sm:text-xl font-bold text-[var(--text-primary)] flex items-baseline gap-1.5">
            <span>{completedCount}</span>
            <span className="text-xs font-normal text-[var(--text-muted)]">done</span>
            <span className="text-xs font-normal text-[var(--text-muted)]">·</span>
            <span className="text-indigo-500">{inProgressCount}</span>
            <span className="text-xs font-normal text-[var(--text-muted)]">active</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            {Math.round((completedCount / (completedCount + inProgressCount + 3)) * 100)}% roadmap progress
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseProgressCard;
