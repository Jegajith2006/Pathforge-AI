from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse], summary="List User Notifications")
def get_notifications(db: Session = Depends(get_db)):
    """Retrieves all notifications for current user."""
    return db.query(Notification).order_by(Notification.created_at.desc()).all()


@router.put("/{notification_id}/read", response_model=NotificationResponse, summary="Mark Notification as Read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """Marks a specific notification as read."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Notification {notification_id} not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
