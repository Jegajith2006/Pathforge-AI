"""
PathForge AI - Gemini Generative AI Capabilities Router
Provides authenticated REST endpoints for AI Career Chatbot, Cover Letter Generation,
Roadmap Explanation, Assessment Question Generation, and Project Explanations.

IMPORTANT SECURITY RULE:
GEMINI_API_KEY is never exposed to the frontend or included in API responses.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Student, StudentSkill, Skill, Project, Career
from routers.auth import get_current_student
from services.gemini_service import gemini_service
from services.skill_gap_service import analyze_student_skill_gap, compute_career_readiness
from services.roadmap_service import generate_topological_roadmap

router = APIRouter(prefix="/api/ai", tags=["Gemini Generative AI Intelligence"])


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message to the AI career assistant")


class ChatResponse(BaseModel):
    response: str
    target_career: str
    readiness_score: int


class CoverLetterRequest(BaseModel):
    role_title: str
    company_name: str


class CoverLetterResponse(BaseModel):
    cover_letter: str
    student_name: str
    role_title: str
    company_name: str
    skills_included: List[str]


class RoadmapExplanationRequest(BaseModel):
    career_id: Optional[str] = None


class RoadmapExplanationResponse(BaseModel):
    explanation: str
    target_career: str
    milestones_count: int


class QuestionGenerationRequest(BaseModel):
    skill_name: str
    career_name: Optional[str] = "Machine Learning Engineer"
    difficulty: Optional[str] = "Intermediate"
    question_type: Optional[str] = "MCQ"


class ProjectExplanationRequest(BaseModel):
    project_name: str
    skills_developed: List[str]
    target_career: Optional[str] = "Machine Learning Engineer"


@router.post("/chat", response_model=ChatResponse)
def ai_career_chat(
    payload: ChatRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    AI Career Chatbot grounded strictly in student's verified skills,
    skill gaps, target career, and roadmap status.
    """
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    gap_data = analyze_student_skill_gap(db, current_student.student_id)
    readiness = compute_career_readiness(db, current_student.student_id)
    
    student_skills = (
        db.query(StudentSkill)
        .filter(StudentSkill.student_id == current_student.student_id)
        .all()
    )
    top_skills = [
        ss.skill.skill_name for ss in student_skills
        if ss.skill and ss.final_mastery >= 50
    ][:5]

    top_gaps = [g["skill_name"] for g in gap_data.get("gaps", [])][:4]

    context = {
        "target_career": gap_data.get("career_name", "Software Engineer"),
        "readiness_score": readiness.get("career_readiness_score", 65),
        "top_skills": top_skills,
        "skill_gaps": top_gaps,
    }

    ai_reply = gemini_service.chat_response(payload.message, context)

    return {
        "response": ai_reply,
        "target_career": context["target_career"],
        "readiness_score": context["readiness_score"],
    }


@router.post("/cover-letter", response_model=CoverLetterResponse)
def generate_tailored_cover_letter(
    payload: CoverLetterRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Generates a tailored cover letter draft based strictly on demonstrable student evidence.
    """
    student_skills = (
        db.query(StudentSkill)
        .filter(StudentSkill.student_id == current_student.student_id)
        .all()
    )
    verified_skills = [
        ss.skill.skill_name for ss in student_skills
        if ss.skill and ss.final_mastery >= 45
    ]

    student_name = f"{current_student.first_name} {current_student.last_name}"
    cover_letter_text = gemini_service.generate_cover_letter(
        student_name=student_name,
        role_title=payload.role_title,
        company_name=payload.company_name,
        verified_skills=verified_skills,
    )

    return {
        "cover_letter": cover_letter_text,
        "student_name": student_name,
        "role_title": payload.role_title,
        "company_name": payload.company_name,
        "skills_included": verified_skills[:6],
    }


@router.post("/explain-roadmap", response_model=RoadmapExplanationResponse)
def explain_learning_roadmap(
    payload: Optional[RoadmapExplanationRequest] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    roadmap = generate_topological_roadmap(db, current_student.student_id)
    milestones = [m.get("milestone_name", m.get("skill_name", "Milestone")) for m in roadmap.get("milestones", [])]
    target_career = roadmap.get("career_name", "Software Engineer")

    gap_data = analyze_student_skill_gap(db, current_student.student_id)
    gaps = [g["skill_name"] for g in gap_data.get("gaps", [])]

    explanation = gemini_service.explain_roadmap(
        top_milestones=milestones,
        target_career=target_career,
        student_gaps=gaps,
    )

    return {
        "explanation": explanation,
        "target_career": target_career,
        "milestones_count": len(milestones),
    }


@router.post("/explain-project")
def explain_project(
    payload: ProjectExplanationRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Explains why a portfolio project is recommended for the student's career path.
    """
    explanation = gemini_service.explain_project_recommendation(
        project_name=payload.project_name,
        skills_developed=payload.skills_developed,
        target_career=payload.target_career or "Software Engineer",
    )
    return {
        "project_name": payload.project_name,
        "explanation": explanation,
        "skills_developed": payload.skills_developed,
    }


@router.post("/generate-question")
def generate_assessment_question(
    payload: QuestionGenerationRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Generates a validated assessment question for diagnostic evaluation.
    """
    question_data = gemini_service.generate_assessment_question(
        career=payload.career_name or "Machine Learning Engineer",
        skill=payload.skill_name,
        difficulty=payload.difficulty or "Intermediate",
        question_type=payload.question_type or "MCQ",
    )
    return question_data
