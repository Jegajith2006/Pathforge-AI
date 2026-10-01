from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)
    difficulty = Column(String(30), default="Intermediate")
    estimated_hours = Column(Integer, default=20)
    status = Column(String(30), default="Not Started")  # Not Started, In Progress, Completed
    progress_percentage = Column(Float, default=0.0)
    github_url = Column(String(255), nullable=True)
    demo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
