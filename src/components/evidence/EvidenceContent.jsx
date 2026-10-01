import React, { useState, useMemo } from 'react';
import { EvidenceHeader } from './EvidenceHeader';
import { EvidenceSummary } from './EvidenceSummary';
import { EvidenceFilters } from './EvidenceFilters';
import { EvidenceGrid } from './EvidenceGrid';
import { AddEvidenceModal } from './AddEvidenceModal';
import { EvidenceDetailsModal } from './EvidenceDetailsModal';
import { mockEvidenceVaultItems } from '../../data/mockData';

export const EvidenceContent = () => {
  const [items, setItems] = useState(mockEvidenceVaultItems);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [portfolioFilter, setPortfolioFilter] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Dynamic counts
  const totalCount = items.length;
  const verifiedCount = items.filter((i) => i.verificationStatus === 'Verified').length;
  const pendingCount = items.filter(
    (i) => i.verificationStatus === 'Pending Review' || i.verificationStatus === 'In Review'
  ).length;
  const portfolioReadyCount = items.filter((i) => i.portfolioReady).length;

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (typeFilter !== 'All') count += 1;
    if (statusFilter !== 'All') count += 1;
    if (portfolioFilter !== 'All') count += 1;
    if (sortBy !== 'recent') count += 1;
    return count;
  }, [searchQuery, typeFilter, statusFilter, portfolioFilter, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('All');
    setStatusFilter('All');
    setPortfolioFilter('All');
    setSortBy('recent');
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchSkill = item.relatedSkill?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchFile = item.fileName?.toLowerCase().includes(q);
          if (!matchTitle && !matchSkill && !matchDesc && !matchFile) return false;
        }

        // Type
        if (typeFilter !== 'All') {
          if (typeFilter === 'Project Repository') {
            if (item.type !== 'Project Repository' && item.type !== 'GitHub Repository') return false;
          } else if (typeFilter === 'Portfolio Link') {
            if (item.type !== 'Portfolio Link' && item.type !== 'Portfolio Project') return false;
          } else if (typeFilter === 'Internship Experience') {
            if (item.type !== 'Internship Experience' && item.type !== 'Internship Record') return false;
          } else if (item.type !== typeFilter) {
            return false;
          }
        }

        // Verification Status
        if (statusFilter !== 'All') {
          if (statusFilter === 'Pending Review') {
            if (item.verificationStatus !== 'Pending Review' && item.verificationStatus !== 'In Review') {
              return false;
            }
          } else if (statusFilter === 'Rejected') {
            if (item.verificationStatus !== 'Rejected' && item.verificationStatus !== 'Needs Revision') {
              return false;
            }
          } else if (item.verificationStatus !== statusFilter) {
            return false;
          }
        }

        // Portfolio Ready
        if (portfolioFilter !== 'All') {
          if (portfolioFilter === 'Portfolio Ready' && !item.portfolioReady) return false;
          if (portfolioFilter === 'Not Portfolio Ready' && item.portfolioReady) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          const dateA = new Date(a.dateAdded || a.submissionDate || 0).getTime();
          const dateB = new Date(b.dateAdded || b.submissionDate || 0).getTime();
          return dateB - dateA;
        }
        if (sortBy === 'oldest') {
          const dateA = new Date(a.dateAdded || a.submissionDate || 0).getTime();
          const dateB = new Date(b.dateAdded || b.submissionDate || 0).getTime();
          return dateA - dateB;
        }
        if (sortBy === 'verifiedFirst') {
          const score = (val) => (val.verificationStatus === 'Verified' ? 2 : val.verificationStatus === 'Pending Review' ? 1 : 0);
          return score(b) - score(a);
        }
        if (sortBy === 'type') {
          return a.type.localeCompare(b.type);
        }
        if (sortBy === 'skill') {
          return (a.relatedSkill || '').localeCompare(b.relatedSkill || '');
        }
        return 0;
      });
  }, [items, searchQuery, typeFilter, statusFilter, portfolioFilter, sortBy]);

  // Actions
  const handleAddEvidence = (newItem) => {
    setItems((prev) => [newItem, ...prev]);
  };

  const handleTogglePortfolioReady = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, portfolioReady: !item.portfolioReady } : item
      )
    );
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, portfolioReady: !prev.portfolioReady } : null));
    }
  };

  const handleUpdateEvidence = (updated) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (selectedItem && selectedItem.id === updated.id) {
      setSelectedItem(updated);
    }
  };

  const handleDeleteEvidence = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Evidence Header */}
      <EvidenceHeader
        totalCount={totalCount}
        verifiedCount={verifiedCount}
        pendingCount={pendingCount}
        portfolioReadyCount={portfolioReadyCount}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* 2. Evidence Summary Cards */}
      <EvidenceSummary
        total={totalCount}
        verified={verifiedCount}
        pending={pendingCount}
        portfolioReady={portfolioReadyCount}
      />

      {/* 3. Filters & Search */}
      <EvidenceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        portfolioFilter={portfolioFilter}
        onPortfolioFilterChange={setPortfolioFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* 4. Evidence Grid */}
      <EvidenceGrid
        items={filteredItems}
        onViewDetails={(item) => setSelectedItem(item)}
        hasActiveFilters={activeFilterCount > 0}
        onResetFilters={handleResetFilters}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Add Evidence Modal */}
      <AddEvidenceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEvidence={handleAddEvidence}
      />

      {/* Details & Actions Modal */}
      <EvidenceDetailsModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onTogglePortfolioReady={handleTogglePortfolioReady}
        onUpdateEvidence={handleUpdateEvidence}
        onDeleteEvidence={handleDeleteEvidence}
      />
    </div>
  );
};

export default EvidenceContent;
