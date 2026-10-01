import React from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Percent,
  Sparkles,
} from 'lucide-react';

/**
 * SkillGapSummary Component
 * Displays 4 KPI cards synthesizing total skills evaluated, verified strengths,
 * priority gaps, and aggregate role coverage.
 */
export const SkillGapSummary = ({
  totalSkills = 12,
  strongCount = 4,
  priorityGapsCount = 3,
  coverageScore = 61,
}) => {
  const cards = [
    {
      id: 'evaluated',
      label: 'Skills Evaluated',
      value: `${totalSkills} Skills`,
      subtext: 'Mapped against ML Engineer hiring rubric',
      trend: '100% evaluated',
      trendType: 'neutral',
      icon: Layers,
      color: 'indigo',
    },
    {
      id: 'strong',
      label: 'Strong Skills',
      value: `${strongCount} Skills`,
      subtext: 'Meets or exceeds market expectations',
      trend: 'Ready for production',
      trendType: 'positive',
      icon: CheckCircle2,
      color: 'emerald',
    },
    {
      id: 'priority',
      label: 'Priority Gaps',
      value: `${priorityGapsCount} Skills`,
      subtext: 'Require immediate learning sprint focus',
      trend: 'Critical for role',
      trendType: 'warning',
      icon: AlertTriangle,
      color: 'amber',
    },
    {
      id: 'coverage',
      label: 'Overall Skill Coverage',
      value: `${coverageScore}%`,
      subtext: 'Target minimum hiring threshold is 78%',
      trend: '+4% this month',
      trendType: 'positive',
      icon: TrendingUp,
      color: 'cyan',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        // Visual icon styling
        const iconStyles = {
          indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        }[card.color];

        const trendStyles = {
          positive: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
          warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
          neutral: 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)]',
        }[card.trendType];

        return (
          <div
            key={card.id}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
          >
            {/* Top row: Icon & Status / Trend Indicator */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className={`p-2.5 rounded-xl border ${iconStyles}`}>
                <Icon className="w-5 h-5" />
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border font-semibold ${trendStyles}`}>
                {card.trend}
              </span>
            </div>

            {/* Middle: Main Value and Label */}
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {card.value}
              </div>
              <div className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">
                {card.label}
              </div>
            </div>

            {/* Bottom Supporting text */}
            <p className="text-[11px] text-[var(--text-muted)] mt-3 pt-2.5 border-t border-[var(--border)] leading-normal">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default SkillGapSummary;
