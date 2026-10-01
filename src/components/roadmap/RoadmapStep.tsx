import React, { useState } from 'react';
import { RoadmapStep as IRoadmapStep } from '../../types';
import { CheckCircle2, Clock, Lock, ChevronDown, ChevronUp, Sparkles, AlertCircle, Play } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface RoadmapStepProps {
  step: IRoadmapStep;
  isCurrent?: boolean;
  onStatusChange?: (id: string, newStatus: IRoadmapStep['status']) => void;
}

export const RoadmapStep: React.FC<RoadmapStepProps> = ({
  step,
  isCurrent = false,
  onStatusChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(isCurrent);
  const { addToast } = useToast();

  const handleAction = () => {
    if (step.status === 'Completed') {
      addToast('Artifact Verified', `Reviewed verified submissions for ${step.title}.`, 'info');
    } else if (step.status === 'In Progress') {
      addToast('Sprint Active', `Resumed interactive learning environment for ${step.title}.`, 'success');
    } else {
      addToast('Step Locked', 'Complete preceding foundational milestones to unlock this module.', 'warning');
    }
  };

  const statusBadge = {
    Completed: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
      label: 'Completed',
    },
    'In Progress': {
      bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse-glow',
      icon: Clock,
      label: 'In Progress (Active)',
    },
    'Not Started': {
      bg: 'bg-slate-800/80 text-slate-400 border-slate-700/50',
      icon: Lock,
      label: 'Upcoming / Locked',
    },
    'Needs Improvement': {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: AlertCircle,
      label: 'Needs Revision',
    },
  }[step.status];

  const StatusIcon = statusBadge.icon;

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 ${
        isCurrent
          ? 'bg-[#151C2E] border-2 border-indigo-500 shadow-2xl shadow-indigo-950/60 ring-4 ring-indigo-500/10'
          : step.status === 'Completed'
          ? 'bg-[#151C2E]/90 border border-slate-800/80 hover:border-slate-700'
          : 'bg-[#121826]/70 border border-slate-800/60 opacity-80 hover:opacity-100'
      }`}
    >
      {/* Header bar */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Node step badge */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 font-display ${
              step.status === 'Completed'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950'
                : isCurrent
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {step.status === 'Completed' ? '✓' : step.stepNumber}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-indigo-400 tracking-wide uppercase">
                {step.skill}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium">{step.type}</span>
            </div>
            <h4 className="text-base font-bold text-white mt-0.5 tracking-tight font-display">
              {step.title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusBadge.label}
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Key Competency Takeaways:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4 list-disc text-xs text-slate-400">
              {step.keyTakeaways.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {step.estimatedTime}
            </span>

            <button
              onClick={handleAction}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isCurrent
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-500 hover:opacity-95 text-white shadow-lg shadow-indigo-950/50'
                  : step.status === 'Completed'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isCurrent && <Play className="w-3.5 h-3.5 fill-white" />}
              {step.actionLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
