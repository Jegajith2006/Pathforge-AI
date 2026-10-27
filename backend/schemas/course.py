from typing import Optional, List
from pydantic import BaseModel, Field


class CourseSkillDetail(BaseModel):
    skill_id: str
    skill_name: str
    coverage_level: str
    importance: int


class CourseResponse(BaseModel):
    course_id: str
    course_name: str
    provider: str
    description: str
    category: str
    difficulty: str
    duration_hours: int
    format: str
    rating: float
    url: str
    language: str
    skills: List[CourseSkillDetail] = []
    progress_percentage: Optional[int] = 0
    status: Optional[str] = "not_started"
    last_lesson_id: Optional[str] = None
    last_lesson_title: Optional[str] = None
    completed_lessons: List[str] = []
    total_lessons: int = 5
    last_accessed_at: Optional[str] = None
    final_assessment_score: Optional[float] = None
    final_assessment_passed: Optional[bool] = False
    assessment_attempts_count: Optional[int] = 0
    match_percentage: Optional[int] = 85
    tag: Optional[str] = None
    explainability: Optional[str] = None
    primary_skill: Optional[str] = None
    duration_text: Optional[str] = None
    is_career_relevant: Optional[bool] = True
    career_id: Optional[str] = None
    career_name: Optional[str] = None
    matched_skills: List[str] = []

    model_config = {"from_attributes": True}


class CourseRecommendation(BaseModel):
    course_id: str
    course_name: str
    provider: str
    primary_skill: str
    match_percentage: int
    duration_text: str
    tag: str
    progress: int
    rating: float
    explainability: str
    url: str
    difficulty: Optional[str] = None
    skills: Optional[List[dict]] = None
    status: Optional[str] = "not_started"
    is_completed: Optional[bool] = False


class CourseProgressUpdate(BaseModel):
    progress_percentage: int = Field(..., ge=0, le=100)
    current_lesson_id: Optional[str] = None
    current_lesson_title: Optional[str] = None
    last_lesson_id: Optional[str] = None
    last_lesson_title: Optional[str] = None
    completed_lessons: Optional[List[str]] = None
    completed_lesson_ids: Optional[List[str]] = None
    completed_lessons_count: Optional[int] = None
    position_seconds: Optional[int] = None
    last_position_seconds: Optional[int] = None


class CourseProgressDetailResponse(BaseModel):
    course_id: str
    course_name: str
    progress_percentage: int
    status: str
    enrollment_status: str = "enrolled"
    current_lesson_id: Optional[str] = None
    current_lesson_title: Optional[str] = None
    last_lesson_id: Optional[str] = None
    last_lesson_title: Optional[str] = None
    last_position_seconds: int = 0
    total_lessons: int = 5
    completed_lessons_count: int = 0
    completed_lessons: List[str] = []
    last_accessed_at: Optional[str] = None
    next_lesson_id: Optional[str] = None
    next_lesson_title: Optional[str] = None
    next_lesson_to_continue: Optional[str] = None
    resume_suggestion: Optional[dict] = None
    final_assessment_score: Optional[float] = None
    final_assessment_passed: Optional[bool] = False
    assessment_attempts_count: Optional[int] = 0
    is_completed: Optional[bool] = False


class LessonResourceResponse(BaseModel):
    resource_id: str
    lesson_id: str
    course_id: str
    resource_order: int
    resource_type: str
    title: str
    url: str
    description: Optional[str] = None
    provider_name: str
    is_verified: bool = True
    is_reviewed: bool = False


class LessonDetailResponse(BaseModel):
    lesson_id: str
    course_id: str
    course_name: str
    course_provider: str
    lesson_number: int
    title: str
    overview: str
    learning_objectives: List[str] = []
    key_concepts: List[dict] = []
    study_notes: str
    step_by_step_explanation: Optional[str] = None
    code_examples: List[dict] = []
    practice_exercises: List[dict] = []
    estimated_minutes: int
    assessment_prerequisites: str = "complete_study_and_resources"
    completion_criteria: str = "study_notes_read,resources_reviewed,assessment_passed"
    is_project_provided: bool = True
    resources: List[LessonResourceResponse] = []
    status: str = "not_started"
    notes_read: bool = False
    resources_reviewed: List[str] = []
    is_assessment_unlocked: bool = False
    assessment_score: Optional[float] = None
    assessment_passed: bool = False
    prev_lesson_id: Optional[str] = None
    next_lesson_id: Optional[str] = None


class LessonSummaryItem(BaseModel):
    lesson_id: str
    lesson_number: int
    title: str
    overview: str
    estimated_minutes: int
    status: str = "not_started"
    is_unlocked: bool = True
    is_completed: bool = False
    prerequisite_explanation: Optional[str] = None


class CourseSyllabusResponse(BaseModel):
    course_id: str
    course_name: str
    provider: str
    difficulty: str
    duration_hours: int
    rating: float
    category: str
    total_lessons: int
    completed_lessons_count: int
    progress_percentage: int
    status: str
    next_lesson_id: Optional[str] = None
    lessons: List[LessonSummaryItem] = []
    final_assessment_score: Optional[float] = None
    final_assessment_passed: Optional[bool] = False
    assessment_attempts_count: Optional[int] = 0
    is_assessment_ready: Optional[bool] = False
    is_completed: Optional[bool] = False


class ReviewResourceRequest(BaseModel):
    resource_id: str


class CompleteLessonRequest(BaseModel):
    assessment_passed: Optional[bool] = None


