import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Hero } from '../components/landing/Hero';
import { FeatureCard } from '../components/landing/FeatureCard';
import { HowItWorks } from '../components/landing/HowItWorks';
import { SectionHeading } from '../components/common/SectionHeading';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Logo } from '../components/common/Logo';
import { mockFeatureCards } from '../data/mockData';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Award,
  ShieldCheck,
  BrainCircuit,
  Lock,
  Compass,
} from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Fixed Navigation Bar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* A. Hero Section with Career Intelligence Orbit */}
        <Hero />

        {/* B. How PathForge AI Works (6 Steps) */}
        <HowItWorks />

        {/* C. Core Feature Cards Section */}
        <section id="features" className="py-20 bg-[var(--surface-secondary)]/50 dark:bg-[#0A0E1C]/60 border-y border-[var(--border)] dark:border-slate-800/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              badge="Intelligence Engine"
              title="Architected for High-Impact Career Acceleration"
              description="Eliminate the guesswork of skill development with targeted diagnostics, verified evidence loops, and direct employer matching."
            />

            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockFeatureCards.map((feat, idx) => (
                <FeatureCard key={feat.title} feature={feat} index={idx} />
              ))}
            </div>
          </div>
        </section>

        {/* D. Career Journey Visualization Section */}
        <section id="career-orbit" className="py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-indigo-50/80 via-white to-cyan-50/80 dark:from-[#0E1326] dark:via-[#141B34] dark:to-[#0E1326] border border-indigo-200/80 dark:border-indigo-500/25 rounded-3xl p-8 sm:p-12 shadow-xl dark:shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <Badge variant="cyan" dot size="sm">
                    Verified Trajectory
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display leading-tight text-[var(--text-primary)]">
                    From Baseline Assessment to Hired ML Engineer
                  </h2>
                  <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                    Most platforms dump hours of passive video lectures onto learners. PathForge AI models your actual cognitive mastery, validates testable repository code, and dynamically adapts your sprint priority.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <Button to="/register" variant="primary" size="md" rightIcon={ArrowRight}>
                      Start Diagnostic Assessment
                    </Button>
                    <Button to="/login" variant="secondary" size="md">
                      Preview Demo Workspace
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="space-y-3">
                    {[
                      {
                        stage: 'Stage 1: Diagnostic Baseline',
                        desc: 'Objective gap scoring across Python, Math & Data modeling.',
                        badge: 'Automated',
                        color: 'text-indigo-600 dark:text-indigo-400',
                      },
                      {
                        stage: 'Stage 2: Adaptive Curriculum Sprints',
                        desc: 'High-yield modules with zero redundant busywork.',
                        badge: 'Dynamic',
                        color: 'text-cyan-600 dark:text-cyan-400',
                      },
                      {
                        stage: 'Stage 3: Evidence Vault & CI Audits',
                        desc: 'Automated unit tests and reproducible production pipelines.',
                        badge: 'Cryptographic',
                        color: 'text-emerald-600 dark:text-emerald-400',
                      },
                      {
                        stage: 'Stage 4: Senior Mentor Rubric Validation',
                        desc: 'Staff ML Engineer code reviews and hiring benchmarks.',
                        badge: 'Human Review',
                        color: 'text-amber-600 dark:text-amber-400',
                      },
                    ].map((item) => (
                      <div
                        key={item.stage}
                        className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] dark:bg-[#0B0F20]/80 dark:border-slate-800/80 flex items-center justify-between gap-4 shadow-2xs"
                      >
                        <div>
                          <p className={`text-xs font-bold font-display ${item.color}`}>
                            {item.stage}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)] shrink-0">
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E. Benefits Section */}
        <section id="readiness-engine" className="py-20 bg-[var(--surface-secondary)]/40 dark:bg-[#090D1A] border-b border-[var(--border)] dark:border-transparent relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              badge="Why PathForge AI"
              title="Engineered for Serious Career Transitions"
              description="Move past standard resume fluff with quantifiable, audit-grade proof of engineering mastery."
            />

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border)] dark:bg-[#0E1326] dark:border-slate-800/80 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
                  Zero Generic Advice
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Every recommendation is grounded in live market data, required frameworks, and the exact delta between your codebase and company hiring rubrics.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border)] dark:bg-[#0E1326] dark:border-slate-800/80 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                <div className="p-3 w-fit rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
                  Tamper-Evident Evidence Vault
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Hiring managers don't trust static PDF certificates. PathForge links testable GitHub commits, test percentiles, and live inference endpoints.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border)] dark:bg-[#0E1326] dark:border-slate-800/80 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                <div className="p-3 w-fit rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
                  Explainable 0–100 Readiness
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Clear factor decomposition shows whether low scores stem from missing mathematics, slow sprint velocity, or insufficient project artifacts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* F. Final Call-to-Action Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-indigo-50/90 via-white to-slate-50 dark:from-[#13192F] dark:to-[#0E1326] border border-indigo-200/80 dark:border-indigo-500/30 shadow-xl dark:shadow-2xl dark:shadow-indigo-950/40 space-y-6">
              <Badge variant="cyan" dot size="sm">
                Take the Next Step
              </Badge>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-[var(--text-primary)] tracking-tight">
                Your skills. Your path. Your future.
              </h2>

              <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
                Join ambitious engineers and analysts using PathForge AI to target Machine Learning, Data Analytics, and Cloud engineering careers.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  to="/register"
                  variant="primary"
                  size="lg"
                  rightIcon={ArrowRight}
                  className="w-full sm:w-auto"
                >
                  Start Your Career Journey
                </Button>
                <Button
                  to="/login"
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Sign In to Existing Account
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* G. Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] dark:bg-[#060811] py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Logo size="sm" to="/" />
            <span className="text-xs text-[var(--text-muted)]">
              © {new Date().getFullYear()} PathForge AI Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
            <Link to="/login" className="hover:text-[var(--text-primary)] transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-[var(--text-primary)] transition-colors">
              Register
            </Link>
            <Link to="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
              Demo Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
