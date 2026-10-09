import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime

from database.connection import get_db
from database.models import Feedback, Student
from schemas.common import MessageResponse
from routers.auth import get_current_student

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


class FeedbackSubmission(BaseModel):
    category: str = "Recommendations"
    rating: int = Field(5, ge=1, le=5)
    comment: str
    issue_type: Optional[str] = "None"


@router.post("", response_model=MessageResponse)
def submit_feedback(
    payload: FeedbackSubmission,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    f_id = f"FDB-{uuid.uuid4().hex[:8].upper()}"

    # Sentiment estimation based on rating
    if payload.rating >= 4:
        sentiment = "Positive"
    elif payload.rating == 3:
        sentiment = "Neutral"
    else:
        sentiment = "Negative"

    fb = Feedback(
        feedback_id=f_id,
        student_id=current_student.student_id,
        category=payload.category,
        rating=payload.rating,
        comment=payload.comment,
        sentiment=sentiment,
        issue_type=payload.issue_type or "None",
        created_at=datetime.now().strftime("%Y-%m-%d"),
    )
    db.add(fb)
    db.commit()

    return MessageResponse(
        message="Thank you! Your feedback has been recorded and will help improve recommendation explainability.",
        data={"feedback_id": f_id, "sentiment": sentiment},
    )


@router.get("")
def list_feedback(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(Feedback)
        .filter(Feedback.student_id == current_student.student_id)
        .order_by(Feedback.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "feedback_id": e.feedback_id,
            "category": e.category,
            "rating": e.rating,
            "comment": e.comment,
            "sentiment": e.sentiment,
            "issue_type": e.issue_type,
            "created_at": e.created_at,
        }
        for e in entries
    ]


@router.get("/{feedback_id}")
def get_feedback_by_id(feedback_id: str, db: Session = Depends(get_db)):
    e = db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Feedback entry not found.")
    return {
        "feedback_id": e.feedback_id,
        "category": e.category,
        "rating": e.rating,
        "comment": e.comment,
        "sentiment": e.sentiment,
        "issue_type": e.issue_type,
        "created_at": e.created_at,
    }
