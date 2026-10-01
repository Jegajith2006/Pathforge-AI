import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Briefcase,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
  Play,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { RoadmapStep } from './RoadmapStep';

export const RoadmapPhase = ({
  phase,
  isExpanded = false,
  onToggleExpand,
  onOpenDetails,
  onAdvanceStep,
  viewMode = 'timeline',
}) => {
  const navigate = useNavigate();

  const isCompleted = phase.status === 'Completed';
  const isInProgress = phase.status === 'In Progress';
  const isUpcoming = phase.status === 'Upcoming' || phase.status === 'Locked';

  // Status-based styling
  const statusStyles = {
    Completed: {
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      border: 'border-[var(--border)]',
      cardBg: 'bg-[var(--surface)]',
      nodeBg: 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30',
      progressVariant: 'emerald',
      statusText: 'Completed',
    },
    'In Progress': {
      badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-semibold',
      border: 'border-indigo-500/50 dark:border-indigo-500/60 shadow-md shadow-indigo-500/5',
      cardBg: 'bg-[var(--surface)]',
      nodeBg: 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md shadow-indigo-600/30',
      progressVariant: 'indigo',
      statusText: 'In Progress (Active Sprint)',
    },
    Upcoming: {
      badge: 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)]',
      border: 'border-[var(--border)]',
      cardBg: 'bg-[var(--surface)]/90',
      nodeBg: 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border)]',
      progressVariant: 'muted',
      statusText: 'Upcoming Milestone',
    },
  }[phase.status] || {
    badge: 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)]',
    border: 'border-[var(--border)]',
    cardBg: 'bg-[var(--surface)]',
    nodeBg: 'bg-[var(--surface-secondary)] text-[var(--text-muted)]',
    progressVariant: 'muted',
    statusText: phase.status,
  };

  return (
    <div
      id={`phase-card-${phase.id}`}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden relative ${
        statusStyles.cardBg
      } ${statusStyles.border} ${
        isInProgress ? 'ring-1 ring-indigo-500/20' : ''
      }`}
    >
      {/* Top Banner Stripe for Active Phase */}
      {isInProgress && (
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-600" />
      )}

      {/* Main Header / Collapsed Summary */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Phase {String(phase.phaseNumber).padStart(2, '0')}
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles.badge}`}
              >
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                {isInProgress && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                {statusStyles.statusText}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {phase.duration}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold font-display text-[var(--text-primary)] tracking-tight">
              {phase.title}
            </h3>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
              {phase.description}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              id={`open-phase-details-${phase.id}`}
              type="button"
              onClick={() => onOpenDetails(phase)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-colors"
            >
              <span>View Specs</span>
              <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
            </button>

            <button
              id={`toggle-expand-phase-${phase.id}`}
              type="button"
              onClick={onToggleExpand}
              aria-expanded={isExpanded}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] border border-transparent hover:border-[var(--border)] transition-colors"
              title={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar & Telemetry Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-medium">Phase Progress</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-[var(--text-primary)]">{phase.progress}%</span>
              {phase.readinessImpact && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  (+{phase.readinessImpact} pts)
                </span>
              )}
            </div>
          </div>

          {/* Styled Progress Track */}
          <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isInProgress
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                  : 'bg-slate-400 dark:bg-slate-700'
              }`}
              style={{ width: `${phase.progress}%` }}
            />
          </div>
        </div>

        {/* Skill Tags & Resource Counts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--border)]/70">
          <div className="flex flex-wrap items-center gap-1.5">
            {phase.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]"
              >
                {skill}
              </span>
            ))}
            {phase.skills.length > 4 && (
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                +{phase.skills.length - 4} more
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono shrink-0">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              {phase.courses?.length || 0} Courses
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-cyan-500" />
              {phase.projects?.length || 0} Project
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Phase Details Section */}
      {isExpanded && (
        <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[var(--border)] bg-[var(--surface-secondary)]/30 space-y-5 animate-in fade-in duration-200">
          {/* Phase Objective */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Phase Objective
            </span>
            <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
              {phase.objective || phase.description}
            </p>
          </div>

          {/* Learning Resources (Courses) & Practical Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Courses */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Related Courses ({phase.courses?.length || 0})
              </h4>
              <div className="space-y-2">
                {phase.courses?.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/courses?selected=${course.id}`)}
                    className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-indigo-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors truncate">
                        {course.title}
                      </h5>
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">
                        {course.duration || 'Paced Curriculum'} • {course.provider || 'PathForge'}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Project */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-cyan-500" />
                Practical Project
              </h4>
              <div className="space-y-2">
                {phase.projects?.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => navigate(`/projects?selected=${proj.id}`)}
                    className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-cyan-500 transition-colors truncate">
                        {proj.title}
                      </h5>
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">
                        {proj.duration || 'Practical Sprint'} • {proj.difficulty || 'Portfolio Artifact'}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-cyan-500 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence Expected & Completion Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Evidence Expected */}
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Evidence Expected
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                {phase.evidenceRequirements?.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Completion Requirements */}
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                Completion Requirements
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                {phase.completionRequirements?.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold shrink-0">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
              <span>Expected readiness impact:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                +{phase.readinessImpact || 12} points
              </strong>
            </div>

            <div className="flex items-center gap-2.5">
              {isInProgress && (
                <button
                  id={`advance-phase-step-btn-${phase.id}`}
                  type="button"
                  onClick={() => onAdvanceStep(phase.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  <Play className="w-3 h-3 fill-white" />
                  Advance Active Step (+15%)
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenDetails(phase)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] transition-colors"
              >
                View Full Specs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapPhase;
