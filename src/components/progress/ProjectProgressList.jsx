import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, ArrowRight, GitCommit, Calendar } from 'lucide-react';
import { mockProjectsInProgress } from '../../data/mockData';

export const ProjectProgressList = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
              Projects in Progress
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Production capstone repositories undergoing milestone verification.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 flex items-center gap-1 transition-colors"
        >
          <span>View All Projects</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Projects Cards List */}
      <div className="space-y-3">
        {mockProjectsInProgress.map((project) => (
          <div
            key={project.id}
            className="p-4 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] hover:border-cyan-500/30 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] font-display">
                  {project.title}
                </h4>
                <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium mt-0.5">
                  {project.currentPhase}
                </div>
              </div>

              <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 self-start sm:self-auto">
                {project.progress}% Complete
              </span>
            </div>

            {/* Next Task & Last Updated */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5 min-w-0">
                <GitCommit className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span className="truncate">
                  Next Task: <strong className="text-[var(--text-primary)] font-medium">{project.nextTask}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[var(--text-muted)] shrink-0">
                <Calendar className="w-3 h-3" />
                <span>{project.lastUpdatedDate}</span>
              </div>
            </div>

            {/* Progress Bar & Continue Button */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--card-bg)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] hover:border-cyan-500/40 transition-colors shadow-sm active:scale-95 shrink-0"
              >
                <span>Continue</span>
                <ArrowRight className="w-3 h-3 text-cyan-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectProgressList;
