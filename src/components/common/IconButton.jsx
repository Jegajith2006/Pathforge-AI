import React from 'react';
import { Tooltip } from './Tooltip';

/**
 * Accessible IconButton component
 */
export const IconButton = ({
  icon: Icon,
  label,
  tooltip,
  onClick,
  variant = 'secondary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  badge = null,
  className = '',
  type = 'button',
  ...props
}) => {
  const sizeClasses = {
    sm: 'p-1.5 rounded-lg text-xs',
    md: 'p-2 rounded-xl text-sm',
    lg: 'p-2.5 rounded-xl text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40',
    secondary: 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]',
    ghost: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]',
    danger: 'text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-rose-500/20',
  };

  const buttonElement = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label || tooltip}
      className={`
        relative
        inline-flex
        items-center
        justify-center
        font-medium
        transition-all
        duration-150
        cursor-pointer
        disabled:opacity-50
        disabled:cursor-not-allowed
        focus-visible:outline-hidden
        focus-visible:ring-2
        focus-visible:ring-indigo-500
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.secondary}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size] || iconSizes.md} />}
      {badge !== null && (
        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-cyan-400 text-[#080B16] text-[10px] font-bold font-mono flex items-center justify-center ring-2 ring-[#080B16]">
          {badge}
        </span>
      )}
    </button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{buttonElement}</Tooltip>;
  }

  return buttonElement;
};

export default IconButton;
