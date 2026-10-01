import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, ArrowRight, Clock, Award, Play, ChevronRight, CheckCircle2 } from 'lucide-react';
import { mockDashboardProjects } from '../../data/mockData';

export const RecommendedProjects = () => {
  const navigate = useNavigate();

  const projects = mockDashboardProjects || [];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 font-mono">
              Portfolio Evidence Lab
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display leading-tight">
              Recommended Projects
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors self-start sm:self-center cursor-pointer"
        >
          <span>View All Projects</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {projects.map((project) => {
          const isInProgress = project.status === 'In Progress';

          return (
            <div
              key={project.id}
              className="group relative flex flex-col justify-between p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-indigo-500/40 hover:shadow-sm transition-all duration-200"
            >
              {/* Top details */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      isInProgress
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {project.status}
                  </span>

                  <span className="text-[10px] font-mono font-medium text-[var(--text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                    {project.duration}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                  {project.title}
                </h3>

                <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                  {project.summary}
                </p>

                {/* Skills Developed Tags */}
                <div className="mt-3">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-1.5 font-medium">
                    Skills Developed:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.skillsDeveloped.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => navigate('/projects')}
                  className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isInProgress
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      : 'bg-[var(--surface)] hover:bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border)]'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isInProgress ? 'fill-current' : ''}`} />
                  <span>{isInProgress ? 'Continue Project' : 'Start Project'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedProjects;
