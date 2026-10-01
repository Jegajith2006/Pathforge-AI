import React from 'react';
import { Sparkles, Clock, Zap, ArrowRight, Play, BookOpen, Layers, CheckCircle } from 'lucide-react';

/**
 * RecommendedCourseSection
 * Prominently showcases the #1 AI-ranked course recommendation based on priority skill gaps
 */
export const RecommendedCourseSection = ({
  featuredCourse,
  onSelectCourse,
  onStartCourse,
  onViewRelatedProject,
  relatedProject,
}) => {
  if (!featuredCourse) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 via-[var(--surface)] to-[var(--surface)] border border-indigo-500/30 p-5 sm:p-6 lg:p-7 shadow-sm transition-all">
      {/* Background soft ambient accents */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left main info */}
        <div className="space-y-3.5 max-w-2xl">
          {/* Eyebrow badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Top Priority Recommendation
            </span>
            <span className="text-xs text-[var(--text-muted)]">·</span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              Provider: <span className="text-[var(--text-primary)] font-semibold">{featuredCourse.provider}</span>
            </span>
          </div>

          {/* Title & Description */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {featuredCourse.title}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 sm:line-clamp-none">
              {featuredCourse.description}
            </p>
          </div>

          {/* Why Recommended Callout */}
          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text-secondary)] flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-[var(--text-primary)]">Recommendation Context: </span>
              <span>{featuredCourse.recommendedReason}</span>
            </div>
          </div>

          {/* Key Metric Tags */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)]">Skill improved:</span>
              <span className="font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {featuredCourse.skills?.[0] || 'Machine Learning'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)]">Difficulty:</span>
              <span className="font-medium text-[var(--text-primary)]">
                {featuredCourse.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{featuredCourse.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-500 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>+{featuredCourse.readinessImpact || 4} Readiness Points</span>
            </div>
          </div>
        </div>

        {/* Right card side: Progress & Actions */}
        <div className="lg:w-72 shrink-0 flex flex-col justify-between bg-[var(--surface-secondary)]/80 border border-[var(--border)] rounded-xl p-4 sm:p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[var(--text-muted)] font-medium">Learning Progress</span>
              <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
                {featuredCourse.progress || 0}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${featuredCourse.progress || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              Module 2 of 5: Cross-Validation & Metric Selection
            </p>
          </div>

          {/* Linked Project Preview */}
          {relatedProject && (
            <div className="pt-3 border-t border-[var(--border)] text-xs">
              <span className="text-[11px] text-[var(--text-muted)] block mb-1">
                Practical Project Next Step:
              </span>
              <button
                type="button"
                onClick={() => onViewRelatedProject?.(relatedProject)}
                className="text-left font-medium text-indigo-400 hover:text-indigo-300 hover:underline flex items-center justify-between w-full group"
              >
                <span className="truncate">{relatedProject.title}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              id="featured-course-continue-btn"
              type="button"
              onClick={() => onStartCourse?.(featuredCourse)}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Continue Learning</span>
            </button>
            <button
              id="featured-course-details-btn"
              type="button"
              onClick={() => onSelectCourse?.(featuredCourse)}
              className="w-full py-2 px-4 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Course Syllabus & Objectives</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendedCourseSection;
