import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  FolderGit2,
  GitFork,
  ShieldCheck,
  MessageSquareQuote,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../common/Button';

/**
 * RecommendedActionList component
 * Displays prioritized sequence of action items tailored to the selected role.
 */
export const RecommendedActionList = ({
  recommendations = [],
  companyName = 'Company',
  roleTitle = 'Role',
  className = '',
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  const pageIcons = {
    Courses: BookOpen,
    Projects: FolderGit2,
    Roadmap: GitFork,
    'Evidence Vault': ShieldCheck,
    'Mentor Feedback': MessageSquareQuote,
  };

  return (
    <div
      className={`
        p-6
        rounded-2xl
        bg-[var(--card-bg)]
        border
        border-[var(--card-border)]
        space-y-5
        shadow-sm
        transition-colors
        duration-200
        ${className}
      `}
    >
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-4 space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 dark:text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ACCELERATION ROADMAP</span>
        </div>
        <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
          Recommended Actions
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Prioritized sequence of steps to close gaps and qualify for {roleTitle} at {companyName}.
        </p>
      </div>

      {/* Action Items */}
      <div className="space-y-3">
        {recommendations.map((item, idx) => {
          const Icon = pageIcons[item.relatedPage] || Sparkles;
          return (
            <div
              key={item.id || idx}
              className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-500/20 flex items-center justify-center text-xs font-bold font-mono shrink-0 mt-0.5">
                  {idx + 1}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-display">
                      {item.title}
                    </h4>
                    {item.relatedPage && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border)]">
                        <Icon className="w-3 h-3 text-indigo-500 dark:text-cyan-400" />
                        <span>{item.relatedPage}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              </div>

              {/* Navigation Action */}
              {item.relatedRoute && (
                <Link to={item.relatedRoute} className="self-end sm:self-center shrink-0">
                  <Button variant="outline" size="xs" rightIcon={ArrowRight}>
                    {item.actionLabel || 'Execute'}
                  </Button>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedActionList;
