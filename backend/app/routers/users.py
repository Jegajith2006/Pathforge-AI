from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(tags=["Users & Profile"])


@router.get("/api/users/me", response_model=UserResponse, summary="Get Current Authenticated User")
def get_current_user(db: Session = Depends(get_db)):
    """
    Returns the active user profile (defaults to primary demo user in development).
    """
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please run seed service."
        )
    return user


@router.get("/api/profile", response_model=UserResponse, summary="Get Profile")
def get_profile(db: Session = Depends(get_db)):
    """Returns profile information for the current user."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return user


@router.put("/api/profile", response_model=UserResponse, summary="Update Profile")
def update_profile(updates: UserUpdate, db: Session = Depends(get_db)):
    """Updates profile attributes for current user."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.get("/api/settings", summary="Get User Settings & Preferences")
def get_settings(db: Session = Depends(get_db)):
    """Returns application configuration preferences for current user."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {
        "weekly_learning_hours": user.weekly_learning_hours,
        "preferred_learning_style": user.preferred_learning_style,
        "target_role": user.target_role,
        "notifications_enabled": True,
        "telemetry_enabled": True,
        "data_mode": "api"
    }


@router.put("/api/settings", summary="Update User Settings & Preferences")
def update_settings(settings_data: dict, db: Session = Depends(get_db)):
    """Updates user preferences and learning configurations."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if "weekly_learning_hours" in settings_data:
        user.weekly_learning_hours = settings_data["weekly_learning_hours"]
    if "preferred_learning_style" in settings_data:
        user.preferred_learning_style = settings_data["preferred_learning_style"]
    if "target_role" in settings_data:
        user.target_role = settings_data["target_role"]

    db.commit()
    db.refresh(user)
    return {
        "success": True,
        "message": "Settings updated successfully",
        "settings": {
            "weekly_learning_hours": user.weekly_learning_hours,
            "preferred_learning_style": user.preferred_learning_style,
            "target_role": user.target_role,
            "notifications_enabled": settings_data.get("notifications_enabled", True),
            "telemetry_enabled": settings_data.get("telemetry_enabled", True),
        }
    }
