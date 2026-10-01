import React from 'react';
import {
  CheckCircle2,
  Code2,
  Flame,
  BrainCircuit,
  ShieldCheck,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const ReadinessStrengths = ({ strengths = [] }) => {
  const iconMap = {
    Code2: Code2,
    CheckCircle2: CheckCircle2,
    Flame: Flame,
    BrainCircuit: BrainCircuit,
    ShieldCheck: ShieldCheck,
  };

  return (
    <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display text-[var(--text-primary)]">
              Verified Candidate Strengths
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Concrete assets backed by code artifacts, test logs, and Staff Engineer reviews.
            </p>
          </div>
        </div>
        <Badge variant="success" size="sm" className="font-mono text-[10px]">
          {strengths.length} Verified
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {strengths.map((str) => {
          const IconComp = iconMap[str.icon] || CheckCircle2;

          return (
            <div
              key={str.id}
              className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-display">
                      {str.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">
                      {str.explanation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                  {str.skill}
                </span>

                <span className="truncate max-w-[200px] text-right italic font-medium">
                  Ref: {str.evidence}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
