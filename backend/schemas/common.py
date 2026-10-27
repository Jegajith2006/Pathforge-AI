from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    message: str
    status: str = "success"
    data: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    database: str = "connected"


class EvidenceBreakdown(BaseModel):
    self_declared_score: int = Field(..., ge=0, le=100)
    resume_score: int = Field(..., ge=0, le=100)
    assessment_score: int = Field(..., ge=0, le=100)
    project_score: int = Field(..., ge=0, le=100)
    certificate_score: int = Field(..., ge=0, le=100)
    mentor_score: int = Field(..., ge=0, le=100)
    final_mastery: int = Field(..., ge=0, le=100)
    mastery_level: str
    evidence_count: int


class CareerReadinessResponse(BaseModel):
    title: str = "PathForge AI Career Readiness Indicator"
    overall_readiness: int = Field(..., ge=0, le=100)
    confidence_score: float = 94.2
    target_career_id: str
    target_career_name: str
    skill_match_percentage: int
    mastery_percentage: int
    evidence_percentage: int
    formula: str = "Readiness = (Skill Match × 0.50) + (Skill Mastery × 0.30) + (Practical Evidence × 0.20)"
    explanation: str
    next_best_action: str
    disclaimer: str = "This is a project-based career readiness indicator, not an official employment or hiring score."
