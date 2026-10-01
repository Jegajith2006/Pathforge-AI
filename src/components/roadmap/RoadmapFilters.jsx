import React from 'react';
import {
  GitFork,
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const RoadmapFilters = ({
  activeFilter = 'all',
  onFilterChange,
  viewMode = 'timeline',
  onViewModeChange,
  counts = { all: 5, completed: 1, 'in-progress': 1, upcoming: 3 },
}) => {
  const filterOptions = [
    { id: 'all', label: 'All Phases', count: counts.all },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'in-progress', label: 'In Progress', count: counts['in-progress'] },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
  ];

  return (
    <div
      id="roadmap-filters-bar"
      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 sm:p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs transition-colors"
    >
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none">
        {filterOptions.map((option) => {
          const isActive = activeFilter === option.id;
          return (
            <button
              key={option.id}
              id={`filter-phase-${option.id}`}
              type="button"
              onClick={() => onFilterChange(option.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30'
                  : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <span>{option.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* View Mode Toggle: Timeline vs Compact */}
      <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-xl border border-[var(--border)] shrink-0 self-end sm:self-auto">
        <button
          id="view-mode-timeline-btn"
          type="button"
          onClick={() => onViewModeChange('timeline')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'timeline'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title="Full Connected Timeline View"
        >
          <GitFork className="w-3.5 h-3.5 text-indigo-500" />
          <span>Timeline View</span>
        </button>

        <button
          id="view-mode-compact-btn"
          type="button"
          onClick={() => onViewModeChange('compact')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'compact'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title="Stacked Cards Compact View"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-500" />
          <span>Compact View</span>
        </button>
      </div>
    </div>
  );
};

export default RoadmapFilters;
