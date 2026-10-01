import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CheckCircle2,
  Clock,
  BookOpen,
  Briefcase,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Play,
  Layers,
  FileCheck,
} from 'lucide-react';

export const RoadmapDetailsPanel = ({
  phase,
  isOpen = false,
  onClose,
  onMarkStepComplete,
}) => {
  const navigate = useNavigate();

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !phase) return null;

  const isCompleted = phase.status === 'Completed';
  const isInProgress = phase.status === 'In Progress';

  return (
    <div
      id="roadmap-details-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-start justify-between gap-4 bg-[var(--surface-secondary)]/40 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Phase {String(phase.phaseNumber).padStart(2, '0')}
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : isInProgress
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)]'
                }`}
              >
                {phase.status}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {phase.duration}
              </span>
            </div>

            <h2
              id="phase-details-title"
              className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight"
            >
              {phase.title}
            </h2>
          </div>

          <button
            id="close-phase-details-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors shrink-0"
            aria-label="Close phase details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Progress Overview Card */}
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">Phase Progress</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-[var(--text-primary)]">{phase.progress}%</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  (+{phase.readinessImpact} Readiness Pts)
                </span>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-[var(--surface)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isInProgress
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                    : 'bg-slate-400 dark:bg-slate-700'
                }`}
                style={{ width: `${phase.progress}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)] pt-1">
              <span>Estimated Duration: {phase.estimatedTime || phase.duration}</span>
              <span>Dependencies: {phase.dependencies || 'None'}</span>
            </div>
          </div>

          {/* Objective & Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Phase Objective & Scope
            </h4>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {phase.objective}
            </p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {phase.description}
            </p>
          </div>

          {/* Skills Covered */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Skills Covered
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {phase.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Related Courses */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Related Courses
            </h4>
            <div className="space-y-2">
              {phase.courses?.map((course) => (
                <div
                  key={course.id}
                  onClick={() => {
                    onClose();
                    navigate(`/courses?selected=${course.id}`);
                  }}
                  className="p-3.5 rounded-xl bg-[var(--surface-secondary)]/40 hover:bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-indigo-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div>
                    <h5 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors">
                      {course.title}
                    </h5>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      {course.duration} • {course.provider}
                    </span>
                  </div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Projects */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-cyan-500" />
              Related Projects
            </h4>
            <div className="space-y-2">
              {phase.projects?.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    onClose();
                    navigate(`/projects?selected=${project.id}`);
                  }}
                  className="p-3.5 rounded-xl bg-[var(--surface-secondary)]/40 hover:bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div>
                    <h5 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] group-hover:text-cyan-500 transition-colors">
                      {project.title}
                    </h5>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      {project.duration} • {project.difficulty}
                    </span>
                  </div>
                  <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Expected */}
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)]/30 border border-[var(--border)] space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Evidence Requirements for Verification
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              {phase.evidenceRequirements?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="details-view-courses-btn"
              type="button"
              onClick={() => {
                onClose();
                navigate('/courses');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-colors"
            >
              View Courses
            </button>

            <button
              id="details-view-projects-btn"
              type="button"
              onClick={() => {
                onClose();
                navigate('/projects');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-colors"
            >
              View Projects
            </button>

            <button
              id="details-view-skill-gaps-btn"
              type="button"
              onClick={() => {
                onClose();
                navigate('/skill-gap');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-colors"
            >
              View Skill Gaps
            </button>

            <button
              id="details-add-evidence-btn"
              type="button"
              onClick={() => {
                onClose();
                navigate('/evidence');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] transition-colors"
            >
              Add Evidence
            </button>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {!isCompleted && (
              <button
                id="details-mark-step-complete-btn"
                type="button"
                onClick={() => onMarkStepComplete?.(phase.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/30 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Step Complete (+15%)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetailsPanel;
