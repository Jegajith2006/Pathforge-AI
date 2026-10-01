from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class ReadinessSnapshot(Base):
    __tablename__ = "readiness_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    overall_score = Column(Float, nullable=False)
    skill_coverage_score = Column(Float, nullable=False)
    project_score = Column(Float, nullable=False)
    consistency_score = Column(Float, nullable=False)
    evidence_score = Column(Float, nullable=False)
    mentor_score = Column(Float, nullable=False)
    readiness_level = Column(String(50), default="High Potential")  # e.g., Junior Ready, Mid-Level Ready, High Potential
    calculated_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="readiness_snapshots")
