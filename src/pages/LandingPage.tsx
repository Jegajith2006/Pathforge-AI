import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/common/BrandLogo';
import { SkillOrbit } from '../components/dashboard/SkillOrbit';
import {
  ArrowRight,
  Sparkles,
  Target,
  Search,
  GitBranch,
  FileCheck2,
  Award,
  Users,
  Building2,
  CheckCircle2,
  Terminal,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      num: '01',
      title: 'Define your career goal',
      desc: 'Select your target job role (e.g., Data Analyst, ML Engineer, Analytics Engineer) or customize your target benchmarks.',
      icon: Target,
    },
    {
      num: '02',
      title: 'Analyze your current skills',
      desc: 'Ingest your verified coursework, coding repositories, and self-assessments to benchmark baseline competencies.',
      icon: Search,
    },
    {
      num: '03',
      title: 'Discover your skill gaps',
      desc: 'Explainable machine-learning models evaluate missing versus required industry proficiency levels.',
      icon: Sparkles,
    },
    {
      num: '04',
      title: 'Follow your personalized roadmap',
      desc: 'Dynamic, paced milestones assemble courses, projects, and drills designed specifically to close gaps.',
      icon: GitBranch,
    },
    {
      num: '05',
      title: 'Build practical evidence',
      desc: 'Publish GitHub repositories, portfolio dashboards, and test reports directly to your verified Evidence Vault.',
      icon: FileCheck2,
    },
    {
      num: '06',
      title: 'Measure your career readiness',
      desc: 'Track your real-time 0-100% readiness score benchmarked against Tier-1 technology companies.',
      icon: Award,
    },
  ];

  const features = [
    {
      title: 'Explainable Skill Gap Analysis',
      desc: 'Know exactly why a skill is recommended, with current vs target benchmarks and priority weights.',
      badge: 'Transparent ML',
      icon: Sparkles,
      color: 'from-indigo-500 to-sky-500',
    },
    {
      title: 'Personalized Course Recommendations',
      desc: 'Curated modules from top platforms mapped directly to your critical missing technical skills.',
      badge: 'Adaptive Sourcing',
      icon: Zap,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Practical Project Recommendations',
      desc: 'Build enterprise-grade portfolio projects with starter GitHub templates and clear deliverables.',
      badge: 'Portfolio Ready',
      icon: Terminal,
      color: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Adaptive Learning Roadmap',
      desc: 'A responsive milestone timeline that continuously updates as your evidence is submitted and verified.',
      badge: 'Dynamic Pacing',
      icon: GitBranch,
      color: 'from-sky-500 to-blue-500',
    },
    {
      title: 'Evidence-Based Skill Tracking',
      desc: 'Secure Evidence Vault verifying code repos, professional certs, and project reports.',
      badge: 'Proof of Mastery',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Expert Mentor Feedback',
      desc: 'Structured reviews from senior industry architects identifying strengths and tactical improvements.',
      badge: 'Industry Reviews',
      icon: Users,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Career Readiness Score',
      desc: 'A multi-factor index synthesizing skill match (70%), mastery (60%), and practical evidence (80%).',
      badge: 'Quantified Index',
      icon: Award,
      color: 'from-cyan-400 to-indigo-600',
    },
    {
      title: 'Company Skill Comparison',
      desc: 'Direct comparison tables evaluating your verified abilities against real Spotify, Google, and Stripe J.D.s.',
      badge: 'Employer Rubrics',
      icon: Building2,
      color: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#080B16] text-slate-100 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#080B16]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <BrandLogo size="md" showTagline={false} />

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Core Intelligence
            </a>
            <a href="#journey" className="hover:text-white transition-colors">
              Career Journey
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Readiness Framework
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/app"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-950/60 transition-all"
            >
              Launch Command Center
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>AI-Powered Career Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] font-display">
              Build the skills that move your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-violet-400">
                career forward.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              PathForge AI analyzes your skills, identifies career gaps, recommends the right courses and projects, and builds a personalized path toward career readiness.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/app"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-500 hover:opacity-95 shadow-xl shadow-indigo-950/60 transition-all"
              >
                Start Your Journey
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
              >
                Explore How It Works
              </a>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 pt-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Explainable ML
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Evidence
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Industry Benchmarked
              </span>
            </div>
          </div>

          {/* Right Column: Career Intelligence Orbit Visual */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <SkillOrbit careerGoal="Data Analyst" interactive={true} />
          </div>
        </div>
      </section>

      {/* Trusted-by Style Tech Badges */}
      <section className="border-y border-slate-800/80 bg-[#0B0F19]/50 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Trained On Real Industry Career Rubrics
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating competencies expected by modern engineering and analytics teams
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-400 font-display font-bold text-sm">
            <span className="hover:text-white transition-colors">SPOTIFY</span>
            <span className="hover:text-white transition-colors">GOOGLE CLOUD</span>
            <span className="hover:text-white transition-colors">STRIPE</span>
            <span className="hover:text-white transition-colors">MICROSOFT</span>
            <span className="hover:text-white transition-colors">DATABRICKS</span>
            <span className="hover:text-white transition-colors">SNOWFLAKE</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Methodology
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            How PathForge AI Powers Your Growth
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            A continuous, closed-loop machine learning system that transforms fragmented course completions into verified, job-ready market value.
          </p>
        </div>

        {/* 6 Step Horizontal/Grid Process with Connected Lines */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 shadow-xl group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-700 group-hover:text-indigo-400 transition-colors font-display">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-display mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#0B0F19]/60 border-y border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              An AI Career Command Center Built For Excellence
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every card, visual matrix, and predictive model has been designed with mathematical precision to maximize your career velocity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 shadow-xl group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${feat.color} text-white shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white font-display group-hover:text-indigo-300 transition-colors mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Explore Module</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 via-[#151C2E] to-violet-950/40 border border-indigo-500/30 rounded-3xl p-8 sm:p-14 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Start Free Evaluation
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 font-display">
            Ready to forge your personalized path to career readiness?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mt-3 leading-relaxed">
            Enter the Command Center today. Get your baseline readiness score, identify high-priority missing skills, and start verified learning sprints.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-950/60 transition-all"
            >
              Launch Dashboard Now
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080B16] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <BrandLogo size="sm" showTagline={true} />

          <p className="text-center md:text-left">
            © 2025 PathForge AI. Explainable Machine Learning-Based Personalized Learning & Skill Intelligence.
          </p>

          <div className="flex items-center gap-6">
            <Link to="/app" className="hover:text-slate-300 transition-colors">
              Command Center
            </Link>
            <Link to="/app/skills" className="hover:text-slate-300 transition-colors">
              Skills
            </Link>
            <Link to="/app/roadmap" className="hover:text-slate-300 transition-colors">
              Roadmap
            </Link>
            <Link to="/login" className="hover:text-slate-300 transition-colors">
              Auth
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
