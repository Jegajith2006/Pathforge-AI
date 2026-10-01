import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  GitFork,
  BookOpen,
  MessageSquareQuote,
  Award,
  Building2,
  ExternalLink,
} from 'lucide-react';

/**
 * NotificationMenu component
 * Popover menu for live notifications, time ago, read/unread states, and batch actions.
 */
export const NotificationMenu = () => {
  const {
    notifications,
    unreadNotificationsCount,
    notificationMenuOpen,
    setNotificationMenuOpen,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
  } = useApp();

  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!notificationMenuOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [notificationMenuOpen, setNotificationMenuOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'roadmap':
        return <GitFork className="w-4 h-4 text-cyan-400" />;
      case 'course':
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
      case 'mentor':
        return <MessageSquareQuote className="w-4 h-4 text-amber-400" />;
      case 'readiness':
        return <Award className="w-4 h-4 text-emerald-400" />;
      case 'company':
        return <Building2 className="w-4 h-4 text-violet-400" />;
      default:
        return <Bell className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
        className="relative p-2 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="View notifications"
        aria-expanded={notificationMenuOpen}
        aria-haspopup="true"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-white text-[10px] font-bold font-mono flex items-center justify-center ring-2 ring-[var(--background)] animate-pulse">
            {unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {notificationMenuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--dropdown-bg)] border border-[var(--dropdown-border)] shadow-2xl z-50 overflow-hidden animate-fade-in divide-y divide-[var(--border)]"
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between bg-[var(--surface-secondary)]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-primary)] font-display">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                  {unreadNotificationsCount} NEW
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-cyan-500 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)] custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                <Bell className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`
                    p-3.5
                    flex
                    items-start
                    gap-3
                    transition-colors
                    cursor-pointer
                    ${
                      notif.unread
                        ? 'bg-[var(--accent-surface)] hover:bg-[var(--accent-surface-hover)]'
                        : 'bg-transparent hover:bg-[var(--surface-secondary)] opacity-80'
                    }
                  `}
                >
                  <div className="p-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      {notif.description}
                    </p>
                  </div>

                  {notif.unread && (
                    <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer note & link */}
          <div className="p-2.5 bg-[var(--surface-secondary)] flex items-center justify-between border-t border-[var(--border)] px-4">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              PathForge Diagnostics
            </span>
            <Link
              to="/notifications"
              onClick={() => setNotificationMenuOpen(false)}
              className="text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
