import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Target, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const ReadinessPriorityGaps = ({ priorityGaps = [] }) => {
  const navigate = useNavigate();

  // Fallback to standardized gaps if empty
  const gaps =
    priorityGaps && priorityGaps.length > 0
      ? priorityGaps
      : [
          {
            id: 'gap-1',
            skill: 'Model Deployment & Serving',
            currentScore: 36,
            targetScore: 75,
            requiredScore: 75,
            gap: 39,
            gapPercentage: 39,
            priority: 'High',
            impact: 'High',
            recommendedAction:
              'Build and containerize a high-concurrency FastAPI inference service with Docker and Prometheus metrics.',
            route: '/skill-gap',
          },
          {
            id: 'gap-2',
            skill: 'Deep Learning & PyTorch',
            currentScore: 42,
            targetScore: 80,
            requiredScore: 80,
            gap: 38,
            gapPercentage: 38,
            priority: 'High',
            impact: 'High',
            recommendedAction:
              'Complete the neural network architecture and train a transformer-based sequence classifier.',
            route: '/courses',
          },
          {
            id: 'gap-3',
            skill: 'Advanced Statistics & Calibration',
            currentScore: 55,
            targetScore: 80,
            requiredScore: 80,
            gap: 25,
            gapPercentage: 25,
            priority: 'Medium',
            impact: 'Medium',
            recommendedAction:
              'Implement Platt scaling or isotonic regression for reliable confidence calibration before production serving.',
            route: '/skill-gap',
          },
        ];

  return (
    <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display text-[var(--text-primary)]">
              Priority Gaps Holding Back Your Career Readiness
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Addressing these high-impact skill deficiencies will advance your readiness toward target machine learning roles and improve your career readiness score.
            </p>
          </div>
        </div>
        <Badge variant="warning" size="sm" className="font-mono text-[10px] self-start sm:self-auto shrink-0">
          {gaps.length} Critical
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {gaps.map((gap) => {
          const current = Number(gap.currentScore) || 0;
          const target = Number(gap.targetScore || gap.requiredScore) || 80;
          const gapPoints = Math.max(0, target - current);
          const isHigh = gap.priority === 'High' || gap.impact === 'High';

          return (
            <div
              key={gap.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                isHigh
                  ? 'bg-rose-500/[0.03] dark:bg-rose-950/10 border-rose-500/25 hover:border-rose-500/40'
                  : 'bg-amber-500/[0.03] dark:bg-amber-950/10 border-amber-500/25 hover:border-amber-500/40'
              }`}
            >
              <div className="space-y-3">
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                      isHigh
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {gap.priority || gap.impact || 'High'} Priority
                  </span>

                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                    {gapPoints}-point gap
                  </span>
                </div>

                {/* Skill Name */}
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] font-display">
                    {gap.skill}
                  </h4>
                </div>

                {/* Dual Progress Bar: Current vs Target */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                    <span>Current: <strong className="text-[var(--text-primary)]">{current}%</strong></span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-indigo-500" />
                      Target: <strong className="text-indigo-600 dark:text-indigo-400">{target}%</strong>
                    </span>
                  </div>

                  {/* Visual Dual Indicator Bar */}
                  <div className="relative w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden border border-[var(--border)]">
                    {/* Target benchmark range indicator (light dashed/tinted) */}
                    <div
                      className="absolute top-0 bottom-0 bg-indigo-500/20 border-r-2 border-indigo-500"
                      style={{ width: `${Math.min(100, target)}%` }}
                    />
                    {/* Current achieved progress */}
                    <div
                      className={`absolute top-0 bottom-0 rounded-full transition-all duration-700 ease-out ${
                        isHigh ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, current)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-0.5">
                    <span>{gapPoints} percentage points remaining</span>
                  </div>
                </div>

                {/* Recommended Action */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1">
                  {gap.recommendedAction}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-[var(--border)]">
                <Button
                  onClick={() => navigate(gap.route || '/skill-gap')}
                  variant="outline"
                  size="sm"
                  rightIcon={ArrowUpRight}
                  className={`w-full text-xs h-8.5 font-medium transition-colors ${
                    isHigh
                      ? 'border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10'
                      : 'border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  {gap.route === '/courses' ? 'Start Learning' : 'Resolve Gap'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
