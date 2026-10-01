import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'indigo' | 'blue' | 'emerald' | 'violet' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      glow: 'group-hover:border-indigo-500/40',
    },
    blue: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      glow: 'group-hover:border-sky-500/40',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      glow: 'group-hover:border-emerald-500/40',
    },
    violet: {
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/20',
      glow: 'group-hover:border-violet-500/40',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      glow: 'group-hover:border-amber-500/40',
    },
  }[color];

  return (
    <div
      className={`group relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 hover:border-indigo-500/40 transition-all duration-300 shadow-sm shadow-slate-900/5 dark:shadow-slate-950/40 ${colorMap.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${colorMap.bg} ${colorMap.text} border ${colorMap.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-display">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
              trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{subtitle}</p>
      )}
    </div>
  );
};
