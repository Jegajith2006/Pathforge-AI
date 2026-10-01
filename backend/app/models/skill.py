from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # Core AI, ML Engineering, Backend, MLOps
    current_level = Column(Float, default=0.0)      # 0 to 100
    required_level = Column(Float, default=80.0)    # 0 to 100
    status = Column(String(30), default="In Progress")  # Acquired, In Progress, Gap
    priority = Column(String(20), default="Medium")     # High, Medium, Low
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="skills")
