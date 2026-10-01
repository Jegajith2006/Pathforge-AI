import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tooltip } from '../common/Tooltip';

/**
 * CareerTrajectoryCard component
 * Displays user's active career trajectory in the sidebar and navigation drawers.
 * Styled with semantic CSS tokens to perfectly match both light and dark themes.
 */
export const CareerTrajectoryCard = ({ isCollapsed = false, className = '' }) => {
  const { user, activeCareer } = useApp();
  const currentRole = activeCareer || user?.targetCareer || 'Machine Learning Engineer';

  if (isCollapsed) {
    return (
      <div className="py-2 flex justify-center w-full">
        <Tooltip content={`Target Trajectory: ${currentRole}`} position="right">
          <Link
            to="/career-selection"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors"
            aria-label={`Target Trajectory: ${currentRole}`}
          >
            <Compass className="w-4 h-4" />
          </Link>
        </Tooltip>
      </div>
    );
  }


  return (
    <Link
      to="/career-selection"
      className={`
        group
        block
        w-full
        p-3
        rounded-2xl
        bg-[var(--surface-secondary)]
        dark:bg-[var(--surface)]
        border
        border-[var(--border)]
        dark:border-indigo-500/20
        hover:border-indigo-500/40
        dark:hover:border-indigo-400/40
        hover:bg-[var(--surface-hover)]
        dark:hover:bg-[var(--surface-secondary)]
        transition-all
        duration-200
        cursor-pointer
        ${className}
      `.trim()}
      title="Change target trajectory"
      aria-label={`Current target trajectory: ${currentRole}. Click to customize.`}
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Status Indicator Icon Box */}
          <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-indigo-600 dark:text-cyan-400 border border-[var(--border)] shrink-0 group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 shrink-0 animate-pulse"
                aria-hidden="true"
              />
              <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Target Trajectory
              </p>
            </div>
            <p className="text-xs font-bold font-display text-[var(--text-primary)] truncate mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
              {currentRole}
            </p>
          </div>
        </div>

        {/* Subtle Navigation Affordance Arrow */}
        <div className="p-1 rounded-lg text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-all shrink-0">
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
};

export default CareerTrajectoryCard;
