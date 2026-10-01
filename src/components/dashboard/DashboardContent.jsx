import React from 'react';
import { WelcomeHeader } from './WelcomeHeader';
import { CareerGoalCard } from './CareerGoalCard';
import { ReadinessScoreCard } from './ReadinessScoreCard';
import { NextBestAction } from './NextBestAction';
import { SkillIntelligenceCard } from './SkillIntelligenceCard';
import { ProgressOverview } from './ProgressOverview';
import { RoadmapPreview } from './RoadmapPreview';
import { RecentActivity } from './RecentActivity';
import { RecommendedCourses } from './RecommendedCourses';
import { RecommendedProjects } from './RecommendedProjects';
import { CompanyMatchTeaser } from './CompanyMatchTeaser';
import { QuickActions } from './QuickActions';

/**
 * DashboardContent Component
 * AI Career Intelligence Command Center
 * Assembles all core command center modules into a responsive 12-column layout.
 */
export const DashboardContent = () => {
  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in">
      {/* 1. Welcome Header (Full Width - 12 cols) */}
      <section aria-label="Welcome and Trajectory Overview">
        <WelcomeHeader />
      </section>

      {/* 2. Quick Actions Workflow Bar */}
      <section aria-label="Quick Navigation Shortcuts">
        <QuickActions />
      </section>

      {/* 3, 4, 5. Top Command Center Tier: Career Goal, Readiness Score, Next Best Action */}
      <section
        aria-label="Core Career Readiness & Recommendation"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6"
      >
        {/* Career Goal Card (12 cols on mobile, 6 cols on md, 4 cols on xl) */}
        <div className="md:col-span-1 xl:col-span-4 flex flex-col">
          <CareerGoalCard />
        </div>

        {/* Readiness Score Card (12 cols on mobile, 6 cols on md, 4 cols on xl) */}
        <div className="md:col-span-1 xl:col-span-4 flex flex-col">
          <ReadinessScoreCard />
        </div>

        {/* Next Best Action Card (12 cols on mobile, full width on md, 4 cols on xl) */}
        <div className="md:col-span-2 xl:col-span-4 flex flex-col">
          <NextBestAction />
        </div>
      </section>

      {/* 6. Company Match Intelligence Teaser */}
      <section aria-label="Company Matching Intelligence">
        <CompanyMatchTeaser />
      </section>

      {/* 7, 8. Core Telemetry: Skill Intelligence & Velocity Progress */}
      <section
        aria-label="Competency Intelligence & Velocity Metrics"
        className="grid grid-cols-1 xl:grid-cols-12 gap-6"
      >
        {/* Skill Intelligence Constellation (12 cols on mobile/tablet, 7 cols on xl) */}
        <div className="xl:col-span-7 flex flex-col">
          <SkillIntelligenceCard />
        </div>

        {/* Progress Overview & Study Telemetry (12 cols on mobile/tablet, 5 cols on xl) */}
        <div className="xl:col-span-5 flex flex-col">
          <ProgressOverview />
        </div>
      </section>

      {/* 9, 10. Action & History: Roadmap Preview & Recent Activity */}
      <section
        aria-label="Curriculum Roadmap & Evidence Activity"
        className="grid grid-cols-1 xl:grid-cols-12 gap-6"
      >
        {/* Roadmap Preview (12 cols on mobile/tablet, 7 cols on xl) */}
        <div className="xl:col-span-7 flex flex-col">
          <RoadmapPreview />
        </div>

        {/* Recent Activity Audit Feed (12 cols on mobile/tablet, 5 cols on xl) */}
        <div className="xl:col-span-5 flex flex-col">
          <RecentActivity />
        </div>
      </section>

      {/* 11. Recommended Courses Section (Full Width - 12 cols) */}
      <section aria-label="Targeted Course Curriculum">
        <RecommendedCourses />
      </section>

      {/* 12. Recommended Projects Section (Full Width - 12 cols) */}
      <section aria-label="Portfolio Proofs and Projects">
        <RecommendedProjects />
      </section>
    </div>
  );
};

export default DashboardContent;
