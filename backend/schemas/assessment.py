from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class QuestionOut(BaseModel):
    question_id: str
    career_id: str
    skill_id: str
    skill_name: str
    difficulty: str
    question_type: str
    question: str
    question_text: Optional[str] = None
    options: List[str]
    marks: float = 1.0
    time_limit_seconds: int = 60

    model_config = {"from_attributes": True}


class AssessmentStartRequest(BaseModel):
    career_id: Optional[str] = None
    skill_id: Optional[str] = None
    course_id: Optional[str] = None
    lesson_id: Optional[str] = None
    limit: Optional[int] = 15


class AssessmentStartResponse(BaseModel):
    assessment_id: str
    career_id: str
    career_name: str
    total_questions: int
    estimated_time_minutes: int
    difficulty: str
    skills_covered: List[str]
    questions: List[QuestionOut]


class AnswerSubmission(BaseModel):
    question_id: str
    selected_answer: Optional[str] = None
    selected_option: Optional[str] = None
    time_taken_seconds: int = 30


class AssessmentSubmitRequest(BaseModel):
    assessment_id: str
    course_id: Optional[str] = None
    lesson_id: Optional[str] = None
    answers: List[AnswerSubmission]


class QuestionReview(BaseModel):
    question_id: str
    skill_id: str
    skill_name: str
    question: str
    question_type: Optional[str] = "MCQ"
    difficulty: Optional[str] = "Intermediate"
    selected_answer: str
    correct_answer: str
    is_correct: bool
    marks: float = 1.0
    earned_marks: float = 0.0
    explanation: str


class SkillResultItem(BaseModel):
    skill_id: str
    skill_name: str
    score: int
    level: str
    total_questions: int
    correct_answers: int
    total_marks: Optional[float] = None
    earned_marks: Optional[float] = None
    self_declared_score: Optional[int] = 0
    self_declared_level: Optional[str] = "Missing"
    final_mastery: Optional[int] = 0
    mastery_level: Optional[str] = "Missing"
    evidence_count: Optional[int] = 0
    is_completed: Optional[bool] = False
    completion_status: Optional[str] = "not_started"
    completed_at: Optional[str] = None
    threshold: Optional[int] = 80
    next_recommended_action: Optional[str] = None


class AssessmentResultResponse(BaseModel):
    assessment_id: str
    student_id: str
    career_id: Optional[str] = None
    career_name: str
    total_questions: int
    correct_count: int
    incorrect_count: int = 0
    total_marks: float = 0.0
    earned_marks: float = 0.0
    score_percentage: int
    overall_score: int = 0
    score_grade: str
    level: str = "Developing"
    skill_breakdown: Dict[str, int] = {}
    skill_results: List[SkillResultItem] = []
    question_type_breakdown: Dict[str, Any] = {}
    difficulty_breakdown: Dict[str, Any] = {}
    strong_skills: List[str] = []
    developing_skills: List[str] = []
    weak_skills: List[str] = []
    reviews: List[QuestionReview] = []
    updated_mastery_skills: List[str] = []
    feedback: str
    explanation: Optional[str] = None
    passed: Optional[bool] = False
    is_passed: Optional[bool] = False


class AssessmentHistoryItem(BaseModel):
    attempt_date: str
    career_name: str
    questions_attempted: int
    correct_count: int
    score_percentage: int
    status: str

