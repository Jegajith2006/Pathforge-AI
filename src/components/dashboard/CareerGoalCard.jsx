import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight, Compass, Clock, Award, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { mockCareerProfile } from '../../data/mockData';

export const CareerGoalCard = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const targetRole = user?.targetCareer || mockCareerProfile.targetRole || 'Machine Learning Engineer';
  const careerLevel = mockCareerProfile.careerLevel || 'Intermediate';
  const targetTimeline = mockCareerProfile.targetTimeline || '6 months';
  const currentProgress = mockCareerProfile.currentProgress || 42;

  // Career path nodes for abstract visual
  const pathNodes = [
    { label: 'Foundations', status: 'completed' },
    { label: 'ML Core', status: 'current' },
    { label: 'Deep Learning', status: 'upcoming' },
    { label: 'Production', status: 'upcoming' },
    { label: 'Target', status: 'target' },
  ];

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
      {/* Subtle top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500" />

      {/* Header section */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                Career Trajectory
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display leading-tight">
                {targetRole}
              </h2>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
            Active
          </span>
        </div>

        {/* Career Specs Grid */}
        <div className="grid grid-cols-2 gap-3 py-3.5 border-y border-[var(--border)]">
          <div className="space-y-0.5">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-indigo-500" /> Career Level
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {careerLevel}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-cyan-500" /> Target Timeline
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)] font-mono">
              {targetTimeline}
            </p>
          </div>
        </div>

        {/* Abstract Career Path Visual */}
        <div className="my-5 p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-[var(--text-muted)] mb-2 px-1">
            <span>Stage 2 of 5: ML Core</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentProgress}%</span>
          </div>

          {/* Connected abstract path nodes */}
          <div className="relative flex items-center justify-between px-2 pt-1 pb-1.5">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 bg-[var(--border)] -z-0" />
            <div
              className="absolute top-1/2 left-4 h-0.5 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-cyan-500 -z-0 transition-all duration-500"
              style={{ width: `${currentProgress}%` }}
            />

            {pathNodes.map((node, index) => {
              const isCompleted = node.status === 'completed';
              const isCurrent = node.status === 'current';
              const isTarget = node.status === 'target';

              return (
                <div key={node.label} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-transform ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 scale-110 animate-pulse'
                        : isTarget
                        ? 'bg-[var(--surface)] text-indigo-500 border-2 border-indigo-500'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-medium tracking-tight hidden sm:block ${
                      isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {node.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Phase breakdown badge indicators */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--border)] text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">Current Phase:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">ML Core</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">Next Phase:</span>
              <span className="font-semibold text-[var(--text-secondary)]">Deep Learning</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-[var(--text-secondary)]">Trajectory Completion</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {currentProgress}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 transition-all duration-700 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border)] transition-colors duration-150 cursor-pointer"
        >
          <span>View career profile</span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/career-selection')}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-soft)] hover:bg-[var(--surface-active)] text-indigo-600 dark:text-indigo-300 border border-[var(--border)] transition-colors duration-150 cursor-pointer"
        >
          <Target className="w-3.5 h-3.5 text-indigo-500" />
          <span>Update goal</span>
        </button>
      </div>
    </div>
  );
};

export default CareerGoalCard;
