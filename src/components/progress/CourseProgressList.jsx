import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Clock, PlayCircle } from 'lucide-react';
import { mockCoursesInProgress } from '../../data/mockData';

export const CourseProgressList = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
              Courses in Progress
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Curricula aligned directly with target career roadmap milestones.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
        >
          <span>View All Courses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Course Cards List */}
      <div className="space-y-3">
        {mockCoursesInProgress.map((course) => (
          <div
            key={course.id}
            className="p-4 rounded-xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] hover:border-indigo-500/30 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {course.provider}
                </span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] font-display">
                  {course.title}
                </h4>
              </div>

              <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 self-start sm:self-auto">
                {course.progress}% Complete
              </span>
            </div>

            {/* Current Lesson */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5 min-w-0">
                <PlayCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate font-medium text-[var(--text-primary)]">
                  {course.currentLesson}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[var(--text-muted)] shrink-0">
                <Clock className="w-3 h-3" />
                <span>{course.estimatedRemainingTime}</span>
              </div>
            </div>

            {/* Progress Bar & Continue Button */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${course.progress}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm active:scale-95 shrink-0"
              >
                <span>Continue</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseProgressList;
