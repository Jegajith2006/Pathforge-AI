from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from app.core.database import Base


class RoadmapPhase(Base):
    __tablename__ = "roadmap_phases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    phase_number = Column(Integer, nullable=False)
    status = Column(String(30), default="Locked")  # Locked, Available, In Progress, Completed
    progress_percentage = Column(Float, default=0.0)
    estimated_weeks = Column(Integer, default=4)
    order_index = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
