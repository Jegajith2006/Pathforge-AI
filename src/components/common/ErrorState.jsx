import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

/**
 * ErrorState component
 * Standardized error message with retry handler and WCAG compliant contrast.
 */
export const ErrorState = ({
  title = 'Telemetry Synchronization Error',
  message = 'An error occurred while communicating with the PathForge diagnostics engine.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`
        p-6
        sm:p-8
        rounded-2xl
        bg-rose-500/10
        border
        border-rose-500/20
        text-center
        flex
        flex-col
        items-center
        justify-center
        space-y-4
        max-w-lg
        mx-auto
        animate-fade-in
        ${className}
      `}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-bold font-display text-[var(--text-primary)]">
          {title}
        </h4>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          leftIcon={RefreshCw}
          className="mt-2 text-rose-600 dark:text-rose-300 border-rose-500/40 hover:bg-rose-500/10"
        >
          Retry Calibration
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
