import React, { useState } from 'react';

/**
 * Avatar component
 * Displays user profile image with fallback initials and optional status indicator dot.
 */
export const Avatar = ({
  src,
  name = 'User',
  alt,
  size = 'md',
  status = null,
  className = '',
  ringColor = 'ring-indigo-500/50',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
    lg: 'w-3 h-3 bottom-0.5 right-0.5',
    xl: 'w-3.5 h-3.5 bottom-1 right-1',
  };

  const statusColors = {
    online: 'bg-emerald-400 ring-2 ring-[var(--surface)]',
    busy: 'bg-amber-400 ring-2 ring-[var(--surface)]',
    offline: 'bg-slate-400 dark:bg-slate-500 ring-2 ring-[var(--surface)]',
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setImageError(true)}
          className={`
            ${sizeClasses[size] || sizeClasses.md}
            rounded-xl
            object-cover
            ring-1
            ${ringColor}
            bg-[var(--surface-secondary)]
          `}
        />
      ) : (
        <div
          className={`
            ${sizeClasses[size] || sizeClasses.md}
            rounded-xl
            bg-gradient-to-br
            from-indigo-600
            to-cyan-600
            text-white
            font-bold
            font-display
            flex
            items-center
            justify-center
            ring-1
            ${ringColor}
          `}
        >
          {getInitials(name)}
        </div>
      )}

      {status && statusColors[status] && (
        <span
          className={`
            absolute
            rounded-full
            ${statusDotSizes[size] || statusDotSizes.md}
            ${statusColors[status]}
          `}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;
