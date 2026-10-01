import React from 'react';

/**
 * StatusBadge component
 * Provides semantic badges for statuses like Verified, In Progress, Critical Gap, High Priority, etc.
 */
export const StatusBadge = ({
  status = 'default',
  label,
  children,
  size = 'md',
  dot = true,
  className = '',
}) => {
  const text = label || children || status;
  const normalized = String(text).toLowerCase();

  let variant = 'neutral';
  if (
    normalized.includes('verified') ||
    normalized.includes('completed') ||
    normalized.includes('approved') ||
    normalized.includes('strong') ||
    normalized.includes('competitive')
  ) {
    variant = 'success';
  } else if (
    normalized.includes('progress') ||
    normalized.includes('active') ||
    normalized.includes('enrolled') ||
    normalized.includes('review')
  ) {
    variant = 'cyan';
  } else if (
    normalized.includes('high') ||
    normalized.includes('urgent') ||
    normalized.includes('developing') ||
    normalized.includes('warning')
  ) {
    variant = 'amber';
  } else if (
    normalized.includes('critical') ||
    normalized.includes('gap') ||
    normalized.includes('failed') ||
    normalized.includes('locked')
  ) {
    variant = 'rose';
  } else if (
    normalized.includes('milestone') ||
    normalized.includes('target') ||
    normalized.includes('tier')
  ) {
    variant = 'indigo';
  }

  const styles = {
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
    neutral: 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]',
  };

  const dotColors = {
    success: 'bg-emerald-500 dark:bg-emerald-400',
    cyan: 'bg-cyan-500 dark:bg-cyan-400 animate-pulse',
    amber: 'bg-amber-500 dark:bg-amber-400',
    rose: 'bg-rose-500 dark:bg-rose-400',
    indigo: 'bg-indigo-500 dark:bg-indigo-400',
    neutral: 'bg-[var(--text-muted)]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        font-mono
        font-semibold
        uppercase
        tracking-wider
        ${styles[variant] || styles.neutral}
        ${sizes[size] || sizes.md}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.neutral}`}
        />
      )}
      <span>{text}</span>
    </span>
  );
};

export default StatusBadge;
