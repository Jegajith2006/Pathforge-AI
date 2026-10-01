import React from 'react';
import {
  Clock,
  Zap,
  CheckCircle2,
  Play,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Layers,
  Sparkles,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { ProjectDifficultyBadge } from './ProjectDifficultyBadge';
import { ProjectSkillTags } from './ProjectSkillTags';

/**
 * ProjectCard Component
 * High-craft card presenting project objectives, skills developed, skill gap connection, and in-progress tasks.
 */
export const ProjectCard = ({
  project,
  onSelectProject,
  onStartProject,
  relatedCourseTitle,
  onViewRelatedCourse,
}) => {
  const isInProgress = project.status === 'In Progress';
  const isCompleted = project.status === 'Completed';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Recommended':
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div
      id={`project-card-${project.id}`}
      onClick={() => onSelectProject?.(project)}
      className="group relative bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-indigo-500/40 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Header Row: Category / Difficulty / Status */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <ProjectDifficultyBadge difficulty={project.difficulty} size="xs" />
            <span className="text-[11px] font-semibold text-indigo-400">
              {project.category}
            </span>
          </div>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
              project.status
            )}`}
          >
            {project.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors line-clamp-1 leading-snug">
          {project.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Related Skill Gap & Impact Bar */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mt-2.5 text-xs">
          <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            <span>{project.duration}</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-500 font-semibold text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>+{project.readinessImpact || 8} Readiness Pts</span>
          </div>

          {project.relatedSkill && (
            <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              <span>Target Gap: {project.relatedSkill}</span>
            </div>
          )}
        </div>

        {/* Skills Developed Tags */}
        <div className="mt-3">
          <ProjectSkillTags skills={project.skillsDeveloped || project.skills} maxVisible={3} size="xs" />
        </div>

        {/* Recommendation Reason Context */}
        {project.recommendedReason && (
          <div className="mt-3 p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-relaxed">
              <strong className="text-[var(--text-primary)] font-medium">Why recommended: </strong>
              {project.recommendedReason}
            </p>
          </div>
        )}

        {/* In-Progress Task Breakdown callout */}
        {isInProgress && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs text-[var(--text-secondary)] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-400">
              <span>Phase: {project.currentPhase || 'Implementation'}</span>
              <span className="font-mono">{project.progress || 50}%</span>
            </div>
            {project.nextTask && (
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                <span className="font-medium text-[var(--text-secondary)]">Next task: </span>
                {project.nextTask}
              </p>
            )}
          </div>
        )}

        {/* Related course teaser */}
        {relatedCourseTitle && (
          <div className="mt-2 text-[11px] text-[var(--text-muted)] flex items-center gap-1 truncate">
            <span className="font-medium text-[var(--text-secondary)]">Prep course:</span>
            <span className="text-indigo-400 truncate hover:underline" title={relatedCourseTitle}>
              {relatedCourseTitle}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Progress Bar & Button Actions */}
      <div className="mt-4 pt-3 border-t border-[var(--border)]">
        {/* Progress Bar (if in progress or completed) */}
        {(isInProgress || isCompleted) && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[var(--text-muted)] font-medium text-[11px]">
                {isCompleted ? 'Portfolio Artifact Verified' : 'Milestone Completion'}
              </span>
              <span className="text-[var(--text-primary)] font-mono font-semibold text-xs">
                {project.progress || 0}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                }`}
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            id={`project-view-btn-${project.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProject?.(project);
            }}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1 transition-colors py-1.5"
          >
            <span>View Project</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            id={`project-action-btn-${project.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartProject?.(project);
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
                <span>In Vault</span>
              </>
            ) : isInProgress ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Push Updates</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
