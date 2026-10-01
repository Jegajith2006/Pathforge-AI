import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, Map, Clock, Zap, TrendingUp } from 'lucide-react';
import { readinessData } from '../../data/readinessData';

export const NextBestAction = () => {
  const navigate = useNavigate();

  const action = readinessData.nextBestAction || {
    title: 'Complete Deep Learning Specialization',
    recommendedModule: 'Neural Network Architectures & PyTorch Foundations',
    estimatedTime: '3 hours remaining',
    impact: '+8 Readiness Points',
    status: 'High Priority',
    priority: 'High',
  };

  const title = action.title || 'Complete Deep Learning Specialization';
  const moduleName =
    action.recommendedModule || 'Neural Network Architectures & PyTorch Foundations';
  const estimatedTime = action.estimatedTime || '3 hours remaining';
  const impact = action.impact || '+8 Readiness Points';
  const status = action.status || 'High Priority';

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-50/50 via-[var(--surface)] to-[var(--surface)] dark:from-indigo-950/20 dark:via-[var(--surface)] dark:to-[var(--surface)] border-2 border-indigo-500/30 dark:border-indigo-500/40 p-6 shadow-sm hover:border-indigo-500/50 transition-all duration-200">
      {/* Decorative subtle ambient corner badge */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
              AI Recommendation
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono">
            <Zap className="w-3 h-3" />
            {status}
          </span>
        </div>

        {/* Card Title */}
        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display tracking-tight">
          {title}
        </h2>

        {/* Recommended Module Statement */}
        <div className="mt-3 p-3.5 rounded-xl bg-[var(--surface)] border border-indigo-500/20 shadow-xs space-y-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
            Recommended Module:
          </span>
          <p className="text-sm sm:text-base font-semibold text-[var(--text-primary)] leading-snug">
            {moduleName}
          </p>
        </div>

        {/* Action Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          <div className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Estimated Time
            </span>
            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5">
              {estimatedTime}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              Status
            </span>
            <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 truncate mt-0.5 font-mono">
              {status}
            </p>
          </div>

          <div className="col-span-2 p-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Impact:
            </span>
            <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {impact}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer group"
        >
          <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
          <span>Start Learning</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/roadmap')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border)] transition-colors duration-150 cursor-pointer"
        >
          <Map className="w-4 h-4 text-indigo-500" />
          <span>View Roadmap</span>
        </button>
      </div>
    </div>
  );
};

export default NextBestAction;
