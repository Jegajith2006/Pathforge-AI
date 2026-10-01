import React from 'react';
import {
  Sparkles,
  Clock,
  Zap,
  Play,
  BookmarkPlus,
  ArrowRight,
  Terminal,
} from 'lucide-react';

/**
 * RecommendedProjectSection
 * Premium, clean, and balanced featured practical capstone project card.
 * Proportions: ~67% Left Details Column / ~33% Right Compact Action Panel.
 */
export const RecommendedProjectSection = ({
  featuredProject,
  onSelectProject,
  onStartProject,
  onAddToRoadmap,
  relatedCourse,
  onViewRelatedCourse,
}) => {
  if (!featuredProject) return null;

  const prepCourse = relatedCourse || {
    id: featuredProject.relatedCourseId || 'fastapi-ml',
    title: 'FastAPI for Machine Learning',
  };

  const competencies = featuredProject.skillsDeveloped?.length
    ? featuredProject.skillsDeveloped
    : featuredProject.skills?.length
    ? featuredProject.skills
    : ['FastAPI', 'Docker', 'Model Serving', 'REST APIs', 'Deployment'];

  const progressPercent = featuredProject.progress || 0;

  return (
    <section
      aria-label="Featured Capstone Project"
      className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 sm:p-6 lg:p-7 shadow-xs transition-all"
    >
      {/* Minimal clean accent strip along top edge */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400" />

      {/* Two-Column Balanced Grid: 67% Left, 33% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Information Column (approx 67%) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category & Difficulty Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Featured Capstone
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
              {featuredProject.difficulty || 'Intermediate'}
            </span>
            <span className="text-xs font-medium text-[var(--text-secondary)] pl-0.5">
              {featuredProject.category || 'Deployment'}
            </span>
          </div>

          {/* Project Title & Description */}
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight leading-snug">
              {featuredProject.title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {featuredProject.description}
            </p>
          </div>

          {/* Recommendation Reason Compact Callout */}
          <div className="flex items-start sm:items-center gap-2.5 px-3 py-2 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 text-xs text-[var(--text-secondary)]">
            <div className="w-5 h-5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="leading-snug">
              <span className="font-semibold text-[var(--text-primary)]">Recommendation Reason: </span>
              <span>
                {featuredProject.recommendedReason ||
                  'Model Deployment is one of your highest-priority skill gaps.'}
              </span>
            </p>
          </div>

          {/* Competency Tags */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[var(--text-muted)] block">
              Core Competencies Developed
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {competencies.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)] text-xs font-medium transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Metadata Groups Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Duration */}
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)]/60 dark:bg-[var(--surface-secondary)]/50 border border-[var(--border)]">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5" />
                <span>Duration</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-1 font-mono">
                {featuredProject.duration || '3–4 weeks'}
              </p>
            </div>

            {/* Expected Impact */}
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)]/60 dark:bg-[var(--surface-secondary)]/50 border border-[var(--border)]">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Estimated impact</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                +{featuredProject.readinessImpact || 8} readiness points
              </p>
            </div>

            {/* Deliverable */}
            <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)]/60 dark:bg-[var(--surface-secondary)]/50 border border-[var(--border)]">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Deliverable</span>
              </div>
              <p
                className="text-xs font-semibold text-[var(--text-primary)] mt-1 truncate"
                title="Docker container + FastAPI microservice"
              >
                Docker container + FastAPI microservice
              </p>
            </div>
          </div>
        </div>

        {/* Right Project Action Panel (approx 33%) */}
        <div className="lg:col-span-4 w-full rounded-xl bg-[var(--surface-secondary)]/50 dark:bg-[var(--surface-secondary)]/40 border border-[var(--border)] p-4 sm:p-5 space-y-4">
          {/* Project Status Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              Project Status
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {featuredProject.status || 'Recommended'}
            </span>
          </div>

          {/* Progress Bar with explicit completion percentage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">Progress</span>
              <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                {progressPercent}% Complete
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(progressPercent, 0)}%` }}
              />
            </div>
          </div>

          {/* Short Status Description */}
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Ready to initialize starter repository template with Pytest and Dockerfile.
          </p>

          {/* Recommended Prep Course */}
          <div className="pt-3 border-t border-[var(--border)] space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Recommended Prep Course
            </span>
            <button
              id="featured-project-prep-course-btn"
              type="button"
              onClick={() => onViewRelatedCourse?.(prepCourse)}
              className="w-full text-left p-2.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] flex items-center justify-between group transition-colors cursor-pointer"
              title={`View ${prepCourse.title}`}
            >
              <span className="truncate font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {prepCourse.title}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          </div>

          {/* Action Buttons with clear visual hierarchy */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Primary Action */}
            <button
              id="featured-project-start-btn"
              type="button"
              onClick={() => onStartProject?.(featuredProject)}
              className="w-full h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Project</span>
            </button>

            {/* Secondary Action */}
            <button
              id="featured-project-details-btn"
              type="button"
              onClick={() => onSelectProject?.(featuredProject)}
              className="w-full h-9 px-4 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <span>View Project Specs</span>
            </button>

            {/* Tertiary / Roadmap Action */}
            <button
              id="featured-project-roadmap-btn"
              type="button"
              onClick={() => onAddToRoadmap?.(featuredProject)}
              className="w-full h-9 px-4 rounded-lg bg-transparent hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Add to Roadmap</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecommendedProjectSection;
