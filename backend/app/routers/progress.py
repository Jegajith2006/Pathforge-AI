from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.progress import Progress
from app.models.user import User
from app.schemas.progress import ProgressResponse, ProgressCreate

router = APIRouter(prefix="/api/progress", tags=["Progress"])


@router.get("", response_model=List[ProgressResponse], summary="List Progress & Activity History")
def get_progress(db: Session = Depends(get_db)):
    """Retrieves chronological activity and milestone history."""
    return db.query(Progress).order_by(Progress.activity_date.desc()).all()


@router.post("", response_model=ProgressResponse, status_code=status.HTTP_201_CREATED, summary="Log Learning Activity")
def log_progress(progress_in: ProgressCreate, db: Session = Depends(get_db)):
    """Logs a completed learning milestone or assessment."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    record = Progress(
        user_id=progress_in.user_id or user.id,
        activity_type=progress_in.activity_type,
        activity_title=progress_in.activity_title,
        progress_value=progress_in.progress_value,
        activity_date=progress_in.activity_date or datetime.utcnow(),
        notes=progress_in.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
