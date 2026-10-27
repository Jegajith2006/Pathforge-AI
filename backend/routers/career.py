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
    search: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    query = db.query(Career)
    if category and category.strip().lower() not in ["all", "all roles"]:
        cat_lower = category.strip().lower()
        if "ai" in cat_lower or "machine" in cat_lower or "ml" in cat_lower:
            query = query.filter(
                (Career.category.ilike("%AI%")) | 
                (Career.category.ilike("%ML%")) | 
                (Career.category.ilike("%Machine%"))
            )
        elif "software" in cat_lower or "dev" in cat_lower:
            query = query.filter(
                (Career.category.ilike("%Software%")) | 
                (Career.category.ilike("%Engineering%")) | 
                (Career.category.ilike("%Developer%"))
            )
        else:
            query = query.filter(Career.category.ilike(f"%{category.strip()}%"))
    careers = query.all()

    if search and search.strip():
        s_term = search.strip().lower()
        filtered = []
        for c in careers:
            c_name = (c.career_name or "").lower()
            c_cat = (c.category or "").lower()
            c_desc = (c.description or "").lower()
            c_focus = (c.core_focus or "").lower()
            skill_names = [cs.skill.skill_name.lower() for cs in c.skills if cs.skill]

            if (
                s_term in c_name
                or s_term in c_cat
                or s_term in c_desc
                or s_term in c_focus
                or any(s_term in sk for sk in skill_names)
            ):
                filtered.append(c)
        careers = filtered

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
@router.post("/api/careers/select/{career_id}", response_model=MessageResponse)
def select_target_career(
    payload: Optional[CareerSelectRequest] = None,
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    target_cid = payload.career_id if (payload and payload.career_id) else career_id
    if not target_cid:
        raise HTTPException(status_code=400, detail="Career ID must be provided.")

    career = db.query(Career).filter(Career.career_id == target_cid).first()
    if not career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career '{target_cid}' does not exist.",
        )

    current_student.target_career_id = target_cid
    db.commit()

    # 1. Synchronize updated target career to datasets safely
    try:
        from services.dataset_sync_service import sync_student_to_dataset
        sync_student_to_dataset(current_student)
    except Exception as e:
        print(f"[Career Change] Dataset sync notice: {e}")

    # 2. Regenerate adaptive roadmap for the new career (preserving previous learning records)
    try:
        from services.roadmap_service import generate_topological_roadmap
        generate_topological_roadmap(db, current_student.student_id, career_id=target_cid)
    except Exception as e:
        print(f"[Career Change] Roadmap generation notice: {e}")

    # 3. Record learning activity
    try:
        import uuid
        from datetime import datetime
        from database.models import LearningActivity
        act = LearningActivity(
            activity_id=f"ACT_{uuid.uuid4().hex[:8]}",
            student_id=current_student.student_id,
            activity_date=datetime.utcnow().strftime("%Y-%m-%d"),
            activity_type="Career Goal Change",
            activity_name=f"Switched target career to {career.career_name}",
            duration_minutes=5,
            activity_count=1,
        )
        db.add(act)
        db.commit()
    except Exception:
        pass

    return MessageResponse(
        message=f"Target career successfully updated to '{career.career_name}' ({career.career_id}).",
        data={"career_id": career.career_id, "career_name": career.career_name, "category": career.category}
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
