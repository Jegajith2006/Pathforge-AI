from typing import Optional, List
from pydantic import BaseModel, Field


class CareerSkillItem(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    required_level: str
    importance: int
    weight: float
    is_core_skill: bool

    model_config = {"from_attributes": True}


class CareerResponse(BaseModel):
    career_id: str
    career_name: str
    category: str
    description: str
    difficulty: str
    estimated_preparation_months: int
    core_focus: str
    typical_entry_level: str
    match_percentage: Optional[int] = None
    required_skills: List[CareerSkillItem] = []

    model_config = {"from_attributes": True}


class CareerSelectRequest(BaseModel):
    career_id: str


class SkillGapItem(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    required_level: str
    required_score: int
    current_mastery: int
    gap: int
    status: Optional[str] = "Gap"  # Met, Near Target, Moderate Gap, Major Gap, Critical Gap
    priority: str                  # Critical Gap, High Priority, Medium Priority, Near Target, Met
    priority_score: Optional[float] = None
    priority_rank: Optional[int] = None
    tone: str                      # danger, warning, purple, success
    importance: int
    weight: float
    is_core_skill: bool
    evidence_status: str
    projected_readiness_lift: int


class SkillGapResponse(BaseModel):
    career_id: str
    career_name: str
    total_required_skills: int
    mastered_skills_count: int
    developing_skills_count: int
    missing_skills_count: int
    high_impact_count: int
    overall_skill_gap: int
    current_readiness: int
    skill_match_pct: Optional[int] = None
    avg_mastery_pct: Optional[int] = None
    evidence_pct: Optional[int] = None
    projected_lift_6_weeks: int
    gaps: List[SkillGapItem]
