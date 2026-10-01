import React from 'react';
import { Download, Sparkles, Flame, Clock, Award, CheckCircle2, Calendar } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ProgressHeader = ({
  targetRole = 'Machine Learning Engineer',
  currentStreak = 7,
  totalHours = 86,
  overallProgress = 42,
  lastActiveDate = 'Today, Sep 12, 2026',
  dateRange = 'This Week',
  onDateRangeChange,
}) => {
  const { addToast } = useToast();

  const handleExport = () => {
    addToast(
      `Progress report for "${dateRange}" successfully compiled. Ready for download.`,
      'success'
    );
  };

  const ranges = ['This Week', 'This Month', 'Last 3 Months', 'All Time'];

  return (
    <div className="space-y-4">
      {/* Top Title and Primary Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Telemetry & Velocity
            </span>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Target: <span className="text-[var(--text-primary)] font-semibold">{targetRole}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] tracking-tight">
            Progress Center
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Track your learning activity, project completion, skill development, and career growth over time.
          </p>
        </div>

        {/* Date Filter & Export Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="inline-flex p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]" role="tablist" aria-label="Date range selector">
            {ranges.map((range) => {
              const isActive = dateRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onDateRangeChange && onDateRangeChange(range)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-indigo-500/40 transition-all shadow-sm active:scale-95"
            aria-label="Export learning progress report"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Export Progress</span>
          </button>
        </div>
      </div>

      {/* Target Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--text-muted)] truncate">Target Track</div>
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">{targetRole}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--text-muted)] truncate">Active Streak</div>
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">{currentStreak} Consecutive Days</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--text-muted)] truncate">Logged Study</div>
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">{totalHours} Total Hours</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[var(--text-muted)] truncate">Last Activity</div>
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">{lastActiveDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressHeader;
