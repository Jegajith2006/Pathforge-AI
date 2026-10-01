import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Clock, ArrowRight, Layers, Database, Cpu, Brain, ChevronRight } from 'lucide-react';
import { mockDashboardCourses } from '../../data/mockData';

export const RecommendedCourses = () => {
  const navigate = useNavigate();

  const courses = mockDashboardCourses || [];

  const getCourseIcon = (iconName) => {
    switch (iconName) {
      case 'Brain':
        return <Brain className="w-5 h-5 text-indigo-500" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-cyan-500" />;
      case 'Database':
        return <Database className="w-5 h-5 text-violet-500" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-emerald-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
              Curated Curriculum
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display leading-tight">
              Recommended Courses
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors self-start sm:self-center cursor-pointer"
        >
          <span>Browse Catalog (18 courses)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Responsive Horizontal Grid of Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {courses.map((course) => {
          const hasProgress = course.progress > 0;

          return (
            <div
              key={course.id}
              className="group relative flex flex-col justify-between p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-indigo-500/40 hover:shadow-sm transition-all duration-200"
            >
              {/* Top info */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-2xs">
                    {getCourseIcon(course.icon)}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] font-medium">
                    {course.difficulty}
                  </span>
                </div>

                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 font-mono block mb-1">
                  {course.category}
                </span>

                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs text-[var(--text-muted)] mt-1">
                  by {course.provider}
                </p>
              </div>

              {/* Progress & Duration */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                    {course.duration}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {course.progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => navigate('/courses')}
                  className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    hasProgress
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      : 'bg-[var(--surface)] hover:bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border)]'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${hasProgress ? 'fill-current' : ''}`} />
                  <span>{hasProgress ? 'Continue' : 'Start Course'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedCourses;
