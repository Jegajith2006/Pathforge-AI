import React from 'react';
import {
  MessageSquareQuote,
  Star,
  ListTodo,
  BrainCircuit,
  TrendingUp,
  Award,
} from 'lucide-react';

export const MentorSummary = ({
  totalFeedback = 8,
  averageRating = 4.6,
  openActionItems = 5,
  skillsReviewedCount = 6,
  completionRate = 64,
}) => {
  const cards = [
    {
      id: 'feedback-received',
      title: 'Feedback Received',
      value: `${totalFeedback} Reviews`,
      subtext: 'From Staff & Principal Mentors',
      icon: MessageSquareQuote,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      bgGlow: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      trend: '+2 this week',
    },
    {
      id: 'average-rating',
      title: 'Average Rating',
      value: `${Number(averageRating).toFixed(1)} / 5.0`,
      subtext: 'Hiring Committee standard 4.2+',
      icon: Star,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgGlow: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      trend: 'Top 8% percentile',
    },
    {
      id: 'action-items',
      title: 'Action Items',
      value: `${openActionItems} Open`,
      subtext: `${completionRate}% action items completed`,
      icon: ListTodo,
      iconColor: 'text-cyan-500 dark:text-cyan-400',
      bgGlow: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      trend: '9 verified closed',
    },
    {
      id: 'skills-reviewed',
      title: 'Skills Reviewed',
      value: `${skillsReviewedCount} Skills`,
      subtext: 'Python, ML, MLOps, Statistics',
      icon: BrainCircuit,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgGlow: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      trend: 'All target core skills',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            className={`p-5 rounded-2xl bg-[var(--card-bg)] border ${card.borderColor} shadow-sm shadow-slate-900/5 dark:shadow-slate-950/40 transition-all hover:border-[var(--text-muted)]/30 flex flex-col justify-between gap-3`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl ${card.bgGlow} flex items-center justify-center shrink-0`}
              >
                <IconComponent className={`w-4.5 h-4.5 ${card.iconColor}`} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-[var(--text-primary)] tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {card.subtext}
              </p>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/60 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>{card.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
