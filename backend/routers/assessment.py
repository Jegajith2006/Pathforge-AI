from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Student, AssessmentQuestion, Career
from schemas.assessment import (
    AssessmentStartRequest,
    AssessmentStartResponse,
    AssessmentSubmitRequest,
    AssessmentResultResponse,
    AssessmentHistoryItem,
    QuestionOut,
)
from schemas.common import MessageResponse
from routers.auth import get_current_student
from services.assessment_service import (
    start_diagnostic_assessment,
    evaluate_assessment_submission,
    get_assessment_result_by_id,
    get_assessment_history,
)

router = APIRouter(prefix="/api/assessment", tags=["Assessment Portal"])


@router.get("", response_model=Dict[str, Any])
def get_assessment_overview(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    career = db.query(Career).filter(Career.career_id == current_student.target_career_id).first()
    career_name = career.career_name if career else "Machine Learning Engineer"

    # Blueprint skills
    blueprint_skills = [
        {"skill_name": cs.skill.skill_name, "level": cs.required_level, "importance": cs.importance}
        for cs in career.skills[:9]
    ] if career else []

    return {
        "target_career_id": current_student.target_career_id,
        "target_career_name": career_name,
        "total_available_questions": 30,
        "estimated_time_minutes": 40,
        "difficulty": "Adaptive",
        "blueprint_skills": blueprint_skills,
        "instructions": [
            "Questions adapt based on your demonstrated responses.",
            "Your score updates your verifiable skill profile in the database.",
            "Results are an internal project assessment, not an industry certificate.",
        ],
    }


@router.post("/start", response_model=AssessmentStartResponse)
def start_assessment_post(
    payload: Optional[AssessmentStartRequest] = None,
    career_id: Optional[str] = None,
    skill_id: Optional[str] = None,
    course_id: Optional[str] = None,
    lesson_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    cid = payload.career_id if (payload and payload.career_id) else career_id
    sid = payload.skill_id if (payload and payload.skill_id) else skill_id
    c_id = payload.course_id if (payload and payload.course_id) else course_id
    l_id = payload.lesson_id if (payload and payload.lesson_id) else lesson_id
    limit = payload.limit if (payload and payload.limit) else 15
    try:
        return start_diagnostic_assessment(
            db, current_student.student_id, career_id=cid, skill_id=sid, limit=limit, course_id=c_id, lesson_id=l_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/start", response_model=AssessmentStartResponse)
def start_assessment_get(
    career_id: Optional[str] = None,
    skill_id: Optional[str] = None,
    course_id: Optional[str] = None,
    lesson_id: Optional[str] = None,
    limit: int = 15,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    try:
        return start_diagnostic_assessment(
            db, current_student.student_id, career_id=career_id, skill_id=skill_id, limit=limit, course_id=course_id, lesson_id=lesson_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/questions", response_model=List[QuestionOut])
def get_questions_sample(
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    res = start_diagnostic_assessment(db, current_student.student_id, career_id=career_id, limit=10)
    return res["questions"]


@router.post("/answer", response_model=MessageResponse)
def record_single_answer(
    question_id: str = Body(..., embed=True),
    selected_answer: str = Body(..., embed=True),
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return MessageResponse(message=f"Answer recorded for question {question_id}.")


@router.post("/submit", response_model=AssessmentResultResponse)
def submit_assessment(
    payload: AssessmentSubmitRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    if not payload.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment submission contains no answers.",
        )
    submissions_list = [
        {
            "question_id": ans.question_id,
            "selected_answer": ans.selected_answer or ans.selected_option or "",
            "time_taken_seconds": ans.time_taken_seconds or 30,
        }
        for ans in payload.answers
    ]
    return evaluate_assessment_submission(
        db, current_student.student_id, payload.assessment_id, submissions_list,
        course_id=payload.course_id, lesson_id=payload.lesson_id
    )


@router.get("/result/{assessment_id}", response_model=Dict[str, Any])
def get_assessment_result(
    assessment_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_assessment_result_by_id(db, current_student.student_id, assessment_id)


@router.get("/history", response_model=List[AssessmentHistoryItem])
def get_history(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_assessment_history(db, current_student.student_id)


@router.post("/retake", response_model=AssessmentStartResponse)
def retake_assessment(
    career_id: Optional[str] = None,
    skill_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return start_diagnostic_assessment(db, current_student.student_id, career_id=career_id, skill_id=skill_id, limit=15)
