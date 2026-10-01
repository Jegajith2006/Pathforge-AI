import React from 'react';
import { ArrowRight, ChevronRight, Zap, Target } from 'lucide-react';
import { SkillPriorityBadge } from './SkillPriorityBadge';
import { SkillComparisonBar } from './SkillComparisonBar';

/**
 * SkillGapCard Component
 * Responsive, interactive card for displaying individual skill gaps.
 * Optimally sized for mobile stacked lists and tablet grids.
 */
export const SkillGapCard = ({
  skill,
  onSelect,
  isSelected = false,
}) => {
  if (!skill) return null;

  return (
    <div
      onClick={() => onSelect && onSelect(skill)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect && onSelect(skill);
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        isSelected
          ? 'bg-[var(--surface-elevated)] border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
          : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] hover:shadow'
      }`}
    >
      {/* Header with Title, Category, and Priority Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--text-muted)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-md border border-[var(--border)]">
              {skill.category}
            </span>
            {skill.importance === 'Critical' && (
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                Critical Requirement
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
            {skill.name}
          </h3>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <SkillPriorityBadge priority={skill.priority} type="priority" size="xs" />
        </div>
      </div>

      {/* Visual Proficiency Comparison Bar */}
      <div className="mb-4">
        <SkillComparisonBar
          currentScore={skill.currentScore}
          requiredScore={skill.requiredScore}
          gap={skill.gap}
          status={skill.status}
          showLabels={true}
        />
      </div>

      {/* Description Snippet */}
      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
        {skill.whyItMatters || skill.description}
      </p>

      {/* Footer with Target Impact and Details Prompt */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold text-[var(--text-primary)]">+{skill.readinessImpact} pts</span>
          <span className="text-[var(--text-muted)] hidden xs:inline">readiness impact</span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
          <span>View Analysis</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

export default SkillGapCard;
