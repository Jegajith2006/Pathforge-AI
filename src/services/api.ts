import axios from 'axios';
import {
  UserProfile,
  Skill,
  Course,
  Project,
  RoadmapStep,
  EvidenceItem,
  MentorFeedback,
  ReadinessBreakdown,
  CompanyComparison,
} from '../types';
import {
  mockUserProfile,
  mockSkills,
  mockCourses,
  mockProjects,
  mockRoadmapSteps,
  mockEvidenceItems,
  mockMentorFeedback,
  mockReadinessBreakdown,
  mockCompanies,
  generateHeatmapData,
  mockWeeklyHoursChart,
  mockCourseCompletionChart,
  mockSkillRadarData,
} from '../data/mockData';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Flag to switch between live API calls and mock data
const USE_MOCK = true;

export const apiService = {
  // User Profile
  async getUserProfile(): Promise<UserProfile> {
    if (USE_MOCK) return Promise.resolve(mockUserProfile);
    const { data } = await apiClient.get<UserProfile>('/api/profile');
    return data;
  },

  async updateUserCareerGoal(targetCareer: string): Promise<UserProfile> {
    if (USE_MOCK) {
      return Promise.resolve({
        ...mockUserProfile,
        targetCareer,
      });
    }
    const { data } = await apiClient.put<UserProfile>('/api/profile/career-goal', { targetCareer });
    return data;
  },

  // Skill Intelligence & Gap Analysis
  async getSkills(): Promise<Skill[]> {
    if (USE_MOCK) return Promise.resolve(mockSkills);
    const { data } = await apiClient.get<Skill[]>('/api/skills');
    return data;
  },

  async getSkillGapMatrix(): Promise<{
    strong: Skill[];
    developing: Skill[];
    missing: Skill[];
    overallMatch: number;
  }> {
    if (USE_MOCK) {
      return Promise.resolve({
        strong: mockSkills.filter((s) => s.status === 'strong'),
        developing: mockSkills.filter((s) => s.status === 'developing'),
        missing: mockSkills.filter((s) => s.status === 'missing'),
        overallMatch: 70,
      });
    }
    const { data } = await apiClient.get('/api/skills/gap-matrix');
    return data;
  },

  // Course Recommendations
  async getCourses(filter?: string): Promise<Course[]> {
    return this.getCourseRecommendations(filter);
  },

  async getCourseRecommendations(filter?: string): Promise<Course[]> {
    if (USE_MOCK) {
      if (!filter || filter === 'All') return Promise.resolve(mockCourses);
      if (filter === 'High-priority skills') return Promise.resolve(mockCourses.filter((c) => c.isHighPriority));
      return Promise.resolve(mockCourses.filter((c) => c.difficulty.toLowerCase() === filter.toLowerCase()));
    }
    const { data } = await apiClient.get<Course[]>('/api/recommendations/courses', {
      params: { filter },
    });
    return data;
  },

  // Project Recommendations
  async getProjects(): Promise<Project[]> {
    return this.getProjectRecommendations();
  },

  async getProjectRecommendations(): Promise<Project[]> {
    if (USE_MOCK) return Promise.resolve(mockProjects);
    const { data } = await apiClient.get<Project[]>('/api/recommendations/projects');
    return data;
  },

  // Roadmap
  async getRoadmap(): Promise<RoadmapStep[]> {
    if (USE_MOCK) {
      return Promise.resolve(mockRoadmapSteps);
    }
    const { data } = await apiClient.get<{ steps: RoadmapStep[] }>('/api/roadmap');
    return data.steps;
  },

  async getRoadmapDetails(): Promise<{ steps: RoadmapStep[]; completionPercentage: number }> {
    if (USE_MOCK) {
      return Promise.resolve({
        steps: mockRoadmapSteps,
        completionPercentage: 42,
      });
    }
    const { data } = await apiClient.get('/api/roadmap');
    return data;
  },

  async updateRoadmapStepStatus(stepId: string, status: RoadmapStep['status']): Promise<RoadmapStep> {
    if (USE_MOCK) {
      const step = mockRoadmapSteps.find((s) => s.id === stepId);
      if (!step) throw new Error('Step not found');
      return Promise.resolve({ ...step, status });
    }
    const { data } = await apiClient.patch<RoadmapStep>(`/api/roadmap/steps/${stepId}`, { status });
    return data;
  },

  // Progress & Learning Analytics
  async getHeatmapData() {
    if (USE_MOCK) {
      return Promise.resolve(generateHeatmapData());
    }
    const { data } = await apiClient.get('/api/progress/heatmap');
    return data;
  },

  async getProgressAnalytics() {
    if (USE_MOCK) {
      return Promise.resolve({
        weeklyHours: mockWeeklyHoursChart,
        courseCompletion: mockCourseCompletionChart,
        skillRadar: mockSkillRadarData,
        heatmap: generateHeatmapData(),
        stats: {
          totalHours: 148,
          coursesCompleted: 8,
          projectsCompleted: 4,
          currentStreak: 14,
          skillsImproved: 7,
        },
      });
    }
    const { data } = await apiClient.get('/api/progress');
    return data;
  },

  // Evidence Vault
  async getEvidence(): Promise<EvidenceItem[]> {
    return this.getEvidenceItems();
  },

  async getEvidenceItems(): Promise<EvidenceItem[]> {
    if (USE_MOCK) return Promise.resolve(mockEvidenceItems);
    const { data } = await apiClient.get<EvidenceItem[]>('/api/evidence');
    return data;
  },

  async submitEvidence(item: Omit<EvidenceItem, 'id' | 'submissionDate' | 'verificationStatus'>): Promise<EvidenceItem> {
    if (USE_MOCK) {
      const newItem: EvidenceItem = {
        id: `ev_${Date.now()}`,
        ...item,
        submissionDate: 'Just now',
        verificationStatus: 'Pending Review',
      };
      return Promise.resolve(newItem);
    }
    const { data } = await apiClient.post<EvidenceItem>('/api/evidence', item);
    return data;
  },

  // Mentor Feedback
  async getMentorFeedback(): Promise<MentorFeedback[]> {
    if (USE_MOCK) return Promise.resolve(mockMentorFeedback);
    const { data } = await apiClient.get<MentorFeedback[]>('/api/mentor/feedback');
    return data;
  },

  // Career Readiness Score
  async getReadinessBreakdown(): Promise<ReadinessBreakdown> {
    if (USE_MOCK) return Promise.resolve(mockReadinessBreakdown);
    const { data } = await apiClient.get<ReadinessBreakdown>('/api/readiness');
    return data;
  },

  // Company Match
  async getCompanyComparisons(): Promise<CompanyComparison[]> {
    if (USE_MOCK) return Promise.resolve(mockCompanies);
    const { data } = await apiClient.get<CompanyComparison[]>('/api/company-match');
    return data;
  },

  async getCompanyMatch(companyName: string, roleName?: string): Promise<CompanyComparison> {
    if (USE_MOCK) {
      const found = mockCompanies.find(
        (c) => c.companyName.toLowerCase() === companyName.toLowerCase()
      );
      return Promise.resolve(found || mockCompanies[0]);
    }
    const { data } = await apiClient.get<CompanyComparison>('/api/company-match/compare', {
      params: { company: companyName, role: roleName },
    });
    return data;
  },
};
