from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class MentorRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    title: str = Field(..., min_length=2, max_length=150)
    experience_years: int = Field(..., ge=0, le=50)
    expertise_areas: List[str] = Field(default_factory=list)
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None


class MentorProfileResponse(BaseModel):
    mentor_id: str
    name: str
    email: Optional[str] = None
    title: Optional[str] = None
    headline: Optional[str] = None
    company: Optional[str] = None
    profile_picture: Optional[str] = None
    experience_years: int
    expertise: str
    skills: str
    bio: str
    education: Optional[str] = None
    certifications: Optional[str] = None
    languages: Optional[str] = "English"
    career_specializations: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    rating: float = 4.8
    availability: str = "Available"
    max_capacity: int = 15
    role: str = "mentor"
    status: str = "active"
    verification_status: Optional[str] = "Approved"
    verification_document: Optional[str] = None
    verification_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class MentorProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    headline: Optional[str] = None
    company: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=60)
    education: Optional[str] = None
    certifications: Optional[str] = None
    languages: Optional[str] = None
    career_specializations: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    availability: Optional[str] = None
    max_capacity: Optional[int] = Field(None, ge=1, le=50)


class MentorshipSessionCreate(BaseModel):
    student_id: str
    topic: str
    session_date: str
    start_time: str
    end_time: str
    platform: Optional[str] = "Google Meet"
    meeting_link: Optional[str] = "https://meet.google.com/pathforge-ai"
    notes: Optional[str] = None


class MentorshipSessionRescheduleRequest(BaseModel):
    session_date: str
    start_time: str
    end_time: str
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class MentorshipSessionStatusUpdate(BaseModel):
    status: str  # upcoming, completed, cancelled, rescheduled
    notes: Optional[str] = None
    reason: Optional[str] = None


class StudentSessionCreateRequest(BaseModel):
    mentor_id: str
    topic: str
    session_date: str
    start_time: str
    end_time: str
    platform: Optional[str] = "Google Meet"
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class SessionCancellationRequest(BaseModel):
    reason: Optional[str] = None


class StudentSessionResponse(BaseModel):
    session_id: str
    mentor_id: str
    mentor_name: str
    mentor_title: Optional[str] = None
    mentor_company: Optional[str] = None
    mentor_avatar: Optional[str] = None
    student_id: str
    topic: str
    session_date: str
    start_time: str
    end_time: str
    duration_minutes: Optional[int] = 60
    platform: str
    meeting_link: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: str


class StudentAssignedMentorResponse(BaseModel):
    assignment_id: str
    mentor_id: str
    mentor_name: str
    mentor_email: str
    mentor_title: Optional[str] = None
    mentor_company: Optional[str] = None
    mentor_avatar: Optional[str] = None
    mentor_bio: Optional[str] = None
    mentor_rating: Optional[float] = None
    mentor_skills: Optional[List[str]] = None
    mentor_expertise: Optional[str] = None
    assigned_at: str
    notes: Optional[str] = None
    status: str
    upcoming_sessions_count: int = 0


class ProjectReviewCreate(BaseModel):
    student_id: str
    project_id: str
    skill_id: str
    rating: int = Field(..., ge=1, le=5)
    strengths: str
    improvement_areas: str
    comments: str
    recommended_action: Optional[str] = "Approved and progress confirmed"
    rubric_scores: Optional[Dict[str, int]] = None


class ProjectReviewUpdateRequest(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    strengths: Optional[str] = None
    improvement_areas: Optional[str] = None
    comments: Optional[str] = None
    recommended_action: Optional[str] = None


class MentorMessageCreate(BaseModel):
    student_id: str
    content: str


class StudentMessageCreate(BaseModel):
    mentor_id: str
    content: str


class MessageItemResponse(BaseModel):
    message_id: str
    sender_role: str
    sender_id: str
    content: str
    is_read: bool
    created_at: str


class StudentConversationResponse(BaseModel):
    mentor_id: str
    mentor_name: str
    mentor_title: Optional[str] = None
    latest_message: str
    latest_time: str
    unread_count: int


class UnreadCountResponse(BaseModel):
    unread_count: int


class MentorResourceCreate(BaseModel):
    title: str
    description: str
    category: str
    url: str
    tags: Optional[str] = ""


class MentorGuidanceNoteCreate(BaseModel):
    student_id: str
    notes: str
    recommended_skills: Optional[List[str]] = None
    recommended_courses: Optional[List[str]] = None
    recommended_projects: Optional[List[str]] = None
    preparation_activities: Optional[List[str]] = None
    action_items: Optional[List[str]] = None
    private_notes: Optional[str] = None
    follow_up_date: Optional[str] = None


class StudentAssignmentRequest(BaseModel):
    student_id: str
    notes: Optional[str] = None


class MentorNotificationResponse(BaseModel):
    notification_id: str
    type: str
    title: str
    message: str
    is_read: bool
    created_at: str


class MentorshipRequestCreate(BaseModel):
    mentor_id: str
    message: Optional[str] = None
    career_goal: Optional[str] = None


class MentorshipRequestAction(BaseModel):
    status: Optional[str] = "accepted"
    response_note: Optional[str] = None


class MentorshipRequestResponse(BaseModel):
    request_id: str
    student_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_career: Optional[str] = None
    student_readiness: Optional[int] = None
    mentor_id: str
    mentor_name: Optional[str] = None
    mentor_title: Optional[str] = None
    mentor_company: Optional[str] = None
    mentor_rating: Optional[float] = None
    message: Optional[str] = None
    career_goal: Optional[str] = None
    status: str
    response_note: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


class MentorshipRequestMutationResponse(BaseModel):
    message: str
    request_id: str
    status: str


class MentorProgressFeedbackRequest(BaseModel):
    strengths: str
    improvement_areas: str
    recommended_action: str
    comments: Optional[str] = ""
    project_id: Optional[str] = None
    skill_id: Optional[str] = None
    rating: Optional[int] = Field(5, ge=1, le=5)


# Phase 9: Skill Assessments & Evaluations
class AssessmentCriterion(BaseModel):
    criterion: str
    weight: Optional[int] = 25
    description: Optional[str] = ""


class MentorAssessmentCreate(BaseModel):
    skill_id: str
    title: str
    description: str
    instructions: Optional[str] = None
    criteria: Optional[List[Any]] = None
    deadline: Optional[str] = None
    max_score: Optional[int] = 100
    student_id: Optional[str] = None  # Specific mentee or None for all assigned mentees


class AssessmentSubmissionCreate(BaseModel):
    submission_text: Optional[str] = None
    attachment_url: Optional[str] = None
    answers: Optional[List[Dict[str, Any]]] = None


class AssessmentEvaluationRequest(BaseModel):
    score: float = Field(..., ge=0, le=100)
    feedback: str
    rubric_scores: Optional[Dict[str, Any]] = None
    release: Optional[bool] = True


class MentorAssessmentSubmissionResponse(BaseModel):
    submission_id: str
    assessment_id: str
    student_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    submission_text: Optional[str] = None
    attachment_url: Optional[str] = None
    answers: Optional[List[Dict[str, Any]]] = None
    status: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    rubric_scores: Optional[Dict[str, Any]] = None
    is_released: bool = True
    submitted_at: str
    evaluated_at: Optional[str] = None


class MentorAssessmentResponse(BaseModel):
    assessment_id: str
    mentor_id: str
    mentor_name: Optional[str] = None
    mentor_title: Optional[str] = None
    mentor_company: Optional[str] = None
    mentor_avatar: Optional[str] = None
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    skill_id: str
    skill_name: Optional[str] = None
    title: str
    description: str
    instructions: Optional[str] = None
    criteria: List[Dict[str, Any]] = []
    deadline: Optional[str] = None
    max_score: int = 100
    status: str = "active"
    created_at: str
    submissions_count: int = 0
    evaluated_count: int = 0
    my_submission: Optional[MentorAssessmentSubmissionResponse] = None






# Phase 10: Mentor Expertise, Availability & Career Guidance
class MentorSkillCreate(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=150)
    category: Optional[str] = Field("programming", max_length=100)
    proficiency_level: Optional[str] = Field("Advanced", max_length=50)
    years_of_experience: Optional[int] = Field(3, ge=0, le=50)
    is_willing_to_mentor: Optional[bool] = True


class MentorSkillUpdate(BaseModel):
    category: Optional[str] = None
    proficiency_level: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=50)
    is_willing_to_mentor: Optional[bool] = None


class MentorSkillResponse(BaseModel):
    id: int
    skill_id: Optional[str] = None
    skill_name: str
    category: str
    proficiency_level: str
    years_of_experience: int
    is_willing_to_mentor: bool
    created_at: str


class MentorAvailabilityUpdateRequest(BaseModel):
    available_days: List[str] = Field(default_factory=lambda: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    start_time: str = Field("09:00", min_length=4, max_length=10)
    end_time: str = Field("17:00", min_length=4, max_length=10)
    session_duration: Optional[int] = Field(60, ge=15, le=180)
    timezone: Optional[str] = "UTC"
    unavailable_dates: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = None


class MentorAvailabilityResponse(BaseModel):
    available_days: List[str]
    start_time: str
    end_time: str
    session_duration: int
    timezone: str
    unavailable_dates: List[str]
    notes: Optional[str] = None
    weekly_schedule: Optional[List[Dict[str, Any]]] = None


class StudentCareerGuidanceItem(BaseModel):
    id: int
    mentor_id: str
    mentor_name: str
    mentor_title: Optional[str] = None
    mentor_company: Optional[str] = None
    mentor_avatar: Optional[str] = None
    target_career_name: Optional[str] = None
    notes: str
    recommended_skills: List[str] = []
    recommended_courses: List[str] = []
    recommended_projects: List[str] = []
    preparation_activities: List[str] = []
    action_items: List[str] = []
    follow_up_date: Optional[str] = None
    status: str = "active"
    created_at: str
