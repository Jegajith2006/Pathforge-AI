import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export const RoadmapStep = ({
  step,
  type = 'course', // 'course' | 'project' | 'evidence' | 'requirement'
  isCompleted = false,
  onToggleComplete,
}) => {
  const navigate = useNavigate();

  const handleNavigate = (e) => {
    e.stopPropagation();
    if (type === 'course' && step.id) {
      navigate(`/courses?selected=${step.id}`);
    } else if (type === 'project' && step.id) {
      navigate(`/projects?selected=${step.id}`);
    } else if (type === 'evidence') {
      navigate('/evidence');
    }
  };

  const typeConfig = {
    course: {
      icon: BookOpen,
      badge: 'Course',
      badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      actionLabel: 'View Course',
    },
    project: {
      icon: Briefcase,
      badge: 'Project',
      badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      actionLabel: 'View Project',
    },
    evidence: {
      icon: ShieldCheck,
      badge: 'Evidence',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      actionLabel: 'Evidence Vault',
    },
    requirement: {
      icon: CheckCircle2,
      badge: 'Milestone',
      badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      actionLabel: 'Details',
    },
  }[type] || {
    icon: CheckCircle2,
    badge: 'Step',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    actionLabel: 'View',
  };

  const Icon = typeConfig.icon;

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isCompleted
          ? 'bg-[var(--surface-secondary)]/50 border-[var(--border)] opacity-85'
          : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] shadow-2xs'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleComplete}
          title={isCompleted ? 'Mark step incomplete' : 'Mark step complete'}
          className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-all ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-600 text-white'
              : 'border-[var(--border)] hover:border-indigo-400 bg-[var(--surface-secondary)] text-transparent hover:text-indigo-400'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-semibold border ${typeConfig.badgeClass}`}
            >
              <Icon className="w-3 h-3" />
              {typeConfig.badge}
            </span>
            {step.duration && (
              <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {step.duration}
              </span>
            )}
            {step.provider && (
              <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                • {step.provider}
              </span>
            )}
          </div>

          <h5
            className={`text-xs sm:text-sm font-semibold truncate ${
              isCompleted
                ? 'line-through text-[var(--text-muted)]'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {typeof step === 'string' ? step : step.title}
          </h5>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {(type === 'course' || type === 'project' || type === 'evidence') && (
          <button
            type="button"
            onClick={handleNavigate}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          >
            <span>{typeConfig.actionLabel}</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RoadmapStep;
