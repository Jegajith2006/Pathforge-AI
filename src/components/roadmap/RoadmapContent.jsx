import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mockRoadmapPhases } from '../../data/mockData';
import { RoadmapHeader } from './RoadmapHeader';
import { RoadmapProgressHeader } from './RoadmapProgressHeader';
import { RoadmapSummary } from './RoadmapSummary';
import { NextRoadmapAction } from './NextRoadmapAction';
import { RoadmapFilters } from './RoadmapFilters';
import { RoadmapTimeline } from './RoadmapTimeline';
import { RoadmapDetailsPanel } from './RoadmapDetailsPanel';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';

export const RoadmapContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { activeCareer, user } = useApp() || {};

  // Phases state with localStorage persistence or mock data fallback
  const [phases, setPhases] = useState(() => {
    try {
      const saved = localStorage.getItem('pathforge_roadmap_phases');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return mockRoadmapPhases;
  });

  // Filter and view state
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'compact'

  // Expanded phases map: Phase 2 expanded by default
  const [expandedPhases, setExpandedPhases] = useState({
    'phase-2': true,
  });

  // Selected phase for Details Modal / Panel
  const [selectedPhase, setSelectedPhase] = useState(null);

  // Recalculating loading state
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pathforge_roadmap_phases', JSON.stringify(phases));
    } catch {
      // ignore
    }
  }, [phases]);

  // Deep linking via URL query param e.g. /roadmap?selected=phase-2
  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (selectedId) {
      const targetPhase = phases.find((p) => p.id === selectedId);
      if (targetPhase) {
        setSelectedPhase(targetPhase);
        setExpandedPhases((prev) => ({ ...prev, [selectedId]: true }));
      }
    }
  }, [searchParams, phases]);

  // Filtered phases computation
  const filteredPhases = useMemo(() => {
    if (statusFilter === 'all') return phases;
    if (statusFilter === 'completed') return phases.filter((p) => p.status === 'Completed');
    if (statusFilter === 'in-progress') return phases.filter((p) => p.status === 'In Progress');
    if (statusFilter === 'upcoming') {
      return phases.filter((p) => p.status === 'Upcoming' || p.status === 'Locked');
    }
    return phases;
  }, [phases, statusFilter]);

  // Filter counts
  const filterCounts = useMemo(() => {
    return {
      all: phases.length,
      completed: phases.filter((p) => p.status === 'Completed').length,
      'in-progress': phases.filter((p) => p.status === 'In Progress').length,
      upcoming: phases.filter((p) => p.status === 'Upcoming' || p.status === 'Locked').length,
    };
  }, [phases]);

  // Computed summary metrics
  const overallProgress = useMemo(() => {
    if (!phases.length) return 0;
    const total = phases.reduce((acc, p) => acc + (p.progress || 0), 0);
    return Math.round(total / phases.length);
  }, [phases]);

  const completedPhasesCount = useMemo(() => {
    return phases.filter((p) => p.status === 'Completed').length;
  }, [phases]);

  const completedTasksCount = useMemo(() => {
    return phases.reduce((acc, p) => acc + (p.completedTasksCount || 0), 0);
  }, [phases]);

  const totalTasksCount = useMemo(() => {
    return phases.reduce((acc, p) => acc + (p.totalTasksCount || 0), 0);
  }, [phases]);

  const currentActivePhase = useMemo(() => {
    return phases.find((p) => p.status === 'In Progress') || phases[1] || phases[0];
  }, [phases]);

  // Handlers
  const handleToggleExpand = (phaseId) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const handleOpenDetails = (phase) => {
    setSelectedPhase(phase);
  };

  const handleCloseDetails = () => {
    setSelectedPhase(null);
    if (searchParams.has('selected')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('selected');
      setSearchParams(nextParams, { replace: true });
    }
  };

  // Recalculate Roadmap mock loading state
  const handleRecalculateRoadmap = () => {
    setIsRecalculating(true);
    addToast('Recalculating Career Roadmap', 'Analyzing recent assessment and Evidence Vault submissions...', 'info');

    setTimeout(() => {
      setIsRecalculating(false);
      addToast(
        'Roadmap Recalibration Complete',
        'Pacing and milestone dependencies successfully recalibrated for Machine Learning Engineer.',
        'success'
      );
    }, 1500);
  };

  // Advance step / Mark complete action
  const handleAdvanceStep = (phaseId) => {
    setPhases((prev) =>
      prev.map((phase) => {
        if (phase.id === phaseId) {
          const nextProgress = Math.min(100, (phase.progress || 0) + 15);
          const isNowCompleted = nextProgress === 100;
          const nextCompletedTasks = Math.min(
            phase.totalTasksCount,
            (phase.completedTasksCount || 0) + 1
          );

          if (isNowCompleted) {
            addToast(
              `Phase Completed: ${phase.title}!`,
              `Readiness increased by +${phase.readinessImpact} points. Next phase is now unlocked.`,
              'success'
            );
          } else {
            addToast(
              'Milestone Step Advanced',
              `Progress updated to ${nextProgress}% for ${phase.title}.`,
              'success'
            );
          }

          const updatedPhase = {
            ...phase,
            progress: nextProgress,
            status: isNowCompleted ? 'Completed' : 'In Progress',
            completedTasksCount: nextCompletedTasks,
          };

          if (selectedPhase?.id === phaseId) {
            setSelectedPhase(updatedPhase);
          }

          return updatedPhase;
        }
        return phase;
      })
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Page Header */}
      <RoadmapHeader
        targetRole={activeCareer || user?.targetCareer || 'Machine Learning Engineer'}
        timeline="6 months"
        overallProgress={overallProgress}
        completedPhases={completedPhasesCount}
        totalPhases={phases.length}
        estimatedRemainingTime="~14 weeks"
        lastUpdated="Today · Real-time Sync"
        onRecalculate={handleRecalculateRoadmap}
        isRecalculating={isRecalculating}
      />

      {/* 2. Visual Progress Header */}
      <RoadmapProgressHeader
        progress={overallProgress}
        completedPhases={completedPhasesCount}
        totalPhases={phases.length}
        currentPhaseName={currentActivePhase.title}
        currentPhaseNumber={currentActivePhase.phaseNumber}
        estimatedDuration="6 months"
      />

      {/* 3. Summary Cards */}
      <RoadmapSummary
        overallProgress={overallProgress}
        completedTasks={completedTasksCount}
        totalTasks={totalTasksCount}
        currentPhaseTitle={currentActivePhase.title}
        estimatedCompletion="6 months"
      />

      {/* 4. Next Best Roadmap Action Card */}
      <NextRoadmapAction
        actionTitle="Complete the Model Evaluation and Validation module."
        relatedPhase="Machine Learning Core"
        phaseId="phase-2"
        estimatedTime="45 minutes"
        skillImproved="Model Evaluation"
        readinessImpact={4}
        priority="High"
        onViewDetails={(phaseId) => {
          const target = phases.find((p) => p.id === phaseId);
          if (target) {
            setSelectedPhase(target);
            setExpandedPhases((prev) => ({ ...prev, [phaseId]: true }));
          }
        }}
      />

      {/* 5. Filters & View Selector */}
      <RoadmapFilters
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        counts={filterCounts}
      />

      {/* 6. Timeline or Compact Visual Representation */}
      <RoadmapTimeline
        phases={filteredPhases}
        expandedPhases={expandedPhases}
        onToggleExpand={handleToggleExpand}
        onOpenDetails={handleOpenDetails}
        onAdvanceStep={handleAdvanceStep}
        viewMode={viewMode}
      />

      {/* 7. Slide-over / Modal Details Panel */}
      <RoadmapDetailsPanel
        phase={selectedPhase}
        isOpen={Boolean(selectedPhase)}
        onClose={handleCloseDetails}
        onMarkStepComplete={handleAdvanceStep}
      />
    </div>
  );
};

export default RoadmapContent;
