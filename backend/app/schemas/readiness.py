from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ReadinessSnapshotBase(BaseModel):
    overall_score: float = Field(ge=0.0, le=100.0)
    skill_coverage_score: float = Field(ge=0.0, le=100.0)
    project_score: float = Field(ge=0.0, le=100.0)
    consistency_score: float = Field(ge=0.0, le=100.0)
    evidence_score: float = Field(ge=0.0, le=100.0)
    mentor_score: float = Field(ge=0.0, le=100.0)
    readiness_level: Optional[str] = "High Potential"


class ReadinessSnapshotCreate(ReadinessSnapshotBase):
    user_id: Optional[int] = None


class ReadinessSnapshotResponse(ReadinessSnapshotBase):
    id: int
    user_id: int
    calculated_at: datetime

    model_config = ConfigDict(from_attributes=True)
