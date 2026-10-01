import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Sliders, Settings2, BookOpen, Target } from 'lucide-react';

/**
 * CoursesHeader
 * Top banner presenting title, target career focus, AI recommendation badge, and preferences shortcut
 */
export const CoursesHeader = ({
  targetRole = 'Machine Learning Engineer',
  recommendedCount = 8,
  onOpenPreferences,
}) => {
  const navigate = useNavigate();

  const handlePreferencesClick = () => {
    if (onOpenPreferences) {
      onOpenPreferences();
    } else {
      navigate('/settings');
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Learning Hub
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-3 h-3" />
            Personalized recommendations
          </span>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
          Build the skills that matter most for your target career with personalized learning recommendations.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          id="course-update-prefs-btn"
          type="button"
          onClick={handlePreferencesClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Update learning preferences</span>
        </button>
      </div>
    </div>
  );
};

export default CoursesHeader;
