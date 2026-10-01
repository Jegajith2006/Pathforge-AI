import React from 'react';
import { mockHowItWorksSteps } from '../../data/mockData';
import { SectionHeading } from '../common/SectionHeading';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Adaptive Career Methodology"
          title="How PathForge AI Powers Your Trajectory"
          description="A self-correcting 6-step loop engineered to turn raw effort into verified, industry-ready engineering competence."
        />

        {/* 6 Steps Grid with Step Connectors */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {mockHowItWorksSteps.map((step, idx) => (
            <div
              key={step.step}
              className="
                relative
                p-6
                sm:p-7
                rounded-2xl
                bg-[var(--surface)]
                border
                border-[var(--border)]
                dark:bg-[#0E1326]
                dark:border-slate-800/80
                hover:border-cyan-500/50
                shadow-xs
                hover:shadow-lg
                dark:hover:shadow-cyan-950/20
                transition-all
                duration-300
                group
                flex
                flex-col
                justify-between
              "
            >
              <div>
                {/* Step number badge & icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-black text-slate-400 dark:text-slate-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {step.step}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] dark:bg-slate-800/60 dark:border-slate-700/60 flex items-center justify-center text-[var(--text-muted)] group-hover:text-cyan-600 dark:group-hover:text-cyan-300 group-hover:border-cyan-500/40 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display group-hover:text-cyan-600 dark:group-hover:text-cyan-200 transition-colors">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Progress connector indicator */}
              <div className="mt-6 pt-3 border-t border-[var(--border)] dark:border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                <span>Phase {idx + 1} of 6</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Automated recs</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
