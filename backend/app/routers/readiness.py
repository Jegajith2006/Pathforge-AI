from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.readiness import ReadinessSnapshot
from app.models.user import User

router = APIRouter(prefix="/api/readiness", tags=["Readiness Intelligence"])


@router.get("", summary="Get Current Readiness Analytics")
def get_readiness(db: Session = Depends(get_db)):
    """
    Retrieves the latest explainable readiness score snapshot,
    sub-dimensional scores, and benchmarking metrics.
    """
    snapshot = db.query(ReadinessSnapshot).order_by(ReadinessSnapshot.calculated_at.desc()).first()
    user = db.query(User).first()

    if not snapshot:
        if user:
            return {
                "overall_score": user.readiness_score or 75.0,
                "readiness_level": "Developing",
                "skill_coverage_score": 75.0,
                "project_score": 70.0,
                "consistency_score": 80.0,
                "evidence_score": 65.0,
                "mentor_score": 70.0,
                "calculated_at": user.updated_at,
            }
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No readiness data available")

    return {
        "id": snapshot.id,
        "user_id": snapshot.user_id,
        "overall_score": snapshot.overall_score,
        "readiness_level": snapshot.readiness_level,
        "skill_coverage_score": snapshot.skill_coverage_score,
        "project_score": snapshot.project_score,
        "consistency_score": snapshot.consistency_score,
        "evidence_score": snapshot.evidence_score,
        "mentor_score": snapshot.mentor_score,
        "calculated_at": snapshot.calculated_at,
        "target_role": user.target_role if user else "AI Engineer",
    }
