/**
 * Dashboard Service for PathForge AI
 * Handles aggregation of live telemetry, next best actions, and recent activity.
 */

import { apiClient } from './apiClient';
import { isMockMode } from '../config/dataMode';
import { ENDPOINTS } from '../config/api';
import {
  mockUserData,
  mockSkills,
  mockRoadmapMilestones,
  mockLegacyActivities,
  mockRecommendedCourses,
  mockRecommendedProjects,
} from '../data/mockData';
import { companyMatchData } from '../data/companyMatchData';

export const dashboardService = {
  /**
   * Fetch complete telemetry overview for the command center
   */
  async getDashboardOverview() {
    if (isMockMode()) {
      return Promise.resolve({
        user: mockUserData,
        skills: mockSkills,
        milestones: mockRoadmapMilestones,
        activities: mockLegacyActivities,
        recommendedCourses: mockRecommendedCourses,
        recommendedProjects: mockRecommendedProjects,
        topCompanyMatches: companyMatchData.slice(0, 3),
      });
    }

    const { data } = await apiClient.get(ENDPOINTS.DASHBOARD);
    return data;
  },

  /**
   * Fetch company match summary widget for the dashboard
   */
  async getCompanyMatchSummary() {
    if (isMockMode()) {
      return Promise.resolve(companyMatchData.slice(0, 3));
    }

    const { data } = await apiClient.get(ENDPOINTS.COMPANY_MATCH.LIST, {
      params: { limit: 3 },
    });
    return data;
  },

  /**
   * Trigger recalculation of Next Best Action
   */
  async getNextBestAction() {
    if (isMockMode()) {
      return Promise.resolve(mockUserData.nextBestAction);
    }

    const { data } = await apiClient.get(`${ENDPOINTS.DASHBOARD}/next-action`);
    return data;
  },
};

export default dashboardService;
