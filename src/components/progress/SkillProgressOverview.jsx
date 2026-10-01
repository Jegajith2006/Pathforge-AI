import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, Filter, Sparkles, Layers } from 'lucide-react';
import { mockSkillProgressDevelopment } from '../../data/mockData';

const TARGET_BENCHMARKS = {
  Python: 85,
  'Machine Learning': 75,
  SQL: 70,
  Statistics: 65,
  'Deep Learning': 60,
  'Model Deployment': 65,
};

export const SkillProgressOverview = () => {
  const [sortBy, setSortBy] = useState('highest');

  const skillsData = (mockSkillProgressDevelopment || []).map((s) => ({
    name: s.name,
    category: s.category,
    current: s.currentScore || s.current || 0,
    previous: s.previousScore || s.previous || 0,
    target: TARGET_BENCHMARKS[s.name] || 80,
    change: s.change || (s.currentScore ? s.currentScore - (s.previousScore || 0) : 5),
    color: s.color || '#6366f1',
  }));

  const sortedSkills = [...skillsData].sort((a, b) => {
    if (sortBy === 'highest') return b.current - a.current;
    if (sortBy === 'lowest') return a.current - b.current;
    if (sortBy === 'improvement') return b.change - a.change;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-5">
      {/* Header and Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">
            Skill Development
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Calibrated benchmark competencies compared with target role requirements.
          </p>
        </div>

        {/* Sort Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            aria-label="Sort skills by"
          >
            <option value="highest">Highest Progress</option>
            <option value="improvement">Largest Improvement</option>
            <option value="lowest">Lowest Progress</option>
            <option value="name">Skill Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedSkills.map((skill) => {
          return (
            <div
              key={skill.name}
              className="p-4 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] hover:border-indigo-500/30 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-primary)] font-display">
                      {skill.name}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-muted)]">
                      {skill.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Previous: <span className="font-mono">{skill.previous}%</span> • Target:{' '}
                    <span className="font-mono">{skill.target}%</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-base font-extrabold font-mono text-[var(--text-primary)]">
                    {skill.current}%
                  </span>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />+{skill.change}%
                  </span>
                </div>
              </div>

              {/* Progress Bar with milestone marker */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${skill.current}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>0%</span>
                  <span>Target: {skill.target}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillProgressOverview;
