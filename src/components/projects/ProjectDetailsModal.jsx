import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  Zap,
  CheckCircle2,
  Play,
  BookmarkPlus,
  ArrowRight,
  BookOpen,
  Terminal,
  Code2,
  FileCheck2,
  Layers,
  Award,
} from 'lucide-react';
import { ProjectDifficultyBadge } from './ProjectDifficultyBadge';
import { ProjectSkillTags } from './ProjectSkillTags';

/**
 * ProjectDetailsModal
 * Comprehensive technical spec dialog with problem statement, objective, deliverables, tech stack, and evaluation rubric.
 */
export const ProjectDetailsModal = ({
  project,
  onClose,
  onStartProject,
  onAddToRoadmap,
  onViewRelatedCourse,
  relatedCourse,
}) => {
  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  const isInProgress = project.status === 'In Progress';
  const isCompleted = project.status === 'Completed';

  // Fallback deliverables
  const deliverables = project.deliverables || [
    'Clean dataset and reproducible feature engineering script',
    'Trained model artifact with versioned weight checksums',
    'Evaluation report with latency benchmarks and precision-recall trade-offs',
    'FastAPI endpoint with OpenAPI specification documentation',
    'Dockerfile and docker-compose.yml configuration',
    'README with architecture diagram and deployment instructions',
  ];

  // Fallback evaluation criteria
  const evaluationCriteria = project.evaluationCriteria || [
    'P95 latency under 60ms for single prediction requests',
    'Zero unhandled 500 errors on invalid, null, or extreme outlier inputs',
    'Multi-stage Docker image builds cleanly with non-root security user',
    'CI pipeline executes linting and full test suite on pull requests',
  ];

  // Tech stack
  const techStack = project.techStack || [
    'Python',
    'Scikit-learn',
    'FastAPI',
    'Docker',
    'Pytest',
    'GitHub Actions',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        id="project-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-10 custom-scrollbar flex flex-col my-auto"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--border)] p-4 sm:p-5 flex items-start justify-between gap-4 z-20">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <ProjectDifficultyBadge difficulty={project.difficulty} size="xs" />
              <span className="text-xs text-[var(--text-muted)]">·</span>
              <span className="text-xs font-semibold text-indigo-400">
                {project.category}
              </span>
              {project.relatedSkill && (
                <>
                  <span className="text-xs text-[var(--text-muted)]">·</span>
                  <span className="text-xs text-cyan-400 font-medium">
                    Gap: {project.relatedSkill}
                  </span>
                </>
              )}
            </div>
            <h2
              id="project-modal-title"
              className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-tight"
            >
              {project.title}
            </h2>
          </div>

          <button
            id="project-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Metadata Badges Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs">
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Duration</span>
              <span className="font-semibold text-[var(--text-primary)]">{project.duration}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Readiness Impact</span>
              <span className="font-semibold text-emerald-500">
                +{project.readinessImpact || 8} Points
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Status</span>
              <span className="font-semibold text-indigo-400">{project.status}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Progress</span>
              <span className="font-semibold text-[var(--text-primary)] font-mono">
                {project.progress || 0}%
              </span>
            </div>
          </div>

          {/* Recommendation Reason Context */}
          {project.recommendedReason && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm text-[var(--text-secondary)] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span>Recommendation Context</span>
              </div>
              <p className="leading-relaxed text-[var(--text-primary)]">
                {project.recommendedReason}
              </p>
            </div>
          )}

          {/* In-Progress Telemetry (if active) */}
          {isInProgress && (
            <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                  Active Sprint Progress: {project.progress || 65}%
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Last updated: {project.lastUpdated || '2 days ago'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                  style={{ width: `${project.progress || 65}%` }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[var(--text-muted)] block">Current Phase:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {project.currentPhase || 'Model evaluation'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Next Task:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {project.nextTask || 'Compare precision, recall, and F1-score across folds.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Problem Statement & Objective */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-400" />
                Problem Statement
              </h4>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {project.problemStatement || project.description}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
                <Award className="w-4 h-4 text-cyan-400" />
                Project Objective
              </h4>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {project.projectObjective ||
                  'Build a robust and reproducible machine learning service that demonstrates production deployment competence to interview evaluation panels.'}
              </p>
            </div>
          </div>

          {/* Suggested Technology Stack */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-400" />
              Suggested Technology Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Skills Developed */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Skills Developed
            </h3>
            <ProjectSkillTags
              skills={project.skillsDeveloped || project.skills}
              maxVisible={null}
            />
          </div>

          {/* Expected Deliverables */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">
              Expected Project Deliverables
            </h3>
            <ul className="space-y-2">
              {deliverables.map((del, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{del}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Evaluation Criteria Rubric */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">
              Evaluation Criteria & Rubric
            </h3>
            <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
              {evaluationCriteria.map((crit, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                  <span>{crit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Course Link Card */}
          {relatedCourse && (
            <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Recommended Preparatory Course
                  </span>
                </div>
                <span className="text-[11px] text-emerald-500 font-medium">
                  +{relatedCourse.readinessImpact || 4} pts readiness
                </span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  {relatedCourse.title}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                  {relatedCourse.description}
                </p>
              </div>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Duration: {relatedCourse.duration} · Provider: {relatedCourse.provider}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewRelatedCourse?.(relatedCourse);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Open in Learning Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="sticky bottom-0 bg-[var(--surface)]/95 backdrop-blur border-t border-[var(--border)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-2">
            <button
              id="project-modal-add-roadmap-btn"
              type="button"
              onClick={() => onAddToRoadmap?.(project)}
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] flex items-center gap-1.5 transition-colors"
            >
              <BookmarkPlus className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Add to Roadmap</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="project-modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Close
            </button>

            <button
              id="project-modal-primary-btn"
              type="button"
              onClick={() => onStartProject?.(project)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {isCompleted
                  ? 'View In Portfolio'
                  : isInProgress
                  ? 'Update Sprint Progress'
                  : 'Start Project'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
