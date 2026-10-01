import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  GitFork,
  ShieldCheck,
  Building2,
  MessageSquareQuote,
  Compass,
  ArrowRight,
  Zap,
} from 'lucide-react';

/**
 * QuickActions component
 * High-utility shortcuts grid allowing learners to instantly jump into core platform workflows.
 */
export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Analyze Skill Gaps',
      description: 'Run diagnostic review on Python & ML benchmarks',
      icon: BrainCircuit,
      color: 'indigo',
      path: '/skill-gap',
      badge: '18 Tracked',
    },
    {
      title: 'Continue Roadmap Sprint',
      description: 'Milestone 02: Model Evaluation & Validation',
      icon: GitFork,
      color: 'cyan',
      path: '/roadmap',
      badge: 'Sprint 2',
    },
    {
      title: 'Anchor Evidence Proof',
      description: 'Upload GitHub repository hash or CI/CD test log',
      icon: ShieldCheck,
      color: 'emerald',
      path: '/evidence',
      badge: 'Vault',
    },
    {
      title: 'Compare Company Matches',
      description: 'Benchmark skills vs Stripe, Spotify & Google roles',
      icon: Building2,
      color: 'violet',
      path: '/company-match',
      badge: '84% Top Fit',
    },
    {
      title: 'Request Mentor Review',
      description: 'Submit PR for rubric critique by Staff ML Engineers',
      icon: MessageSquareQuote,
      color: 'amber',
      path: '/mentor-feedback',
      badge: '4.8 Avg',
    },
    {
      title: 'Calibrate Career Target',
      description: 'Explore 6 industry roles and salary benchmarks',
      icon: Compass,
      color: 'blue',
      path: '/career-selection',
      badge: 'MLE Track',
    },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
              Quick Actions
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Direct pathways into active learning, proof verification, and career calibration workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              onClick={() => navigate(action.path)}
              className="p-3.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] border border-[var(--border)] hover:border-indigo-500/40 transition-all text-left group flex items-start justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-indigo-600 dark:text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] font-display truncate group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                      {action.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                  {action.badge}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-indigo-600 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
