from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    difficulty: Optional[str] = "Intermediate"
    estimated_hours: Optional[int] = 20
    status: Optional[str] = "Not Started"
    progress_percentage: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)
    github_url: Optional[str] = None
    demo_url: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_hours: Optional[int] = None
    status: Optional[str] = None
    progress_percentage: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    github_url: Optional[str] = None
    demo_url: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
