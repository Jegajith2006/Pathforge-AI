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
    company: Optional[str] = None
    experience_years: int
    expertise: str
    skills: str
    bio: str
    linkedin_url: Optional[str] = None
    rating: float = 4.8
    availability: str = "Available"
    role: str = "mentor"
    status: str = "active"


class MentorProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    linkedin_url: Optional[str] = None
    availability: Optional[str] = None


class MentorshipSessionCreate(BaseModel):
    student_id: str
    topic: str
    session_date: str
    start_time: str
    end_time: str
    platform: Optional[str] = "Google Meet"
    meeting_link: Optional[str] = "https://meet.google.com/pathforge-ai"
    notes: Optional[str] = None


class MentorshipSessionStatusUpdate(BaseModel):
    status: str  # upcoming, completed, cancelled, rescheduled


class ProjectReviewCreate(BaseModel):
    student_id: str
    project_id: str
    skill_id: str
    rating: int = Field(..., ge=1, le=5)
    strengths: str
    improvement_areas: str
    comments: str
    recommended_action: str
    rubric_scores: Optional[Dict[str, int]] = None


class MentorMessageCreate(BaseModel):
    student_id: str
    content: str


class MentorResourceCreate(BaseModel):
    title: str
    description: str
    category: str
    url: str
    tags: Optional[str] = ""


class MentorGuidanceNoteCreate(BaseModel):
    student_id: str
    notes: str
    recommended_courses: Optional[List[str]] = None
    recommended_projects: Optional[List[str]] = None
    action_items: Optional[List[str]] = None


class StudentAssignmentRequest(BaseModel):
    student_id: str
    notes: Optional[str] = None
