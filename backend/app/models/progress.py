from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Progress(Base):
    __tablename__ = "progress_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String(50), nullable=False)  # Course, Project, Skill, Assessment, Evidence, Mentor Feedback
    activity_title = Column(String(150), nullable=False)
    progress_value = Column(Float, default=100.0)
    activity_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    # Relationship
    user = relationship("User", back_populates="progress_records")
