from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Career, Student, CareerSkill, StudentSkill
from schemas.career import CareerResponse, CareerSelectRequest, CareerSkillItem
from schemas.common import MessageResponse
from routers.auth import get_current_student
from ml.career_matching import compute_career_matches

router = APIRouter(tags=["Careers"])


@router.get("/api/careers", response_model=List[CareerResponse])
def get_all_careers(
    category: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    query = db.query(Career)
    if category:
        query = query.filter(Career.category.ilike(f"%{category}%"))
    careers = query.all()

    # Get student skills for matching
    student_skills = [
        ss.skill.skill_name
        for ss in db.query(StudentSkill).filter(StudentSkill.student_id == current_student.student_id).all()
        if ss.skill and ss.final_mastery > 30
    ]
    student_bg = f"{current_student.degree} {current_student.department} {current_student.college}"

    # Build payload for ML matcher
    careers_payload = []
    for c in careers:
        req_skills = [
            {"skill_id": cs.skill_id, "skill_name": cs.skill.skill_name if cs.skill else cs.skill_id}
            for cs in c.skills
        ]
        careers_payload.append({
            "career_id": c.career_id,
            "career_name": c.career_name,
            "category": c.category,
            "description": c.description,
            "difficulty": c.difficulty,
            "estimated_preparation_months": c.estimated_preparation_months,
            "core_focus": c.core_focus,
            "typical_entry_level": c.typical_entry_level,
            "required_skills": req_skills,
        })

    matched_results = compute_career_matches(student_skills, student_bg, careers_payload)
    matches_dict = {m["career_id"]: m["match_percentage"] for m in matched_results}

    response = []
    for c in careers:
        req_skill_items = [
            CareerSkillItem(
                skill_id=cs.skill_id,
                skill_name=cs.skill.skill_name if cs.skill else cs.skill_id,
                category=cs.skill.category if cs.skill else "General",
                required_level=cs.required_level,
                importance=cs.importance,
                weight=cs.weight,
                is_core_skill=cs.is_core_skill,
            )
            for cs in c.skills
        ]
        response.append(
            CareerResponse(
                career_id=c.career_id,
                career_name=c.career_name,
                category=c.category,
                description=c.description,
                difficulty=c.difficulty,
                estimated_preparation_months=c.estimated_preparation_months,
                core_focus=c.core_focus,
                typical_entry_level=c.typical_entry_level,
                match_percentage=matches_dict.get(c.career_id, 75),
                required_skills=req_skill_items,
            )
        )

    # Sort descending by match percentage
    response.sort(key=lambda x: x.match_percentage or 0, reverse=True)
    return response


@router.get("/api/careers/{career_id}", response_model=CareerResponse)
def get_career_by_id(career_id: str, db: Session = Depends(get_db)):
    career = db.query(Career).filter(Career.career_id == career_id).first()
    if not career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career '{career_id}' not found.",
        )

    req_skill_items = [
        CareerSkillItem(
            skill_id=cs.skill_id,
            skill_name=cs.skill.skill_name if cs.skill else cs.skill_id,
            category=cs.skill.category if cs.skill else "General",
            required_level=cs.required_level,
            importance=cs.importance,
            weight=cs.weight,
            is_core_skill=cs.is_core_skill,
        )
        for cs in career.skills
    ]

    return CareerResponse(
        career_id=career.career_id,
        career_name=career.career_name,
        category=career.category,
        description=career.description,
        difficulty=career.difficulty,
        estimated_preparation_months=career.estimated_preparation_months,
        core_focus=career.core_focus,
        typical_entry_level=career.typical_entry_level,
        match_percentage=85,
        required_skills=req_skill_items,
    )


@router.post("/api/career/select", response_model=MessageResponse)
def select_target_career(
    payload: CareerSelectRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    career = db.query(Career).filter(Career.career_id == payload.career_id).first()
    if not career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career '{payload.career_id}' does not exist.",
        )

    current_student.target_career_id = payload.career_id
    db.commit()
    return MessageResponse(
        message=f"Target career successfully updated to '{career.career_name}' ({career.career_id})."
    )


@router.get("/api/career/current", response_model=CareerResponse)
def get_current_career(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    career = db.query(Career).filter(Career.career_id == current_student.target_career_id).first()
    if not career:
        career = db.query(Career).first()

    req_skill_items = [
        CareerSkillItem(
            skill_id=cs.skill_id,
            skill_name=cs.skill.skill_name if cs.skill else cs.skill_id,
            category=cs.skill.category if cs.skill else "General",
            required_level=cs.required_level,
            importance=cs.importance,
            weight=cs.weight,
            is_core_skill=cs.is_core_skill,
        )
        for cs in career.skills
    ]

    return CareerResponse(
        career_id=career.career_id,
        career_name=career.career_name,
        category=career.category,
        description=career.description,
        difficulty=career.difficulty,
        estimated_preparation_months=career.estimated_preparation_months,
        core_focus=career.core_focus,
        typical_entry_level=career.typical_entry_level,
        match_percentage=85,
        required_skills=req_skill_items,
    )


@router.get("/api/careers/{career_id}/skills")
def get_career_skills(career_id: str, db: Session = Depends(get_db)):
    career = db.query(Career).filter(Career.career_id == career_id).first()
    if not career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career '{career_id}' not found.",
        )
    return {
        "career_id": career.career_id,
        "career_name": career.career_name,
        "skills": [
            {
                "skill_id": cs.skill_id,
                "skill_name": cs.skill.skill_name if cs.skill else cs.skill_id,
                "category": cs.skill.category if cs.skill else "General",
                "required_level": cs.required_level,
                "importance": cs.importance,
                "weight": cs.weight,
                "is_core_skill": cs.is_core_skill,
            }
            for cs in career.skills
        ],
    }


class CareerMatchRequest(BaseModel):
    skills: Optional[List[str]] = None
    background_text: Optional[str] = None
    category: Optional[str] = None


@router.post("/api/career/match")
def match_careers(
    payload: Optional[CareerMatchRequest] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Computes career match scores using BGE neural embeddings and skill match analysis.
    Returns ranked careers with semantic_score, skill_match_score, combined_score,
    matching_skills, missing_skills, and reason.
    """
    query = db.query(Career)
    if payload and payload.category:
        query = query.filter(Career.category.ilike(f"%{payload.category}%"))
    careers = query.all()

    # Get student skills and background
    student_skills_records = (
        db.query(StudentSkill)
        .filter(StudentSkill.student_id == current_student.student_id)
        .all()
    )

    if payload and payload.skills:
        student_skills = payload.skills
        mastery_map = {s.lower(): 75 for s in student_skills}
    else:
        student_skills = [
            ss.skill.skill_name
            for ss in student_skills_records
            if ss.skill and ss.final_mastery > 20
        ]
        mastery_map = {
            ss.skill.skill_name.lower(): ss.final_mastery
            for ss in student_skills_records
            if ss.skill
        }

    if payload and payload.background_text:
        student_bg = payload.background_text
    else:
        student_bg = f"{current_student.degree} in {current_student.department} from {current_student.college}. CGPA: {current_student.cgpa}. Preferred learning mode: {current_student.learning_mode}."

    careers_payload = []
    for c in careers:
        req_skills = [
            {
                "skill_id": cs.skill_id,
                "skill_name": cs.skill.skill_name if cs.skill else cs.skill_id,
                "required_level": cs.required_level,
                "importance": cs.importance,
                "weight": cs.weight,
                "is_core_skill": cs.is_core_skill,
            }
            for cs in c.skills
        ]
        careers_payload.append({
            "career_id": c.career_id,
            "career_name": c.career_name,
            "category": c.category,
            "description": c.description,
            "difficulty": c.difficulty,
            "estimated_preparation_months": c.estimated_preparation_months,
            "core_focus": c.core_focus,
            "typical_entry_level": c.typical_entry_level,
            "required_skills": req_skills,
        })

    results = compute_career_matches(
        student_skills=student_skills,
        student_background_text=student_bg,
        careers=careers_payload,
        student_mastery_map=mastery_map,
    )

    return results
