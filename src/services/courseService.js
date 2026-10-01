/**
 * Course Service for PathForge AI
 * Manages course catalogs, personalized recommendations, and enrollment telemetry.
 */

import { apiClient } from './apiClient';
import { isMockMode } from '../config/dataMode';
import { ENDPOINTS } from '../config/api';
import { mockRecommendedCourses } from '../data/mockData';
import { normalizeCourses, normalizeCourse } from '../utils/normalizeCourses';

export const courseService = {
  /**
   * Fetch all recommended and core courses
   */
  async getCourses() {
    if (isMockMode()) {
      return Promise.resolve(normalizeCourses(mockRecommendedCourses));
    }

    const { data } = await apiClient.get(ENDPOINTS.COURSES.LIST);
    return normalizeCourses(data);
  },

  /**
   * Fetch single course details by ID
   */
  async getCourseDetail(courseId) {
    if (isMockMode()) {
      const match = mockRecommendedCourses.find(
        (c) => c.title.toLowerCase().replace(/\s+/g, '-') === courseId || c.id === courseId
      );
      return Promise.resolve(normalizeCourse(match || mockRecommendedCourses[0]));
    }

    const { data } = await apiClient.get(ENDPOINTS.COURSES.DETAIL(courseId));
    return normalizeCourse(data);
  },

  /**
   * Enroll in course
   */
  async enrollCourse(courseId) {
    if (isMockMode()) {
      return Promise.resolve({ success: true, courseId, status: 'Enrolled' });
    }

    const { data } = await apiClient.post(ENDPOINTS.COURSES.ENROLL(courseId));
    return data;
  },

  /**
   * Update course syllabus progress
   */
  async updateProgress(courseId, progressPercent) {
    if (isMockMode()) {
      return Promise.resolve({ success: true, courseId, progress: progressPercent });
    }

    const { data } = await apiClient.put(ENDPOINTS.COURSES.PROGRESS(courseId), {
      progress: progressPercent,
    });
    return data;
  },
};

export default courseService;
