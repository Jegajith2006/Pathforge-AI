import React from 'react';
import {
  BookOpen,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  Play,
  ArrowRight,
  ChevronRight,
  Layers,
  Database,
  Cpu,
  Calculator,
  Terminal,
  Compass,
} from 'lucide-react';

/**
 * Helper to get clean abstract topic icons without random images
 */
export const getCourseCategoryIcon = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('deep learning')) return Cpu;
  if (cat.includes('machine learning')) return Sparkles;
  if (cat.includes('sql') || cat.includes('data')) return Database;
  if (cat.includes('math') || cat.includes('statistic')) return Calculator;
  if (cat.includes('deploy') || cat.includes('ops')) return Terminal;
  if (cat.includes('program')) return Layers;
  return Compass;
};

/**
 * CourseCard Component
 * High-craft card displaying course details, recommendation reason, skill impact, and progress
 */
export const CourseCard = ({
  course,
  onSelectCourse,
  onStartCourse,
  relatedProjectTitle,
  onViewRelatedProject,
}) => {
  const IconComponent = getCourseCategoryIcon(course.category);
  const isInProgress = course.status === 'In Progress';
  const isCompleted = course.status === 'Completed';

  // Difficulty badge styling
  const getDifficultyBadge = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'advanced':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'intermediate':
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div
      id={`course-card-${course.id}`}
      onClick={() => onSelectCourse?.(course)}
      className="group relative bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-indigo-500/40 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      {/* Top Header: Category Icon + Badges */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 flex items-center justify-center shrink-0 transition-colors">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[var(--text-muted)] block">
                {course.provider}
              </span>
              <span className="text-[11px] font-semibold text-indigo-400">
                {course.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                course.difficulty
              )}`}
            >
              {course.difficulty}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
          {course.title}
        </h3>

        {/* Duration & Impact Row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 font-medium">
            <Zap className="w-3.5 h-3.5" />
            <span>+{course.readinessImpact || 4} Readiness Pts</span>
          </div>
        </div>

        {/* Recommendation Reason Callout */}
        {course.recommendedReason && (
          <div className="mt-3 p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-relaxed">
              <strong className="text-[var(--text-primary)] font-medium">Why recommended: </strong>
              {course.recommendedReason}
            </p>
          </div>
        )}

        {/* What to build after learning teaser */}
        {relatedProjectTitle && (
          <div className="mt-2 text-[11px] text-[var(--text-muted)] flex items-center gap-1 truncate">
            <span className="font-medium text-[var(--text-secondary)]">Build next:</span>
            <span className="text-indigo-400 truncate hover:underline" title={relatedProjectTitle}>
              {relatedProjectTitle}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Section: Progress Bar & Actions */}
      <div className="mt-4 pt-3 border-t border-[var(--border)]">
        {/* Progress Display */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--text-muted)] font-medium">
              {isCompleted
                ? 'Completed'
                : isInProgress
                ? 'In Progress'
                : 'Not Started'}
            </span>
            <span className="text-[var(--text-primary)] font-mono font-semibold">
              {course.progress || 0}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isInProgress
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                  : 'bg-transparent'
              }`}
              style={{ width: `${course.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Button Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            id={`course-view-btn-${course.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCourse?.(course);
            }}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1 transition-colors py-1.5"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            id={`course-action-btn-${course.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartCourse?.(course);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                : isInProgress
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20'
                : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] hover:border-indigo-500/40'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Review</span>
              </>
            ) : isInProgress ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Continue</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Course</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
