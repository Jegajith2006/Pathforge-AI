from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    roles = relationship("CompanyRole", back_populates="company", cascade="all, delete-orphan")


class CompanyRole(Base):
    __tablename__ = "company_roles"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    role_title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    required_skills = Column(JSON, default=list)  # list of skill objects or names
    match_score = Column(Float, default=0.0)      # e.g., 85.0
    readiness_level = Column(String(50), default="High Match")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    company = relationship("Company", back_populates="roles")
