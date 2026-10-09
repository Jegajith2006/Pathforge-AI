from typing import Optional, List
from pydantic import BaseModel, Field


class CourseSkillDetail(BaseModel):
    skill_id: str
    skill_name: str
    coverage_level: str
    importance: int


class CourseResponse(BaseModel):
    course_id: str
    course_name: str
    provider: str
    description: str
    category: str
    difficulty: str
    duration_hours: int
    format: str
    rating: float
    url: str
    language: str
    skills: List[CourseSkillDetail] = []
    progress_percentage: Optional[int] = 0
    status: Optional[str] = "not_started"

    model_config = {"from_attributes": True}


class CourseRecommendation(BaseModel):
    course_id: str
    course_name: str
    provider: str
    primary_skill: str
    match_percentage: int
    duration_text: str
    tag: str
    progress: int
    rating: float
    explainability: str
    url: str


class CourseProgressUpdate(BaseModel):
    progress_percentage: int = Field(..., ge=0, le=100)
