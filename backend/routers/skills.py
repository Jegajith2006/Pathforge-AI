from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Skill, Student, StudentSkill
from routers.auth import get_current_student
from services.skill_gap_service import update_or_create_student_skill
from services.skill_progression_service import get_student_career_progression
from schemas.student import StudentSkillUpdate
from schemas.common import MessageResponse

router = APIRouter(prefix="/api/skills", tags=["Skills Master Ontology"])


class SkillDetailResponse(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    subcategory: str
    description: str
    beginner_definition: str
    intermediate_definition: str
    advanced_definition: str

    model_config = {"from_attributes": True}


@router.get("", response_model=List[SkillDetailResponse])
def get_all_skills(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Fetch all skills from the SQLite database."""
    query = db.query(Skill)
    if category:
        query = query.filter(Skill.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(
            Skill.skill_name.ilike(f"%{search}%") | Skill.description.ilike(f"%{search}%")
        )
    skills = query.order_by(Skill.skill_name.asc()).all()
    return skills


@router.get("/mastery")
def get_all_skills_mastery(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Fetch demonstrated mastery across all skills for the current student.
    Returns schema specified in Section 25.
    """
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


@router.get("/progression")
def get_career_progression_endpoint(
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Fetch prerequisite DAG-ordered progression for the student's target career track.
    Identifies completed skills (80% threshold), in-progress, eligible, locked, and next recommended skill.
    """
    return get_student_career_progression(
        db=db,
        student_id=current_student.student_id,
        career_id=career_id or current_student.target_career_id,
    )


@router.get("/{skill_id}/mastery")
def get_single_skill_mastery(
    skill_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Fetch demonstrated mastery for a specific skill for the current student."""
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
            "skill": skill.skill_name if skill else skill_id,
            "skill_name": skill.skill_name if skill else skill_id,
            "final_mastery": 0,
            "status": "Missing",
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


@router.get("/{skill_id}", response_model=SkillDetailResponse)
def get_skill_by_id(skill_id: str, db: Session = Depends(get_db)):
    """Fetch single skill details from SQLite by skill_id."""
    skill = db.query(Skill).filter(Skill.skill_id == skill_id).first()
    if not skill:
        skill = db.query(Skill).filter(Skill.skill_name.ilike(skill_id)).first()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill '{skill_id}' not found.",
        )
    return skill


@router.post("/declare", response_model=Dict[str, Any])
def declare_skill_evidence(
    payload: StudentSkillUpdate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Declare or update self-reported score for a skill.
    Recalculates multi-source final mastery and persists to database.
    """
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

    return {
        "skill_id": ss.skill_id,
        "skill_name": ss.skill.skill_name if ss.skill else ss.skill_id,
        "self_declared_score": ss.self_declared_score,
        "final_mastery": ss.final_mastery,
        "mastery_level": ss.mastery_level,
        "evidence_count": ss.evidence_count,
        "message": f"Skill declared. Multi-source calibrated mastery: {ss.final_mastery}% ({ss.mastery_level}).",
    }


@router.put("/{skill_id}/self-declare", response_model=Dict[str, Any])
def self_declare_single_skill(
    skill_id: str,
    score: int = 60,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Update self-declared evidence for a specific skill."""
    return declare_skill_evidence(
        payload=StudentSkillUpdate(skill_id=skill_id, self_declared_score=score),
        current_student=current_student,
        db=db,
    )


@router.post("/recalculate", response_model=Dict[str, Any])
def recalculate_all_skills(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Recalculate final_mastery across all demonstrated student skills
    using the multi-source evidence calibration formula.
    """
    skills = (
        db.query(StudentSkill)
        .filter(StudentSkill.student_id == current_student.student_id)
        .all()
    )

    recalculated = []
    for ss in skills:
        updated = update_or_create_student_skill(
            db=db,
            student_id=current_student.student_id,
            skill_id=ss.skill_id,
        )
        recalculated.append({
            "skill_id": updated.skill_id,
            "skill_name": updated.skill.skill_name if updated.skill else updated.skill_id,
            "final_mastery": updated.final_mastery,
            "mastery_level": updated.mastery_level,
            "evidence_count": updated.evidence_count,
        })

    db.commit()
    return {
        "student_id": current_student.student_id,
        "total_skills_recalculated": len(recalculated),
        "skills": recalculated,
    }
