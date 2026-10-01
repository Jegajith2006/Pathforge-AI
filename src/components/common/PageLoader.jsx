import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * PageLoader component
 * Centralized loading state for full pages or complex view sections.
 */
export const PageLoader = ({ message = 'Synchronizing PathForge telemetry...', className = '' }) => {
  return (
    <div
      className={`
        w-full
        py-20
        flex
        flex-col
        items-center
        justify-center
        space-y-4
        text-center
        animate-fade-in
        ${className}
      `}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-cyan-400 shadow-lg shadow-indigo-950/20 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--text-primary)] font-display">
          {message}
        </p>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          Calibrating machine learning intelligence benchmarks
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
