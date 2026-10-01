import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Send,
  PlusCircle,
  MessageSquareQuote,
  Star,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const MentorFeedbackHeader = ({
  totalReviews = 8,
  avgRating = 4.6,
  openActionItems = 5,
  latestDate = 'Yesterday',
  onRequestFeedback,
  onAddFeedback,
}) => {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Mentor Feedback"
        description="Use expert feedback to improve your skills, strengthen your projects, and make better career decisions."
        badge="Staff Engineer Rubrics"
        badgeVariant="indigo"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={onRequestFeedback}
              variant="outline"
              size="sm"
              leftIcon={Send}
            >
              Request Feedback
            </Button>
            <Button
              onClick={onAddFeedback}
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
            >
              Add Feedback
            </Button>
          </div>
        }
      />

      {/* Mini Telemetry Status Bar */}
      <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block tracking-wider">
              Reviews Received
            </span>
            <span className="font-bold text-[var(--text-primary)]">
              {totalReviews} Evaluations
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block tracking-wider">
              Mean Score
            </span>
            <span className="font-bold text-[var(--text-primary)]">
              {Number(avgRating).toFixed(1)} / 5.0 Rubric
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block tracking-wider">
              Open Actions
            </span>
            <span className="font-bold text-[var(--text-primary)]">
              {openActionItems} Pending Resolution
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block tracking-wider">
              Latest Review
            </span>
            <span className="font-bold text-[var(--text-primary)]">
              {latestDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
