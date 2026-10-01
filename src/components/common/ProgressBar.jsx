import React from 'react';

/**
 * Reusable ProgressBar component
 */
export const ProgressBar = ({
  value = 0,
  max = 100,
  target = null,
  height = 'h-2',
  variant = 'gradient', // 'gradient' | 'cyan' | 'indigo' | 'emerald' | 'amber' | 'rose'
  showLabel = false,
  label = '',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const targetPercentage = target !== null ? Math.min(100, Math.max(0, (target / max) * 100)) : null;

  const variantGradients = {
    gradient:
      percentage >= 75
        ? 'bg-gradient-to-r from-indigo-500 to-emerald-400'
        : percentage >= 50
        ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
        : 'bg-gradient-to-r from-amber-500 to-rose-400',
    cyan: 'bg-cyan-400',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-500',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-semibold text-[var(--text-primary)]">{label}</span>}
          <div className="flex items-center gap-2 ml-auto text-[var(--text-muted)] font-mono text-[11px]">
            {targetPercentage !== null && <span>Target: {target}%</span>}
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{Math.round(percentage)}%</span>
          </div>
        </div>
      )}

      <div className={`w-full bg-[var(--surface-tertiary)] ${height} rounded-full overflow-hidden relative flex`}>
        {targetPercentage !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[var(--text-primary)]/40 z-10"
            style={{ left: `${targetPercentage}%` }}
            title={`Benchmark target: ${target}%`}
          />
        )}
        <div
          className={`${height} rounded-full transition-all duration-500 ${variantGradients[variant] || variantGradients.gradient}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
