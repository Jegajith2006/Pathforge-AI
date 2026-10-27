from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class RoadmapStepItem(BaseModel):
    step_number: int = Field(..., description="1-indexed sequence order")
    milestone_name: str = Field(..., description="Milestone action title")
    skill_id: Optional[str] = None
    skill_name: Optional[str] = None
    category: Optional[str] = "Engineering"
    target_level: Optional[str] = "Intermediate"
    target_score: Optional[int] = 70
    current_mastery: Optional[int] = 0
    gap: Optional[int] = 0
    priority: Optional[str] = "Medium Priority"
    status: str = "pending"  # completed, in_progress, pending
    estimated_weeks: int = Field(3, description="Estimated duration in weeks")
    start_week: Optional[int] = 1
    end_week: Optional[int] = 3
    readiness_lift: int = 8
    course_id: Optional[str] = None
    course_name: Optional[str] = None
    course_provider: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    has_assessment: bool = True
    progress_percentage: int = 0
    prerequisites_satisfied: bool = True
    prerequisites: List[str] = Field(default_factory=list)


class WeeklyPlanItem(BaseModel):
    week_number: int
    title: str
    focus_skill: str
    action_type: str  # Course, Project, Assessment, Practice
    description: str
    resource_name: str
    estimated_hours: int = 10
    status: str = "pending"


class RoadmapResponse(BaseModel):
    career_id: str
    career_name: str
    current_progress_percentage: int
    completed_milestones: int
    total_milestones: int
    next_best_action: str
    next_milestone_title: str
    projected_weeks_to_ready: int
    milestones: List[RoadmapStepItem]
    weekly_plan: List[WeeklyPlanItem] = Field(default_factory=list)
    explanation: Optional[str] = None
