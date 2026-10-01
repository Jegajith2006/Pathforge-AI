from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SkillBase(BaseModel):
    name: str
    category: str
    current_level: float = Field(default=0.0, ge=0.0, le=100.0)
    required_level: float = Field(default=80.0, ge=0.0, le=100.0)
    status: Optional[str] = "In Progress"
    priority: Optional[str] = "Medium"
    description: Optional[str] = None


class SkillCreate(SkillBase):
    user_id: Optional[int] = None


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    current_level: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    required_level: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    status: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None


class SkillResponse(SkillBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
