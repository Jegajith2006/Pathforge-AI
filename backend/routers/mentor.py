import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from database.connection import get_db
from database.models import Mentor, MentorFeedback, Student, Project, Skill
from schemas.common import MessageResponse
from routers.auth import get_current_student
from services.skill_gap_service import update_or_create_student_skill

router = APIRouter(tags=["Mentor Connect"])


class MentorRequestPayload(BaseModel):
    mentor_id: str
    topic: str
    preferred_date: str


class MentorFeedbackPayload(BaseModel):
    mentor_id: str
    project_id: str
    skill_id: str
    rating: int
    strengths: str
    improvement_areas: str
    comments: str
    recommended_action: str


@router.get("/api/mentors")
def get_all_mentors(db: Session = Depends(get_db)):
    mentors = db.query(Mentor).all()
    return [
        {
            "mentor_id": m.mentor_id,
            "name": m.name,
            "expertise": m.expertise,
            "experience_years": m.experience_years,
            "skills": m.skills,
            "bio": m.bio,
            "availability": m.availability,
            "rating": m.rating,
        }
        for m in mentors
    ]


@router.get("/api/mentors/{mentor_id}")
def get_mentor_by_id(mentor_id: str, db: Session = Depends(get_db)):
    m = db.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Mentor '{mentor_id}' not found.")
    return {
        "mentor_id": m.mentor_id,
        "name": m.name,
        "expertise": m.expertise,
        "experience_years": m.experience_years,
        "skills": m.skills,
        "bio": m.bio,
        "availability": m.availability,
        "rating": m.rating,
    }


@router.post("/api/mentor/request", response_model=MessageResponse)
def request_mentorship(
    payload: MentorRequestPayload,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    m = db.query(Mentor).filter(Mentor.mentor_id == payload.mentor_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    return MessageResponse(
        message=f"Mentorship session requested with {m.name} for topic: '{payload.topic}'."
    )


@router.get("/api/mentor/sessions")
def get_upcoming_sessions(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return [
        {
            "session_id": "SES-001",
            "mentor_name": "Dr. Arun Kumar",
            "topic": "Roadmap & MLOps Strategy",
            "scheduled_time": "Tomorrow · 4:00 PM PST",
            "platform": "Google Meet",
            "agenda": "Discuss MLOps milestone and portfolio evidence",
        }
    ]


@router.get("/api/mentor/feedback")
def get_student_mentor_feedback(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    feedbacks = (
        db.query(MentorFeedback)
        .filter(MentorFeedback.student_id == current_student.student_id)
        .all()
    )

    if not feedbacks:
        return [
            {
                "feedback_id": "F0001",
                "mentor_name": "Dr. Arun Kumar",
                "project_name": "Customer Churn Prediction",
                "skill_name": "Machine Learning",
                "rating": 4.0,
                "comments": "Good implementation. Improve feature engineering and model explainability.",
                "strengths": "Solid pipeline structure and baseline accuracy.",
                "improvement_areas": "Add cross-validation and MLflow tracking.",
                "date": "2026-09-24",
            }
        ]

    return [
        {
            "feedback_id": f.feedback_id,
            "mentor_name": f.mentor.name if f.mentor else "Expert Mentor",
            "project_name": f.project.project_name if f.project else f.project_id,
            "skill_name": f.skill.skill_name if f.skill else f.skill_id,
            "rating": float(f.rating),
            "comments": f.comments,
            "strengths": f.strengths,
            "improvement_areas": f.improvement_areas,
            "recommended_action": f.recommended_action,
            "date": f.feedback_date,
        }
        for f in feedbacks
    ]


@router.post("/api/mentor/feedback", response_model=MessageResponse)
def submit_mentor_feedback(
    payload: MentorFeedbackPayload,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    # Resolve skill by skill_id or skill_name
    skill = db.query(Skill).filter(Skill.skill_id == payload.skill_id).first()
    if not skill:
        skill = db.query(Skill).filter(Skill.skill_name.ilike(payload.skill_id)).first()

    target_skill_id = skill.skill_id if skill else payload.skill_id

    feedback = MentorFeedback(
        feedback_id=f"FB-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=payload.mentor_id,
        student_id=current_student.student_id,
        project_id=payload.project_id,
        skill_id=target_skill_id,
        rating=payload.rating,
        strengths=payload.strengths,
        improvement_areas=payload.improvement_areas,
        comments=payload.comments,
        recommended_action=payload.recommended_action,
        feedback_date=datetime.now().strftime("%Y-%m-%d"),
    )
    db.add(feedback)

    # Convert 1-5 star rating or raw score into 0-100 scale
    if payload.rating <= 5:
        mentor_score = int(round((payload.rating / 5.0) * 100))
    else:
        mentor_score = min(100, max(0, payload.rating))

    # Persist mentor evidence and recalibrate final mastery
    update_or_create_student_skill(
        db=db,
        student_id=current_student.student_id,
        skill_id=target_skill_id,
        mentor_score=mentor_score,
    )

    db.commit()
    return MessageResponse(
        message=f"Mentor feedback submitted successfully. Demonstrated skill evidence updated to {mentor_score}%."
    )
