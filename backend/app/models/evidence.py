from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Evidence(Base):
    __tablename__ = "evidence_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    evidence_type = Column(String(50), nullable=False)  # Certificate, GitHub Repository, Project Demo, Assessment, Mentor Review, Document
    url = Column(String(255), nullable=True)
    verification_status = Column(String(30), default="Pending")  # Pending, Verified, Rejected
    portfolio_ready = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="evidence_items")
