import React from 'react';

export const COURSE_CATEGORIES = [
  'All',
  'Programming',
  'Machine Learning',
  'Deep Learning',
  'Mathematics',
  'SQL',
  'Deployment',
  'Professional Skills',
];

/**
 * CourseCategoryTabs
 * Horizontal scrollable category pill selector with counts
 */
export const CourseCategoryTabs = ({
  activeCategory = 'All',
  onSelectCategory,
  categoryCounts = {},
}) => {
  return (
    <div className="w-full overflow-x-auto pb-1 custom-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        {COURSE_CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          const count = categoryCounts[category] || 0;

          return (
            <button
              key={category}
              id={`course-cat-tab-${category.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onSelectCategory(category)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
              }`}
            >
              <span>{category}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CourseCategoryTabs;
