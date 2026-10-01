import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  icon: Icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[11px] gap-1.5',
    md: 'px-3 py-1 text-xs gap-2',
  };

  const variantStyles = {
    default: 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]',
    indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30',
    violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/30',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30',
    outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border)]',
  };

  const dotColors = {
    default: 'bg-slate-400',
    indigo: 'bg-indigo-400 shadow-[0_0_8px_#818CF8]',
    cyan: 'bg-cyan-400 shadow-[0_0_8px_#22D3EE]',
    violet: 'bg-violet-400 shadow-[0_0_8px_#A78BFA]',
    success: 'bg-emerald-400 shadow-[0_0_8px_#34D399]',
    warning: 'bg-amber-400 shadow-[0_0_8px_#FBBF24]',
    danger: 'bg-rose-400 shadow-[0_0_8px_#FB7185]',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        font-semibold
        rounded-full
        whitespace-nowrap
        tracking-wide
        select-none
        ${sizeStyles[size] || sizeStyles.sm}
        ${variantStyles[variant] || variantStyles.default}
        ${className}
      `.trim()}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.default}`} />
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
