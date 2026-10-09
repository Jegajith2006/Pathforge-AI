from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Student
from schemas.roadmap import RoadmapResponse, RoadmapStepItem
from schemas.common import MessageResponse
from routers.auth import get_current_student
from services.roadmap_service import generate_topological_roadmap, mark_roadmap_step_complete

router = APIRouter(prefix="/api/roadmap", tags=["Learning Roadmap"])


@router.get("", response_model=RoadmapResponse)
def get_roadmap(
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return generate_topological_roadmap(db, current_student.student_id, career_id=career_id)


@router.post("/generate", response_model=RoadmapResponse)
def regenerate_roadmap(
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return generate_topological_roadmap(db, current_student.student_id, career_id=career_id)


@router.post("/update", response_model=RoadmapResponse)
def update_roadmap(
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return generate_topological_roadmap(db, current_student.student_id, career_id=career_id)


@router.get("/{step_id}")
def get_roadmap_step(
    step_id: int,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    roadmap = generate_topological_roadmap(db, current_student.student_id)
    for m in roadmap["milestones"]:
        if m["step_number"] == step_id:
            return m
    raise HTTPException(status_code=404, detail=f"Milestone #{step_id} not found.")


@router.post("/{step_id}/complete", response_model=MessageResponse)
def complete_step(
    step_id: int,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    res = mark_roadmap_step_complete(db, current_student.student_id, step_id)
    return MessageResponse(message=res["message"])


@router.post("/steps/{step_id}/complete", response_model=MessageResponse)
def complete_step_alias(
    step_id: int,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    res = mark_roadmap_step_complete(db, current_student.student_id, step_id)
    return MessageResponse(message=res["message"])
