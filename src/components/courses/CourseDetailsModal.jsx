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
  ExternalLink,
  BookOpen,
  Briefcase,
  Layers,
} from 'lucide-react';

/**
 * CourseDetailsModal
 * Comprehensive modal displaying course syllabus, learning objectives, skill impact, and related practical project.
 */
export const CourseDetailsModal = ({
  course,
  onClose,
  onStartCourse,
  onAddToRoadmap,
  onViewRelatedProject,
  relatedProject,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!course) return null;

  const isInProgress = course.status === 'In Progress';
  const isCompleted = course.status === 'Completed';

  // Default objectives fallback if none provided
  const objectives = course.objectives || [
    'Understand precision, recall, and F1-score across imbalanced classes',
    'Compare classification evaluation metrics and select optimal decision thresholds',
    'Apply stratified and group cross-validation strategies',
    'Interpret confusion matrices and cumulative gain curves',
    'Detect and eliminate target data leakage across train-validation splits',
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
        id="course-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-modal-title"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-10 custom-scrollbar flex flex-col my-auto"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--border)] p-4 sm:p-5 flex items-start justify-between gap-4 z-20">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                {course.category}
              </span>
              <span className="text-xs text-[var(--text-muted)]">·</span>
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                {course.provider}
              </span>
            </div>
            <h2
              id="course-modal-title"
              className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-tight"
            >
              {course.title}
            </h2>
          </div>

          <button
            id="course-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 flex-1">
          {/* Metadata badges row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs">
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Difficulty</span>
              <span className="font-semibold text-[var(--text-primary)]">{course.difficulty}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Duration</span>
              <span className="font-semibold text-[var(--text-primary)]">{course.duration}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Readiness Impact</span>
              <span className="font-semibold text-emerald-500">
                +{course.readinessImpact || 4} Points
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Current Status</span>
              <span className="font-semibold text-indigo-400">
                {course.status} ({course.progress || 0}%)
              </span>
            </div>
          </div>

          {/* Recommendation Reason Callout */}
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm text-[var(--text-secondary)] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span>Why This Course is Recommended for You</span>
            </div>
            <p className="leading-relaxed text-[var(--text-primary)]">
              {course.recommendedReason}
            </p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Course Overview
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Skills Improved */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Skills Improved
            </h3>
            <div className="flex flex-wrap gap-2">
              {(course.skills || [course.category]).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--surface-secondary)] text-indigo-400 border border-[var(--border)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Learning Objectives Checklist */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">
              Core Learning Objectives
            </h3>
            <ul className="space-y-2">
              {objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Related Practical Project Box */}
          {relatedProject && (
            <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Associated Practical Project
                  </span>
                </div>
                <span className="text-[11px] text-emerald-500 font-medium">
                  +{relatedProject.readinessImpact || 8} pts readiness
                </span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  {relatedProject.title}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                  {relatedProject.description}
                </p>
              </div>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Estimated duration: {relatedProject.duration}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewRelatedProject?.(relatedProject);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Open in Project Studio</span>
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
              id="course-modal-add-roadmap-btn"
              type="button"
              onClick={() => onAddToRoadmap?.(course)}
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] flex items-center gap-1.5 transition-colors"
            >
              <BookmarkPlus className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Add to Roadmap</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="course-modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Close
            </button>

            <button
              id="course-modal-primary-btn"
              type="button"
              onClick={() => onStartCourse?.(course)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCompleted ? 'Review Content' : isInProgress ? 'Continue Course' : 'Start Course'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsModal;
