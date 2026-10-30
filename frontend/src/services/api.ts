/**
 * PathForge AI Frontend API Client
 * Centralized service layer connecting React frontend to the FastAPI backend.
 */

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).__PATHFORGE_API_URL__) {
    return (window as any).__PATHFORGE_API_URL__;
  }
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // If running in browser on Vite dev server (port 5173 or 5174), use relative URL to leverage Vite proxy seamlessly
  if (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174')) {
    return '';
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('pathforge_token') : null;
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('pathforge_token');
    }
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pathforge_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pathforge_token');
    }
  }

  logout() {
    this.clearToken();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutMs = 12000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[PathForge API Client] Request to ${endpoint} failed:`, err);
      if (err.name === 'AbortError') {
        throw new Error(`Request to ${endpoint} timed out after ${timeoutMs / 1000}s. Please ensure the backend server is reachable.`);
      }
      if (err instanceof TypeError && (err.message === 'Failed to fetch' || err.message.includes('fetch'))) {
        throw new Error('Unable to connect to PathForge AI backend (http://127.0.0.1:8000). Please ensure the backend server is running.');
      }
      throw err;
    }
  }

  // Health
  async getHealth() {
    return this.request<{ status: string; version?: string; database?: string }>('/api/health');
  }

  // Auth & Recovery
  async login(payload: { email: string; password: string }) {
    const data = await this.request<{ access_token: string; student_id: string; user_id?: string; role?: string; email: string; name: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.access_token);
    return data;
  }

  async adminLogin(payload: { email: string; password: string }) {
    const data = await this.request<{ access_token: string; student_id?: string; user_id?: string; role?: string; email: string; name: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(payload: any) {
    const data = await this.request<{ access_token: string; student_id: string; email: string; name: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.access_token);
    return data;
  }

  async registerStudent(payload: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    confirm_password?: string;
    college?: string;
    department?: string;
    degree?: string;
    graduation_year?: number;
    target_career_id?: string;
    terms_agreed?: boolean;
  }) {
    const data = await this.request<{
      access_token: string;
      token_type: string;
      student_id?: string;
      user_id?: string;
      role: string;
      email: string;
      name: string;
      message?: string;
      status?: string;
      challenge_id?: string;
    }>('/api/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async registerMentor(payload: {
    name: string;
    email: string;
    password: string;
    confirm_password?: string;
    title: string;
    experience_years?: number;
    expertise_areas?: string[];
    company?: string;
    linkedin_url?: string;
    verification_document?: string;
    verification_notes?: string;
    bio?: string;
    terms_agreed?: boolean;
  }) {
    const data = await this.request<{
      access_token: string;
      token_type: string;
      mentor_id?: string;
      student_id?: string;
      user_id?: string;
      role: string;
      email: string;
      name: string;
      message?: string;
      status?: string;
      challenge_id?: string;
      verification_status?: string;
    }>('/api/auth/register/mentor', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async uploadMentorVerificationFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/register/mentor/upload-verification`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || `Upload failed: ${response.statusText}`);
    }
    return await response.json() as {
      status: string;
      file_name: string;
      original_name: string;
      file_size: number;
      message: string;
    };
  }

  async verifyEmail(payload: { challenge_id: string; otp: string; email?: string }) {
    const data = await this.request<{
      access_token: string;
      token_type: string;
      student_id?: string;
      user_id?: string;
      role: string;
      email: string;
      name: string;
    }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.access_token);
    return data;
  }

  async resendVerification(payload: { challenge_id: string; email?: string }) {
    return this.request<{ message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async forgotPassword(payload: { email: string }) {
    return this.request<{
      status: string;
      message: string;
      challenge_id?: string;
      email: string;
    }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyResetOtp(payload: { challenge_id: string; otp: string; email?: string }) {
    return this.request<{
      status: string;
      reset_token: string;
      message: string;
    }>('/api/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetPassword(payload: {
    challenge_id: string;
    reset_token?: string;
    new_password: string;
    confirm_password?: string;
  }) {
    return this.request<{ status: string; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMe() {
    return this.request<any>('/api/auth/me');
  }

  // Admin APIs
  async getAdminDashboardStats() {
    return this.request<{
      total_students: number;
      total_mentors: number;
      pending_mentors?: number;
      approved_mentors?: number;
      rejected_mentors?: number;
      total_users: number;
      total_feedback: number;
      average_rating: number;
      platform_feedback_count: number;
      mentor_feedback_count: number;
      active_sessions: number;
    }>('/api/admin/dashboard-stats');
  }

  async getAdminUsers() {
    return this.request<any[]>('/api/admin/users');
  }

  async getAdminStudents(params?: { search?: string; page?: number; limit?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.status) q.append('status', params.status);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return this.request<{
      items: any[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    }>(`/api/admin/students${queryString}`);
  }

  async getAdminStudentDetail(studentId: string) {
    return this.request<{
      profile: any;
      courses: any[];
      assessments: any[];
      skills: any[];
      certificates: any[];
      feedbacks: any[];
    }>(`/api/admin/students/${encodeURIComponent(studentId)}`);
  }

  async removeAdminStudent(studentId: string) {
    return this.request<{ status: string; message: string; student_id: string }>(
      `/api/admin/students/${encodeURIComponent(studentId)}`,
      { method: 'DELETE' }
    );
  }

  async reactivateAdminStudent(studentId: string) {
    return this.request<{ status: string; message: string; student_id: string }>(
      `/api/admin/students/${encodeURIComponent(studentId)}/reactivate`,
      { method: 'POST' }
    );
  }

  async getAdminMentors(params?: { search?: string; page?: number; limit?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.status) q.append('status', params.status);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return this.request<{
      items: any[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    }>(`/api/admin/mentors${queryString}`);
  }

  async getAdminMentorDetail(mentorId: string) {
    return this.request<{
      profile: any;
      mentees: any[];
      sessions: any[];
      feedbacks: any[];
      total_sessions: number;
      active_mentees: number;
    }>(`/api/admin/mentors/${encodeURIComponent(mentorId)}`);
  }

  async removeAdminMentor(mentorId: string) {
    return this.request<{ status: string; message: string; mentor_id: string }>(
      `/api/admin/mentors/${encodeURIComponent(mentorId)}`,
      { method: 'DELETE' }
    );
  }

  async reactivateAdminMentor(mentorId: string) {
    return this.request<{ status: string; message: string; mentor_id: string }>(
      `/api/admin/mentors/${encodeURIComponent(mentorId)}/reactivate`,
      { method: 'POST' }
    );
  }

  async getMentorVerificationQueue(params?: { search?: string; page?: number; limit?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.status) q.append('status', params.status);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return this.request<{
      items: any[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      counts: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
      };
    }>(`/api/admin/mentors/verification-queue${queryString}`);
  }

  async approveMentorApplication(mentorId: string) {
    return this.request<{ status: string; message: string; mentor_id: string; verification_status: string }>(
      `/api/admin/mentors/${encodeURIComponent(mentorId)}/approve`,
      { method: 'POST' }
    );
  }

  async rejectMentorApplication(mentorId: string, reason?: string) {
    return this.request<{ status: string; message: string; mentor_id: string; verification_status: string; rejection_reason?: string }>(
      `/api/admin/mentors/${encodeURIComponent(mentorId)}/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Application could not be verified' }),
      }
    );
  }

  async getMentorProofDocument(mentorId: string) {
    return this.request<any>(`/api/admin/mentors/${encodeURIComponent(mentorId)}/proof`);
  }

  async getAdminStudentProgress(studentId: string) {
    return this.request<any>(`/api/admin/student-progress/${encodeURIComponent(studentId)}`);
  }

  async getAdminFeedback() {
    return this.request<{ platform_feedback: any[]; mentor_feedback: any[] }>('/api/admin/feedback');
  }

  async getAdminStats() {
    return this.request<any>('/api/admin/system-stats');
  }

  // Profile
  async getProfile() {
    return this.request<any>('/api/profile');
  }

  async updateProfile(payload: any) {
    return this.request<any>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getPreferences() {
    return this.request<any>('/api/profile/preferences');
  }

  async changePassword(payload: { current_password: string; new_password: string; confirm_password: string }) {
    return this.request<any>('/api/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProfileSkills() {
    return this.request<any[]>('/api/profile/skills');
  }

  // Dashboard
  async getDashboard() {
    return this.request<any>('/api/dashboard');
  }

  // Careers
  async getCareers(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category && category !== 'All' && category !== 'All roles') params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/api/careers${qs}`);
  }

  async getCareer(careerId: string) {
    return this.request<any>(`/api/careers/${careerId}`);
  }

  async selectCareer(careerId: string) {
    return this.request<{ message: string }>('/api/career/select', {
      method: 'POST',
      body: JSON.stringify({ career_id: careerId }),
    });
  }

  async getCurrentCareer() {
    return this.request<any>('/api/career/current');
  }

  async getCareerSkills(careerId: string) {
    return this.request<{ career_id: string; career_name: string; skills: any[] }>(`/api/careers/${careerId}/skills`);
  }

  // Skills Master Ontology
  async getSkills(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/api/skills${qs}`);
  }

  async getSkill(skillId: string) {
    return this.request<any>(`/api/skills/${skillId}`);
  }

  // Skill Gap & Mastery
  async getSkillGap() {
    return this.request<any>('/api/skill-gap');
  }

  async getSkillsMastery() {
    return this.request<any[]>('/api/skills/mastery');
  }

  async getCareerReadiness() {
    return this.request<any>('/api/career-readiness');
  }

  async getCareerReadinessBreakdown() {
    return this.request<any>('/api/career-readiness/breakdown');
  }

  async getCareerAgenda(careerId: string) {
    return this.request<any>(`/api/careers/${careerId}/agenda`);
  }

  async getCareerProgress(careerId: string) {
    return this.request<any>(`/api/careers/${careerId}/progress`);
  }

  // Roadmap
  async getRoadmap() {
    return this.request<any>('/api/roadmap');
  }

  async getRoadmapSchedule() {
    return this.request<any>('/api/roadmap/schedule');
  }

  async updateRoadmapPreferences(hoursPerWeek: number) {
    return this.request<any>('/api/roadmap/preferences', {
      method: 'PUT',
      body: JSON.stringify({ weekly_learning_hours: hoursPerWeek }),
    });
  }

  async regenerateRoadmap() {
    return this.request<any>('/api/roadmap/generate', { method: 'POST' });
  }

  async completeRoadmapStep(stepId: number) {
    return this.request<{ message: string }>(`/api/roadmap/${stepId}/complete`, { method: 'POST' });
  }

  // Courses
  async getCourses(filters?: {
    category?: string;
    difficulty?: string;
    career_id?: string;
    search?: string;
    priority?: string;
    view_all?: boolean;
    skip?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.career_id) params.append('career_id', filters.career_id);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.view_all !== undefined) params.append('view_all', String(filters.view_all));
    if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/api/courses${qs}`);
  }

  async getCourse(courseId: string) {
    return this.request<any>(`/api/courses/${courseId}`);
  }

  async getCourseSkills(courseId: string) {
    return this.request<{ course_id: string; course_name: string; skills: any[] }>(`/api/courses/${courseId}/skills`);
  }

  async getCourseRecommendations(careerId?: string) {
    const qs = careerId ? `?career_id=${encodeURIComponent(careerId)}` : '';
    return this.request<any[]>(`/api/courses/recommendations${qs}`);
  }

  async getCourseProgress(courseId: string) {
    return this.request<any>(`/api/courses/${courseId}/progress`);
  }

  async updateCourseProgress(courseId: string, progressPercentage: number, details?: { current_lesson_id?: string; current_lesson_title?: string; completed_lessons?: string[]; position_seconds?: number }) {
    return this.request<{ message: string; resume_suggestion?: any }>(`/api/courses/${courseId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress_percentage: progressPercentage, ...details }),
    });
  }

  async completeCourse(courseId: string) {
    return this.request<{ message: string; resume_suggestion?: any }>(`/api/courses/${courseId}/complete`, {
      method: 'POST',
    });
  }

  async getCourseSyllabus(courseId: string) {
    return this.request<any>(`/api/courses/${courseId}/syllabus`);
  }

  async getCourseLesson(courseId: string, lessonId: string) {
    return this.request<any>(`/api/courses/${courseId}/lessons/${lessonId}`);
  }

  async getLessonStudyGuide(courseId: string, lessonId: string, resourceId?: string) {
    const endpoint = resourceId
      ? `/api/courses/${courseId}/lessons/${lessonId}/study-guide/${resourceId}`
      : `/api/courses/${courseId}/lessons/${lessonId}/study-guide`;
    return this.request<any>(endpoint);
  }

  async reviewLessonResource(courseId: string, lessonId: string, resourceId: string) {
    return this.request<{
      status: string;
      message: string;
      resources_reviewed: string[];
      reviewed_count: number;
      total_required: number;
      is_assessment_unlocked: boolean;
    }>(`/api/courses/${courseId}/lessons/${lessonId}/review-resource`, {
      method: 'POST',
      body: JSON.stringify({ resource_id: resourceId }),
    });
  }

  async completeCourseLesson(courseId: string, lessonId: string, assessmentPassed?: boolean) {
    return this.request<any>(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ assessment_passed: assessmentPassed }),
    });
  }

  async getUnifiedRecommendations() {
    return this.request<any>('/api/recommendations');
  }

  // Projects
  async getProjects(filters?: { difficulty?: string; career_id?: string }) {
    const params = new URLSearchParams();
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.career_id) params.append('career_id', filters.career_id);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/api/projects${qs}`);
  }

  async getProject(projectId: string) {
    return this.request<any>(`/api/projects/${projectId}`);
  }

  async getProjectSkills(projectId: string) {
    return this.request<{ project_id: string; project_name: string; skills: any[] }>(`/api/projects/${projectId}/skills`);
  }

  async getProjectRecommendations() {
    return this.request<any[]>('/api/projects/recommendations');
  }

  async startProject(projectId: string) {
    return this.request<{ message: string }>(`/api/projects/${projectId}/start`, { method: 'POST' });
  }

  async updateProjectProgress(projectId: string, progressPercentage: number, githubUrl?: string) {
    return this.request<{ message: string }>(`/api/projects/${projectId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress_percentage: progressPercentage, github_url: githubUrl }),
    });
  }

  // Resume Analyzer & History
  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/resume/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || `Upload failed: ${response.statusText}`);
    }
    return await response.json();
  }

  async analyzeResume() {
    return this.request<any>('/api/resume/analyze', { method: 'POST' });
  }

  async getLatestResume() {
    return this.request<any>('/api/resume/latest');
  }

  async getResumeHistory() {
    return this.request<any[]>('/api/resume/history');
  }

  async getResumeById(resumeId: string) {
    return this.request<any>(`/api/resume/${resumeId}`);
  }

  async reanalyzeResume(resumeId: string) {
    return this.request<any>(`/api/resume/${resumeId}/reanalyze`, { method: 'POST' });
  }

  async deleteResume(resumeId: string) {
    return this.request<{ message: string }>(`/api/resume/${resumeId}`, { method: 'DELETE' });
  }

  async downloadResume(resumeId: string, filename: string = 'resume.pdf') {
    const url = `${API_BASE_URL}/api/resume/${resumeId}/download`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }

  async getResumeSuggestions() {
    return this.request<any[]>('/api/resume/suggestions');
  }

  async approveResumeSuggestion(suggestionId: string) {
    return this.request<{ message: string }>(`/api/resume/suggestions/${suggestionId}/approve`, { method: 'POST' });
  }

  async dismissResumeSuggestion(suggestionId: string) {
    return this.request<{ message: string }>(`/api/resume/suggestions/${suggestionId}/dismiss`, { method: 'POST' });
  }

  async getResumeProfileEntries() {
    return this.request<any[]>('/api/resume/profile-entries');
  }

  async getResumeSkills(resumeId?: string) {
    const path = resumeId ? `/api/resume/${resumeId}/skills` : '/api/resume/skills';
    return this.request<any[]>(path);
  }

  async getResumeProjects(resumeId?: string) {
    const path = resumeId ? `/api/resume/${resumeId}/projects` : '/api/resume/projects';
    return this.request<any>(path);
  }

  async getResumeCertificates(resumeId?: string) {
    const path = resumeId ? `/api/resume/${resumeId}/certificates` : '/api/resume/certificates';
    return this.request<any>(path);
  }

  async getResumeExperience(resumeId?: string) {
    const path = resumeId ? `/api/resume/${resumeId}/experience` : '/api/resume/experience';
    return this.request<any>(path);
  }


  // Gemini AI Assistant Services
  async aiChat(message: string) {
    return this.request<{ response: string; target_career: string; readiness_score: number }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async generateCoverLetter(roleTitle: string, companyName: string) {
    return this.request<{ cover_letter: string; student_name: string; role_title: string; company_name: string; skills_included: string[] }>('/api/ai/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ role_title: roleTitle, company_name: companyName }),
    });
  }

  async explainRoadmap(careerId?: string) {
    return this.request<{ explanation: string; target_career: string; milestones_count: number }>('/api/ai/explain-roadmap', {
      method: 'POST',
      body: JSON.stringify({ career_id: careerId }),
    });
  }

  async explainProject(projectName: string, skillsDeveloped: string[], targetCareer?: string) {
    return this.request<any>('/api/ai/explain-project', {
      method: 'POST',
      body: JSON.stringify({ project_name: projectName, skills_developed: skillsDeveloped, target_career: targetCareer }),
    });
  }

  async generateAssessmentQuestion(skillName: string, careerName?: string) {
    return this.request<any>('/api/ai/generate-question', {
      method: 'POST',
      body: JSON.stringify({ skill_name: skillName, career_name: careerName }),
    });
  }

  // Assessment
  async getAssessmentOverview() {
    return this.request<any>('/api/assessment');
  }

  async startAssessment(
    careerIdOrPayload?: string | { career_id?: string; skill_id?: string; course_id?: string; lesson_id?: string; limit?: number },
    skillId?: string,
    courseId?: string,
    lessonId?: string
  ) {
    const body = typeof careerIdOrPayload === 'object' && careerIdOrPayload !== null
      ? careerIdOrPayload
      : { career_id: careerIdOrPayload, skill_id: skillId, course_id: courseId, lesson_id: lessonId };
    return this.request<any>('/api/assessment/start', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getSkillProgression(careerId?: string) {
    const qs = careerId ? `?career_id=${encodeURIComponent(careerId)}` : '';
    return this.request<any>(`/api/skills/progression${qs}`);
  }

  async submitAssessment(
    assessmentIdOrPayload: string | { assessment_id: string; answers: any[]; course_id?: string; lesson_id?: string },
    answers?: { question_id: string; selected_answer?: string; selected_option?: string; time_taken_seconds?: number }[],
    courseId?: string,
    lessonId?: string
  ) {
    const body = typeof assessmentIdOrPayload === 'object' && assessmentIdOrPayload !== null
      ? assessmentIdOrPayload
      : { assessment_id: assessmentIdOrPayload, answers, course_id: courseId, lesson_id: lessonId };
    return this.request<any>('/api/assessment/submit', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getAssessmentHistory() {
    return this.request<any[]>('/api/assessment/history');
  }

  // Mentor & Mentorship (Student view)
  async getMentors(params?: {
    search?: string;
    query?: string;
    skill?: string;
    specialization?: string;
    expertise?: string;
    min_experience?: number;
    availability?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.query) searchParams.append('query', params.query);
    if (params?.skill) searchParams.append('skill', params.skill);
    if (params?.specialization) searchParams.append('specialization', params.specialization);
    if (params?.expertise) searchParams.append('expertise', params.expertise);
    if (params?.min_experience !== undefined && params?.min_experience !== null) {
      searchParams.append('min_experience', String(params.min_experience));
    }
    if (params?.availability) searchParams.append('availability', params.availability);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<any[]>(`/api/mentors${qs}`);
  }

  async getMentorById(mentorId: string) {
    return this.request<any>(`/api/mentors/${mentorId}`);
  }

  async getMentorFeedback() {
    return this.request<any[]>('/api/mentor/feedback');
  }

  async requestMentorship(payload: { mentor_id: string; message?: string; career_goal?: string; topic?: string; preferred_date?: string }) {
    return this.request<{ message: string; request_id: string; status: string }>('/api/mentor/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getStudentMentorshipRequests() {
    return this.request<any[]>('/api/student/mentorship-requests');
  }

  async cancelMentorshipRequest(requestId: string) {
    return this.request<{ message: string; request_id: string }>(`/api/student/mentorship-requests/${requestId}`, {
      method: 'DELETE',
    });
  }

  async getStudentSessions(status?: string) {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<any[]>(`/api/student/sessions${qs}`);
  }

  async getStudentSessionDetail(sessionId: string) {
    return this.request<any>(`/api/student/sessions/${sessionId}`);
  }

  async createStudentSession(payload: {
    mentor_id: string;
    topic: string;
    session_date: string;
    start_time: string;
    end_time: string;
    platform?: string;
    meeting_link?: string;
    notes?: string;
  }) {
    return this.request<{ message: string; data?: any }>('/api/student/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async cancelStudentSession(sessionId: string, reason?: string) {
    return this.request<{ message: string }>(`/api/student/sessions/${sessionId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async rescheduleStudentSession(
    sessionId: string,
    payload: {
      session_date: string;
      start_time: string;
      end_time: string;
      meeting_link?: string;
      notes?: string;
    }
  ) {
    return this.request<{ message: string }>(`/api/student/sessions/${sessionId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getStudentMyMentors() {
    return this.request<any[]>('/api/student/my-mentors');
  }

  async getStudentNotifications() {
    return this.request<any[]>('/api/student/notifications');
  }

  async markStudentNotificationRead(notificationId: string) {
    return this.request<{ message: string }>(`/api/student/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllStudentNotificationsRead() {
    return this.request<{ message: string }>('/api/student/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // Companies & Jobs
  async getCompanies(search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/api/companies${qs}`);
  }

  async getJobs(search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/api/jobs${qs}`);
  }

  // Certificates
  async getCertificates() {
    return this.request<any[]>('/api/certificates');
  }

  async uploadCertificate(payload: { provider: string; course_name: string; skill_id: string; certificate_url?: string }) {
    return this.request<{ message: string }>('/api/certificates/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Activity & Feedback
  async getRecentActivity(limit = 10) {
    return this.request<any[]>(`/api/activity?limit=${limit}`);
  }

  async getActivityCalendar(year?: number, month?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request<{
      student_id: string;
      selected_year: number;
      selected_month?: number;
      available_years: number[];
      total_activities: number;
      active_days: number;
      current_streak: number;
      longest_streak: number;
      daily_counts: Record<string, number>;
      daily_details: Record<string, Array<{ type: string; name: string; duration_minutes: number }>>;
      intensity_thresholds: Record<number, string | number>;
    }>(`/api/activity/calendar${q}`);
  }

  async getActivityHeatmap() {
    return this.request<any>('/api/activity/heatmap');
  }

  async getActivityStats() {
    return this.request<any>('/api/activity/stats');
  }

  async submitFeedback(payload: { category: string; rating: number; comment: string; issue_type?: string }) {
    return this.request<{ message: string }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getFeedbackList() {
    return this.request<any[]>('/api/feedback');
  }

  async updatePreferences(payload: { weekly_learning_hours?: number; preferred_difficulty?: string; learning_mode?: string }) {
    return this.request<{ message: string }>('/api/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // ==========================================
  // MENTOR PORTAL ENDPOINTS
  // ==========================================

  async getMentorDashboard() {
    return this.request<any>('/api/mentor/dashboard');
  }

  async getMentorStudents(search?: string, careerFilter?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (careerFilter) params.append('career_filter', careerFilter);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/api/mentor/students${qs}`);
  }

  async getMentorStudentDetail(studentId: string) {
    return this.request<any>(`/api/mentor/students/${studentId}`);
  }

  async getMentorStudentProgress(studentId: string) {
    return this.request<any>(`/api/mentor/students/${studentId}/progress`);
  }

  async submitMentorStudentProgressFeedback(
    studentId: string,
    payload: {
      strengths: string;
      improvement_areas: string;
      recommended_action: string;
      comments?: string;
      project_id?: string;
      skill_id?: string;
      rating?: number;
    }
  ) {
    return this.request<{ message: string }>(`/api/mentor/students/${studentId}/progress-feedback`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async assignStudent(studentId: string, notes?: string) {
    return this.request<{ message: string }>('/api/mentor/students/assign', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, notes }),
    });
  }

  async getMentorSessions(statusFilter?: string, dateFilter?: string) {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    if (dateFilter) params.append('date_filter', dateFilter);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/api/mentor/sessions${qs}`);
  }

  async getMentorSessionDetail(sessionId: string) {
    return this.request<any>(`/api/mentor/sessions/${sessionId}`);
  }

  async createMentorSession(payload: {
    student_id: string;
    topic: string;
    session_date: string;
    start_time: string;
    end_time: string;
    platform?: string;
    meeting_link?: string;
    notes?: string;
  }) {
    return this.request<{ message: string }>('/api/mentor/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateSessionStatus(sessionId: string, status: string, notes?: string, reason?: string) {
    return this.request<{ message: string }>(`/api/mentor/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes, reason }),
    });
  }

  async rescheduleMentorSession(
    sessionId: string,
    payload: {
      session_date: string;
      start_time: string;
      end_time: string;
      meeting_link?: string;
      notes?: string;
    }
  ) {
    return this.request<{ message: string }>(`/api/mentor/sessions/${sessionId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getMentorProjectReviews() {
    return this.request<any[]>('/api/mentor/project-reviews');
  }

  async submitProjectReview(payload: {
    student_id: string;
    project_id: string;
    skill_id: string;
    rating: number;
    strengths: string;
    improvement_areas: string;
    comments: string;
    recommended_action: string;
  }) {
    return this.request<{ message: string }>('/api/mentor/project-reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMentorCareerGuidance(studentId: string) {
    return this.request<any>(`/api/mentor/career-guidance/${studentId}`);
  }

  async saveMentorCareerGuidance(
    studentId: string,
    payload: {
      notes: string;
      recommended_courses?: string[];
      recommended_projects?: string[];
      action_items?: string[];
    }
  ) {
    return this.request<{ message: string }>(`/api/mentor/career-guidance/${studentId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMentorConversations(studentId?: string) {
    const qs = studentId ? `?student_id=${encodeURIComponent(studentId)}` : '';
    return this.request<any[]>(`/api/mentor/messages${qs}`);
  }

  async sendMentorMessage(payload: { student_id: string; content: string }) {
    return this.request<{ message: string }>('/api/mentor/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async markMessageRead(messageId: string) {
    return this.request<{ message: string }>(`/api/mentor/messages/${messageId}/read`, {
      method: 'PATCH',
    });
  }

  async markMentorThreadRead(studentId: string) {
    return this.request<{ message: string }>(`/api/mentor/messages/read-thread?student_id=${encodeURIComponent(studentId)}`, {
      method: 'PATCH',
    });
  }

  async getMentorUnreadMessageCount() {
    return this.request<{ unread_count: number }>('/api/mentor/messages/unread-count');
  }

  async getMentorNotifications() {
    return this.request<any[]>('/api/mentor/notifications');
  }

  async markMentorNotificationRead(notificationId: string) {
    return this.request<{ message: string }>(`/api/mentor/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllMentorNotificationsRead() {
    return this.request<{ message: string }>('/api/mentor/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async getMentorUnreadNotificationCount() {
    return this.request<{ unread_count: number }>('/api/mentor/notifications/unread-count');
  }

  // Student Messaging & Notifications
  async getStudentConversations(mentorId?: string) {
    const qs = mentorId ? `?mentor_id=${encodeURIComponent(mentorId)}` : '';
    return this.request<any[]>(`/api/student/messages${qs}`);
  }

  async sendStudentMessage(payload: { mentor_id: string; content: string }) {
    return this.request<{ message: string }>('/api/student/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async markStudentMessageRead(messageId: string) {
    return this.request<{ message: string }>(`/api/student/messages/${messageId}/read`, {
      method: 'PATCH',
    });
  }

  async markStudentThreadRead(mentorId: string) {
    return this.request<{ message: string }>(`/api/student/messages/read-thread?mentor_id=${encodeURIComponent(mentorId)}`, {
      method: 'PATCH',
    });
  }

  async getStudentUnreadMessageCount() {
    return this.request<{ unread_count: number }>('/api/student/messages/unread-count');
  }

  async getStudentUnreadNotificationCount() {
    return this.request<{ unread_count: number }>('/api/student/notifications/unread-count');
  }

  async getMentorResources() {
    return this.request<any[]>('/api/mentor/resources');
  }

  async createMentorResource(payload: {
    title: string;
    description: string;
    category: string;
    url: string;
    tags?: string;
  }) {
    return this.request<{ message: string }>('/api/mentor/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteMentorResource(resourceId: string) {
    return this.request<{ message: string }>(`/api/mentor/resources/${resourceId}`, {
      method: 'DELETE',
    });
  }

  async getMentorProfile() {
    return this.request<any>('/api/mentor/profile');
  }

  async updateMentorProfile(payload: any) {
    return this.request<{ message: string }>('/api/mentor/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Mentor Portal Mentorship Requests
  async getMentorRequests(statusFilter?: string) {
    const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    return this.request<any[]>(`/api/mentor/requests${qs}`);
  }

  async respondToMentorshipRequest(requestId: string, status: 'accepted' | 'rejected', responseNote?: string) {
    return this.request<{ message: string; request_id: string; status: string }>(`/api/mentor/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, response_note: responseNote }),
    });
  }

  async acceptMentorshipRequest(requestId: string, responseNote?: string) {
    return this.request<{ message: string; request_id: string; status: string }>(`/api/mentor/requests/${requestId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ response_note: responseNote }),
    });
  }

  async rejectMentorshipRequest(requestId: string, responseNote?: string) {
    return this.request<{ message: string; request_id: string; status: string }>(`/api/mentor/requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ response_note: responseNote }),
    });
  }

  // Phase 9: Skill Assessments & Evaluations (Mentor)
  async getMentorAssessments(studentId?: string) {
    const qs = studentId ? `?student_id=${encodeURIComponent(studentId)}` : '';
    return this.request<any[]>(`/api/mentor/assessments${qs}`);
  }

  async createMentorAssessment(payload: {
    skill_id: string;
    title: string;
    description: string;
    instructions?: string;
    criteria?: any[];
    deadline?: string;
    max_score?: number;
    student_id?: string;
  }) {
    return this.request<{ message: string; data?: any }>('/api/mentor/assessments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMentorAssessmentDetail(assessmentId: string) {
    return this.request<any>(`/api/mentor/assessments/${assessmentId}`);
  }

  async getAssessmentSubmissions(assessmentId: string) {
    return this.request<any[]>(`/api/mentor/assessments/${assessmentId}/submissions`);
  }

  async evaluateAssessmentSubmission(
    submissionId: string,
    payload: {
      score: number;
      feedback: string;
      rubric_scores?: Record<string, any>;
      release?: boolean;
    }
  ) {
    return this.request<{ message: string; data?: any }>(`/api/mentor/assessments/submissions/${submissionId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Phase 9: Skill Assessments & Evaluations (Student)
  async getStudentMentorAssessments(status?: string) {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<any[]>(`/api/student/mentor-assessments${qs}`);
  }

  async getStudentMentorAssessmentDetail(assessmentId: string) {
    return this.request<any>(`/api/student/mentor-assessments/${assessmentId}`);
  }

  async submitStudentMentorAssessment(
    assessmentId: string,
    payload: {
      submission_text?: string;
      attachment_url?: string;
      answers?: any[];
    }
  ) {
    return this.request<{ message: string; data?: any }>(`/api/student/mentor-assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getStudentProjectReviews() {
    return this.request<any[]>('/api/student/project-reviews');
  }

  // Phase 10: Mentor Expertise & Skills Management
  async getMentorSkills() {
    return this.request<any[]>('/api/mentor/skills');
  }

  async addMentorSkill(payload: {
    skill_name: string;
    category?: string;
    proficiency_level?: string;
    years_of_experience?: number;
    is_willing_to_mentor?: boolean;
  }) {
    return this.request<{ message: string; data?: any }>('/api/mentor/skills', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateMentorSkill(
    skillId: number,
    payload: {
      category?: string;
      proficiency_level?: string;
      years_of_experience?: number;
      is_willing_to_mentor?: boolean;
    }
  ) {
    return this.request<{ message: string }>(`/api/mentor/skills/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteMentorSkill(skillId: number) {
    return this.request<{ message: string }>(`/api/mentor/skills/${skillId}`, {
      method: 'DELETE',
    });
  }

  async getSkillCategories() {
    return this.request<{ categories: string[]; catalog_skills: any[] }>('/api/skills/categories');
  }

  // Phase 10: Mentor Availability Management
  async getMentorAvailability() {
    return this.request<any>('/api/mentor/availability');
  }

  async updateMentorAvailability(payload: {
    available_days: string[];
    start_time: string;
    end_time: string;
    session_duration?: number;
    timezone?: string;
    unavailable_dates?: string[];
    notes?: string;
  }) {
    return this.request<{ message: string }>('/api/mentor/availability', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getMentorPublicAvailability(mentorId: string) {
    return this.request<any>(`/api/mentors/${mentorId}/availability`);
  }

  async getMentorAvailableSlots(mentorId: string, date: string) {
    return this.request<any>(`/api/mentors/${mentorId}/available-slots?date=${encodeURIComponent(date)}`);
  }

  // Phase 10: Mentor Avatar Upload
  async uploadMentorAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/mentor/profile/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || `Upload failed: ${response.statusText}`);
    }
    return await response.json();
  }

  // Phase 10: Student Career Guidance
  async getStudentCareerGuidance() {
    return this.request<any[]>('/api/student/career-guidance');
  }

  async updateGuidanceStatus(guidanceId: number, status: string) {
    return this.request<{ message: string }>(`/api/student/career-guidance/${guidanceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

}


export const api = new ApiClient();
export default api;
