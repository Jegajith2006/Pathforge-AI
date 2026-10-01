/**
 * Central API Configuration for PathForge AI
 * Prepares the frontend for future FastAPI backend & ML services integration.
 */

const rawApiUrl = (import.meta.env?.VITE_API_BASE_URL || '').trim();

// Do not assume an arbitrary external URL if not provided.
// If VITE_API_BASE_URL is not set, API_BASE_URL is empty string.
export const API_BASE_URL = rawApiUrl;

export const hasConfiguredApiUrl = Boolean(API_BASE_URL && API_BASE_URL.length > 0);

export const API_TIMEOUT = Number(import.meta.env?.VITE_API_TIMEOUT) || 10000;

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false,
};

/**
 * Standardized API Route Endpoints
 */
export const ENDPOINTS = {
  // Health & Diagnostics
  HEALTH: '/health',
  STATUS: '/api/status',

  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
  },

  // Dashboard
  DASHBOARD: '/api/dashboard',

  // Skills & Diagnostics
  SKILLS: {
    LIST: '/api/skills',
    GAP: '/api/skills/gap',
    DETAIL: (id) => `/api/skills/${id}`,
    UPDATE: (id) => `/api/skills/${id}`,
  },

  // Courses
  COURSES: {
    LIST: '/api/courses',
    RECOMMENDED: '/api/courses/recommended',
    DETAIL: (id) => `/api/courses/${id}`,
    ENROLL: (id) => `/api/courses/${id}/enroll`,
    PROGRESS: (id) => `/api/courses/${id}/progress`,
  },

  // Projects
  PROJECTS: {
    LIST: '/api/projects',
    RECOMMENDED: '/api/projects/recommended',
    DETAIL: (id) => `/api/projects/${id}`,
    SUBMIT: (id) => `/api/projects/${id}/submit`,
  },

  // Roadmap
  ROADMAP: {
    GET: '/api/roadmap',
    MILESTONES: '/api/roadmap/milestones',
    UPDATE_PHASE: (phaseId) => `/api/roadmap/${phaseId}`,
  },

  // Learning Progress & Velocity
  PROGRESS: {
    SUMMARY: '/api/progress',
    STREAK: '/api/progress/streak',
    HOURS: '/api/progress/hours',
  },

  // Evidence Vault
  EVIDENCE: {
    LIST: '/api/evidence',
    DETAIL: (id) => `/api/evidence/${id}`,
    UPLOAD: '/api/evidence/upload',
    VERIFY: (id) => `/api/evidence/${id}/verify`,
    DELETE: (id) => `/api/evidence/${id}`,
  },

  // Mentor Reviews & Rubrics
  MENTOR: {
    FEEDBACK: '/api/mentor-feedback',
    REQUEST_REVIEW: '/api/mentor-feedback/request',
    RUBRIC: (id) => `/api/mentor-feedback/rubric/${id}`,
  },

  // Career Readiness
  READINESS: {
    COMPOSITE: '/api/readiness',
    EXPLANATION: '/api/readiness/explain',
    FACTORS: '/api/readiness/factors',
  },

  // Company Match & Job Alignment
  COMPANY_MATCH: {
    LIST: '/api/company-matches',
    DETAIL: (company, role) => `/api/company-matches/${encodeURIComponent(company)}/${encodeURIComponent(role)}`,
    RECALCULATE: '/api/company-matches/recalculate',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    DELETE: (id) => `/api/notifications/${id}`,
    CLEAR_ALL: '/api/notifications/clear-all',
  },

  // Profile
  PROFILE: {
    GET: '/api/profile',
    UPDATE: '/api/profile',
  },

  // Settings
  SETTINGS: {
    GET: '/api/settings',
    UPDATE: '/api/settings',
  },
};

export default API_CONFIG;
