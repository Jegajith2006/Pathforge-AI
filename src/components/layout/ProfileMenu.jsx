import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import {
  User,
  Settings,
  LogOut,
  Sparkles,
  ChevronDown,
  Compass,
} from 'lucide-react';

/**
 * ProfileMenu component
 * Dropdown menu for current user profile summary, quick links, and logout.
 */
export const ProfileMenu = () => {
  const { user, activeCareer, profileMenuOpen, setProfileMenuOpen } = useApp();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [profileMenuOpen, setProfileMenuOpen]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] border border-[var(--border)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-expanded={profileMenuOpen}
        aria-haspopup="true"
        aria-label="User profile menu"
      >
        <Avatar
          src={user.avatar}
          name={user.name}
          size="sm"
          status="online"
          ringColor="ring-indigo-500/40"
        />

        <div className="hidden lg:block text-left">
          <p className="text-xs font-bold text-[var(--text-primary)] font-display leading-tight truncate max-w-[120px]">
            {user.name}
          </p>
          <p className="text-[10px] font-mono text-indigo-600 dark:text-cyan-400 font-semibold leading-none mt-0.5">
            {user.readinessScore}% Ready
          </p>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 hidden sm:block ${
            profileMenuOpen ? 'rotate-180 text-[var(--text-primary)]' : ''
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {profileMenuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] shadow-2xl z-50 overflow-hidden animate-fade-in divide-y divide-[var(--border)]"
        >
          {/* User Information Header */}
          <div className="p-4 bg-[var(--surface-secondary)]">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar} name={user.name} size="md" />
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-[var(--text-primary)] font-display truncate">
                  {user.name}
                </h4>
                <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
              </div>
            </div>

            {/* Target Career Pill */}
            <div className="mt-3 p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs">
              <div className="overflow-hidden">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                  Target Goal
                </span>
                <span className="font-bold text-indigo-600 dark:text-cyan-300 font-display truncate block">
                  {activeCareer || user.targetCareer}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                {user.readinessScore}%
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-2 space-y-1 text-xs">
            <Link
              to="/profile"
              onClick={() => setProfileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
              role="menuitem"
            >
              <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[var(--text-primary)]">View Profile</p>
                <p className="text-[10px] text-[var(--text-muted)]">Skills, bio & experience level</p>
              </div>
            </Link>

            <Link
              to="/career-selection"
              onClick={() => setProfileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
              role="menuitem"
            >
              <Compass className="w-4 h-4 text-cyan-500 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[var(--text-primary)]">Career Selection</p>
                <p className="text-[10px] text-[var(--text-muted)]">Switch target trajectory</p>
              </div>
            </Link>

            <Link
              to="/readiness"
              onClick={() => setProfileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
              role="menuitem"
            >
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[var(--text-primary)]">Readiness Index</p>
                <p className="text-[10px] text-[var(--text-muted)]">Benchmark vs employers</p>
              </div>
            </Link>

            <Link
              to="/settings"
              onClick={() => setProfileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
              role="menuitem"
            >
              <Settings className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[var(--text-primary)]">Settings</p>
                <p className="text-[10px] text-[var(--text-muted)]">Preferences & security</p>
              </div>
            </Link>
          </div>

          {/* Logout Action */}
          <div className="p-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors text-xs font-semibold cursor-pointer"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
