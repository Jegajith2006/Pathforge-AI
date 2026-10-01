import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, CheckCircle2, Circle, Clock, ArrowRight, ChevronRight, Lock } from 'lucide-react';
import { mockRoadmapPhases } from '../../data/mockData';

export const RoadmapPreview = () => {
  const navigate = useNavigate();

  const phases = mockRoadmapPhases || [];

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">
                Curriculum Trajectory
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display leading-tight">
                Roadmap Preview
              </h2>
            </div>
          </div>

          <span className="text-xs font-mono text-[var(--text-muted)] self-start sm:self-center">
            Phase 2 of 5 Active
          </span>
        </div>

        {/* Roadmap Timeline List */}
        <div className="relative pl-6 sm:pl-8 space-y-6 my-4">
          {/* Vertical Connector Line */}
          <div className="absolute top-3 bottom-3 left-3 sm:left-4 w-0.5 bg-[var(--border)] -translate-x-1/2" />

          {phases.map((phase, idx) => {
            const isCompleted = phase.status === 'Completed';
            const isInProgress = phase.status === 'In Progress';
            const isUpcoming = phase.status === 'Upcoming';

            return (
              <div
                key={phase.phaseNumber || idx}
                className={`relative flex items-start justify-between gap-4 p-3 rounded-xl transition-all duration-150 ${
                  isInProgress
                    ? 'bg-[var(--accent-soft)] border border-indigo-500/30 shadow-xs'
                    : 'bg-transparent hover:bg-[var(--surface-secondary)]/50'
                }`}
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3 w-6 h-6 rounded-full flex items-center justify-center -translate-x-1/2 text-xs font-bold transition-transform ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isInProgress
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 animate-pulse'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] border-2 border-[var(--border)]'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{phase.phaseNumber}</span>
                  )}
                </div>

                {/* Phase Info */}
                <div className="space-y-1 flex-1 min-w-0 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-muted)]">
                      Phase 0{phase.phaseNumber}
                    </span>
                    <h3
                      className={`text-sm font-bold truncate ${
                        isInProgress
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : isCompleted
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {phase.title}
                    </h3>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                    {phase.description}
                  </p>

                  {/* Active callout if in progress */}
                  {isInProgress && phase.activeModule && (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                      <span>Active: {phase.activeModule}</span>
                    </div>
                  )}
                </div>

                {/* Status & Metrics Badge */}
                <div className="text-right shrink-0 flex flex-col items-end justify-center space-y-1">
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : isInProgress
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {phase.status}
                  </span>

                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                      {phase.duration}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {phase.progress}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Button */}
      <div className="pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => navigate('/roadmap')}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border)] hover:border-indigo-500/30 transition-all duration-150 cursor-pointer group"
        >
          <span>View Full Roadmap</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
        </button>
      </div>
    </div>
  );
};

export default RoadmapPreview;
