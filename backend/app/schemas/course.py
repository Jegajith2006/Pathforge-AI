from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CourseBase(BaseModel):
    title: str
    provider: str
    description: Optional[str] = None
    category: str
    difficulty: Optional[str] = "Intermediate"
    duration_hours: Optional[float] = 10.0
    rating: Optional[float] = 4.8
    url: Optional[str] = None
    is_completed: Optional[bool] = False
    progress_percentage: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    provider: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration_hours: Optional[float] = None
    rating: Optional[float] = None
    url: Optional[str] = None
    is_completed: Optional[bool] = None
    progress_percentage: Optional[float] = Field(default=None, ge=0.0, le=100.0)


class CourseResponse(CourseBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
