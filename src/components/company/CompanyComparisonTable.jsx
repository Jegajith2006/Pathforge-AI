import React from 'react';
import { ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { ReadinessBadge } from './ReadinessBadge';
import { Button } from '../common/Button';

/**
 * CompanyComparisonTable component
 * Tabular view for high-density comparison of company opportunities.
 */
export const CompanyComparisonTable = ({
  opportunities = [],
  selectedId,
  onSelect,
  onViewDetails,
  className = '',
}) => {
  if (!opportunities || opportunities.length === 0) return null;

  return (
    <div
      className={`
        rounded-2xl
        bg-[var(--card-bg)]
        border
        border-[var(--card-border)]
        overflow-hidden
        shadow-sm
        ${className}
      `}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Company & Role</th>
              <th className="py-3.5 px-4 font-semibold">Location / Salary</th>
              <th className="py-3.5 px-4 font-semibold">Match Score</th>
              <th className="py-3.5 px-4 font-semibold">Readiness Tier</th>
              <th className="py-3.5 px-4 font-semibold">Top Matched Skills</th>
              <th className="py-3.5 px-4 font-semibold">Priority Gap</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
            {opportunities.map((opp) => {
              const isSelected = selectedId === opp.id;
              const matched = opp.requiredSkills.filter(
                (s) => s.status === 'Matched' || s.status === 'Close Match'
              );
              const topGap = opp.priorityGaps?.[0];

              return (
                <tr
                  key={opp.id}
                  className={`
                    hover:bg-[var(--surface-hover)]
                    transition-colors
                    ${isSelected ? 'bg-indigo-500/5 dark:bg-cyan-500/5' : ''}
                  `}
                >
                  {/* Company & Role */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-600 text-white font-bold font-display flex items-center justify-center text-xs shrink-0">
                        {opp.logoText || opp.company.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-[var(--text-primary)] block font-display">
                          {opp.company}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">
                          {opp.role}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Location & Salary */}
                  <td className="py-4 px-4 font-mono text-[11px]">
                    <span className="block text-[var(--text-primary)] truncate max-w-[130px]">
                      {opp.location}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                      {opp.salaryRange?.split('+')[0].trim()}
                    </span>
                  </td>

                  {/* Match Score */}
                  <td className="py-4 px-4">
                    <span className="text-base font-extrabold font-display text-indigo-600 dark:text-cyan-400">
                      {opp.matchScore}%
                    </span>
                  </td>

                  {/* Readiness Tier */}
                  <td className="py-4 px-4">
                    <ReadinessBadge tier={opp.readinessLevel} score={opp.matchScore} size="xs" />
                  </td>

                  {/* Matched Skills */}
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {matched.slice(0, 2).map((s) => (
                        <span
                          key={s.id || s.name}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20"
                        >
                          {s.name}
                        </span>
                      ))}
                      {matched.length > 2 && (
                        <span className="text-[10px] font-mono text-[var(--text-muted)] self-center">
                          +{matched.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Top Gap */}
                  <td className="py-4 px-4">
                    {topGap ? (
                      <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-medium truncate block max-w-[160px]">
                        {topGap.skill} (-{topGap.gap}%)
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">None</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onSelect?.(opp)}
                        className={`
                          px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer
                          ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
                          }
                        `}
                      >
                        {isSelected ? 'Active' : 'Benchmark'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewDetails?.(opp)}
                        className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyComparisonTable;
