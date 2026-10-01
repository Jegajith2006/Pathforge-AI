import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { CompanyRoleSelector } from '../components/company/CompanyRoleSelector';
import { MatchScoreCard } from '../components/company/MatchScoreCard';
import { PriorityGapCard } from '../components/company/PriorityGapCard';
import { SkillMatchBreakdown } from '../components/company/SkillMatchBreakdown';
import { MatchScoreBreakdown } from '../components/company/MatchScoreBreakdown';
import { RecommendedActionList } from '../components/company/RecommendedActionList';
import { CompanyComparisonCard } from '../components/company/CompanyComparisonCard';
import { CompanyComparisonTable } from '../components/company/CompanyComparisonTable';
import { CompanyDetailPanel } from '../components/company/CompanyDetailPanel';
import { EmptyState } from '../components/common/EmptyState';
import { companyMatchData, getCompanyMatch } from '../data/companyMatchData';
import {
  Building2,
  Briefcase,
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Info,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

/**
 * CompanyMatch page
 * Stage 9: Company Match and Job Readiness Comparison
 */
export const CompanyMatch = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven or state-driven selected company and role
  const urlCompany = searchParams.get('company') || 'Google';
  const urlRole = searchParams.get('role') || 'Machine Learning Engineer';

  const [selectedCompany, setSelectedCompany] = useState(urlCompany);
  const [selectedRole, setSelectedRole] = useState(urlRole);

  // Sync state when URL params change
  useEffect(() => {
    if (urlCompany) setSelectedCompany(urlCompany);
    if (urlRole) setSelectedRole(urlRole);
  }, [urlCompany, urlRole]);

  // Update URL params when selection changes
  const handleCompanyChange = (comp) => {
    setSelectedCompany(comp);
    setSearchParams({ company: comp, role: selectedRole });
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setSearchParams({ company: selectedCompany, role: role });
  };

  // Active target match data
  const currentMatch = useMemo(() => {
    return getCompanyMatch(selectedCompany, selectedRole);
  }, [selectedCompany, selectedRole]);

  // Comparison section controls
  const [comparisonSearch, setComparisonSearch] = useState('');
  const [readinessFilter, setReadinessFilter] = useState('All');
  const [sortBy, setSortBy] = useState('highest-score'); // 'highest-score' | 'lowest-score' | 'company-az' | 'role-az'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal inspection state
  const [inspectedOpportunity, setInspectedOpportunity] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filtered & sorted opportunities
  const filteredOpportunities = useMemo(() => {
    let list = [...companyMatchData];

    // Readiness tier filter
    if (readinessFilter !== 'All') {
      list = list.filter((item) => item.readinessLevel === readinessFilter);
    }

    // Search query filter
    if (comparisonSearch.trim()) {
      const q = comparisonSearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.company.toLowerCase().includes(q) ||
          item.role.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.team?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'highest-score') return b.matchScore - a.matchScore;
      if (sortBy === 'lowest-score') return a.matchScore - b.matchScore;
      if (sortBy === 'company-az') return a.company.localeCompare(b.company);
      if (sortBy === 'role-az') return a.role.localeCompare(b.role);
      return 0;
    });

    return list;
  }, [readinessFilter, comparisonSearch, sortBy]);

  const handleSelectOpportunity = (opp) => {
    setSelectedCompany(opp.company);
    setSelectedRole(opp.role);
    setSearchParams({ company: opp.company, role: opp.role });
    // Smooth scroll to top summary
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInspectOpportunity = (opp) => {
    setInspectedOpportunity(opp);
    setIsDetailModalOpen(true);
  };

  const readinessTiers = [
    'All',
    'Strong Match',
    'Developing Match',
    'Partial Match',
    'Early Stage',
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Company Match"
        description="Compare your current capabilities with the skills required for your target roles."
        badge="Mock career data"
        badgeVariant="cyan"
      />

      {/* Explanatory Context Banner */}
      <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-cyan-500/5 border border-indigo-500/20 dark:border-cyan-500/20 flex items-start gap-3 text-xs text-[var(--text-secondary)] shadow-sm">
        <Info className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-semibold text-[var(--text-primary)]">
            Explainable Job Readiness Intelligence
          </p>
          <p>
            Match scores and preparation timelines are calculated from your verified mock skill profile, course milestones, project code repositories, and mentor feedback. Select any target role to examine granular rubrics, priority gaps, and tailored acceleration steps.
          </p>
        </div>
      </div>

      {/* 2. Company & Role Dropdowns */}
      <CompanyRoleSelector
        selectedCompany={selectedCompany}
        selectedRole={selectedRole}
        onCompanyChange={handleCompanyChange}
        onRoleChange={handleRoleChange}
      />

      {/* 3. Selected Role Summary Card (Radial Gauge & Metrics) */}
      <MatchScoreCard match={currentMatch} />

      {/* 4. Main Two-Column Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Priority Gaps, Granular Breakdown, Score Calculation */}
        <div className="lg:col-span-2 space-y-8">
          {/* Priority Gaps to Close */}
          <PriorityGapCard
            gaps={currentMatch.priorityGaps}
            companyName={currentMatch.company}
          />

          {/* Granular Skill Match Breakdown */}
          <SkillMatchBreakdown
            skills={currentMatch.requiredSkills}
            companyName={currentMatch.company}
            roleTitle={currentMatch.role}
          />

          {/* Explainable Score Breakdown */}
          <MatchScoreBreakdown
            scoreBreakdown={currentMatch.scoreBreakdown}
            totalScore={currentMatch.matchScore}
          />
        </div>

        {/* Right 1 Column: Recommended Actions & Role Spec Context */}
        <div className="space-y-8">
          {/* Recommended Action Plan */}
          <RecommendedActionList
            recommendations={currentMatch.recommendations}
            companyName={currentMatch.company}
            roleTitle={currentMatch.role}
          />

          {/* Role Spec & Verified Strengths Quick Widget */}
          <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>KEY PROFILE ASSETS</span>
            </div>
            <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
              Verified Strengths for {currentMatch.company}
            </h3>
            <div className="space-y-2">
              {currentMatch.strengths?.map((str, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{str}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Compare Opportunities Section (Card Grid / Table View) */}
      <section className="space-y-6 pt-4 border-t border-[var(--border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 dark:text-cyan-400">
              <Layers className="w-3.5 h-3.5" />
              <span>MARKET OPPORTUNITY INTELLIGENCE</span>
            </div>
            <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">
              Compare Opportunities
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Explore how your current verified competencies measure up across tier-1 organizations and roles.
            </p>
          </div>

          {/* View Toggle: Grid vs Table */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer
                ${
                  viewMode === 'grid'
                    ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }
              `}
              aria-label="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer
                ${
                  viewMode === 'table'
                    ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }
              `}
              aria-label="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Filter, Search, and Sort Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
          {/* Readiness Tier Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            <span className="text-xs font-mono text-[var(--text-muted)] mr-1 hidden sm:inline">
              Tier:
            </span>
            {readinessTiers.map((tier) => {
              const count =
                tier === 'All'
                  ? companyMatchData.length
                  : companyMatchData.filter((m) => m.readinessLevel === tier).length;
              const isActive = readinessFilter === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setReadinessFilter(tier)}
                  className={`
                    px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5
                    ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/30'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                    }
                  `}
                >
                  <span>{tier}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search and Sort Dropdown */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 lg:w-56">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search company or role..."
                value={comparisonSearch}
                onChange={(e) => setComparisonSearch(e.target.value)}
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

            {/* Sort Selector */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="
                  appearance-none
                  pl-8
                  pr-8
                  py-1.5
                  rounded-xl
                  text-xs
                  font-medium
                  bg-[var(--surface-secondary)]
                  border
                  border-[var(--border)]
                  text-[var(--text-primary)]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-500/40
                  cursor-pointer
                "
              >
                <option value="highest-score">Highest Match</option>
                <option value="lowest-score">Lowest Match</option>
                <option value="company-az">Company (A-Z)</option>
                <option value="role-az">Role (A-Z)</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Opportunity List: Grid vs Table */}
        {filteredOpportunities.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOpportunities.map((opp) => (
                <CompanyComparisonCard
                  key={opp.id}
                  opportunity={opp}
                  isSelected={currentMatch.id === opp.id}
                  onSelect={handleSelectOpportunity}
                  onViewDetails={handleInspectOpportunity}
                />
              ))}
            </div>
          ) : (
            <CompanyComparisonTable
              opportunities={filteredOpportunities}
              selectedId={currentMatch.id}
              onSelect={handleSelectOpportunity}
              onViewDetails={handleInspectOpportunity}
            />
          )
        ) : (
          <EmptyState
            icon={Filter}
            title="No opportunities found"
            description={`No roles matched "${comparisonSearch}" with tier filter "${readinessFilter}".`}
            actionLabel="Reset Filters"
            onAction={() => {
              setReadinessFilter('All');
              setComparisonSearch('');
              setSortBy('highest-score');
            }}
          />
        )}
      </section>

      {/* 6. Company Role Detail Modal */}
      <CompanyDetailPanel
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        opportunity={inspectedOpportunity}
        onSetTarget={handleSelectOpportunity}
      />
    </div>
  );
};

export default CompanyMatch;
