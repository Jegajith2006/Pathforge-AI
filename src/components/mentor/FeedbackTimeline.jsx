import React from 'react';
import { CheckCircle2, Clock, MessageSquareQuote, ShieldCheck } from 'lucide-react';

export const FeedbackTimeline = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-indigo-400" />
        <span>Review History & Milestone Timeline</span>
      </h5>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
        {timeline.map((item, index) => {
          const isLatest = index === timeline.length - 1;
          return (
            <div key={index} className="relative group">
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border flex items-center justify-center ${
                  isLatest
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-xs'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] text-xs space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {item.action}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {item.date}
                  </span>
                </div>
                {item.actor && (
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    By <span className="font-medium text-[var(--text-primary)]">{item.actor}</span>
                  </p>
                )}
                {item.notes && (
                  <p className="text-[11px] text-[var(--text-muted)] italic">
                    "{item.notes}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
