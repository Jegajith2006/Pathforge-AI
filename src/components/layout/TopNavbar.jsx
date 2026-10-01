import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { NotificationMenu } from './NotificationMenu';
import { ProfileMenu } from './ProfileMenu';
import {
  Menu,
  Search,
  Moon,
  Sun,
} from 'lucide-react';

/**
 * TopNavbar component
 * Fixed-height top navigation bar with search, notifications, theme toggle, and profile.
 */
export const TopNavbar = () => {
  const {
    toggleMobileSidebar,
    setCommandPaletteOpen,
    theme,
    toggleTheme,
    user,
    activeCareer,
  } = useApp();

  const location = useLocation();

  // Dynamic friendly page title based on current pathname
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Overview';
      case '/profile':
        return 'Career Profile';
      case '/career-selection':
        return 'Career Selection';
      case '/skill-gap':
        return 'Skill Intelligence';
      case '/courses':
        return 'Course Catalog';
      case '/projects':
        return 'Project Capstones';
      case '/roadmap':
        return 'Learning Roadmap';
      case '/progress':
        return 'Learning Velocity';
      case '/evidence':
        return 'Evidence Vault';
      case '/mentor-feedback':
        return 'Mentor Feedback';
      case '/readiness':
        return 'Career Readiness';
      case '/company-match':
        return 'Company Matching';
      case '/notifications':
        return 'Notification Center';
      case '/settings':
        return 'Settings';
      default:
        return 'Workspace';
    }
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-40 h-16 bg-[var(--topbar-bg)] backdrop-blur-md border-b border-[var(--topbar-border)] px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
      {/* Left side */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border)] transition-colors cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo */}
        <div className="md:hidden">
          <Logo size="sm" to="/dashboard" />
        </div>

        {/* Desktop Breadcrumb / Title */}
        <div className="hidden md:flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
          <span className="font-mono uppercase tracking-wider">PathForge OS</span>
          <span className="text-[var(--border-strong)]">/</span>
          <span className="font-semibold text-[var(--text-primary)] font-display text-sm">
            {getPageTitle(location.pathname)}
          </span>
        </div>

        {/* Target Career Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[var(--text-muted)]">Target:</span>
          <span className="font-bold text-[var(--text-primary)] font-display">
            {activeCareer || user.targetCareer}
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search / Command Button */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Search or jump to screen"
        >
          <Search className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[var(--surface-tertiary)] rounded border border-[var(--border)] text-[var(--text-muted)]">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <NotificationMenu />

        {/* Divider */}
        <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />

        {/* User Profile Dropdown */}
        <ProfileMenu />
      </div>
    </header>
  );
};

export default TopNavbar;
