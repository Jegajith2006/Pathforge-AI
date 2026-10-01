from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EvidenceBase(BaseModel):
    title: str
    description: Optional[str] = None
    evidence_type: str  # Certificate, GitHub Repository, Project Demo, Assessment, Mentor Review, Document
    url: Optional[str] = None
    verification_status: Optional[str] = "Pending"  # Pending, Verified, Rejected
    portfolio_ready: Optional[bool] = False


class EvidenceCreate(EvidenceBase):
    user_id: Optional[int] = None


class EvidenceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    evidence_type: Optional[str] = None
    url: Optional[str] = None
    verification_status: Optional[str] = None
    portfolio_ready: Optional[bool] = None


class EvidenceResponse(EvidenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
