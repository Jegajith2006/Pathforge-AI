from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class MentorFeedback(Base):
    __tablename__ = "mentor_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_name = Column(String(100), nullable=False)
    mentor_role = Column(String(100), nullable=False)
    feedback_title = Column(String(150), nullable=False)
    feedback_text = Column(Text, nullable=False)
    feedback_type = Column(String(50), default="Code Review")
    status = Column(String(30), default="Received")  # Requested, In Review, Received, Resolved
    priority = Column(String(20), default="Medium")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="mentor_feedbacks")
