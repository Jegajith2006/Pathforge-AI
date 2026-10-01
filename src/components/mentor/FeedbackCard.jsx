import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  FolderGit2,
  BookOpen,
  ListTodo,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { StatusBadge } from '../common/StatusBadge';
import { FeedbackRating } from './FeedbackRating';

export const FeedbackCard = ({
  feedback,
  onSelect,
}) => {
  const completedActions = feedback.actionItems
    ? feedback.actionItems.filter((a) => a.completed).length
    : 0;
  const totalActions = feedback.actionItems ? feedback.actionItems.length : 0;

  const statusVariants = {
    New: 'indigo',
    Reviewed: 'cyan',
    'Action Required': 'warning',
    Resolved: 'success',
  };

  return (
    <div
      onClick={() => onSelect && onSelect(feedback)}
      className="group p-5 sm:p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] hover:border-indigo-500/50 shadow-sm shadow-slate-900/5 dark:shadow-slate-950/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-5 cursor-pointer relative overflow-hidden"
    >
      {/* Top Bar: Mentor Info, Category & Status */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3.5">
          {feedback.avatar ? (
            <img
              src={feedback.avatar}
              alt={feedback.mentorName}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/30 shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-12 h-12 rounded-full bg-indigo-500/15 border-2 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center shrink-0 ${
              feedback.avatar ? 'hidden' : 'flex'
            }`}
          >
            {feedback.avatarInitials ||
              feedback.mentorName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-[var(--text-primary)] font-display group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                {feedback.mentorName}
              </h4>
              <Badge
                variant={statusVariants[feedback.status] || 'default'}
                size="sm"
                dot
              >
                {feedback.status}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
              <span>{feedback.mentorRole}</span>
              {feedback.company && (
                <>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span className="text-[var(--text-muted)] flex items-center gap-1">
                    <Building2 className="w-3 h-3 inline" />
                    {feedback.company}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Rating and Date */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
          <FeedbackRating rating={feedback.rating} size="sm" />
          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {feedback.date}
          </span>
        </div>
      </div>

      {/* Target Project / Course Context */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
          Topic:
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-primary)] font-semibold border border-[var(--border)]">
          {feedback.relatedProjectId ? (
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          )}
          {feedback.relatedProjectTitle || feedback.relatedCourseTitle || 'General Capstone'}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20">
          {feedback.category}
        </span>
      </div>

      {/* Summary narrative */}
      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
        {feedback.summary || feedback.feedback}
      </p>

      {/* Strengths & Improvements preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-xs">
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Key Strengths</span>
            </div>
            <p className="text-[var(--text-secondary)] line-clamp-1 text-xs">
              {feedback.strengths[0]}
            </p>
          </div>
        )}

        {feedback.improvementAreas && feedback.improvementAreas.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Improvement Focus</span>
            </div>
            <p className="text-[var(--text-secondary)] line-clamp-1 text-xs">
              {feedback.improvementAreas[0]}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Row: Skills Tagged & Action Items Indicator */}
      <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(feedback.skillsTagged || []).slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]"
            >
              #{skill}
            </span>
          ))}
          {(feedback.skillsTagged || []).length > 3 && (
            <span className="text-[10px] text-[var(--text-muted)]">
              +{(feedback.skillsTagged || []).length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
          {totalActions > 0 && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
              <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
              {completedActions} / {totalActions} actions
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            Details
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
