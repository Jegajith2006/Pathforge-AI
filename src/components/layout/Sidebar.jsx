import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { Avatar } from '../common/Avatar';
import { SidebarItem } from './SidebarItem';
import { CareerTrajectoryCard } from './CareerTrajectoryCard';
import { Tooltip } from '../common/Tooltip';
import { navigationConfig } from '../../config/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Settings,
} from 'lucide-react';

/**
 * Sidebar component
 * Collapsible navigation sidebar (256px expanded / 80px collapsed)
 * In collapsed mode:
 * - Fixed 80px (w-20) width
 * - All icons centered horizontally and vertically
 * - Text completely omitted from DOM to prevent clipping/overflow
 * - Expand toggle button cleanly stacked below centered logo
 * - Floating portal tooltips outside sidebar on hover and keyboard focus
 */
export const Sidebar = () => {
  const {
    sidebarCollapsed,
    toggleSidebar,
    user,
    unreadNotificationsCount,
  } = useApp();

  const getBadgeValue = (item) => {
    if (!item.badgeKey) return null;
    if (item.badgeKey === 'unreadNotificationsCount') {
      return unreadNotificationsCount > 0 ? `${unreadNotificationsCount}` : null;
    }
    const val = user[item.badgeKey];
    if (val === undefined || val === null) return null;
    return item.badgeSuffix ? `${val}${item.badgeSuffix}` : `${val}`;
  };

  return (
    <aside
      className={`
        bg-[var(--sidebar-bg)]
        border-r
        border-[var(--sidebar-border)]
        transition-all
        duration-300
        ease-in-out
        flex
        flex-col
        justify-between
        shrink-0
        z-30
        h-screen
        sticky
        top-0
        hidden
        md:flex
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Top Section: Logo & Trajectory & Navigation */}
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        {/* Header with Logo and Collapse/Expand Button */}
        {sidebarCollapsed ? (
          <div className="py-3 px-2 border-b border-[var(--border)] flex flex-col items-center gap-2.5 shrink-0">
            <Logo size="sm" showText={false} to="/dashboard" />
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] border border-[var(--border)] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="h-16 border-b border-[var(--border)] flex items-center justify-between px-4 shrink-0">
            <Logo size="sm" to="/dashboard" />
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] border border-[var(--border)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace / Target Career Indicator */}
        <div className={`shrink-0 ${sidebarCollapsed ? 'px-2 my-2.5' : 'px-3 my-3'}`}>
          <CareerTrajectoryCard isCollapsed={sidebarCollapsed} />
        </div>

        {/* Navigation Items grouped */}
        <nav
          className={`
            flex-1
            overflow-y-auto
            custom-scrollbar
            ${sidebarCollapsed ? 'px-2 py-1 space-y-2' : 'px-3 py-1 space-y-4'}
          `}
        >
          {navigationConfig.map((group) => (
            <div key={group.title} className={sidebarCollapsed ? 'space-y-1.5' : 'space-y-1'}>
              {!sidebarCollapsed && (
                <p className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 py-1 select-none">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => (
                <SidebarItem
                  key={item.name}
                  icon={item.icon}
                  label={item.name}
                  to={item.to}
                  badge={getBadgeValue(item)}
                  isCollapsed={sidebarCollapsed}
                />
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Section: Learning Streak & User Profile status */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
        {!sidebarCollapsed ? (
          <div className="space-y-2">
            {/* Learning Streak widget */}
            <div className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                  <Flame className="w-4 h-4" />
                  <span>{user.learningStreakDays} Day Streak</span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {user.weeklyHours}h/wk
                </span>
              </div>
              <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (user.weeklyHours / 20) * 100)}%` }}
                />
              </div>
            </div>

            {/* User Profile & Account Status Row */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
              >
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size="xs"
                  status="online"
                />
                <div className="min-w-0 flex-1 truncate">
                  <p className="text-xs font-bold text-[var(--text-primary)] font-display truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-mono text-indigo-600 dark:text-cyan-400 font-semibold truncate">
                    {user.readinessScore}% Ready
                  </p>
                </div>
              </Link>

              <Link
                to="/settings"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                title="Account Settings"
                aria-label="Account Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {/* Collapsed Streak Icon */}
            <Tooltip
              content={`${user.learningStreakDays} Day Streak (${user.weeklyHours}h/wk)`}
              position="right"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface-secondary)] text-amber-600 dark:text-amber-400 border border-[var(--border)] cursor-default"
                aria-label={`${user.learningStreakDays} Day Learning Streak`}
              >
                <Flame className="w-4 h-4" />
              </div>
            </Tooltip>

            {/* Collapsed Profile Avatar */}
            <Tooltip
              content={`${user.name} (${user.readinessScore}% Ready)`}
              position="right"
            >
              <Link
                to="/profile"
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:ring-2 hover:ring-indigo-500/40 transition-all"
                aria-label={`Profile: ${user.name}`}
              >
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size="xs"
                  status="online"
                />
              </Link>
            </Tooltip>

            {/* Collapsed Settings Button */}
            <Tooltip content="Account Settings" position="right">
              <Link
                to="/settings"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] border border-transparent hover:border-[var(--border)] transition-colors"
                aria-label="Account Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

