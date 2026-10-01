import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, Sparkles, ArrowUpRight } from 'lucide-react';

export const EvidenceSummary = ({
  total = 12,
  verified = 8,
  pending = 3,
  portfolioReady = 6,
}) => {
  const verifiedPercentage = total > 0 ? Math.round((verified / total) * 100) : 0;
  const portfolioPercentage = total > 0 ? Math.round((portfolioReady / total) * 100) : 0;

  const cards = [
    {
      id: 'total',
      title: 'Total Evidence',
      value: total,
      unit: 'Items',
      description: 'Accredited proofs deposited in vault',
      trend: '100% On File',
      icon: ShieldCheck,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      accentColor: 'from-indigo-500/10 to-transparent',
    },
    {
      id: 'verified',
      title: 'Verified Proofs',
      value: verified,
      unit: 'Items',
      description: `${verifiedPercentage}% passed code / rubric audit`,
      trend: 'High Integrity',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      accentColor: 'from-emerald-500/10 to-transparent',
    },
    {
      id: 'pending',
      title: 'Pending Review',
      value: pending,
      unit: 'Items',
      description: 'Under evaluation by mentors / automated CI',
      trend: 'In Queue',
      icon: Clock,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      accentColor: 'from-amber-500/10 to-transparent',
    },
    {
      id: 'portfolio',
      title: 'Portfolio Ready',
      value: portfolioReady,
      unit: 'Items',
      description: `${portfolioPercentage}% primed for recruiter view`,
      trend: 'Public Ready',
      icon: Sparkles,
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      accentColor: 'from-cyan-500/10 to-transparent',
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
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.accentColor} rounded-bl-full pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity`}
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
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold font-display text-[var(--text-primary)] tracking-tight">
                  {card.value}
                </span>
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  {card.unit}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                  {card.trend}
                </span>
                <span className="text-[var(--text-muted)] truncate text-[11px]">
                  {card.description}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EvidenceSummary;
