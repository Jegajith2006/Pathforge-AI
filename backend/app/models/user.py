from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    target_role = Column(String(100), default="AI Engineer")
    experience_level = Column(String(50), default="Mid-Level")
    learning_goal = Column(Text, nullable=True)
    weekly_learning_hours = Column(Integer, default=12)
    preferred_learning_style = Column(String(50), default="Project-Based")
    current_streak = Column(Integer, default=0)
    readiness_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skills = relationship("Skill", back_populates="user", cascade="all, delete-orphan")
    progress_records = relationship("Progress", back_populates="user", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="user", cascade="all, delete-orphan")
    mentor_feedbacks = relationship("MentorFeedback", back_populates="user", cascade="all, delete-orphan")
    readiness_snapshots = relationship("ReadinessSnapshot", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
