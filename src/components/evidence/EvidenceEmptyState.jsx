import React from 'react';
import { SearchX, FolderPlus, RotateCcw } from 'lucide-react';

export const EvidenceEmptyState = ({
  hasActiveFilters = false,
  onResetFilters,
  onOpenAddModal,
}) => {
  return (
    <div className="p-8 sm:p-12 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm text-center space-y-4 max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
        {hasActiveFilters ? <SearchX className="w-7 h-7" /> : <FolderPlus className="w-7 h-7" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
          {hasActiveFilters ? 'No Matching Evidence Found' : 'No Evidence Deposited Yet'}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {hasActiveFilters
            ? 'We could not find any artifacts matching your active search and filter criteria. Try loosening the filter parameters or resetting.'
            : 'Start proving your expertise by adding project links, code repositories, course certificates, or mentor reviews to your cryptographic vault.'}
        </p>
      </div>

      <div className="pt-2 flex flex-wrap justify-center gap-2.5">
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Clear Filters</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Deposit First Artifact</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EvidenceEmptyState;
