import React from 'react';
import { RoadmapStep as IRoadmapStep } from '../../types';
import { RoadmapStep } from './RoadmapStep';
import { Sparkles, CheckCircle, Flag, Layers } from 'lucide-react';

interface RoadmapTimelineProps {
  steps: IRoadmapStep[];
  completionPercentage?: number;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({
  steps,
  completionPercentage = 42,
}) => {
  const completedCount = steps.filter((s) => s.status === 'Completed').length;

  return (
    <div className="space-y-8">
      {/* Top Summary Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#151C2E] via-[#1E1B4B]/70 to-[#151C2E] border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Adaptive AI Roadmap
              </span>
              <span className="text-xs text-slate-400">
                {completedCount} of {steps.length} milestones finished
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Your roadmap is {completionPercentage}% complete.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Dynamically paced by machine-learning skill gap scores. Completing your current active SQL sprint will advance readiness to 76%.
            </p>
          </div>

          <div className="w-full md:w-64 space-y-2 shrink-0">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Roadmap Velocity</span>
              <span className="text-indigo-400">{completionPercentage}%</span>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block text-right">
              Est. Completion: 8 Weeks
            </span>
          </div>
        </div>
      </div>

      {/* Connected Timeline Sequence */}
      <div className="relative pl-6 sm:pl-10 space-y-6">
        {/* Continuous vertical connecting line */}
        <div className="absolute top-4 bottom-4 left-3 sm:left-5 w-0.5 bg-gradient-to-b from-emerald-500 via-indigo-500 to-slate-800" />

        {steps.map((step, idx) => {
          const isCurrent = step.status === 'In Progress' && idx === 2; // Step 3 is active
          return (
            <div key={step.id} className="relative">
              {/* Point on timeline */}
              <div
                className={`absolute -left-6 sm:-left-10 top-6 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 transform -translate-x-1/2 transition-all ${
                  step.status === 'Completed'
                    ? 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-950'
                    : isCurrent
                    ? 'bg-indigo-500 border-white ring-4 ring-indigo-500/30 animate-ping-slow'
                    : 'bg-slate-900 border-slate-700'
                }`}
              />

              <RoadmapStep step={step} isCurrent={isCurrent} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
