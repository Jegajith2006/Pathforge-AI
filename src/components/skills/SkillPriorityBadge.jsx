import React from 'react';
import { AlertCircle, AlertTriangle, Clock, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

/**
 * SkillPriorityBadge component
 * Accessible, theme-aware badge communicating priority levels with both text and iconography.
 */
export const SkillPriorityBadge = ({
  priority = 'Medium',
  type = 'priority', // 'priority' | 'status' | 'importance'
  size = 'sm',
  className = '',
}) => {
  const normalized = (priority || '').toLowerCase();

  const getBadgeConfig = () => {
    switch (normalized) {
      case 'critical':
      case 'priority gap':
        return {
          label: priority,
          icon: ShieldAlert,
          classes: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
          dotColor: 'bg-rose-500',
        };
      case 'high':
      case 'needs improvement':
        return {
          label: priority,
          icon: AlertTriangle,
          classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
          dotColor: 'bg-amber-500',
        };
      case 'medium':
      case 'developing':
        return {
          label: priority,
          icon: Clock,
          classes: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          dotColor: 'bg-indigo-500',
        };
      case 'low':
        return {
          label: priority,
          icon: Sparkles,
          classes: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
          dotColor: 'bg-slate-400',
        };
      case 'strong':
      case 'mastered':
        return {
          label: priority,
          icon: CheckCircle2,
          classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          dotColor: 'bg-emerald-500',
        };
      default:
        return {
          label: priority,
          icon: AlertCircle,
          classes: 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)]',
          dotColor: 'bg-[var(--text-muted)]',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[10px] gap-1'
    : size === 'md'
    ? 'px-3 py-1 text-xs gap-1.5 font-semibold'
    : 'px-2.5 py-0.5 text-[11px] gap-1.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono border tracking-wide whitespace-nowrap select-none transition-colors ${sizeClasses} ${config.classes} ${className}`}
      role="status"
      aria-label={`${type}: ${config.label}`}
    >
      <Icon className={size === 'xs' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

export default SkillPriorityBadge;
