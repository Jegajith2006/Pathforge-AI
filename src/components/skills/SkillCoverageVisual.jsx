import React from 'react';
import { Layers, CheckCircle2, TrendingUp } from 'lucide-react';

/**
 * SkillCoverageVisual Component
 * Renders an aggregate category coverage visual breakdown comparing user competency
 * versus target benchmark across all core disciplines.
 */
export const SkillCoverageVisual = ({
  categoryData = [],
  overallCoverage = 61,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
              Category Competency Coverage
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Aggregate domain mastery mapped against Machine Learning Engineer benchmarks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-[var(--surface-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
          <span className="text-xs text-[var(--text-secondary)]">Overall Coverage:</span>
          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {overallCoverage}%
          </span>
        </div>
      </div>

      {/* Categories Grid Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryData.map((item) => {
          const gap = Math.max(0, item.requiredScore - item.userScore);
          const isTargetMet = item.userScore >= item.requiredScore;

          return (
            <div
              key={item.category}
              className="p-4 rounded-xl bg-[var(--surface-secondary)]/40 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                  {item.category}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {item.count} {item.count === 1 ? 'skill' : 'skills'}
                </span>
              </div>

              {/* Multi-tier progress indicator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--text-secondary)]">
                    Current: <strong className="text-[var(--text-primary)]">{item.userScore}%</strong>
                  </span>
                  <span className="text-[var(--text-muted)]">
                    Target: {item.requiredScore}%
                  </span>
                </div>

                {/* Bar */}
                <div className="relative w-full h-2 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTargetMet
                        ? 'bg-emerald-500'
                        : gap > 25
                        ? 'bg-rose-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, item.userScore)}%` }}
                  />
                  {/* Required Target Tick */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-600 dark:bg-slate-300"
                    style={{ left: `${Math.min(100, item.requiredScore)}%` }}
                  />
                </div>
              </div>

              {/* Status pill */}
              <div className="flex items-center justify-between text-[10px] pt-1">
                {isTargetMet ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Target Achieved
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Gap: -{gap}%
                  </span>
                )}
                <span className="font-mono text-[var(--text-muted)]">
                  {Math.round((item.userScore / item.requiredScore) * 100)}% fit
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillCoverageVisual;
