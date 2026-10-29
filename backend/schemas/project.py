from typing import Optional, List
from pydantic import BaseModel, Field


class ProjectSkillDetail(BaseModel):
    skill_id: str
    skill_name: str
    required_level: str
    importance: int


class ProjectResponse(BaseModel):
    project_id: str
    project_name: str
    description: str
    category: str
    difficulty: str
    estimated_duration_weeks: int
    career_id: str
    career_name: Optional[str] = None
    learning_outcomes: str
    problem_statement: Optional[str] = None
    reason: Optional[str] = None
    skills: List[ProjectSkillDetail] = []
    match_percentage: Optional[int] = None
    status: Optional[str] = "not_started"
    github_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ProjectRecommendation(BaseModel):
    project_id: str
    project_name: str
    difficulty: str
    duration_text: str
    match_percentage: int
    primary_skills: List[str]
    description: str
    learning_outcomes: str
    problem_statement: Optional[str] = None
    reason: Optional[str] = None
    career_id: Optional[str] = None
    career_name: Optional[str] = None
    status: str = "not_started"


class ProjectProgressUpdate(BaseModel):
    progress_percentage: int = Field(..., ge=0, le=100)
    github_url: Optional[str] = None
