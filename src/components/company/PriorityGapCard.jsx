import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  FolderGit2,
  GitFork,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../common/Button';

/**
 * PriorityGapCard component
 * Displays prioritized critical skill gaps with actionable multi-path navigation.
 */
export const PriorityGapCard = ({
  gaps = [],
  companyName = 'Target Company',
  className = '',
}) => {
  if (!gaps || gaps.length === 0) return null;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>CRITICAL ROADBLOCKS</span>
          </div>
          <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
            Priority Gaps to Close
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Key missing or developing skills that have the highest negative drag on your {companyName} hiring score.
          </p>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold self-start sm:self-auto">
          {gaps.length} Urgent Gaps
        </span>
      </div>

      {/* Gaps List */}
      <div className="space-y-4">
        {gaps.map((gap, index) => (
          <div
            key={gap.id || index}
            className="p-5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-rose-500/30 transition-all space-y-3.5"
          >
            {/* Title & Priority */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center text-xs font-bold font-mono">
                  #{index + 1}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-display">
                  {gap.skill}
                </h4>
                {gap.category && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border)]">
                    {gap.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  Gap: -{gap.gap}%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold uppercase">
                  {gap.priority || 'High'} Priority
                </span>
              </div>
            </div>

            {/* Proficiency visual indicator */}
            <div className="space-y-1.5 py-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--text-secondary)]">
                  Current Level: <strong className="text-[var(--text-primary)]">{gap.currentLevel}%</strong>
                </span>
                <span className="text-[var(--text-muted)]">
                  Required Bar: <strong className="text-[var(--text-primary)]">{gap.requiredLevel}%</strong>
                </span>
              </div>
              <div className="w-full bg-[var(--surface-tertiary)] h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-400 h-full rounded-l-full"
                  style={{ width: `${Math.min(100, gap.currentLevel)}%` }}
                />
                <div
                  className="bg-rose-500/30 h-full"
                  style={{ width: `${Math.max(0, Math.min(100, gap.requiredLevel - gap.currentLevel))}%` }}
                />
              </div>
            </div>

            {/* Why It Matters */}
            {gap.whyItMatters && (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <strong className="text-[var(--text-primary)]">Why it matters: </strong>
                {gap.whyItMatters}
              </p>
            )}

            {/* Recommended Next Action */}
            {gap.recommendedAction && (
              <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-[var(--text-primary)]">Action: </strong>
                  {gap.recommendedAction}
                </span>
              </div>
            )}

            {/* Direct Multi-Path Navigation Buttons */}
            <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-[var(--text-muted)] mr-1">
                Close this gap via:
              </span>

              <Link to="/courses">
                <Button variant="outline" size="xs" leftIcon={BookOpen}>
                  Courses
                </Button>
              </Link>

              <Link to="/projects">
                <Button variant="outline" size="xs" leftIcon={FolderGit2}>
                  Projects
                </Button>
              </Link>

              <Link to="/roadmap">
                <Button variant="outline" size="xs" leftIcon={GitFork}>
                  Roadmap
                </Button>
              </Link>

              <Link to="/evidence">
                <Button variant="ghost" size="xs" leftIcon={ShieldCheck}>
                  Add Evidence
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriorityGapCard;
