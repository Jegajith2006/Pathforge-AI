import React from 'react';
import { Badge } from './Badge';

export const SectionHeading = ({
  badge,
  badgeVariant = 'indigo',
  title,
  description,
  align = 'center',
  actions,
  className = '',
}) => {
  const isCenter = align === 'center';

  return (
    <div
      className={`
        flex flex-col
        ${isCenter ? 'items-center text-center' : 'items-start text-left'}
        ${className}
      `}
    >
      {badge && (
        <div className="mb-3">
          {typeof badge === 'string' ? (
            <Badge variant={badgeVariant} dot size="sm">
              {badge}
            </Badge>
          ) : (
            badge
          )}
        </div>
      )}

      {title && (
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] font-display tracking-tight leading-tight max-w-3xl">
          {title}
        </h2>
      )}

      {description && (
        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-3 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}

      {actions && <div className="mt-5 flex items-center gap-3">{actions}</div>}
    </div>
  );
};

export default SectionHeading;
