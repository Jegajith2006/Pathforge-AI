import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  to,
  href,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 select-none whitespace-nowrap active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-md shadow-indigo-600/20 hover:shadow-lg dark:shadow-indigo-950/40 border border-indigo-400/25',
    secondary:
      'bg-[var(--surface)] hover:bg-[var(--surface-secondary)] dark:hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] dark:border-[var(--border)] hover:border-[var(--accent)] dark:hover:border-[var(--accent)] shadow-xs',
    outline:
      'bg-transparent hover:bg-[var(--accent-surface)] text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white border border-indigo-500/40 hover:border-indigo-400',
    ghost:
      'bg-transparent hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/20 border border-rose-400/30',
    cyan:
      'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-950/20 border border-cyan-300/40',
  };

  const combinedClasses = `
    ${baseStyles}
    ${sizeStyles[size] || sizeStyles.md}
    ${variantStyles[variant] || variantStyles.primary}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0 text-current" />
      ) : null}
      <span>{children}</span>
      {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0 text-current" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClasses} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClasses} target="_blank" rel="noreferrer noopener" {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
