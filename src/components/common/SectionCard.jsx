import React from 'react';

/**
 * SectionCard component
 * Standard surface wrapper for sections, lists, tables, and charts.
 */
export const SectionCard = ({
  title,
  subtitle,
  badge,
  action,
  children,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div
      className={`
        rounded-2xl
        bg-[var(--card-bg)]
        border
        border-[var(--card-border)]
        shadow-sm
        shadow-slate-900/5
        dark:shadow-slate-950/40
        overflow-hidden
        transition-colors
        duration-200
        ${className}
      `}
    >
      {(title || subtitle || badge || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2.5">
              {title && (
                <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default SectionCard;
