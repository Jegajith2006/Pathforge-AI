from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.mentor import MentorFeedback
from app.models.user import User
from app.schemas.mentor import MentorFeedbackResponse, MentorFeedbackCreate

router = APIRouter(prefix="/api/mentor-feedback", tags=["Mentor Feedback"])


@router.get("", response_model=List[MentorFeedbackResponse], summary="List Mentor Feedback Items")
def get_mentor_feedbacks(db: Session = Depends(get_db)):
    """Retrieves all feedback and reviews received from industry mentors."""
    return db.query(MentorFeedback).order_by(MentorFeedback.created_at.desc()).all()


@router.post("", response_model=MentorFeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Submit Mentor Feedback Request")
def create_mentor_feedback(feedback_in: MentorFeedbackCreate, db: Session = Depends(get_db)):
    """Logs or requests mentor feedback on a project or skill."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    record = MentorFeedback(
        user_id=feedback_in.user_id or user.id,
        mentor_name=feedback_in.mentor_name,
        mentor_role=feedback_in.mentor_role,
        feedback_title=feedback_in.feedback_title,
        feedback_text=feedback_in.feedback_text,
        feedback_type=feedback_in.feedback_type or "Code Review",
        status=feedback_in.status or "Received",
        priority=feedback_in.priority or "Medium",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
