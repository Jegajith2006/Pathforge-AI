import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  FolderGit2,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const ReadinessImprovementPlan = ({ improvementPlan = [] }) => {
  const navigate = useNavigate();

  const categoryIcons = {
    Project: FolderGit2,
    Course: BookOpen,
    Evidence: ShieldCheck,
  };

  return (
    <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display text-[var(--text-primary)]">
              Ranked Action Plan to Reach 85%+ Readiness
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              High-leverage tasks prioritized by point impact on hiring committees.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          +17 Total Points Potential
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {improvementPlan.map((plan, index) => {
          const IconComp = categoryIcons[plan.category] || FolderGit2;

          return (
            <div
              key={plan.id}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <IconComp className="w-4.5 h-4.5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-[var(--card-bg)] border border-[var(--border)] text-[10px] font-mono font-bold flex items-center justify-center text-[var(--text-muted)]">
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] font-display">
                      {plan.title}
                    </h4>
                    <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                      {plan.category}
                    </Badge>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] max-w-xl leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] pt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {plan.expectedImpact}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {plan.estimatedTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="self-end sm:self-center shrink-0">
                <Button
                  onClick={() => navigate(plan.actionRoute || '/projects')}
                  variant="primary"
                  size="sm"
                  rightIcon={ArrowRight}
                  className="text-xs h-9 px-4 whitespace-nowrap"
                >
                  {plan.actionLabel || 'Get Started'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
