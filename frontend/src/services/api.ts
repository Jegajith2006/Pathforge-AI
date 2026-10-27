/**
 * PathForge AI Frontend API Client
 * Centralized service layer connecting React frontend to the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      // In local dev without backend running, fallback gracefully or rethrow
      console.warn(`[PathForge API Client] Request to ${endpoint} failed:`, err);
      throw err;
    }
  }

  // Health
  async getHealth() {
    return this.request<{ status: string }>('/health');
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
    return this.request<{
      status: string;
      challenge_id: string;
      email: string;
      message: string;
      expires_in_minutes: number;
    }>('/api/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
    bio?: string;
    terms_agreed?: boolean;
  }) {
    return this.request<{
      status: string;
      challenge_id: string;
      email: string;
      message: string;
      expires_in_minutes: number;
    }>('/api/auth/register/mentor', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
  async getAdminUsers() {
    return this.request<any[]>('/api/admin/users');
  }

  async getAdminStudents() {
    return this.request<any[]>('/api/admin/students');
  }

  async getAdminMentors() {
    return this.request<any[]>('/api/admin/mentors');
  }

  async getAdminStudentProgress(studentId: string) {
    return this.request<any>(`/api/admin/student-progress/${studentId}`);
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

  // Roadmap
  async getRoadmap() {
    return this.request<any>('/api/roadmap');
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

  async reviewLessonResource(courseId: string, lessonId: string, resourceId: string) {
    return this.request<any>(`/api/courses/${courseId}/lessons/${lessonId}/review-resource`, {
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

  // Mentor (Student view)
  async getMentors() {
    return this.request<any[]>('/api/mentors');
  }

  async getMentorFeedback() {
    return this.request<any[]>('/api/mentor/feedback');
  }

  async requestMentorship(payload: { mentor_id: string; topic?: string; preferred_date?: string }) {
    return this.request<{ message: string }>('/api/mentor/request', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  async assignStudent(studentId: string, notes?: string) {
    return this.request<{ message: string }>('/api/mentor/students/assign', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, notes }),
    });
  }

  async getMentorSessions(statusFilter?: string) {
    const qs = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : '';
    return this.request<any[]>(`/api/mentor/sessions${qs}`);
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

  async updateSessionStatus(sessionId: string, status: string) {
    return this.request<{ message: string }>(`/api/mentor/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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
}

export const api = new ApiClient();
export default api;
