from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database.connection import get_db
from database.models import Student, StudentSkill, Skill
from schemas.student import (
    StudentProfileResponse,
    StudentProfileUpdate,
    StudentSkillItem,
    StudentSkillUpdate,
    LearningPreferencesUpdate,
)
from schemas.common import MessageResponse
from routers.auth import get_current_student
from services.skill_gap_service import calibrate_mastery_score, update_or_create_student_skill

router = APIRouter(prefix="/api/profile", tags=["Student Profile"])


@router.get("", response_model=StudentProfileResponse)
def get_profile(
    current_student: Student = Depends(get_current_student),
):
    return {
        "student_id": current_student.student_id,
        "first_name": current_student.first_name,
        "last_name": current_student.last_name,
        "full_name": f"{current_student.first_name} {current_student.last_name}",
        "email": current_student.email,
        "college": current_student.college,
        "department": current_student.department,
        "degree": current_student.degree,
        "graduation_year": current_student.graduation_year,
        "cgpa": current_student.cgpa,
        "target_career_id": current_student.target_career_id,
        "target_career_name": current_student.career.career_name if current_student.career else None,
        "weekly_learning_hours": current_student.weekly_learning_hours,
        "preferred_difficulty": current_student.preferred_difficulty,
        "learning_mode": current_student.learning_mode,
    }


@router.put("", response_model=StudentProfileResponse)
def update_profile(
    payload: StudentProfileUpdate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(current_student, field, val)

    db.commit()
    db.refresh(current_student)

    return {
        "student_id": current_student.student_id,
        "first_name": current_student.first_name,
        "last_name": current_student.last_name,
        "full_name": f"{current_student.first_name} {current_student.last_name}",
        "email": current_student.email,
        "college": current_student.college,
        "department": current_student.department,
        "degree": current_student.degree,
        "graduation_year": current_student.graduation_year,
        "cgpa": current_student.cgpa,
        "target_career_id": current_student.target_career_id,
        "target_career_name": current_student.career.career_name if current_student.career else None,
        "weekly_learning_hours": current_student.weekly_learning_hours,
        "preferred_difficulty": current_student.preferred_difficulty,
        "learning_mode": current_student.learning_mode,
    }


@router.get("/skills", response_model=List[StudentSkillItem])
def get_student_skills(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    skills = (
        db.query(StudentSkill)
        .filter(StudentSkill.student_id == current_student.student_id)
        .all()
    )
    result = []
    for ss in skills:
        s = ss.skill
        result.append({
            "skill_id": ss.skill_id,
            "skill_name": s.skill_name if s else ss.skill_id,
            "category": s.category if s else "General",
            "self_declared_score": ss.self_declared_score,
            "resume_score": ss.resume_score,
            "assessment_score": ss.assessment_score,
            "project_score": ss.project_score,
            "certificate_score": ss.certificate_score,
            "mentor_score": ss.mentor_score,
            "final_mastery": ss.final_mastery,
            "mastery_level": ss.mastery_level,
            "evidence_count": ss.evidence_count,
            "last_updated": ss.last_updated,
        })
    return result


@router.put("/skills", response_model=MessageResponse)
def update_student_skill(
    payload: StudentSkillUpdate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    now_str = datetime.now().strftime("%Y-%m-%d")
    skill = db.query(Skill).filter(Skill.skill_id == payload.skill_id).first()
    if not skill:
        skill = db.query(Skill).filter(Skill.skill_name.ilike(payload.skill_id)).first()

    target_skill_id = skill.skill_id if skill else payload.skill_id

    ss = update_or_create_student_skill(
        db=db,
        student_id=current_student.student_id,
        skill_id=target_skill_id,
        self_declared_score=payload.self_declared_score or 50,
    )
    db.commit()
    db.refresh(ss)

    return MessageResponse(
        message=f"Skill '{target_skill_id}' calibrated. Final mastery: {ss.final_mastery}% ({ss.mastery_level})."
    )


@router.get("/preferences")
def get_preferences(current_student: Student = Depends(get_current_student)):
    return {
        "weekly_learning_hours": current_student.weekly_learning_hours,
        "preferred_difficulty": current_student.preferred_difficulty,
        "learning_mode": current_student.learning_mode,
    }


@router.put("/preferences", response_model=MessageResponse)
def update_preferences(
    payload: LearningPreferencesUpdate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    if payload.weekly_learning_hours is not None:
        current_student.weekly_learning_hours = payload.weekly_learning_hours
    if payload.preferred_difficulty is not None:
        current_student.preferred_difficulty = payload.preferred_difficulty
    if payload.learning_mode is not None:
        current_student.learning_mode = payload.learning_mode

    db.commit()
    return MessageResponse(message="Learning preferences updated successfully.")
