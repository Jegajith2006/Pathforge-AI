import React from 'react';
import { RoadmapPhase } from './RoadmapPhase';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';

export const RoadmapTimeline = ({
  phases = [],
  expandedPhases = {},
  onToggleExpand,
  onOpenDetails,
  onAdvanceStep,
  viewMode = 'timeline', // 'timeline' | 'compact'
}) => {
  if (!phases || phases.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
        <p className="text-sm">No roadmap phases match the current filter.</p>
      </div>
    );
  }

  // Compact View: Stacked phase cards
  if (viewMode === 'compact') {
    return (
      <div id="roadmap-compact-grid" className="space-y-4">
        {phases.map((phase) => (
          <RoadmapPhase
            key={phase.id}
            phase={phase}
            isExpanded={Boolean(expandedPhases[phase.id])}
            onToggleExpand={() => onToggleExpand(phase.id)}
            onOpenDetails={onOpenDetails}
            onAdvanceStep={onAdvanceStep}
            viewMode="compact"
          />
        ))}
      </div>
    );
  }

  // Timeline View: Vertical connected roadmap
  return (
    <div id="roadmap-timeline-container" className="relative space-y-8 pl-10 sm:pl-16">
      {/* Continuous Vertical Timeline Connector Line */}
      <div
        className="absolute top-8 bottom-8 left-[19px] sm:left-[31px] w-0.5 bg-[var(--border)] transition-colors"
        aria-hidden="true"
      >
        {/* Dynamic completed/active progress gradient overlay on the connector line */}
        <div
          className="w-full bg-gradient-to-b from-emerald-500 via-indigo-500 to-transparent transition-all duration-700"
          style={{
            height: '42%',
          }}
        />
      </div>

      {phases.map((phase, index) => {
        const isCompleted = phase.status === 'Completed';
        const isInProgress = phase.status === 'In Progress';
        const isUpcoming = phase.status === 'Upcoming' || phase.status === 'Locked';

        return (
          <div key={phase.id} className="relative group">
            {/* Timeline Node Indicator Circle */}
            <div
              className={`absolute -left-10 sm:-left-16 top-5 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border-2 transition-all duration-300 z-10 ${
                isCompleted
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20'
                  : isInProgress
                  ? 'bg-indigo-600 border-white text-white ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-600/30 animate-pulse'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <span className="font-mono">{String(phase.phaseNumber).padStart(2, '0')}</span>
              )}
            </div>

            {/* Phase Card Component */}
            <RoadmapPhase
              phase={phase}
              isExpanded={Boolean(expandedPhases[phase.id])}
              onToggleExpand={() => onToggleExpand(phase.id)}
              onOpenDetails={onOpenDetails}
              onAdvanceStep={onAdvanceStep}
              viewMode="timeline"
            />
          </div>
        );
      })}
    </div>
  );
};

export default RoadmapTimeline;
