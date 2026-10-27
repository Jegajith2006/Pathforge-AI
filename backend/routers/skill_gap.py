from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Student, StudentSkill, Skill, Career
from schemas.career import SkillGapResponse, SkillGapItem
from schemas.common import CareerReadinessResponse
from routers.auth import get_current_student
from services.skill_gap_service import analyze_student_skill_gap
from services.career_readiness_service import compute_career_readiness

router = APIRouter(tags=["AI Skill Gap & Mastery"])


@router.get("/api/skill-gap", response_model=SkillGapResponse)
def get_skill_gap_analysis(
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    data = analyze_student_skill_gap(db, current_student.student_id, career_id=career_id)
    return SkillGapResponse(**data)


@router.post("/api/skill-gap/analyze", response_model=SkillGapResponse)
def trigger_skill_gap_analysis(
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    data = analyze_student_skill_gap(db, current_student.student_id, career_id=career_id)
    return SkillGapResponse(**data)


@router.get("/api/skill-gap/career/{career_id}", response_model=SkillGapResponse)
def get_skill_gap_by_career(
    career_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    data = analyze_student_skill_gap(db, current_student.student_id, career_id=career_id)
    return SkillGapResponse(**data)


@router.get("/api/skill-gap/{identifier}")
def get_skill_gap_by_identifier(
    identifier: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    # Check if identifier matches a career
    career = db.query(Career).filter((Career.career_id == identifier) | (Career.career_name.ilike(identifier))).first()
    if career:
        data = analyze_student_skill_gap(db, current_student.student_id, career_id=career.career_id)
        return SkillGapResponse(**data)

    # Otherwise treat as skill identifier
    data = analyze_student_skill_gap(db, current_student.student_id)
    for g in data["gaps"]:
        if g["skill_id"] == identifier or g["skill_name"].lower() == identifier.lower():
            return SkillGapItem(**g)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Resource '{identifier}' is not a valid career or skill in target career '{data['career_name']}'.",
    )


# Skill Mastery Endpoints
@router.get("/api/skills/mastery")
def get_all_skills_mastery(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    skills = (
        db.query(StudentSkill)
        .filter(StudentSkill.student_id == current_student.student_id)
        .all()
    )
    return [
        {
            "skill_id": ss.skill_id,
            "skill": ss.skill.skill_name if ss.skill else ss.skill_id,
            "skill_name": ss.skill.skill_name if ss.skill else ss.skill_id,
            "category": ss.skill.category if ss.skill else "General",
            "self_declared": ss.self_declared_score,
            "self_declared_score": ss.self_declared_score,
            "assessment": ss.assessment_score,
            "assessment_score": ss.assessment_score,
            "project": bool(ss.project_score > 0),
            "project_score": ss.project_score,
            "projects": bool(ss.project_score > 0),
            "certificate": bool(ss.certificate_score > 0),
            "certificate_score": ss.certificate_score,
            "mentor": "Verified" if ss.mentor_score >= 70 else ("Feedback" if ss.mentor_score > 0 else "None"),
            "mentor_score": ss.mentor_score,
            "resume_score": ss.resume_score,
            "final_mastery": ss.final_mastery,
            "status": ss.mastery_level,
            "mastery_level": ss.mastery_level,
            "evidence_count": ss.evidence_count,
            "last_updated": ss.last_updated,
        }
        for ss in skills
    ]


@router.get("/api/skills/{skill_id}/mastery")
def get_single_skill_mastery(
    skill_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    ss = (
        db.query(StudentSkill)
        .filter(
            StudentSkill.student_id == current_student.student_id,
            StudentSkill.skill_id == skill_id,
        )
        .first()
    )
    if not ss:
        skill = db.query(Skill).filter(Skill.skill_id == skill_id).first()
        return {
            "skill_id": skill_id,
            "skill_name": skill.skill_name if skill else skill_id,
            "final_mastery": 0,
            "mastery_level": "Missing",
            "evidence_count": 0,
            "explanation": "No verified evidence or declaration recorded yet.",
        }

    return {
        "skill_id": ss.skill_id,
        "skill": ss.skill.skill_name if ss.skill else ss.skill_id,
        "skill_name": ss.skill.skill_name if ss.skill else ss.skill_id,
        "category": ss.skill.category if ss.skill else "General",
        "self_declared": ss.self_declared_score,
        "self_declared_score": ss.self_declared_score,
        "assessment": ss.assessment_score,
        "assessment_score": ss.assessment_score,
        "project": bool(ss.project_score > 0),
        "project_score": ss.project_score,
        "projects": bool(ss.project_score > 0),
        "certificate": bool(ss.certificate_score > 0),
        "certificate_score": ss.certificate_score,
        "mentor": "Verified" if ss.mentor_score >= 70 else ("Feedback" if ss.mentor_score > 0 else "None"),
        "mentor_score": ss.mentor_score,
        "resume_score": ss.resume_score,
        "final_mastery": ss.final_mastery,
        "status": ss.mastery_level,
        "mastery_level": ss.mastery_level,
        "evidence_count": ss.evidence_count,
        "last_updated": ss.last_updated,
    }


# Career Readiness Endpoints
@router.get("/api/career-readiness", response_model=CareerReadinessResponse)
def get_career_readiness(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return compute_career_readiness(db, current_student.student_id)


@router.post("/api/career-readiness/calculate", response_model=CareerReadinessResponse)
def recalculate_career_readiness(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return compute_career_readiness(db, current_student.student_id)


@router.get("/api/career-readiness/breakdown")
def get_career_readiness_breakdown(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    data = compute_career_readiness(db, current_student.student_id)
    return {
        **data,
        "radar_distribution": [
            {"dimension": "Programming", "score": 90},
            {"dimension": "Data Structures", "score": 85},
            {"dimension": "ML Theory", "score": 75},
            {"dimension": "SQL & DBs", "score": 65},
            {"dimension": "Deep Learning", "score": 20},
            {"dimension": "System Design", "score": 78},
        ],
        "competitive_cohort": "Competitive Candidate — Top 32% Cohort",
        "market_median_base": "$142k – $168k",
    }
