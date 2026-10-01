import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { readinessData } from '../../data/readinessData';

export const ReadinessScoreCard = () => {
  const navigate = useNavigate();

  const overallScore = readinessData.overallScore || 68;
  const explanation =
    readinessData.summaryExplanation ||
    'Your current profile is progressing well. Strengthening deep learning and deployment skills will improve your readiness.';

  const factors = Object.values(readinessData.factors);

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
      {/* Top Section */}
      <div>
        {/* 1. Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono block">
                AI Evaluation Engine
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display leading-tight">
                Career Readiness
              </h2>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono whitespace-nowrap">
            Career Readiness Score: {overallScore}%
          </span>
        </div>

        {/* 2 & 3. Circular Readiness Chart & External Readiness Level Badge */}
        <div className="flex flex-col items-center justify-center pt-2">
          {/* Circular Readiness Chart: contains only 68% and READINESS SCORE centered */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center max-w-full">
            <ProgressRing
              score={overallScore}
              size={180}
              strokeWidth={12}
              label="READINESS SCORE"
            />
          </div>

          {/* 3. Readiness Level Badge: completely outside the chart in normal document flow */}
          {/* Spacing from chart to badge: 14px (mt-3.5) */}
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono tracking-wide shadow-xs">
            Readiness Level: Developing
          </div>
        </div>

        {/* 4. Divider (spacing: badge to divider 24px via mt-6, divider to factor cards 18px via pt-4.5) */}
        <div className="mt-6 pt-4.5 border-t border-[var(--border)]">
          {/* 5. Four Factor Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {factors.map((factor) => (
              <div
                key={factor.label || factor.name}
                className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]"
              >
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[var(--text-secondary)] truncate">
                    {factor.label || factor.name}
                  </span>
                  <span className={`font-bold font-mono ${factor.textColor}`}>
                    {factor.score}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${factor.color} transition-all duration-700 ease-out`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Short Explanation Box */}
        <div className="mt-4 p-3 rounded-xl bg-[var(--surface-secondary)]/70 border border-[var(--border)] text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2.5">
          <TrendingUp className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
          <p>{explanation}</p>
        </div>
      </div>

      {/* 7. View Readiness Details Button */}
      <div className="pt-5">
        <button
          type="button"
          onClick={() => navigate('/readiness')}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-xs hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer group"
        >
          <span>View Readiness Details</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
};

export default ReadinessScoreCard;
