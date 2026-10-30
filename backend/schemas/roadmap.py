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
    status: str = "pending"  # completed, in_progress, pending, locked
    estimated_weeks: int = Field(3, description="Estimated duration in weeks")
    start_week: Optional[int] = 1
    end_week: Optional[int] = 3
    readiness_lift: int = 8
    course_id: Optional[str] = None
    course_name: Optional[str] = None
    course_provider: Optional[str] = None
    difficulty: Optional[str] = "Beginner"
    duration_hours: Optional[int] = 10
    skills_taught: List[str] = Field(default_factory=list)
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    has_assessment: bool = True
    progress_percentage: int = 0
    prerequisites_satisfied: bool = True
    prerequisites: List[str] = Field(default_factory=list)
    is_locked: bool = False
    lock_reason: Optional[str] = None
    phase_id: Optional[str] = None
    phase_name: Optional[str] = None
    tier: Optional[int] = 0
    completed_lessons: int = 0
    total_lessons: int = 0


class WeeklyPlanCourseItem(BaseModel):
    course_id: str
    course_name: str
    hours: int = 0
    completed: bool = False


class WeeklyPlanItem(BaseModel):
    week_number: int
    title: str
    focus_skill: str
    action_type: str  # Course, Project, Assessment, Practice
    description: str
    resource_name: str
    estimated_hours: int = 10
    status: str = "pending"  # done, this_week, upcoming, overdue
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    date_range: Optional[str] = None
    progress_percentage: int = 0
    courses_planned: List[WeeklyPlanCourseItem] = Field(default_factory=list)


class RoadmapPhase(BaseModel):
    phase_id: str
    phase_name: str
    tier: int
    description: str
    total_courses: int
    completed_courses: int
    total_lessons: int
    completed_lessons: int
    progress_percentage: int
    is_locked: bool = False
    milestones: List[RoadmapStepItem] = Field(default_factory=list)


class RoadmapPreferencesUpdate(BaseModel):
    weekly_learning_hours: int = Field(..., ge=1, le=80, description="Hours dedicated per week to learning")


class RoadmapResponse(BaseModel):
    career_id: Optional[str] = None
    career_name: Optional[str] = None
    current_progress_percentage: int
    completed_milestones: int
    total_milestones: int
    completed_courses_count: int = 0
    total_courses_count: int = 0
    completed_lessons_count: int = 0
    total_lessons_count: int = 0
    next_best_action: str
    next_milestone_title: str
    projected_weeks_to_ready: int
    estimated_finish_date: Optional[str] = None
    weekly_learning_hours: int = 12
    milestones: List[RoadmapStepItem]
    phases: List[RoadmapPhase] = Field(default_factory=list)
    weekly_plan: List[WeeklyPlanItem] = Field(default_factory=list)
    explanation: Optional[str] = None
