from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.roadmap import RoadmapPhase
from app.schemas.roadmap import RoadmapPhaseResponse

router = APIRouter(prefix="/api/roadmap", tags=["Roadmap"])


@router.get("", response_model=List[RoadmapPhaseResponse], summary="Get Career Roadmap Phases")
def get_roadmap(db: Session = Depends(get_db)):
    """
    Returns ordered phases of the learner's personalized career roadmap.
    """
    return db.query(RoadmapPhase).order_by(RoadmapPhase.order_index).all()
