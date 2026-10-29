from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ResponseMeta(BaseModel):
    timestamp: str
    request_id: str


class APIResponseEnvelope(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None
    meta: ResponseMeta


class MessageResponse(BaseModel):
    message: str
    status: str = "success"
    data: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    database: str = "connected"
    timestamp: Optional[str] = None


def create_envelope(
    data: Optional[Any] = None,
    error: Optional[Any] = None,
    request_id: Optional[str] = None,
    success: Optional[bool] = None,
) -> Dict[str, Any]:
    """Helper to wrap any payload in the standardized PathForge API response envelope."""
    from datetime import datetime, timezone
    import uuid

    req_id = request_id or str(uuid.uuid4())
    is_success = success if success is not None else (error is None)
    err_dict = None
    if error is not None:
        if hasattr(error, "model_dump"):
            err_dict = error.model_dump()
        elif hasattr(error, "dict"):
            err_dict = error.dict()
        elif isinstance(error, dict):
            err_dict = error
        else:
            err_dict = {"code": "ERROR", "message": str(error), "details": None}

    return {
        "success": is_success,
        "data": data,
        "error": err_dict,
        "meta": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": req_id,
        },
    }



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
