import React, { useState, useMemo } from 'react';
import { SkillGapHeader } from './SkillGapHeader';
import { SkillGapSummary } from './SkillGapSummary';
import { RecommendedSkillAction } from './RecommendedSkillAction';
import { SkillCoverageVisual } from './SkillCoverageVisual';
import { SkillCategoryTabs } from './SkillCategoryTabs';
import { SkillGapMatrix } from './SkillGapMatrix';
import { SkillGapDetailsPanel } from './SkillGapDetailsPanel';
import { mockSkillGapData } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';

/**
 * SkillGapContent Component
 * Main coordinator for Stage 4: Skill Gap Intelligence.
 * Manages filtering, sorting, real-time search, interactive drawer details, and AI re-analysis.
 */
export const SkillGapContent = () => {
  const { addToast } = useToast();

  // Primary dataset from mockData
  const baseData = mockSkillGapData;

  // Interaction states
  const [selectedCategory, setSelectedCategory] = useState('All Skills');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [sortBy, setSortBy] = useState('gap');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState(baseData.lastAnalyzed);

  // Re-analyze mock handler
  const handleReanalyze = () => {
    setIsReanalyzing(true);
    setTimeout(() => {
      setIsReanalyzing(false);
      const now = new Date();
      const updatedTime = `Just now · ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      setLastAnalyzed(updatedTime);
      addToast(
        'AI Skill Analysis Complete',
        'Calibrated 12 competencies against latest Q3 Senior Machine Learning Engineer hiring requirements.',
        'success'
      );
    }, 1200);
  };

  // Open details for a specific skill
  const handleSelectSkill = (skill) => {
    // If selected via recommendation card, find full skill in dataset
    const fullSkill = baseData.skills.find((s) => s.id === skill.id) || skill;
    setSelectedSkill(fullSkill);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  // Compute category counts for tab badges
  const categoryTabs = useMemo(() => {
    const rawCategories = [
      'All Skills',
      'Programming',
      'Mathematics',
      'Machine Learning',
      'Deep Learning',
      'Data Engineering',
      'Deployment',
      'Professional Skills',
    ];

    return rawCategories.map((catName) => {
      if (catName === 'All Skills') {
        return { name: catName, count: baseData.skills.length };
      }
      const count = baseData.skills.filter((s) => s.category === catName).length;
      return { name: catName, count };
    });
  }, [baseData.skills]);

  // Filter & sort competencies
  const processedSkills = useMemo(() => {
    let result = [...baseData.skills];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.topics && s.topics.some((t) => t.toLowerCase().includes(q))) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    // 2. Category filter
    if (selectedCategory !== 'All Skills') {
      result = result.filter((s) => s.category === selectedCategory);
    }

    // 3. Priority filter
    if (selectedPriority !== 'All') {
      result = result.filter((s) => s.priority === selectedPriority);
    }

    // 4. Sorting logic
    result.sort((a, b) => {
      if (sortBy === 'gap') {
        return b.gap - a.gap;
      }
      if (sortBy === 'importance') {
        const weight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (weight[b.importance] || 0) - (weight[a.importance] || 0);
      }
      if (sortBy === 'current') {
        return b.currentScore - a.currentScore;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [baseData.skills, searchQuery, selectedCategory, selectedPriority, sortBy]);

  return (
    <div className="w-full space-y-8 pb-16 animate-fade-in">
      {/* 1. Page Header */}
      <section aria-label="Skill Intelligence Header">
        <SkillGapHeader
          targetRole={baseData.targetRole}
          lastAnalyzed={lastAnalyzed}
          totalSkills={baseData.totalSkills}
          overallCoverage={baseData.overallCoverage}
          onReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
        />
      </section>

      {/* 2. Executive Summary Cards */}
      <section aria-label="Executive Competency KPI Overview">
        <SkillGapSummary
          totalSkills={baseData.totalSkills}
          strongCount={baseData.strongSkillsCount}
          priorityGapsCount={baseData.priorityGapsCount}
          coverageScore={baseData.overallCoverage}
        />
      </section>

      {/* 3. Top Priority Focus Recommendations */}
      <section aria-label="Targeted High-Leverage Focus Recommendations">
        <RecommendedSkillAction
          recommendations={baseData.topPriorityGaps}
          onSelectSkill={handleSelectSkill}
        />
      </section>

      {/* 4. Domain Coverage Breakdown */}
      <section aria-label="Domain Category Coverage Breakdown">
        <SkillCoverageVisual
          categoryData={baseData.categoryCoverage}
          overallCoverage={baseData.overallCoverage}
        />
      </section>

      {/* 5. Main Skill Gap Matrix Section with Filter Controls */}
      <section aria-label="Skill Gap Matrix and Filters" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              Competency Evaluation Matrix
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Detailed breakdown of required thresholds versus verified production mastery.
            </p>
          </div>

          <span className="text-xs font-mono text-[var(--text-muted)] self-start sm:self-auto">
            Showing {processedSkills.length} of {baseData.skills.length} skills
          </span>
        </div>

        {/* Filter & Category Controls */}
        <SkillCategoryTabs
          categories={categoryTabs}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedPriority={selectedPriority}
          onSelectPriority={setSelectedPriority}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalResults={processedSkills.length}
        />

        {/* The Matrix Table / Cards */}
        <SkillGapMatrix
          skills={processedSkills}
          selectedSkill={selectedSkill}
          onSelectSkill={handleSelectSkill}
        />
      </section>

      {/* 6. Deep Dive Skill Details Panel / Drawer */}
      <SkillGapDetailsPanel
        skill={selectedSkill}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
};

export default SkillGapContent;
