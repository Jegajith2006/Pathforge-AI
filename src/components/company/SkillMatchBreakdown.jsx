import React, { useState, useMemo } from 'react';
import {
  BrainCircuit,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { SkillMatchRow } from './SkillMatchRow';
import { EmptyState } from '../common/EmptyState';

/**
 * SkillMatchBreakdown component
 * Filterable, searchable granular breakdown of all skills required for the selected role.
 */
export const SkillMatchBreakdown = ({
  skills = [],
  companyName = 'Company',
  roleTitle = 'Role',
  className = '',
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    'All',
    'Matched',
    'Close Match',
    'Needs Improvement',
    'Missing',
  ];

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      // Status filter
      if (activeFilter !== 'All' && skill.status !== activeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = skill.name.toLowerCase().includes(query);
        const matchesCat = skill.category?.toLowerCase().includes(query);
        return matchesName || matchesCat;
      }
      return true;
    });
  }, [skills, activeFilter, searchQuery]);

  const matchedCount = skills.filter((s) => s.status === 'Matched').length;
  const closeCount = skills.filter((s) => s.status === 'Close Match').length;

  return (
    <div
      className={`
        p-6
        rounded-2xl
        bg-[var(--card-bg)]
        border
        border-[var(--card-border)]
        space-y-5
        shadow-sm
        transition-colors
        duration-200
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 dark:text-cyan-400">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>COMPETENCY GAP MATRIX</span>
          </div>
          <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
            Skill Match Breakdown
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Detailed evaluation of required skills for {roleTitle} at {companyName}.
          </p>
        </div>

        <div className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
            <strong className="text-emerald-600 dark:text-emerald-400">{matchedCount + closeCount}</strong> of {skills.length} on target
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => {
            const count = tab === 'All' ? skills.length : skills.filter((s) => s.status === tab).length;
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`
                  px-3
                  py-1.5
                  rounded-xl
                  text-xs
                  font-medium
                  transition-all
                  cursor-pointer
                  flex
                  items-center
                  gap-1.5
                  whitespace-nowrap
                  ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/30'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                  }
                `}
              >
                <span>{tab}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full
              pl-9
              pr-3.5
              py-1.5
              rounded-xl
              text-xs
              bg-[var(--surface-secondary)]
              border
              border-[var(--border)]
              text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)]
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500/40
              transition-all
            "
          />
        </div>
      </div>

      {/* Skills List */}
      {filteredSkills.length > 0 ? (
        <div className="space-y-3">
          {filteredSkills.map((skill) => (
            <SkillMatchRow key={skill.id} skill={skill} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Filter}
          title="No skills found"
          description={`No skills matched the filter "${activeFilter}" ${searchQuery ? `or query "${searchQuery}"` : ''}.`}
          actionLabel="Reset Filters"
          onAction={() => {
            setActiveFilter('All');
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
};

export default SkillMatchBreakdown;
