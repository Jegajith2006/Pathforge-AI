import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../common/Button';

/**
 * SkillMatchRow component
 * Renders a single skill comparison row with dual proficiency indicators and action link.
 */
export const SkillMatchRow = ({
  skill,
  className = '',
}) => {
  if (!skill) return null;

  const {
    name,
    category,
    currentLevel = 0,
    requiredLevel = 0,
    gap = 0,
    status = 'Close Match',
    priority = 'Medium',
    whyItMatters,
    relatedAction,
    relatedRoute = '/courses',
    actionLabel = 'Improve Skill',
  } = skill;

  // Status configuration
  const statusConfigs = {
    Matched: {
      label: 'Matched',
      icon: CheckCircle2,
      style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-500',
    },
    'Close Match': {
      label: 'Close Match',
      icon: Sparkles,
      style: 'bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border-indigo-500/20',
      dot: 'bg-cyan-400',
    },
    'Needs Improvement': {
      label: 'Needs Improvement',
      icon: AlertTriangle,
      style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
    },
    Missing: {
      label: 'Missing Requirement',
      icon: AlertCircle,
      style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dot: 'bg-rose-400',
    },
  };

  const statusConfig = statusConfigs[status] || statusConfigs['Close Match'];
  const StatusIcon = statusConfig.icon;

  // Priority badge styles
  const priorityStyles = {
    High: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold',
    Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Low: 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)]',
  };

  return (
    <div
      className={`
        p-4
        sm:p-5
        rounded-xl
        bg-[var(--surface-secondary)]
        border
        border-[var(--border)]
        hover:border-indigo-500/40
        transition-all
        space-y-3.5
        ${className}
      `}
    >
      {/* Top Header: Skill Name, Category, Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-display">
            {name}
          </h4>
          {category && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border)] font-medium">
              {category}
            </span>
          )}
          <span
            className={`
              inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
              ${statusConfig.style}
            `}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusConfig.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`
              text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider
              ${priorityStyles[priority] || priorityStyles.Medium}
            `}
          >
            {priority} Priority
          </span>
        </div>
      </div>

      {/* Dual Proficiency Visual Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
        {/* User Verified Level */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Your Verified Level:</span>
            <span className="font-bold text-[var(--text-primary)]">{currentLevel}%</span>
          </div>
          <div className="w-full bg-[var(--surface-tertiary)] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentLevel >= requiredLevel
                  ? 'bg-emerald-500'
                  : currentLevel >= 50
                  ? 'bg-indigo-500 dark:bg-cyan-400'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, currentLevel)}%` }}
            />
          </div>
        </div>

        {/* Company Benchmark Level */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Company Target:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)]">{requiredLevel}%</span>
              <span
                className={`text-[11px] font-bold ${
                  gap >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                ({gap >= 0 ? `+${gap}` : gap} pts)
              </span>
            </div>
          </div>
          <div className="w-full bg-[var(--surface-tertiary)] h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-400 dark:bg-slate-600"
              style={{ width: `${Math.min(100, requiredLevel)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Explanation & Context */}
      {whyItMatters && (
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">Why it matters: </strong>
          {whyItMatters}
        </p>
      )}

      {/* Action Footer */}
      <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-[var(--text-secondary)] flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-[var(--text-muted)]">Recommended step:</span>
          <span className="font-semibold text-[var(--text-primary)] truncate max-w-md">
            {relatedAction}
          </span>
        </div>

        {relatedRoute && (
          <Link to={relatedRoute} className="self-end sm:self-auto shrink-0">
            <Button variant="outline" size="xs" rightIcon={ArrowRight}>
              {actionLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default SkillMatchRow;
