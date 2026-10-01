import React from 'react';
import { Filter, ArrowUpDown, Search, Layers } from 'lucide-react';

/**
 * SkillCategoryTabs Component
 * Provides responsive category chips, priority filters, search query, and sorting dropdown.
 */
export const SkillCategoryTabs = ({
  categories = [],
  selectedCategory = 'All Skills',
  onSelectCategory,
  priorityFilters = ['All', 'Critical', 'High', 'Medium', 'Low'],
  selectedPriority = 'All',
  onSelectPriority,
  sortBy = 'gap',
  onSortChange,
  searchQuery = '',
  onSearchChange,
  totalResults = 0,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Controls: Search and Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search competencies, frameworks, or topics..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Priority and Sort Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Priority filter dropdown */}
          <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-secondary)] font-medium hidden xs:inline">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => onSelectPriority(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] font-semibold focus:outline-none cursor-pointer text-xs"
              aria-label="Filter by priority level"
            >
              {priorityFilters.map((p) => (
                <option key={p} value={p} className="bg-[var(--surface)] text-[var(--text-primary)]">
                  {p === 'All' ? 'All Priorities' : `${p} Priority`}
                </option>
              ))}
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <span className="text-[var(--text-secondary)] font-medium hidden xs:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] font-semibold focus:outline-none cursor-pointer text-xs"
              aria-label="Sort skills by criteria"
            >
              <option value="gap" className="bg-[var(--surface)] text-[var(--text-primary)]">Largest Gap</option>
              <option value="importance" className="bg-[var(--surface)] text-[var(--text-primary)]">Highest Importance</option>
              <option value="current" className="bg-[var(--surface)] text-[var(--text-primary)]">Current Proficiency</option>
              <option value="name" className="bg-[var(--surface)] text-[var(--text-primary)]">Skill Name (A–Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Horizontal Filter Pills */}
      <div className="relative">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-500'
                    : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                }`}
                aria-pressed={isSelected}
              >
                <span>{cat.name}</span>
                {cat.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected
                        ? 'bg-indigo-700 text-white'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SkillCategoryTabs;
