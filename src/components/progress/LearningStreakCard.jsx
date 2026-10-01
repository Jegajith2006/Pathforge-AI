import React from 'react';
import { Flame, Calendar, Award, CheckCircle2 } from 'lucide-react';

export const LearningStreakCard = ({
  currentStreak = 7,
  longestStreak = 14,
  lastActive = 'Today',
}) => {
  const days = [
    { label: 'M', active: true },
    { label: 'T', active: true },
    { label: 'W', active: true },
    { label: 'T', active: true },
    { label: 'F', active: true },
    { label: 'S', active: true },
    { label: 'S', active: true },
  ];

  return (
    <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
              Learning Streak
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Consistent daily momentum accelerates neural retention.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Flame className="w-3.5 h-3.5" />
          {currentStreak} Days
        </span>
      </div>

      {/* Week Day Pills */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">This Week's Activity</div>
        <div className="flex justify-between items-center gap-1.5 p-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
          {days.map((day, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 flex-1 py-1"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-transform ${
                  day.active
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 font-mono scale-105'
                    : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                {day.active ? <CheckCircle2 className="w-4 h-4" /> : day.label}
              </div>
              <span className="text-[10px] font-medium text-[var(--text-muted)]">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak Stats Breakdown */}
      <div className="grid grid-cols-2 gap-3 py-2 px-3 rounded-xl bg-[var(--surface-secondary)]/70 border border-[var(--border)] text-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-500 shrink-0" />
          <div>
            <div className="text-[10px] text-[var(--text-muted)]">Longest Streak</div>
            <div className="font-bold text-[var(--text-primary)] font-mono">{longestStreak} Days</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-3">
          <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
          <div>
            <div className="text-[10px] text-[var(--text-muted)]">Last Active</div>
            <div className="font-bold text-[var(--text-primary)] font-mono">{lastActive}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningStreakCard;
