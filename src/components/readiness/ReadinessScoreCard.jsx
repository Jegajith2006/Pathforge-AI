import React from 'react';
import {
  TrendingUp,
  Award,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { getReadinessLevelDetails } from '../../utils/readinessCalculator';

export const ReadinessScoreCard = ({
  score = 68,
  previousScore = 61,
  scoreDelta = '+7 points this month',
  lastCalculated = '2026-09-11',
  summaryExplanation = '',
  factors = [],
}) => {
  const levelDetails = getReadinessLevelDetails(score);

  // SVG Gauge calculations
  const radius = 70;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] shadow-md shadow-slate-900/5 dark:shadow-slate-950/40 relative overflow-hidden">
      {/* Decorative ambient subtle background blur */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
        {/* Left: Circular Animated Score Gauge */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg
              height={radius * 2 + 10}
              width={radius * 2 + 10}
              className="transform -rotate-90"
            >
              {/* Background Track */}
              <circle
                stroke="currentColor"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius + 5}
                cy={radius + 5}
                className="text-[var(--surface-secondary)]"
              />
              {/* Value Stroke */}
              <circle
                stroke={levelDetails.color}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius + 5}
                cy={radius + 5}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Score Center Label */}
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-4xl sm:text-5xl font-extrabold font-display text-[var(--text-primary)] tracking-tight">
                {score}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                out of 100
              </span>
            </div>
          </div>

          {/* Score Momentum Badge */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{scoreDelta}</span>
          </div>
        </div>

        {/* Right: Explainable Summary & Tier Assessment */}
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            <Badge
              variant={levelDetails.variant || 'indigo'}
              size="md"
              className="px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            >
              Level: {levelDetails.label}
            </Badge>

            <span className="px-2.5 py-1 rounded-md bg-[var(--surface-secondary)] text-[var(--text-secondary)] text-xs font-mono border border-[var(--border)]">
              {levelDetails.tier}
            </span>

            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Audited: {lastCalculated}
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]">
              Ready for Associate & Mid-Level ML Roles
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mt-2 max-w-2xl">
              {summaryExplanation || levelDetails.description}
            </p>
          </div>

          {/* Explainability Breakdown Pill Row */}
          <div className="pt-3 border-t border-[var(--border)]">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Factor Contribution Weights</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-left">
              {factors.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-xl bg-[var(--surface-secondary)]/70 border border-[var(--border)] flex flex-col justify-between"
                >
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono truncate">
                    {f.name}
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      {f.score}%
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                      wt {f.weight}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
