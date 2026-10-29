import logging
logger = logging.getLogger('pathforge.career')
from typing import List, Optional, Dict, Any, Set
from collections import defaultdict
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database.connection import get_db
from database.models import (
    Career,
    Student,
    CareerSkill,
    StudentSkill,
    Company,
    Project,
    CourseLesson,
    StudentLessonProgress,
    StudentCourseProgress,
)
from schemas.career import (
    CareerResponse,
    CareerSelectRequest,
    CareerSkillItem,
    CareerProgressResponse,
    CareerAgendaResponse,
    CareerAgendaPhaseItem,
    CareerAgendaProjectItem,
    CareerAgendaCompanyItem,
    CareerAgendaCourseSummary,
)
from schemas.common import MessageResponse
from routers.auth import get_current_student
from ml.career_matching import compute_career_matches

router = APIRouter(tags=["Careers"])


def compute_student_career_progress(
    db: Session,
    student_id: str,
    career_id: str,
    career_name: str,
    completed_lesson_ids_set: Optional[Set[str]] = None,
) -> CareerProgressResponse:
    from services.roadmap_service import get_canonical_career_courses

    courses = get_canonical_career_courses(db, career_id)
    course_ids = [c.course_id for c in courses]
    total_courses = len(courses)

    if not course_ids:
        return CareerProgressResponse(
            career_id=career_id,
            career_name=career_name,
            completed_courses_count=0,
            total_courses_count=0,
            completed_lessons_count=0,
            total_lessons_count=0,
            progress_percentage=0.0,
        )

    # Count total lessons across canonical career courses
    total_lessons = db.query(CourseLesson).filter(CourseLesson.course_id.in_(course_ids)).count()

    # Completed lessons
    if completed_lesson_ids_set is None:
        completed_lessons_count = (
            db.query(StudentLessonProgress)
            .filter(
                StudentLessonProgress.student_id == student_id,
                StudentLessonProgress.course_id.in_(course_ids),
                or_(
                    StudentLessonProgress.status == "completed",
                    StudentLessonProgress.assessment_passed == True,
                ),
            )
            .count()
        )
    else:
        all_lids = [lid for (lid,) in db.query(CourseLesson.lesson_id).filter(CourseLesson.course_id.in_(course_ids)).all()]
        completed_lessons_count = sum(1 for lid in all_lids if lid in completed_lesson_ids_set)

    # Completed courses
    completed_courses_count = (
        db.query(StudentCourseProgress)
        .filter(
            StudentCourseProgress.student_id == student_id,
            StudentCourseProgress.course_id.in_(course_ids),
            or_(
                StudentCourseProgress.status == "completed",
                StudentCourseProgress.progress_percentage >= 100,
            ),
        )
        .count()
    )

    progress_pct = round((completed_lessons_count / total_lessons * 100), 1) if total_lessons > 0 else 0.0

    return CareerProgressResponse(
        career_id=career_id,
        career_name=career_name,
        completed_courses_count=completed_courses_count,
        total_courses_count=total_courses,
        completed_lessons_count=completed_lessons_count,
        total_lessons_count=total_lessons,
        progress_percentage=progress_pct,
    )


@router.get("/api/careers", response_model=List[CareerResponse])
def get_all_careers(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: Optional[int] = None,
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

    # Pre-fetch completed lesson IDs for current student for ultra-fast progress computation
    completed_slps = (
        db.query(StudentLessonProgress.lesson_id)
        .filter(
            StudentLessonProgress.student_id == current_student.student_id,
            or_(
                StudentLessonProgress.status == "completed",
                StudentLessonProgress.assessment_passed == True,
            ),
        )
        .all()
    )
    completed_lids_set = {r[0] for r in completed_slps}

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
        prog = compute_student_career_progress(
            db, current_student.student_id, c.career_id, c.career_name, completed_lesson_ids_set=completed_lids_set
        )
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
                progress=prog,
            )
        )

    # Sort descending by match percentage
    response.sort(key=lambda x: x.match_percentage or 0, reverse=True)
    if limit is not None and limit > 0:
        return response[skip:skip + limit]
    if skip > 0:
        return response[skip:]
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


@router.get("/api/careers/{career_id}/progress", response_model=CareerProgressResponse)
def get_career_progress(
    career_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    career = db.query(Career).filter(Career.career_id == career_id).first()
    if not career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career '{career_id}' not found.",
        )
    return compute_student_career_progress(
        db, current_student.student_id, career.career_id, career.career_name
    )


@router.get("/api/careers/{career_id}/agenda", response_model=CareerAgendaResponse)
def get_career_agenda(
    career_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    career = db.query(Career).filter(Career.career_id == career_id).first()
    if not career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career '{career_id}' not found.",
        )

    from services.roadmap_service import get_canonical_career_courses, classify_course_tier

    courses = get_canonical_career_courses(db, career_id)

    tier_map: Dict[int, Dict[str, Any]] = {}
    skills_by_tier: Dict[str, Set[str]] = defaultdict(set)
    total_duration_hours = 0
    total_lessons = 0

    for c in courses:
        c_skills = [
            {
                "skill_id": cs.skill_id,
                "skill_name": cs.skill.skill_name,
                "category": cs.skill.category if cs.skill and cs.skill.category else "General",
            }
            for cs in c.skills
            if cs.skill
        ]
        tier, phase_name, _ = classify_course_tier(c.course_id, c.course_name, c_skills)
        if tier not in tier_map:
            tier_map[tier] = {
                "phase_id": f"PHASE_{tier}",
                "phase_name": phase_name,
                "tier": tier,
                "courses": [],
                "duration_hours": 0,
            }

        duration = c.duration_hours or 10
        total_duration_hours += duration
        tier_map[tier]["duration_hours"] += duration
        total_lessons += len(c.lessons) if c.lessons else 5

        s_names = [cs.skill.skill_name for cs in c.skills if cs.skill]
        for sn in s_names:
            skills_by_tier[phase_name].add(sn)

        tier_map[tier]["courses"].append(
            CareerAgendaCourseSummary(
                course_id=c.course_id,
                course_name=c.course_name,
                difficulty=c.difficulty,
                duration_hours=duration,
                skills_taught=s_names,
            )
        )

    phases = []
    for tier in sorted(tier_map.keys()):
        p_data = tier_map[tier]
        phases.append(
            CareerAgendaPhaseItem(
                phase_id=p_data["phase_id"],
                phase_name=p_data["phase_name"],
                tier=p_data["tier"],
                course_count=len(p_data["courses"]),
                duration_hours=p_data["duration_hours"],
                courses=p_data["courses"],
            )
        )

    # Domain-aligned recommended projects for this career
    projects_query = db.query(Project).filter(Project.career_id == career_id).all()
    if not projects_query:
        projects_query = (
            db.query(Project)
            .filter(Project.category.ilike(f"%{career.category}%"))
            .limit(4)
            .all()
        )
    if not projects_query:
        projects_query = db.query(Project).limit(3).all()

    rec_projects = []
    for p in projects_query:
        p_skills = [ps.skill.skill_name for ps in p.skills if ps.skill]
        rec_projects.append(
            CareerAgendaProjectItem(
                project_id=p.project_id,
                project_name=p.project_name,
                description=p.description or "",
                difficulty=p.difficulty,
                estimated_duration_weeks=p.estimated_duration_weeks or 4,
                skills_covered=p_skills,
            )
        )

    # Target companies hiring for this career/domain
    companies_query = (
        db.query(Company)
        .filter(
            or_(
                Company.career_categories.ilike(f"%{career.category}%"),
                Company.career_categories.ilike(f"%{career.career_name}%"),
            )
        )
        .limit(6)
        .all()
    )
    if not companies_query:
        companies_query = db.query(Company).limit(6).all()

    target_companies = [
        CareerAgendaCompanyItem(
            company_id=co.company_id,
            company_name=co.company_name,
            industry=co.industry or "Technology",
            location=co.location or "Global",
            company_size=co.company_size or "Enterprise",
        )
        for co in companies_query
    ]

    # Student progress for this career
    progress = compute_student_career_progress(
        db, current_student.student_id, career_id, career.career_name
    )

    # Readiness score from skill gap analysis
    readiness_score = 75
    try:
        from services.skill_gap_service import analyze_student_skill_gap
        gap_res = analyze_student_skill_gap(db, current_student.student_id, career_id)
        readiness_score = gap_res.get("current_readiness", 75)
    except Exception:
        pass

    # Estimated weeks based on 10 hours/week standard budget
    estimated_weeks = max(1, total_duration_hours // 10)

    # Contextual next best action
    if progress.completed_lessons_count == 0:
        first_course_name = courses[0].course_name if courses else "Foundation Course"
        next_best_action = f"Start Phase 1 with '{first_course_name}'"
    elif progress.progress_percentage < 100.0:
        next_best_action = f"Continue your roadmap ({progress.progress_percentage}% completed)"
    else:
        next_best_action = "Review your portfolio capstone project"

    return CareerAgendaResponse(
        career_id=career.career_id,
        career_name=career.career_name,
        category=career.category,
        description=career.description,
        core_focus=career.core_focus,
        difficulty=career.difficulty,
        estimated_preparation_months=career.estimated_preparation_months,
        typical_entry_level=career.typical_entry_level,
        total_courses_count=len(courses),
        total_lessons_count=total_lessons,
        total_duration_hours=total_duration_hours,
        estimated_weeks=estimated_weeks,
        phases=phases,
        skills_by_tier={k: sorted(list(v)) for k, v in skills_by_tier.items()},
        recommended_projects=rec_projects,
        target_companies=target_companies,
        readiness_score=readiness_score,
        next_best_action=next_best_action,
        progress=progress,
    )


@router.post("/api/career/select", response_model=MessageResponse)
@router.put("/api/career/select", response_model=MessageResponse)
@router.post("/api/careers/select/{career_id}", response_model=MessageResponse)
@router.put("/api/student/career-goal", response_model=MessageResponse)
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
        from datetime import datetime, timezone
        from database.models import LearningActivity
        act = LearningActivity(
            activity_id=f"ACT_{uuid.uuid4().hex[:8]}",
            student_id=current_student.student_id,
            activity_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            activity_type="Career Goal Change",
            activity_name=f"Switched target career to {career.career_name}",
            duration_minutes=5,
            activity_count=1,
        )
        db.add(act)
        db.commit()
    except Exception as act_err:
        logger.warning(f"Failed to record learning activity for career switch: {act_err}")

    return MessageResponse(
        message=f"Target career successfully updated to '{career.career_name}' ({career.career_id}).",
        data={"career_id": career.career_id, "career_name": career.career_name, "category": career.category}
    )


@router.get("/api/career/current", response_model=CareerResponse)
@router.get("/api/student/career-goal", response_model=CareerResponse)
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
