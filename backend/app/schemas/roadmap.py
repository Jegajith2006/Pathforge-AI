from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class RoadmapPhaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    phase_number: int
    status: Optional[str] = "Locked"
    progress_percentage: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)
    estimated_weeks: Optional[int] = 4
    order_index: Optional[int] = 1


class RoadmapPhaseCreate(RoadmapPhaseBase):
    pass


class RoadmapPhaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    phase_number: Optional[int] = None
    status: Optional[str] = None
    progress_percentage: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    estimated_weeks: Optional[int] = None
    order_index: Optional[int] = None


class RoadmapPhaseResponse(RoadmapPhaseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
