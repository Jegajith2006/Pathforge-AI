import React from 'react';
import { EvidenceCard } from './EvidenceCard';
import { EvidenceEmptyState } from './EvidenceEmptyState';

export const EvidenceGrid = ({
  items = [],
  onViewDetails,
  hasActiveFilters = false,
  onResetFilters,
  onOpenAddModal,
}) => {
  if (items.length === 0) {
    return (
      <EvidenceEmptyState
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        onOpenAddModal={onOpenAddModal}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((item) => (
        <EvidenceCard
          key={item.id}
          item={item}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default EvidenceGrid;
