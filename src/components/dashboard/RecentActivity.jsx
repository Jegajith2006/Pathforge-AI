import React from 'react';
import {
  CheckCircle2,
  FolderGit2,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
} from 'lucide-react';
import { mockDashboardActivities } from '../../data/mockData';

export const RecentActivity = () => {
  const activities = mockDashboardActivities || [];

  const getActivityIcon = (iconName, type) => {
    switch (iconName) {
      case 'CheckCircle2':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'FolderGit2':
        return <FolderGit2 className="w-4 h-4 text-indigo-500" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-cyan-500" />;
      case 'MessageSquare':
        return <MessageSquare className="w-4 h-4 text-violet-500" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                Audit Trail & Evidence
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display leading-tight">
                Recent Activity
              </h2>
            </div>
          </div>

          <span className="text-xs font-mono text-[var(--text-muted)]">
            Live Stream
          </span>
        </div>

        {/* Timeline feed */}
        <div className="relative pl-6 space-y-4 my-2">
          {/* Vertical connecting line */}
          <div className="absolute top-2 bottom-2 left-2.5 w-0.5 bg-[var(--border)] -translate-x-1/2" />

          {activities.map((item) => (
            <div
              key={item.id}
              className="relative flex items-start gap-3.5 group p-2 rounded-xl hover:bg-[var(--surface-secondary)]/60 transition-colors"
            >
              {/* Timeline Icon Node */}
              <div className="absolute -left-6 top-2.5 w-5 h-5 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center -translate-x-1/2 shadow-2xs group-hover:scale-110 transition-transform">
                {getActivityIcon(item.icon, item.type)}
              </div>

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.scoreGain && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {item.scoreGain}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        item.statusColor === 'emerald'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : item.statusColor === 'cyan'
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                          : item.statusColor === 'violet'
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Progress bar if in-progress item */}
                {item.progress !== undefined && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                      <span>Progress: {item.progress}%</span>
                      <span>Est. Completion: {item.estimatedCompletion}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Impact details if upcoming item */}
                {item.impact && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                    <span className="font-semibold">Impact:</span>
                    <span>{item.impact}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] mt-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{item.time || item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer indicator */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Syncing real-time evidence telemetry</span>
        </span>
      </div>
    </div>
  );
};

export default RecentActivity;
