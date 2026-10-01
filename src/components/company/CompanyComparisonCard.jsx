import React from 'react';
import {
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ReadinessBadge } from './ReadinessBadge';
import { Button } from '../common/Button';

/**
 * CompanyComparisonCard component
 * Renders individual opportunity comparison card in grid view.
 */
export const CompanyComparisonCard = ({
  opportunity,
  isSelected = false,
  onSelect,
  onViewDetails,
  className = '',
}) => {
  if (!opportunity) return null;

  const {
    company,
    role,
    logoText,
    location,
    salaryRange,
    matchScore = 0,
    readinessLevel,
    requiredSkills = [],
    priorityGaps = [],
  } = opportunity;

  const matchedSkills = requiredSkills.filter((s) => s.status === 'Matched' || s.status === 'Close Match');

  return (
    <div
      className={`
        p-5
        sm:p-6
        rounded-2xl
        bg-[var(--card-bg)]
        border
        transition-all
        duration-200
        flex
        flex-col
        justify-between
        space-y-4
        relative
        group
        ${
          isSelected
            ? 'border-indigo-500 shadow-md shadow-indigo-950/20 ring-1 ring-indigo-500/40'
            : 'border-[var(--card-border)] hover:border-indigo-500/40 shadow-sm'
        }
        ${className}
      `}
    >
      {/* Active Selection Pin Indicator */}
      {isSelected && (
        <span className="absolute -top-2.5 right-5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
          Active Benchmark
        </span>
      )}

      {/* Top Row: Company & Score */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-600 text-white font-extrabold font-display flex items-center justify-center text-base shadow-sm shrink-0">
              {logoText || company.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                {company}
              </h3>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">
                {role}
              </p>
            </div>
          </div>

          {/* Match Score Display */}
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black font-display text-indigo-600 dark:text-cyan-400">
                {matchScore}%
              </span>
            </div>
            <ReadinessBadge tier={readinessLevel} score={matchScore} size="xs" />
          </div>
        </div>

        {/* Location & Salary */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)] pt-1">
          {location && (
            <span className="flex items-center gap-1 bg-[var(--surface-secondary)] px-2 py-0.5 rounded border border-[var(--border)]">
              <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="truncate max-w-[150px]">{location}</span>
            </span>
          )}
          {salaryRange && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <DollarSign className="w-3 h-3" />
              <span>{salaryRange.split('+')[0].trim()}</span>
            </span>
          )}
        </div>

        {/* Matched Skills Chips */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Matched Competencies ({matchedSkills.length})</span>
          </span>
          <div className="flex flex-wrap gap-1">
            {matchedSkills.slice(0, 3).map((s) => (
              <span
                key={s.id || s.name}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20"
              >
                {s.name}
              </span>
            ))}
            {matchedSkills.length > 3 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-muted)]">
                +{matchedSkills.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Priority Gaps Chips */}
        {priorityGaps.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Priority Gaps ({priorityGaps.length})</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {priorityGaps.slice(0, 2).map((g) => (
                <span
                  key={g.id || g.skill}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20"
                >
                  {g.skill} (-{g.gap}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
        <Button
          variant={isSelected ? 'secondary' : 'cyan'}
          size="xs"
          onClick={() => onSelect?.(opportunity)}
          className="flex-1"
        >
          {isSelected ? 'Active Target' : 'Benchmark Fit'}
        </Button>

        <Button
          variant="outline"
          size="xs"
          onClick={() => onViewDetails?.(opportunity)}
          rightIcon={ExternalLink}
          title="Inspect full role spec and rubrics"
        >
          Spec
        </Button>
      </div>
    </div>
  );
};

export default CompanyComparisonCard;
