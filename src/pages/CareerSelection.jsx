import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { mockCareerRoles } from '../data/mockData';
import {
  Compass,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const CareerSelection = () => {
  const { activeCareer, changeActiveCareer } = useApp();
  const [search, setSearch] = useState('');
  const [justSwitched, setJustSwitched] = useState(null);

  const filteredRoles = search
    ? mockCareerRoles.filter(
        (role) =>
          role.title.toLowerCase().includes(search.toLowerCase()) ||
          role.description.toLowerCase().includes(search.toLowerCase()) ||
          role.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
      )
    : mockCareerRoles;

  const handleSelectRole = (title) => {
    changeActiveCareer(title);
    setJustSwitched(title);
    setTimeout(() => setJustSwitched(null), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Trajectory Selection"
        description="Select and calibrate your target AI engineering profession to re-align your skill gaps, course roadmaps, and employer readiness models."
        badge="Adaptive Intelligence"
        badgeVariant="cyan"
      />

      {/* Confirmation feedback when switched */}
      {justSwitched && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>
              Target Trajectory recalibrated to <strong>{justSwitched}</strong>. All roadmap milestones, skill gap deltas, and company rubrics have been updated!
            </span>
          </div>
        </div>
      )}

      {/* Search & Active Goal Banner */}
      <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4 shadow-sm shadow-slate-900/5 dark:shadow-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search careers, skills, or titles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
            <span>Currently Active:</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400 font-display px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
              {activeCareer}
            </span>
          </div>
        </div>
      </div>

      {/* Career Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => {
          const isCurrentActive = activeCareer === role.title;

          return (
            <div
              key={role.id}
              className={`
                p-6
                rounded-2xl
                transition-all
                duration-200
                flex
                flex-col
                justify-between
                relative
                overflow-hidden
                shadow-sm
                shadow-slate-900/5
                dark:shadow-slate-950/40
                ${
                  isCurrentActive
                    ? 'bg-[var(--card-bg)] border-2 border-cyan-500 shadow-lg ring-1 ring-cyan-500/30'
                    : 'bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-indigo-500/40'
                }
              `}
            >
              {isCurrentActive && (
                <div className="absolute top-0 right-0 bg-cyan-500 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Current Target</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {role.difficulty || role.category}
                  </span>
                  {!isCurrentActive && (
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {role.currentMatch || role.matchScore}% Match
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
                  {role.title}
                </h3>

                <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                  {role.description}
                </p>

                {/* Salary & Demand metrics */}
                <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block font-medium">Avg Base Comp</span>
                    <span className="font-bold text-[var(--text-primary)] font-mono mt-0.5 block">
                      {role.avgSalary || role.averageSalary}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block font-medium">Market Demand</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5 block">
                      {role.demandGrowth || role.jobGrowth}
                    </span>
                  </div>
                </div>

                {/* Core Skills Chips */}
                <div className="mt-4">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1.5 font-medium">
                    Critical Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(role.skills || role.topSkills || []).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-[var(--border)]">
                {isCurrentActive ? (
                  <Button
                    variant="cyan"
                    size="sm"
                    fullWidth
                    leftIcon={CheckCircle2}
                    disabled
                  >
                    Active Trajectory
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSelectRole(role.title)}
                    variant="outline"
                    size="sm"
                    fullWidth
                    rightIcon={ArrowRight}
                  >
                    Set as Target Trajectory
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CareerSelection;
