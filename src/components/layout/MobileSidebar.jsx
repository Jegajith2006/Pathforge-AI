import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { CareerTrajectoryCard } from './CareerTrajectoryCard';
import { navigationConfig } from '../../config/navigation';
import {
  X,
  Flame,
} from 'lucide-react';

/**
 * MobileSidebar component
 * Slide-in drawer for mobile viewports with backdrop overlay and route auto-close.
 * Driven by centralized navigation configuration.
 */
export const MobileSidebar = () => {
  const {
    mobileSidebarOpen,
    setMobileSidebarOpen,
    user,
    unreadNotificationsCount,
  } = useApp();

  const location = useLocation();

  const getBadgeValue = (item) => {
    if (!item.badgeKey) return null;
    if (item.badgeKey === 'unreadNotificationsCount') {
      return unreadNotificationsCount > 0 ? `${unreadNotificationsCount}` : null;
    }
    const val = user[item.badgeKey];
    if (val === undefined || val === null) return null;
    return item.badgeSuffix ? `${val}${item.badgeSuffix}` : `${val}`;
  };

  // Close drawer on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileSidebarOpen]);

  if (!mobileSidebarOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation drawer"
      className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex animate-fade-in"
      onClick={() => setMobileSidebarOpen(false)}
    >
      <div
        className="w-72 max-w-[85vw] bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] p-4 flex flex-col justify-between h-full shadow-2xl animate-slide-right text-[var(--text-primary)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Bar with Logo & Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
            <Logo size="sm" to="/dashboard" />
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Target Trajectory Card */}
          <div className="my-3 shrink-0" onClick={() => setMobileSidebarOpen(false)}>
            <CareerTrajectoryCard />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-2 space-y-4 custom-scrollbar">
            {navigationConfig.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 py-1">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.to;
                  const Icon = item.icon;
                  const badge = getBadgeValue(item);
                  return (
                    <Link
                      key={item.name}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`
                        flex
                        items-center
                        justify-between
                        px-3
                        py-2
                        rounded-xl
                        text-xs
                        font-medium
                        transition-colors
                        ${
                          isActive
                            ? 'bg-[var(--sidebar-item-active)] text-[var(--text-primary)] border border-indigo-500/40 shadow-sm font-semibold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-item-hover)]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-cyan-400' : 'text-[var(--text-muted)]'}`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {badge && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--accent-surface)] text-[var(--accent-primary)]">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Streak and Landing Link */}
          <div className="pt-3 border-t border-[var(--border)] shrink-0 space-y-2">
            <div className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-bold">
                <Flame className="w-4 h-4" />
                <span>{user.learningStreakDays} Day Streak</span>
              </div>
              <span className="font-mono text-[var(--text-muted)] text-[11px]">
                {user.weeklyHours}h/wk
              </span>
            </div>

            <Link
              to="/"
              onClick={() => setMobileSidebarOpen(false)}
              className="block text-center text-xs text-[var(--text-muted)] hover:text-cyan-500 py-1 transition-colors"
            >
              Return to Landing Showcase →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;
