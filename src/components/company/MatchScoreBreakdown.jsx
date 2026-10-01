import React from 'react';
import {
  HelpCircle,
  Cpu,
  Target,
  FolderGit2,
  ShieldCheck,
  MessageSquareQuote,
  Sparkles,
  Info,
} from 'lucide-react';
import { ProgressBar } from '../common/ProgressBar';

/**
 * MatchScoreBreakdown component
 * Transparent, explainable breakdown of how the role match score is derived across 5 weighted categories.
 */
export const MatchScoreBreakdown = ({
  scoreBreakdown = [],
  totalScore = 0,
  className = '',
}) => {
  const categoryIcons = {
    'Core Technical Skills': Cpu,
    'Role-Specific Skills': Target,
    'Practical Projects': FolderGit2,
    'Evidence Strength': ShieldCheck,
    'Communication and Readiness': MessageSquareQuote,
  };

  return (
    <div
      className={`
        p-6
        rounded-2xl
        bg-[var(--card-bg)]
        border
        border-[var(--card-border)]
        space-y-6
        shadow-sm
        transition-colors
        duration-200
        ${className}
      `}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 dark:text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXPLAINABLE ALGORITHM RUBRIC</span>
          </div>
          <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
            Match Score Breakdown
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Transparent weighting showing how your competencies, evidence, and projects compute the {totalScore}% total match.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] self-start sm:self-auto">
          <span>Weighted Sum:</span>
          <span className="font-bold text-cyan-600 dark:text-cyan-400">{totalScore}%</span>
        </div>
      </div>

      {/* Category Breakdown Rows */}
      <div className="space-y-4">
        {scoreBreakdown.map((item) => {
          const Icon = categoryIcons[item.category] || Target;
          return (
            <div
              key={item.category}
              className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2.5 transition-all hover:border-indigo-500/30"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-indigo-600 dark:text-cyan-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] font-display">
                      {item.category}
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Weight: {item.weight}% of Total Score
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Performance</span>
                    <span className="font-bold text-[var(--text-primary)]">{item.score}%</span>
                  </div>
                  <div className="text-left sm:text-right pl-3 border-l border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Contribution</span>
                    <span className="font-extrabold text-indigo-600 dark:text-cyan-400">
                      +{item.contribution}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-1 pt-1">
                <ProgressBar
                  value={item.score}
                  max={100}
                  height="h-1.5"
                  variant={item.score >= 75 ? 'emerald' : item.score >= 60 ? 'indigo' : 'amber'}
                />
              </div>

              {/* Rationale / Explanation */}
              {item.explanation && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                  <span>{item.explanation}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanatory Footer Note */}
      <div className="p-3.5 rounded-xl bg-indigo-500/5 dark:bg-cyan-500/5 border border-indigo-500/15 dark:border-cyan-500/15 flex items-start gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
        <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-[var(--text-primary)]">Why this matters: </strong>
          The match score is an explainable estimate based on your current skills, projects, evidence, and readiness signals. As you complete recommended courses and submit verified portfolio artifacts, category scores refresh dynamically.
        </p>
      </div>
    </div>
  );
};

export default MatchScoreBreakdown;
