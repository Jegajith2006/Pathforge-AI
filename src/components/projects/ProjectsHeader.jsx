import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, BookOpen, Plus, Sparkles, FolderGit2, CheckCircle2, Flame } from 'lucide-react';

/**
 * ProjectsHeader
 * Studio header with career-driven evidence summary and shortcuts to courses / project creation
 */
export const ProjectsHeader = ({
  recommendedCount = 8,
  completedCount = 2,
  activeCount = 2,
  evidenceCount = 5,
  onAddNewProject,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 pb-1">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Project Studio
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Career Portfolio Evidence
            </span>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Turn your learning into practical evidence through projects aligned with your career goals.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="browse-courses-nav-btn"
            type="button"
            onClick={() => navigate('/courses')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Browse Courses</span>
          </button>

          <button
            id="add-new-project-btn"
            type="button"
            onClick={onAddNewProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-[var(--text-muted)] font-medium">Recommended Projects</span>
          <div className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-1 flex items-baseline gap-1">
            <span>{recommendedCount}</span>
            <span className="text-xs font-normal text-indigo-400">targeted</span>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-[var(--text-muted)] font-medium">Active Sprints</span>
          <div className="text-lg sm:text-xl font-bold text-indigo-400 mt-1 flex items-baseline gap-1">
            <span>{activeCount}</span>
            <span className="text-xs font-normal text-[var(--text-muted)]">in progress</span>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-[var(--text-muted)] font-medium">Completed Projects</span>
          <div className="text-lg sm:text-xl font-bold text-emerald-500 mt-1 flex items-baseline gap-1">
            <span>{completedCount}</span>
            <span className="text-xs font-normal text-[var(--text-muted)]">verified</span>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-[var(--text-muted)] font-medium">Portfolio Evidence</span>
          <div className="text-lg sm:text-xl font-bold text-cyan-400 mt-1 flex items-baseline gap-1">
            <span>{evidenceCount}</span>
            <span className="text-xs font-normal text-[var(--text-muted)]">artifacts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsHeader;
