import React from 'react';
import { TrendingUp, Clock, Flame, CheckCircle2, ArrowUpRight } from 'lucide-react';

export const ProgressSummary = ({
  overallProgress = 42,
  overallProgressChange = '+12% compared with last month',
  learningHours = 86,
  learningHoursChange = '+8 hrs this week',
  currentStreak = 7,
  currentStreakChange = 'Personal record: 14 days',
  completedItems = 18,
  completedItemsChange = '9 courses, 5 projects, 4 assessments',
}) => {
  const cards = [
    {
      id: 'overall-progress',
      title: 'Overall Progress',
      value: `${overallProgress}%`,
      supportingText: overallProgressChange,
      trend: '+12%',
      trendPositive: true,
      icon: TrendingUp,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      accentColor: 'from-indigo-500/20 to-transparent',
    },
    {
      id: 'learning-hours',
      title: 'Learning Hours',
      value: `${learningHours} hours`,
      supportingText: learningHoursChange,
      trend: '+8 hrs',
      trendPositive: true,
      icon: Clock,
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      accentColor: 'from-cyan-500/20 to-transparent',
    },
    {
      id: 'current-streak',
      title: 'Current Streak',
      value: `${currentStreak} days`,
      supportingText: currentStreakChange,
      trend: 'Record: 14d',
      trendPositive: true,
      icon: Flame,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      accentColor: 'from-amber-500/20 to-transparent',
    },
    {
      id: 'completed-items',
      title: 'Completed Items',
      value: `${completedItems} items`,
      supportingText: completedItemsChange,
      trend: '+3 this mo',
      trendPositive: true,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      accentColor: 'from-emerald-500/20 to-transparent',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            className="relative overflow-hidden p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm hover:border-indigo-500/30 transition-all group"
          >
            {/* Ambient subtle gradient glow on hover */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.accentColor} rounded-bl-full pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity`}
            />

            <div className="relative z-10 flex items-start justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${card.iconBg}`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="relative z-10 mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-[var(--text-primary)] tracking-tight">
                {card.value}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {card.trend}
                </span>
                <span className="text-[var(--text-muted)] truncate text-[11px]">
                  {card.supportingText}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressSummary;
