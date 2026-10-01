import React from 'react';
import { Sparkles, ArrowRight, Zap, Clock, Target, CheckCircle2 } from 'lucide-react';
import { SkillPriorityBadge } from './SkillPriorityBadge';

/**
 * RecommendedSkillAction Component
 * "Where you should focus next"
 * Highlights the top 3 high-leverage skill gaps providing maximum career readiness ROI.
 */
export const RecommendedSkillAction = ({
  recommendations = [],
  onSelectSkill,
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="priority-focus-title">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 id="priority-focus-title" className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Where you should focus next
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Top 3 highest-leverage competency gaps calibrated for maximum employer readiness ROI.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
          Ranked by Readiness Delta
        </span>
      </div>

      {/* 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            onClick={() => onSelectSkill && onSelectSkill(rec)}
            className="group relative p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-indigo-500/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
          >
            {/* Top Rank Badge and Gap Indicator */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center font-mono shadow-sm shadow-indigo-600/30">
                    {rec.rank}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
                    Priority #{rec.rank}
                  </span>
                </div>

                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  -{rec.gap}% gap
                </span>
              </div>

              {/* Title & Reason */}
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5">
                {rec.name}
              </h3>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                {rec.reason}
              </p>

              {/* Action Blueprint Box */}
              <div className="p-3 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] mb-4 space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Target className="w-3 h-3 text-indigo-500" />
                  <span>Recommended Action</span>
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                  {rec.nextAction}
                </div>
              </div>
            </div>

            {/* Bottom Meta & Trigger */}
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="font-medium text-[11px]">{rec.estimatedTime}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                  <Zap className="w-3.5 h-3.5" />
                  <span>+{rec.readinessImpact} pts</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                <span>Inspect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedSkillAction;
