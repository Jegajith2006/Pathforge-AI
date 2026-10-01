import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Badge } from '../common/Badge';

/**
 * PageHeader component
 * Displays page title, description, category badge, dynamic breadcrumb, and action buttons.
 */
export const PageHeader = ({
  title,
  description,
  badge,
  badgeVariant = 'indigo',
  breadcrumbs = [],
  action,
  className = '',
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs if not explicitly provided
  const routeSegments = location.pathname.split('/').filter(Boolean);
  const defaultBreadcrumbs = routeSegments.map((segment, index) => {
    const path = `/${routeSegments.slice(0, index + 1).join('/')}`;
    const formatted = segment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { label: formatted, path };
  });

  const activeBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <div
      className={`
        flex
        flex-col
        sm:flex-row
        sm:items-center
        justify-between
        gap-4
        pb-5
        border-b
        border-[var(--border)]
        ${className}
      `}
    >
      <div className="space-y-1.5">
        {/* Breadcrumb Trail */}
        {activeBreadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
            <Link to="/dashboard" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              Platform
            </Link>
            {activeBreadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.path || idx}>
                <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                {idx === activeBreadcrumbs.length - 1 ? (
                  <span className="text-[var(--text-primary)] font-semibold">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title and Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[var(--text-primary)] tracking-tight">
            {title}
          </h1>
          {badge && (
            <Badge variant={badgeVariant} size="sm">
              {badge}
            </Badge>
          )}
        </div>

        {/* Subtitle / Description */}
        {description && (
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action Buttons Slot */}
      {action && <div className="shrink-0 flex items-center gap-3">{action}</div>}
    </div>
  );
};

export default PageHeader;
