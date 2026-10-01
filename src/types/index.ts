export type SkillStatus = 'strong' | 'developing' | 'missing';
export type SkillPriority = 'high' | 'medium' | 'low';

export interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'analytical' | 'domain' | 'soft';
  status: SkillStatus;
  currentLevel: number; // 0-100
  requiredLevel: number; // 0-100
  priority?: SkillPriority;
  recommendedAction?: string;
  importanceWeight: number; // 0.1 - 1.0
  relevanceScore?: number;
  tags?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  targetCareer: string;
  careerDescription: string;
  careerProgress: number; // 0-100
  currentLevelName: string;
  nextMilestone: string;
  skillsCount: {
    strong: number;
    developing: number;
    missing: number;
  };
  learningStreakDays: number;
  weeklyHours: number;
  completedCourses: number;
  completedProjects: number;
  skillsImproved: number;
  overallReadiness: number; // 69
  readinessScore?: number;
  readinessCategory: string;
  stats?: {
    skillsTracked?: number;
    coursesInProgress?: number;
    projectsCompleted?: number;
    totalHoursLearned?: number;
    skillsValidated?: number;
  };
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  platformLogo?: string;
  description: string;
  skillsCovered: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  relevanceScore: number; // 0-100
  recommendedBecause: string;
  rating: number;
  reviewCount: number;
  enrolledUrl: string;
  isHighPriority?: boolean;
}

export type ProjectLabel = 'Portfolio Project' | 'Skill Builder' | 'Interview Project' | 'Capstone Project';

export interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedDuration: string;
  requiredSkills: string[];
  tools: string[];
  expectedOutput: string;
  skillsGained: string[];
  careerRelevance: string;
  label: ProjectLabel;
  githubTemplateUrl?: string;
  status?: 'Not Started' | 'In Progress' | 'Completed';
}

export type RoadmapStepStatus = 'Completed' | 'In Progress' | 'Not Started' | 'Needs Improvement';

export interface RoadmapStep {
  id: string;
  stepNumber: number;
  title: string;
  skill: string;
  type: 'Course' | 'Project' | 'Assessment' | 'Milestone';
  description: string;
  estimatedTime: string;
  status: RoadmapStepStatus;
  keyTakeaways: string[];
  actionLabel: string;
  actionUrl?: string;
}

export interface HeatmapDay {
  date: string;
  count: number; // 0-4 intensity
  hours: number;
  activities: string[];
}

export type EvidenceType =
  | 'Certificate'
  | 'Project Repository'
  | 'Project Report'
  | 'Assessment Result'
  | 'Portfolio Link'
  | 'Mentor Validation'
  | 'Internship Experience'
  | 'Competition Achievement'
  | 'GitHub Repository'
  | 'Portfolio Project'
  | 'Internship Record';

export type EvidenceStatus = 'Verified' | 'Pending Review' | 'Rejected' | 'Needs Revision' | 'In Review';

export interface EvidenceItem {
  id: string;
  title: string;
  type: EvidenceType;
  relatedSkill: string;
  relatedCourseId?: string;
  relatedProjectId?: string;
  description?: string;
  url?: string;
  linkUrl?: string;
  fileName?: string;
  dateAdded?: string;
  submissionDate?: string;
  completionDate?: string;
  verificationStatus: EvidenceStatus;
  portfolioReady?: boolean;
  verificationDetails?: string;
  notes?: string;
  verifiedBy?: string;
  score?: string;
  credentialHash?: string;
}

export interface MentorFeedback {
  id: string;
  mentorName: string;
  mentorRole: string;
  mentorAvatar: string;
  date: string;
  relatedSkill: string;
  rating: number; // 1-5
  feedbackMessage: string;
  strengths: string[];
  improvementAreas: string[];
  suggestedNextAction: string;
}

export interface ReadinessBreakdown {
  overallScore: number;
  statusText: string;
  skillMatch: number;
  skillMastery: number;
  practicalEvidence: number;
  strengths: string[];
  weaknesses: string[];
  recommendedImprovements: string[];
  history: { month: string; score: number }[];
  nextMilestone: string;
}

export interface CompanyComparison {
  companyName: string;
  jobRole: string;
  companyLogoText: string;
  overallMatch: number;
  matchingSkills: string[];
  missingSkills: string[];
  partialSkills: string[];
  recommendedSteps: string[];
  skillTable: {
    skill: string;
    requiredLevel: string;
    yourLevel: string;
    matchStatus: 'Matched' | 'Partial' | 'Missing';
    relevance: 'Core' | 'Preferred' | 'Bonus';
  }[];
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
