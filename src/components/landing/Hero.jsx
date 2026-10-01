import React from 'react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { CareerOrbit } from './CareerOrbit';
import { ArrowRight, Compass, ShieldCheck, Cpu, Check } from 'lucide-react';

export const Hero = () => {
  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    const el = document.querySelector('#how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 overflow-hidden">
      {/* Background radial spotlights: subtle in light mode, deeper in dark mode */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-500/10 via-cyan-400/5 to-transparent dark:from-indigo-600/20 dark:via-cyan-500/10 dark:to-transparent rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-violet-600/10 rounded-full blur-[90px] sm:blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Value Prop & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Tagline / Eyebrow Badge */}
            <div className="inline-flex items-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-500/30 shadow-2xs dark:shadow-lg dark:shadow-cyan-950/40">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                <span>AI-Powered Career Intelligence</span>
              </span>
            </div>

            {/* Primary Hero Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] font-display tracking-tight leading-[1.12]">
              Build the skills that move your career forward.
            </h1>

            {/* Supporting Value Proposition Text */}
            <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              PathForge AI turns your current skills, career goals, learning activity, and project evidence into a personalized roadmap for becoming career-ready.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Button
                to="/register"
                variant="primary"
                size="lg"
                rightIcon={ArrowRight}
                className="w-full sm:w-auto shadow-md hover:shadow-lg dark:shadow-xl dark:shadow-indigo-950/60"
              >
                Start Your Career Journey
              </Button>
              <Button
                onClick={scrollToHowItWorks}
                variant="secondary"
                size="lg"
                leftIcon={Compass}
                className="w-full sm:w-auto"
              >
                Explore How It Works
              </Button>
            </div>

            {/* Trust-Style Metric Row */}
            <div className="pt-8 border-t border-[var(--border)] grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--text-primary)] font-display">
                  <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>Personalized</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">Adaptive Roadmaps</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--text-primary)] font-display">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Evidence-Based</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">Verified Progress</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--text-primary)] font-display">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Explainable</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">Readiness Score</p>
              </div>
            </div>
          </div>

          {/* Right Column: Career Intelligence Orbit Visual */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <CareerOrbit />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
