from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime
from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False, index=True)
    provider = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)
    difficulty = Column(String(30), default="Intermediate")
    duration_hours = Column(Float, default=10.0)
    rating = Column(Float, default=4.8)
    url = Column(String(255), nullable=True)
    is_completed = Column(Boolean, default=False)
    progress_percentage = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
