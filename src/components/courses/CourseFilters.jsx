import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { COURSE_CATEGORIES } from './CourseCategoryTabs';

export const COURSE_DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
export const COURSE_STATUSES = ['All', 'Not Started', 'In Progress', 'Completed'];
export const COURSE_SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'impact', label: 'Highest Skill Impact' },
  { value: 'duration', label: 'Shortest Duration' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'progress', label: 'Progress' },
];

/**
 * CourseFilters component
 * Advanced filtering and sorting toolbar for the learning hub
 */
export const CourseFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
  totalResults,
  onResetFilters,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedDifficulty !== 'All' ||
    selectedStatus !== 'All' ||
    sortBy !== 'recommended';

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
      {/* Top row: Search input + Sort selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            id="course-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by title, topic, or skill (e.g. Scikit-learn, Docker)..."
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              id="course-clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto min-w-[190px]">
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          <span className="text-xs text-[var(--text-muted)] font-medium">Sort:</span>
          <select
            id="course-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full py-2 px-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {COURSE_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Row: Category, Difficulty, Status dropdowns + Results & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Category Dropdown */}
          <select
            id="course-filter-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-2.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {COURSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {/* Difficulty Dropdown */}
          <select
            id="course-filter-difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="py-1.5 px-2.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {COURSE_DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                Difficulty: {diff}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            id="course-filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-2.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {COURSE_STATUSES.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>
        </div>

        {/* Results count & Clear */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-[var(--text-muted)] font-medium">
            Showing <strong className="text-[var(--text-primary)]">{totalResults}</strong> courses
          </span>

          {hasActiveFilters && (
            <button
              id="course-reset-filters-btn"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-medium py-1 px-2 rounded hover:bg-indigo-500/10 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Reset all</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseFilters;
