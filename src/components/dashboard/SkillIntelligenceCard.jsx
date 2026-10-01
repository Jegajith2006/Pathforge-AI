import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, Sparkles, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { SkillConstellation } from './SkillConstellation';
import { mockSkillsIntelligence } from '../../data/mockData';

export const SkillIntelligenceCard = () => {
  const navigate = useNavigate();
  const [selectedSkill, setSelectedSkill] = useState(null);

  const skillsList = [
    { id: 'python', name: 'Python', score: 82, target: 90, tier: 'Strong', color: 'emerald' },
    { id: 'ml', name: 'Machine Learning', score: 64, target: 85, tier: 'Developing', color: 'indigo' },
    { id: 'sql', name: 'SQL', score: 58, target: 80, tier: 'Developing', color: 'cyan' },
    { id: 'stats', name: 'Statistics', score: 55, target: 80, tier: 'Developing', color: 'violet' },
    { id: 'deep-learning', name: 'Deep Learning', score: 42, target: 80, tier: 'Priority Gap', color: 'rose' },
    { id: 'deployment', name: 'Model Deployment', score: 36, target: 75, tier: 'Priority Gap', color: 'rose' },
  ];

  const strongestSkill = mockSkillsIntelligence.strongestSkill || 'Python';
  const prioritySkill = mockSkillsIntelligence.prioritySkill || 'Model Deployment';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
              Competency Constellation
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display leading-tight">
              Skill Intelligence
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/skill-gap')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors self-start sm:self-center cursor-pointer"
        >
          <span>View Skill Gap Matrix</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Layout: Visual on left/top, Compact breakdown on right/bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Constellation visual (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-2 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] overflow-hidden">
          <SkillConstellation
            onSelectSkill={(skill) => setSelectedSkill(skill)}
            activeSkillId={selectedSkill?.id}
          />
        </div>

        {/* Compact List & Metrics (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Key Skill Highlights (Strongest & Priority) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Strongest Skill
              </span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {strongestSkill}
              </p>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">82% Mastery</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20">
              <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                Priority Skill
              </span>
              <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-1">
                {prioritySkill}
              </p>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">36% Focus Target</span>
            </div>
          </div>

          {/* Compact skills list with progress */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)] block">
              Core ML Profile Breakdown:
            </span>

            {skillsList.map((skill) => {
              const isSelected = selectedSkill?.name === skill.name;
              return (
                <div
                  key={skill.name}
                  onClick={() => setSelectedSkill(skill)}
                  className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/40 shadow-xs'
                      : 'bg-[var(--surface-secondary)]/60 hover:bg-[var(--surface-secondary)] border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1 font-medium">
                    <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            skill.score >= 75
                              ? '#10b981'
                              : skill.score >= 50
                              ? '#6366f1'
                              : '#ef4444',
                        }}
                      />
                      {skill.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                          skill.score >= 75
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : skill.score >= 50
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {skill.tier}
                      </span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {skill.score}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${skill.score}%`,
                        backgroundColor:
                          skill.score >= 75
                            ? '#10b981'
                            : skill.score >= 50
                            ? '#6366f1'
                            : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick link button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/skill-gap')}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
            >
              <span>Explore complete 18-skill breakdown</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillIntelligenceCard;
