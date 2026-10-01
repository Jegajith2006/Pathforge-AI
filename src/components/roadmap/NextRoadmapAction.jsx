import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Play,
  ArrowRight,
  Clock,
  Layers,
  Award,
  Zap,
  BookOpen,
} from 'lucide-react';

export const NextRoadmapAction = ({
  actionTitle = 'Complete the Model Evaluation and Validation module.',
  relatedPhase = 'Machine Learning Core',
  phaseId = 'phase-2',
  estimatedTime = '45 minutes',
  skillImproved = 'Model Evaluation',
  readinessImpact = 4,
  priority = 'High',
  onViewDetails,
}) => {
  const navigate = useNavigate();

  const handleStartAction = () => {
    navigate('/courses?selected=model-evaluation');
  };

  return (
    <div
      id="next-roadmap-action-card"
      className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent bg-[var(--surface)] border border-indigo-500/30 dark:border-indigo-500/40 shadow-xs relative overflow-hidden transition-all"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        {/* Left Info */}
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20" />
              Your Next Roadmap Action
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Priority: {priority}
            </span>

            <span className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Est. {estimatedTime}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-display text-[var(--text-primary)] tracking-tight">
            {actionTitle}
          </h3>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              <span>
                Related phase:{' '}
                <strong className="text-[var(--text-primary)] font-medium">
                  {relatedPhase}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Skill improved:{' '}
                <strong className="text-[var(--text-primary)] font-medium">
                  {skillImproved}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <Award className="w-3.5 h-3.5" />
              <span>Readiness impact: +{readinessImpact} points</span>
            </div>
          </div>
        </div>

        {/* Right CTA Buttons */}
        <div className="flex flex-row items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            id="start-next-roadmap-action-btn"
            type="button"
            onClick={handleStartAction}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Start Action
          </button>

          <button
            id="view-next-action-details-btn"
            type="button"
            onClick={() => onViewDetails?.(phaseId)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-colors"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NextRoadmapAction;
