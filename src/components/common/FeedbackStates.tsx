import React from 'react';
import { LucideIcon, Inbox, AlertCircle, RefreshCw } from 'lucide-react';

export const LoadingSkeleton: React.FC<{ rows?: number; type?: 'card' | 'table' | 'line' }> = ({
  rows = 3,
  type = 'card',
}) => {
  if (type === 'line') {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-[var(--surface-tertiary)] rounded w-full" />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="w-full space-y-3 animate-pulse p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]">
        <div className="h-8 bg-[var(--surface-tertiary)] rounded w-1/3 mb-4" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-[var(--surface-secondary)] rounded w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-44 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 bg-[var(--surface-tertiary)] rounded w-24" />
            <div className="h-8 w-8 bg-[var(--surface-tertiary)] rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-[var(--surface-tertiary)] rounded w-3/4" />
            <div className="h-3 bg-[var(--surface-secondary)] rounded w-1/2" />
          </div>
          <div className="h-2 bg-[var(--surface-tertiary)] rounded w-full" />
        </div>
      ))}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
}> = ({ title, description, icon: Icon = Inbox, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--card-bg)] border border-dashed border-[var(--border)] rounded-2xl">
      <div className="p-4 rounded-2xl bg-[var(--accent-surface)] text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">{title}</h4>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-5 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => {
  return (
    <div className="p-6 bg-rose-950/20 border border-rose-900/30 rounded-2xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        <p className="text-sm text-rose-200">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-900/30 hover:bg-rose-900/50 rounded-lg border border-rose-800/40 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};
