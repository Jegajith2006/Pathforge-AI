import React from 'react';
import {
  BrainCircuit,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  Percent,
  CheckCircle2,
} from 'lucide-react';

/**
 * SkillGapHeader Component
 * Executive header for the Skill Intelligence command center.
 * Features target career indicator, telemetry meta counters, and simulated AI re-analysis.
 */
export const SkillGapHeader = ({
  targetRole = 'Machine Learning Engineer',
  lastAnalyzed = 'September 12, 2026 · 10:45 AM',
  totalSkills = 12,
  overallCoverage = 61,
  onReanalyze,
  isReanalyzing = false,
}) => {
  return (
    <div className="p-5 sm:p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
      {/* Top row: Status Badge & Target Role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI skill analysis</span>
          </span>

          <span className="text-xs text-[var(--text-muted)] font-mono hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-mono">
            <span>Target Role:</span>
            <strong className="text-[var(--text-primary)] font-bold">{targetRole}</strong>
          </div>
        </div>

        {/* Re-analyze Action Button */}
        <button
          onClick={onReanalyze}
          disabled={isReanalyzing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white shadow-sm shadow-indigo-600/30 active:scale-[0.98] transition-all self-start sm:self-auto cursor-pointer"
          aria-label="Re-run AI competency gap analysis"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
          <span>{isReanalyzing ? 'Calibrating Telemetry...' : 'Re-analyze Skills'}</span>
        </button>
      </div>

      {/* Main Title and Description */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Skill Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
          Understand where your current abilities stand against the skills required for your target career. Diagnostic deltas compare your verified mastery against senior industry benchmarks.
        </p>
      </div>

      {/* Meta Telemetry Bar */}
      <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Last analyzed:</span>
          <span className="font-mono font-medium text-[var(--text-primary)]">{lastAnalyzed}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Skills analyzed:</span>
          <span className="font-mono font-semibold text-[var(--text-primary)]">{totalSkills} competencies</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-indigo-500" />
          <span>Overall coverage:</span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{overallCoverage}% target match</span>
        </div>
      </div>
    </div>
  );
};

export default SkillGapHeader;
