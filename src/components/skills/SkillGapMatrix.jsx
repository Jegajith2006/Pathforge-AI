import React from 'react';
import { ChevronRight, ArrowUpRight, AlertCircle, Sparkles } from 'lucide-react';
import { SkillPriorityBadge } from './SkillPriorityBadge';
import { SkillComparisonBar } from './SkillComparisonBar';
import { SkillGapCard } from './SkillGapCard';

/**
 * SkillGapMatrix Component
 * Primary analytical matrix comparing user proficiencies against target role requirements.
 * Adapts from a dense, data-rich table on desktop to stacked interactive cards on mobile.
 */
export const SkillGapMatrix = ({
  skills = [],
  selectedSkill = null,
  onSelectSkill = () => {},
  onGeneratePlan,
}) => {
  if (!skills || skills.length === 0) {
    return (
      <div className="p-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center">
        <AlertCircle className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
          No matching competencies found
        </h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
          Try clearing your search query or selecting a different category or priority filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile & Tablet Card Layout (< 1024px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {skills.map((skill) => (
          <SkillGapCard
            key={skill.id}
            skill={skill}
            isSelected={selectedSkill?.id === skill.id}
            onSelect={onSelectSkill}
          />
        ))}
      </div>

      {/* Desktop Structured Table Layout (>= 1024px) */}
      <div className="hidden lg:block overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" role="table">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <th scope="col" className="py-3.5 px-5 font-semibold">Competency</th>
                <th scope="col" className="py-3.5 px-4 font-semibold min-w-[220px]">Proficiency vs Target</th>
                <th scope="col" className="py-3.5 px-4 font-semibold text-center">Gap</th>
                <th scope="col" className="py-3.5 px-4 font-semibold">Importance</th>
                <th scope="col" className="py-3.5 px-4 font-semibold">Priority Status</th>
                <th scope="col" className="py-3.5 px-4 font-semibold text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {skills.map((skill) => {
                const isSelected = selectedSkill?.id === skill.id;
                return (
                  <tr
                    key={skill.id}
                    onClick={() => onSelectSkill(skill)}
                    className={`group cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--surface-active)]'
                        : 'hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    {/* Competency Name & Category */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {skill.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                          {skill.category}
                        </span>
                      </div>
                    </td>

                    {/* Comparison Bar */}
                    <td className="py-4 px-4">
                      <SkillComparisonBar
                        currentScore={skill.currentScore}
                        requiredScore={skill.requiredScore}
                        gap={skill.gap}
                        status={skill.status}
                        showLabels={true}
                        compact={true}
                      />
                    </td>

                    {/* Gap Percentage */}
                    <td className="py-4 px-4 text-center">
                      {skill.gap > 0 ? (
                        <span className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          -{skill.gap}%
                        </span>
                      ) : (
                        <span className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          0%
                        </span>
                      )}
                    </td>

                    {/* Importance */}
                    <td className="py-4 px-4">
                      <span className={`font-semibold text-xs ${
                        skill.importance === 'Critical'
                          ? 'text-rose-600 dark:text-rose-400'
                          : skill.importance === 'High'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-[var(--text-secondary)]'
                      }`}>
                        {skill.importance}
                      </span>
                    </td>

                    {/* Priority & Status */}
                    <td className="py-4 px-4">
                      <SkillPriorityBadge priority={skill.priority} type="priority" size="xs" />
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-4 text-right pr-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSkill(skill);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--surface-secondary)] hover:bg-indigo-600 hover:text-white text-[var(--text-primary)] border border-[var(--border)] transition-all shadow-xs"
                        aria-label={`Inspect ${skill.name} learning plan`}
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SkillGapMatrix;
