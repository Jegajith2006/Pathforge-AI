import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  FolderGit2,
  Flame,
  ShieldCheck,
  MessageSquareQuote,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { Button } from '../common/Button';

export const ReadinessBreakdown = ({ factors = [] }) => {
  const navigate = useNavigate();

  const factorIcons = {
    'skill-coverage': BrainCircuit,
    'practical-projects': FolderGit2,
    'learning-consistency': Flame,
    'evidence-strength': ShieldCheck,
    'mentor-feedback': MessageSquareQuote,
  };

  const factorColors = {
    'skill-coverage': {
      bar: 'indigo',
      glow: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400',
    },
    'practical-projects': {
      bar: 'cyan',
      glow: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400',
    },
    'learning-consistency': {
      bar: 'amber',
      glow: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
    },
    'evidence-strength': {
      bar: 'violet',
      glow: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
    },
    'mentor-feedback': {
      bar: 'emerald',
      glow: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
            Score Composition & Explainability
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Understand how each engineering dimension contributes to your weighted 68% readiness benchmark.
          </p>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--surface-secondary)] px-3 py-1 rounded-lg border border-[var(--border)] self-start sm:self-auto">
          Formula: ∑(Score × Weight) / 100
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {factors.map((factor) => {
          const IconComponent = factorIcons[factor.id] || BrainCircuit;
          const styling = factorColors[factor.id] || factorColors['skill-coverage'];

          return (
            <div
              key={factor.id}
              className="p-5 sm:p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] hover:border-indigo-500/30 shadow-xs transition-all flex flex-col justify-between gap-4"
            >
              {/* Header: Title, Weight Badge, Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${styling.glow} flex items-center justify-center shrink-0`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[var(--text-primary)] font-display">
                        {factor.name}
                      </h4>
                      <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                        {factor.weight}% Weight
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {factor.shortExplanation}
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline sm:flex-col sm:items-end justify-between gap-1 shrink-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                      {factor.score}%
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      ({((factor.score * factor.weight) / 100).toFixed(1)} pts)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                    {factor.score >= 80
                      ? 'Exceeds Benchmark'
                      : factor.score >= 65
                      ? 'Meets Baseline'
                      : 'Needs Reinforcement'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <ProgressBar
                  value={factor.score}
                  max={100}
                  variant={styling.bar}
                  size="md"
                  showLabel={false}
                />
              </div>

              {/* Detailed Breakdown Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                {/* Current Contributing Data */}
                <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Contributing Data & Proof</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {factor.contributingData}
                  </p>
                </div>

                {/* How to improve */}
                <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Path to Target Mastery</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {factor.howToImprove}
                  </p>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-3 border-t border-[var(--border)]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span>Direct source:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {factor.relatedPageName}
                  </span>
                </div>

                <Button
                  onClick={() => navigate(factor.relatedRoute)}
                  variant="outline"
                  size="sm"
                  rightIcon={ArrowRight}
                  className="text-xs self-end sm:self-auto h-8 px-3"
                >
                  View In {factor.relatedPageName}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
