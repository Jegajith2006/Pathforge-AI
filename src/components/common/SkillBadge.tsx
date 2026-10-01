import React from 'react';
import { SkillStatus, SkillPriority } from '../../types';

interface SkillBadgeProps {
  name: string;
  status?: SkillStatus;
  priority?: SkillPriority;
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  name,
  status,
  priority,
  size = 'md',
}) => {
  let badgeStyles = 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)]';

  if (status === 'strong') {
    badgeStyles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25';
  } else if (status === 'developing') {
    badgeStyles = 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/25';
  } else if (status === 'missing') {
    badgeStyles = 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/25';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border backdrop-blur-xs transition-colors ${sizeClasses} ${badgeStyles}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'strong'
            ? 'bg-emerald-400'
            : status === 'developing'
            ? 'bg-sky-400'
            : status === 'missing'
            ? 'bg-rose-400'
            : 'bg-slate-400'
        }`}
      />
      {name}
      {priority === 'high' && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-1 rounded">
          High
        </span>
      )}
    </span>
  );
};
