import React from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const FeedbackFilters = ({
  searchQuery = '',
  onSearchChange,
  statusFilter = 'All',
  onStatusChange,
  ratingFilter = 'All',
  onRatingChange,
  categoryFilter = 'All',
  onCategoryChange,
  onResetFilters,
  totalCount = 0,
  filteredCount = 0,
}) => {
  const statuses = ['All', 'New', 'Reviewed', 'Action Required', 'Resolved'];
  const categories = ['All', 'Skills', 'Courses', 'Projects', 'Career Readiness'];
  const ratings = [
    { label: 'All Ratings', value: 'All' },
    { label: '5.0 Stars', value: '5' },
    { label: '4.0+ Stars', value: '4' },
    { label: '3.9 or Below', value: '3' },
  ];

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    ratingFilter !== 'All' ||
    categoryFilter !== 'All';

  return (
    <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] space-y-4 shadow-xs">
      {/* Top row: Search and Reset */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search mentor name, project, or skill (e.g. 'Sarah', 'Fraud', 'FastAPI')..."
            icon={Search}
            className="w-full text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-[var(--text-secondary)]">
          <span>
            Showing <strong className="text-[var(--text-primary)]">{filteredCount}</strong> of {totalCount} reviews
          </span>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              leftIcon={RotateCcw}
              className="text-xs py-1 px-2.5 h-8"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Filter Chips row: Category & Status */}
      <div className="pt-2 border-t border-[var(--border)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider pr-1 shrink-0">
            Status:
          </span>
          {statuses.map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]/80'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* Dropdowns / Category & Rating selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider shrink-0">
              Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider shrink-0">
              Rating:
            </span>
            <select
              value={ratingFilter}
              onChange={(e) => onRatingChange(e.target.value)}
              className="bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {ratings.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
