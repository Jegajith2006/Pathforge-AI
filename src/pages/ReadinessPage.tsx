import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { CareerReadinessRing } from '../components/dashboard/CareerReadinessRing';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Building,
  Target,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReadinessPage: React.FC = () => {
  const { user } = useAuth();
  const score = user?.readinessScore ?? user?.overallReadiness ?? 69;

  const readinessTiers = [
    { name: 'Exploring', range: '0 - 40%', desc: 'Foundational baseline & coursework in progress.' },
    { name: 'Emerging', range: '41 - 65%', desc: 'Solid technical concepts with emerging projects.' },
    { name: 'Job Ready', range: '66 - 84%', desc: 'Meets competitive hiring bar for associate & mid roles.', active: true },
    { name: 'High Potential', range: '85 - 100%', desc: 'Exceeds standard benchmarks with senior-level artifacts.' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Career Readiness Index & Factor Decomposition"
        subtitle="Multi-factor machine-learning score synthesizing verified competencies, curriculum progress, and proof of work."
        badge="Job Readiness Engine"
      />

      {/* Hero Visual: Large Meter & Decomposed Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col justify-between">
          <CareerReadinessRing
            score={score}
            skillMatch={70}
            learningProgress={60}
            practicalEvidence={80}
            targetRole={user?.targetCareer || 'Data Analyst'}
          />
        </div>

        {/* Detailed Explanation of Score */}
        <div className="lg:col-span-6 bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Tier Classification: Job Ready
              </span>
            </div>

            <h3 className="text-xl font-bold text-white font-display">
              What your 69 / 100 readiness index indicates:
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Your profile is positioned in the <strong>Job Ready (top 28th percentile)</strong> bracket for associate to mid-level Data Analyst positions. You possess validated strengths in EDA, Python, and data cleaning, supported by an 80% practical evidence score.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Primary Factor Weights in Formula:
              </span>
              <div className="flex items-center justify-between text-slate-300">
                <span>1. Verified Skill Match (40% weight):</span>
                <strong className="text-white">70% Match</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>2. Curriculum Completion (25% weight):</span>
                <strong className="text-white">60% Progress</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>3. Practical Evidence Quality (35% weight):</span>
                <strong className="text-emerald-400">80% Verified</strong>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Next Tier Target: <strong>85% (High Potential)</strong>
            </span>
            <Link
              to="/app/roadmap"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Resume Sprints <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Readiness Categories Horizontal Scale */}
      <div className="bg-[#151C2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white font-display mb-4">
          Readiness Classification Spectrum
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {readinessTiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-4 rounded-xl border transition-all ${
                tier.active
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-2 ring-indigo-500/20'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{tier.name}</span>
                <span className={`text-[10px] font-bold ${tier.active ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {tier.range}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                {tier.desc}
              </p>
              {tier.active && (
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                  Current Level: Level 3
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* "What employers think of this profile" - AI Synthesis Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#151C2E] via-[#1A2238] to-[#151C2E] border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Employer Rubric Perception
              </span>
              <span className="text-xs text-slate-400">
                Simulated by hiring models from Spotify, Google, and Stripe
              </span>
            </div>

            <h3 className="text-xl font-bold text-white font-display">
              “Strong data munging & reproducible code; ready for customer telemetry work once SQL window functions are verified.”
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> What Hiring Managers Love:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Clean GitHub documentation, verified EDA repository with testable statistical outputs, and proactive mentor code review cycles.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> What Might Pause an Offer:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Lack of complex multi-table SQL queries and missing interactive BI dashboard (Tableau/PowerBI) in live public portfolio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
