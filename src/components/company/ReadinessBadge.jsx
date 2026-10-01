import React from 'react';
import { CheckCircle2, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

/**
 * ReadinessBadge component
 * Displays normalized readiness tier with semantic styling
 * - 80–100: Strong Match
 * - 60–79: Developing Match
 * - 40–59: Partial Match
 * - 0–39: Early Stage
 */
export const ReadinessBadge = ({
  tier,
  score,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  // Resolve tier from score if not provided
  let resolvedTier = tier;
  if (!resolvedTier && typeof score === 'number') {
    if (score >= 80) resolvedTier = 'Strong Match';
    else if (score >= 60) resolvedTier = 'Developing Match';
    else if (score >= 40) resolvedTier = 'Partial Match';
    else resolvedTier = 'Early Stage';
  }
  if (!resolvedTier) resolvedTier = 'Developing Match';

  const tierConfigs = {
    'Strong Match': {
      label: 'Strong Match',
      icon: CheckCircle2,
      style: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    'Developing Match': {
      label: 'Developing Match',
      icon: TrendingUp,
      style: 'bg-indigo-500/15 text-indigo-600 dark:text-cyan-400 border-indigo-500/30 dark:border-cyan-500/30',
      dotColor: 'bg-cyan-400',
    },
    'Partial Match': {
      label: 'Partial Match',
      icon: AlertTriangle,
      style: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400',
    },
    'Early Stage': {
      label: 'Early Stage',
      icon: Clock,
      style: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      dotColor: 'bg-rose-400',
    },
  };

  const config = tierConfigs[resolvedTier] || tierConfigs['Developing Match'];
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5 font-semibold',
    lg: 'px-3.5 py-1.5 text-sm gap-2 font-bold',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        font-medium
        whitespace-nowrap
        select-none
        transition-colors
        ${config.style}
        ${sizeClasses[size] || sizeClasses.sm}
        ${className}
      `}
    >
      {showIcon && <Icon className={`${iconSizes[size] || iconSizes.sm} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
};

export default ReadinessBadge;
