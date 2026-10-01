import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Reusable StatCard component
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo', // 'indigo' | 'cyan' | 'blue' | 'emerald' | 'amber'
  className = '',
}) => {
  const colorMap = {
    indigo: {
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      borderGlow: 'hover:border-indigo-500/40',
      valueColor: 'text-[var(--text-primary)]',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
      borderGlow: 'hover:border-cyan-500/40',
      valueColor: 'text-cyan-600 dark:text-cyan-400',
    },
    blue: {
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
      borderGlow: 'hover:border-blue-500/40',
      valueColor: 'text-[var(--text-primary)]',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      borderGlow: 'hover:border-emerald-500/40',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
      borderGlow: 'hover:border-amber-500/40',
      valueColor: 'text-[var(--text-primary)]',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`
        p-5
        sm:p-6
        rounded-2xl
        bg-[var(--card-bg)]
        border
        border-[var(--card-border)]
        ${scheme.borderGlow}
        shadow-sm
        shadow-slate-900/5
        dark:shadow-slate-950/40
        transition-all
        duration-200
        flex
        flex-col
        justify-between
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold font-display ${scheme.valueColor}`}>
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-semibold flex items-center gap-0.5 ${
                  trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {trend.value}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${scheme.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border)] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
