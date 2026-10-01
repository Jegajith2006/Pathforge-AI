import React from 'react';

/**
 * CardSkeleton component
 * High-fidelity animated pulse skeleton placeholder for cards and grid items.
 */
export const CardSkeleton = ({ count = 1, className = '', height = 'h-48' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            p-5
            sm:p-6
            rounded-2xl
            bg-[var(--card-bg)]
            border
            border-[var(--card-border)]
            animate-pulse
            flex
            flex-col
            justify-between
            ${height}
            ${className}
          `}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-[var(--surface-tertiary)] rounded-md w-1/3" />
              <div className="h-6 w-16 bg-[var(--surface-tertiary)] rounded-full" />
            </div>
            <div className="h-6 bg-[var(--surface-tertiary)] rounded-md w-3/4" />
            <div className="h-3.5 bg-[var(--surface-secondary)] rounded-md w-1/2" />
          </div>

          <div className="space-y-2 pt-4 border-t border-[var(--border)]">
            <div className="h-2 bg-[var(--surface-tertiary)] rounded-full w-full" />
            <div className="flex justify-between items-center">
              <div className="h-3 bg-[var(--surface-secondary)] rounded w-1/4" />
              <div className="h-3 bg-[var(--surface-secondary)] rounded w-1/5" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default CardSkeleton;
