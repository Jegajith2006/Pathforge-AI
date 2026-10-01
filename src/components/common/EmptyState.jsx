import React from 'react';
import { Button } from './Button';

/**
 * EmptyState component
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <div
      className={`
        p-8
        sm:p-12
        rounded-2xl
        bg-[var(--card-bg)]
        border
        border-[var(--card-border)]
        text-center
        flex
        flex-col
        items-center
        justify-center
        max-w-md
        mx-auto
        transition-colors
        duration-200
        ${className}
      `}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-surface)] border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}

      <h4 className="text-base font-bold font-display text-[var(--text-primary)]">{title}</h4>
      {description && (
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && (
        <div className="mt-5">
          <Button
            onClick={onAction}
            variant="cyan"
            size="sm"
            leftIcon={actionIcon}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
