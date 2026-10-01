import React from 'react';

export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  title,
  subtitle,
  badge,
  action,
  icon: Icon,
  footer,
  onClick,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantStyles = {
    default: 'bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm shadow-slate-900/5 dark:shadow-slate-950/40',
    glass: 'bg-[var(--card-bg)]/85 backdrop-blur-xl border border-[var(--card-border)] shadow-lg shadow-indigo-950/10',
    interactive:
      'bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-indigo-500/40 hover:bg-[var(--card-hover-bg)] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer',
    highlight:
      'bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--surface-tertiary)] border border-indigo-500/35 shadow-lg shadow-indigo-950/10',
  };

  return (
    <div
      className={`
        rounded-2xl
        relative
        overflow-hidden
        transition-colors duration-200
        ${variantStyles[variant] || variantStyles.default}
        ${paddingStyles[padding] || paddingStyles.md}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle || badge || action || Icon) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-[var(--accent-surface)] border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {title && <h3 className="text-base font-bold text-[var(--text-primary)] font-display">{title}</h3>}
                {badge && <span className="shrink-0">{badge}</span>}
              </div>
              {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div>{children}</div>

      {footer && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
