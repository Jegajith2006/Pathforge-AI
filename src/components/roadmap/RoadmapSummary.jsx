import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Target,
  CalendarClock,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const RoadmapSummary = ({
  overallProgress = 42,
  completedTasks = 18,
  totalTasks = 45,
  currentPhaseTitle = 'Machine Learning Core',
  estimatedCompletion = '6 months',
}) => {
  const cards = [
    {
      id: 'summary-progress',
      title: 'Overall Progress',
      value: `${overallProgress}%`,
      supportingText: 'Weighted across 5 sequential roadmap phases',
      badge: '+15% this sprint',
      badgeType: 'positive',
      icon: TrendingUp,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: 'summary-tasks',
      title: 'Completed Tasks',
      value: `${completedTasks} of ${totalTasks}`,
      supportingText: 'Verified courses, labs & project deliverables',
      badge: '3 in active sprint',
      badgeType: 'neutral',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'summary-phase',
      title: 'Current Phase',
      value: currentPhaseTitle,
      supportingText: 'Phase 2 of 5 · Model Evaluation focus',
      badge: 'Active Sprint',
      badgeType: 'active',
      icon: Target,
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 'summary-completion',
      title: 'Estimated Completion',
      value: estimatedCompletion,
      supportingText: 'Targeting junior to mid-level ML engineer candidacy',
      badge: 'Velocity High',
      badgeType: 'positive',
      icon: CalendarClock,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
    },
  ];

  return (
    <div
      id="roadmap-summary-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs hover:border-[var(--border-strong)] transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${card.iconBg}`}
              >
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>

              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  card.badgeType === 'positive'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : card.badgeType === 'active'
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)]'
                }`}
              >
                {card.badge}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--text-muted)] tracking-wide uppercase font-mono block">
                {card.title}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold font-display text-[var(--text-primary)] tracking-tight truncate">
                {card.value}
              </div>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                {card.supportingText}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoadmapSummary;
