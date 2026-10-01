from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    target_role: Optional[str] = "AI Engineer"
    experience_level: Optional[str] = "Mid-Level"
    learning_goal: Optional[str] = None
    weekly_learning_hours: Optional[int] = 12
    preferred_learning_style: Optional[str] = "Project-Based"
    current_streak: Optional[int] = 0
    readiness_score: Optional[float] = 0.0


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    target_role: Optional[str] = None
    experience_level: Optional[str] = None
    learning_goal: Optional[str] = None
    weekly_learning_hours: Optional[int] = None
    preferred_learning_style: Optional[str] = None
    current_streak: Optional[int] = None
    readiness_score: Optional[float] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
