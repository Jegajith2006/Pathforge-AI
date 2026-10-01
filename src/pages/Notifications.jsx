import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import {
  Bell,
  CheckCheck,
  Trash2,
  GitFork,
  BookOpen,
  MessageSquareQuote,
  Award,
  Building2,
  ShieldCheck,
  LineChart,
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';

export const Notifications = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    toggleNotificationRead,
    deleteNotification,
    markAllNotificationsAsRead,
    clearAllNotifications,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const categories = [
    { id: 'all', label: 'All Alerts' },
    { id: 'readiness', label: 'Readiness & Match' },
    { id: 'learning', label: 'Learning & Roadmap' },
    { id: 'mentor', label: 'Mentor Reviews' },
    { id: 'system', label: 'System & Evidence' },
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'roadmap':
        return <GitFork className="w-4 h-4 text-cyan-500" />;
      case 'course':
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'mentor':
        return <MessageSquareQuote className="w-4 h-4 text-amber-500" />;
      case 'readiness':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'company':
        return <Building2 className="w-4 h-4 text-violet-500" />;
      case 'evidence':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'progress':
        return <LineChart className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-cyan-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            High Urgency
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Medium
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border)]">
            Info
          </span>
        );
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Category match
      if (activeCategory !== 'all') {
        if (notif.category) {
          if (notif.category !== activeCategory) return false;
        } else {
          // Fallback matching by type
          if (activeCategory === 'readiness' && notif.type !== 'readiness' && notif.type !== 'company') return false;
          if (activeCategory === 'learning' && notif.type !== 'roadmap' && notif.type !== 'course' && notif.type !== 'progress') return false;
          if (activeCategory === 'mentor' && notif.type !== 'mentor') return false;
          if (activeCategory === 'system' && notif.type !== 'evidence' && notif.type !== 'system') return false;
        }
      }

      // Unread only toggle
      if (showUnreadOnly && !notif.unread) return false;

      // Text query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          notif.title?.toLowerCase().includes(query) ||
          notif.description?.toLowerCase().includes(query) ||
          notif.type?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [notifications, activeCategory, showUnreadOnly, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Review system telemetry alerts, verified evidence logs, mentor reviews, and roadmap milestones."
        badge={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} Unread` : 'All Caught Up'}
        badgeVariant={unreadNotificationsCount > 0 ? 'cyan' : 'emerald'}
        action={
          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <Button
                onClick={markAllNotificationsAsRead}
                variant="outline"
                size="sm"
                leftIcon={CheckCheck}
              >
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                onClick={clearAllNotifications}
                variant="ghost"
                size="sm"
                leftIcon={Trash2}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              >
                Clear All
              </Button>
            )}
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] overflow-x-auto">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    font-semibold
                    transition-all
                    cursor-pointer
                    whitespace-nowrap
                    ${
                      isActive
                        ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search input & Unread toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter notifications..."
                className="w-full bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium cursor-pointer shrink-0 select-none">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Unread Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications List or Empty State */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={notifications.length === 0 ? "No Notifications" : "No Matching Alerts"}
          description={
            notifications.length === 0
              ? "You're completely caught up. New roadmap recalibrations, test verifications, and mentor reviews will appear here."
              : `No notifications match your current filter (${searchQuery || activeCategory}).`
          }
          actionLabel={notifications.length === 0 ? undefined : "Reset Filters"}
          onAction={() => {
            setActiveCategory('all');
            setSearchQuery('');
            setShowUnreadOnly(false);
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`
                p-4
                sm:p-5
                rounded-2xl
                border
                transition-all
                duration-200
                flex
                flex-col
                sm:flex-row
                sm:items-center
                justify-between
                gap-4
                ${
                  notif.unread
                    ? 'bg-[var(--card-bg)] border-indigo-500/40 shadow-sm ring-1 ring-indigo-500/20'
                    : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:border-indigo-500/30 opacity-90'
                }
              `}
            >
              {/* Left Column: Icon + Text */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold font-display text-[var(--text-primary)] truncate">
                      {notif.title}
                    </h4>
                    {notif.unread && (
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 animate-pulse" />
                    )}
                    {getPriorityBadge(notif.priority)}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {notif.description}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notif.timestamp}
                    </span>
                    <span className="uppercase">{notif.type}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--border)]">
                {notif.link && (
                  <Link to={notif.link}>
                    <Button
                      variant="primary"
                      size="xs"
                      rightIcon={ArrowRight}
                      onClick={() => markNotificationAsRead(notif.id)}
                    >
                      {notif.actionLabel || 'Inspect'}
                    </Button>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => toggleNotificationRead(notif.id)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                  title={notif.unread ? 'Mark as read' : 'Mark as unread'}
                  aria-label={notif.unread ? 'Mark as read' : 'Mark as unread'}
                >
                  <CheckCircle2 className={`w-4 h-4 ${notif.unread ? 'text-cyan-500' : 'text-[var(--text-muted)]'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => deleteNotification(notif.id)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete notification"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
