import React from 'react';
import { Search, RotateCcw, Filter, SlidersHorizontal, X } from 'lucide-react';

const EVIDENCE_TYPES = [
  'All',
  'Certificate',
  'Project Repository',
  'Project Report',
  'Assessment Result',
  'Portfolio Link',
  'Mentor Validation',
  'Internship Experience',
  'Competition Achievement',
];

const STATUS_OPTIONS = ['All', 'Verified', 'Pending Review', 'Rejected'];

const PORTFOLIO_OPTIONS = ['All', 'Portfolio Ready', 'Not Portfolio Ready'];

const SORT_OPTIONS = [
  { label: 'Recently Added', value: 'recent' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Verified First', value: 'verifiedFirst' },
  { label: 'Evidence Type', value: 'type' },
  { label: 'Related Skill', value: 'skill' },
];

export const EvidenceFilters = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  portfolioFilter,
  onPortfolioFilterChange,
  sortBy,
  onSortByChange,
  onResetFilters,
  activeFilterCount = 0,
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
      {/* Top Search bar and Reset button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proof by title, skill, description, or filename..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Reset Filters CTA */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Select Dropdowns Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Evidence Type */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-500" />
            Evidence Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {EVIDENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Evidence Types' : t}
              </option>
            ))}
          </select>
        </div>

        {/* Verification Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-500" />
            Verification Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s}
              </option>
            ))}
          </select>
        </div>

        {/* Portfolio Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-500" />
            Portfolio Showcase
          </label>
          <select
            value={portfolioFilter}
            onChange={(e) => onPortfolioFilterChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {PORTFOLIO_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All Portfolio States' : p}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-amber-500" />
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default EvidenceFilters;
