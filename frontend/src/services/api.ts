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

  // Auth
  async login(payload: { email: string; password: string }) {
    const data = await this.request<{ access_token: string; student_id: string; email: string; name: string }>('/api/auth/login', {
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

  async getMe() {
    return this.request<any>('/api/auth/me');
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
  async getCareers(category?: string) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<any[]>(`/api/careers${query}`);
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
  async getCourses(filters?: { category?: string; difficulty?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/api/courses${qs}`);
  }

  async getCourse(courseId: string) {
    return this.request<any>(`/api/courses/${courseId}`);
  }

  async getCourseSkills(courseId: string) {
    return this.request<{ course_id: string; course_name: string; skills: any[] }>(`/api/courses/${courseId}/skills`);
  }

  async getCourseRecommendations() {
    return this.request<any[]>('/api/courses/recommendations');
  }

  async updateCourseProgress(courseId: string, progressPercentage: number) {
    return this.request<{ message: string }>(`/api/courses/${courseId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress_percentage: progressPercentage }),
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

  // Resume Analyzer
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

  async startAssessment(careerId?: string) {
    return this.request<any>('/api/assessment/start', {
      method: 'POST',
      body: JSON.stringify({ career_id: careerId }),
    });
  }

  async submitAssessment(assessmentId: string, answers: { question_id: string; selected_answer: string; time_taken_seconds?: number }[]) {
    return this.request<any>('/api/assessment/submit', {
      method: 'POST',
      body: JSON.stringify({ assessment_id: assessmentId, answers }),
    });
  }

  async getAssessmentHistory() {
    return this.request<any[]>('/api/assessment/history');
  }

  // Mentor
  async getMentors() {
    return this.request<any[]>('/api/mentors');
  }

  async getMentorSessions() {
    return this.request<any[]>('/api/mentor/sessions');
  }

  async getMentorFeedback() {
    return this.request<any[]>('/api/mentor/feedback');
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
}

export const api = new ApiClient();
export default api;
