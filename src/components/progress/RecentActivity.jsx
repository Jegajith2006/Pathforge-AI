import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FolderGit2,
  ShieldCheck,
  Award,
  MessageSquareQuote,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { mockRecentActivities } from '../../data/mockData';

const ICON_MAP = {
  BookOpen,
  FolderGit2,
  ShieldCheck,
  Award,
  MessageSquareQuote,
  TrendingUp,
};

export const RecentActivity = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
              Recent Activity
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Audit trail of your latest lessons, commits, quiz submissions, and mentor reviews.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-[var(--text-muted)]">Last 5 Days</span>
      </div>

      {/* Activity Timeline List */}
      <div className="relative pl-6 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-0.5 before:bg-[var(--border)]">
        {mockRecentActivities.map((activity) => {
          const IconComp = ICON_MAP[activity.icon] || Clock;

          return (
            <div key={activity.id} className="relative flex items-start justify-between gap-4 group">
              {/* Timeline Indicator Dot */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[var(--card-bg)] border-2 border-indigo-500 flex items-center justify-center text-indigo-500 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>

              {/* Main Content */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors">
                    {activity.title}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                    {activity.type}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {activity.description}
                </p>
                <div className="text-[11px] font-mono text-[var(--text-muted)]">
                  {activity.timestamp || activity.date}
                </div>
              </div>

              {/* Action Link */}
              {activity.link && (
                <button
                  type="button"
                  onClick={() => navigate(activity.link)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all shrink-0 self-center opacity-85 group-hover:opacity-100"
                >
                  <span>{activity.linkLabel || 'View'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
