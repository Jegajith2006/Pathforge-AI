from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class StudentRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    college: str = "Stanford University"
    department: str = "Department of Computer Science"
    degree: str = "B.Tech AI & Data Science"
    graduation_year: int = 2026
    cgpa: float = 8.8
    target_career_id: str = "C001"
    weekly_learning_hours: int = 12
    preferred_difficulty: str = "Adaptive"
    learning_mode: str = "Project-based"


class StudentLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student_id: Optional[str] = None
    user_id: Optional[str] = None
    role: str = "student"
    email: str
    name: str


class StudentProfileResponse(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    college: str
    department: str
    degree: str
    graduation_year: int
    cgpa: float
    target_career_id: str
    target_career_name: Optional[str] = None
    weekly_learning_hours: int
    preferred_difficulty: str
    learning_mode: str

    model_config = {"from_attributes": True}


class StudentProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    target_career_id: Optional[str] = None
    weekly_learning_hours: Optional[int] = None
    preferred_difficulty: Optional[str] = None
    learning_mode: Optional[str] = None


class StudentSkillItem(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    self_declared_score: int
    resume_score: int
    assessment_score: int
    project_score: int
    certificate_score: int
    mentor_score: int
    final_mastery: int
    mastery_level: str
    evidence_count: int
    last_updated: Optional[str] = None

    model_config = {"from_attributes": True}


class StudentSkillUpdate(BaseModel):
    skill_id: str
    self_declared_score: Optional[int] = Field(None, ge=0, le=100)


class LearningPreferencesUpdate(BaseModel):
    weekly_learning_hours: Optional[int] = Field(None, ge=1, le=80)
    preferred_difficulty: Optional[str] = None
    learning_mode: Optional[str] = None
