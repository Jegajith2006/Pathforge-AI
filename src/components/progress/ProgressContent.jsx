import React, { useState } from 'react';
import { ProgressHeader } from './ProgressHeader';
import { ProgressSummary } from './ProgressSummary';
import { ProgressChart } from './ProgressChart';
import { LearningHeatmap } from './LearningHeatmap';
import { SkillProgressOverview } from './SkillProgressOverview';
import { CourseProgressList } from './CourseProgressList';
import { ProjectProgressList } from './ProjectProgressList';
import { WeeklyGoalCard } from './WeeklyGoalCard';
import { LearningStreakCard } from './LearningStreakCard';
import { RecentActivity } from './RecentActivity';
import { useApp } from '../../context/AppContext';

export const ProgressContent = () => {
  const { user, activeCareer } = useApp();
  const [dateRange, setDateRange] = useState('This Week');

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Progress Header */}
      <ProgressHeader
        targetRole={activeCareer?.title || 'Machine Learning Engineer'}
        currentStreak={user?.learningStreakDays || 7}
        totalHours={86}
        overallProgress={42}
        lastActiveDate="Today, Sep 12, 2026"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* 2. Key Metrics Summary Cards */}
      <ProgressSummary
        overallProgress={42}
        overallProgressChange="+12% compared with last month"
        learningHours={86}
        learningHoursChange="+8 hrs this week"
        currentStreak={user?.learningStreakDays || 7}
        currentStreakChange="Personal record: 14 days"
        completedItems={18}
        completedItemsChange="9 courses, 5 projects, 4 assessments"
      />

      {/* 3. Main Dynamic Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Velocity Chart */}
          <ProgressChart />

          {/* GitHub-style Consistency Map */}
          <LearningHeatmap />

          {/* Skill Development Progress */}
          <SkillProgressOverview />

          {/* Active Courses List */}
          <CourseProgressList />

          {/* Active Capstone Projects List */}
          <ProjectProgressList />
        </div>

        {/* Right / Ancillary Column (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Weekly Learning Goal Card */}
          <WeeklyGoalCard initialGoal={8.0} initialCompleted={5.5} />

          {/* Learning Streak Card */}
          <LearningStreakCard
            currentStreak={user?.learningStreakDays || 7}
            longestStreak={14}
            lastActive="Today"
          />

          {/* Recent Activity Timeline */}
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default ProgressContent;
