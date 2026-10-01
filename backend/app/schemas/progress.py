from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProgressBase(BaseModel):
    activity_type: str  # Course, Project, Skill, Assessment, Evidence, Mentor Feedback
    activity_title: str
    progress_value: float = Field(default=100.0, ge=0.0)
    activity_date: Optional[datetime] = None
    notes: Optional[str] = None


class ProgressCreate(ProgressBase):
    user_id: Optional[int] = None


class ProgressResponse(ProgressBase):
    id: int
    user_id: int
    activity_date: datetime

    model_config = ConfigDict(from_attributes=True)
