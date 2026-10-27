from typing import List, Optional, Dict, Any
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import (
    Course,
    Student,
    StudentCourseProgress,
    LearningActivity,
    CourseResumeSuggestion,
    StudentSkill,
    CourseLesson,
    LessonResource,
    StudentLessonProgress,
    Career,
    CareerSkill,
    CourseSkill,
    Skill,
)
from schemas.course import (
    CourseResponse,
    CourseRecommendation,
    CourseProgressUpdate,
    CourseSkillDetail,
    CourseProgressDetailResponse,
    LessonResourceResponse,
    LessonDetailResponse,
    LessonSummaryItem,
    CourseSyllabusResponse,
    ReviewResourceRequest,
    CompleteLessonRequest,
)
from schemas.common import MessageResponse
from routers.auth import get_current_student
from services.recommendation_service import get_personalized_courses, get_personalized_recommendations
from services.skill_gap_service import update_or_create_student_skill, analyze_student_skill_gap

router = APIRouter(prefix="/api/courses", tags=["Courses"])
recommendations_router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@recommendations_router.get("")
def get_unified_recommendations(
    limit_courses: int = 8,
    limit_projects: int = 6,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_personalized_recommendations(
        db, current_student.student_id, limit_courses=limit_courses, limit_projects=limit_projects
    )


@router.get("", response_model=List[CourseResponse])
def get_all_courses(
    response: Response,
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    career_id: Optional[str] = None,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    view_all: bool = False,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Authoritative career-filtered course endpoint:
    Authenticated Student -> Active Career -> Career Required Skills -> Courses Covering Those Skills.
    Strictly filters courses to the active career by default.
    """
    # 1. Resolve active target career for authenticated student
    target_cid = (career_id.strip() if career_id and career_id.strip() else None) or current_student.target_career_id
    active_career = None
    if target_cid:
        active_career = db.query(Career).filter(Career.career_id == target_cid).first()
        if not active_career and career_id:
            raise HTTPException(status_code=404, detail=f"Requested career '{career_id}' not found.")

    if not active_career:
        active_career = db.query(Career).filter(Career.career_id == current_student.target_career_id).first()
        if not active_career:
            active_career = db.query(Career).first()

    career_display_id = active_career.career_id if active_career else "C001"
    career_display_name = active_career.career_name if active_career else "Machine Learning Engineer"

    response.headers["X-Active-Career-Id"] = career_display_id
    response.headers["X-Active-Career-Name"] = career_display_name

    # 2. Retrieve career required skills
    career_skills = (
        db.query(CareerSkill).filter(CareerSkill.career_id == career_display_id).all()
        if active_career
        else []
    )
    career_skill_ids = {cs.skill_id for cs in career_skills}

    # 3. Base query scoping
    if not view_all:
        if not career_skill_ids:
            # Career has no mapped skills/courses. Return empty list! Never fall back!
            response.headers["X-Career-Course-Count"] = "0"
            return []

        # Strictly filter courses covering at least one required skill for this career
        query = (
            db.query(Course)
            .join(CourseSkill, Course.course_id == CourseSkill.course_id)
            .filter(CourseSkill.skill_id.in_(career_skill_ids))
            .distinct()
        )
    else:
        query = db.query(Course)

    # 4. Apply difficulty & category SQL filters
    if category and category.strip().lower() not in ["all", "all categories"]:
        query = query.filter(Course.category.ilike(f"%{category.strip()}%"))
    if difficulty and difficulty.strip().lower() not in ["all", "all levels"]:
        query = query.filter(Course.difficulty.ilike(f"%{difficulty.strip()}%"))

    courses = query.all()

    # 5. Fetch student course progress
    progress_records = (
        db.query(StudentCourseProgress)
        .filter(StudentCourseProgress.student_id == current_student.student_id)
        .all()
    )
    progress_map = {scp.course_id: scp for scp in progress_records}

    # 6. Fetch skill gaps for active career to apply skill-gap ranking
    try:
        gap_data = analyze_student_skill_gap(db, current_student.student_id, career_id=career_display_id)
        gaps = gap_data.get("gaps", [])
        gap_map = {g["skill_id"]: g for g in gaps}
    except Exception:
        gap_map = {}

    result = []
    for c in courses:
        # Check matching skills
        c_skill_ids = {cs.skill_id for cs in c.skills}
        matched_ids = c_skill_ids.intersection(career_skill_ids)
        is_relevant = len(matched_ids) > 0

        # If not viewing all and not relevant, strictly exclude
        if not view_all and not is_relevant:
            continue

        matched_names = [
            cs.skill.skill_name
            for cs in c.skills
            if cs.skill_id in matched_ids and cs.skill
        ]

        # Calculate addressed gaps
        addressed_gaps = []
        max_gap_val = 0
        max_prio_score = 0
        for s_id in matched_ids:
            g = gap_map.get(s_id)
            if g and g.get("gap", 0) > 0:
                addressed_gaps.append(g["skill_name"])
                if g["gap"] > max_gap_val:
                    max_gap_val = g["gap"]
                if g.get("priority_score", 0) > max_prio_score:
                    max_prio_score = g.get("priority_score", 0)

        # Gap-anchored tag, score, explainability
        if max_gap_val >= 45:
            tag = "Critical Gap"
            base_match = 94
        elif max_gap_val >= 20:
            tag = "High Priority Gap"
            base_match = 89
        elif max_gap_val > 0:
            tag = "Medium Priority Gap"
            base_match = 84
        elif is_relevant:
            tag = "Core Curriculum"
            base_match = 80
        else:
            tag = "Elective Catalog"
            base_match = 65

        rating_bonus = int(round((c.rating - 4.0) * 5))
        match_percentage = min(98, max(50, base_match + rating_bonus))

        if addressed_gaps:
            explainability = f"Addresses your active {addressed_gaps[0]} skill gap for {career_display_name}."
        elif matched_names:
            explainability = f"Covers core required {matched_names[0]} competencies for {career_display_name}."
        else:
            explainability = f"General curriculum module in {c.category}."

        primary_skill = matched_names[0] if matched_names else (
            c.skills[0].skill.skill_name if c.skills and c.skills[0].skill else c.category
        )

        # Search filter
        if search and search.strip():
            s_term = search.strip().lower()
            searchable = f"{c.course_name} {c.provider} {c.description} {c.category} {primary_skill} {' '.join(matched_names)}".lower()
            if s_term not in searchable:
                continue

        # Priority filter
        if priority and priority.strip().lower() in ["high_priority", "critical"]:
            if not (tag in ["Critical Gap", "High Priority Gap"] or match_percentage >= 88):
                continue

        scp = progress_map.get(c.course_id)
        prog = scp.progress_percentage if scp else 0
        stat = scp.status if scp else "not_started"
        last_lid = scp.last_lesson_id if scp else None
        last_ltitle = scp.last_lesson_title if scp else None
        completed_lessons = json.loads(scp.completed_lessons_json) if (scp and scp.completed_lessons_json) else []
        total_l = len(c.lessons) if c.lessons else (scp.total_lessons if scp else 5)
        last_accessed = scp.last_accessed_at if scp else None

        skill_details = [
            CourseSkillDetail(
                skill_id=cs.skill_id,
                skill_name=cs.skill.skill_name if cs.skill else cs.skill_id,
                coverage_level=cs.coverage_level,
                importance=cs.importance,
            )
            for cs in c.skills
        ]

        result.append(
            CourseResponse(
                course_id=c.course_id,
                course_name=c.course_name,
                provider=c.provider,
                description=c.description,
                category=c.category,
                difficulty=c.difficulty,
                duration_hours=c.duration_hours,
                format=c.format,
                rating=c.rating,
                url=c.url,
                language=c.language,
                skills=skill_details,
                progress_percentage=prog,
                status=stat,
                last_lesson_id=last_lid,
                last_lesson_title=last_ltitle,
                completed_lessons=completed_lessons,
                total_lessons=total_l,
                last_accessed_at=last_accessed,
                final_assessment_score=scp.final_assessment_score if scp else None,
                final_assessment_passed=bool(scp.final_assessment_passed) if scp else False,
                assessment_attempts_count=scp.assessment_attempts_count if scp else 0,
                match_percentage=match_percentage,
                tag=tag,
                explainability=explainability,
                primary_skill=primary_skill,
                duration_text=f"{c.duration_hours or 20} hrs",
                is_career_relevant=is_relevant,
                career_id=career_display_id,
                career_name=career_display_name,
                matched_skills=matched_names,
            )
        )

    # 7. Apply deterministic skill-gap ranking (critical gaps first, match % desc, rating desc)
    result.sort(key=lambda x: (
        x.tag in ["Critical Gap", "High Priority Gap"],
        x.match_percentage or 0,
        x.rating or 0
    ), reverse=True)

    response.headers["X-Career-Course-Count"] = str(len(result))
    return result


@router.get("/recommendations", response_model=List[CourseRecommendation])
def get_course_recommendations(
    limit: int = 12,
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    target_cid = (career_id.strip() if career_id and career_id.strip() else None) or current_student.target_career_id
    return get_personalized_courses(db, current_student.student_id, career_id=target_cid, limit=limit)


@router.get("/recommended", response_model=List[CourseRecommendation])
def get_course_recommendations_alias(
    limit: int = 12,
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    target_cid = (career_id.strip() if career_id and career_id.strip() else None) or current_student.target_career_id
    return get_personalized_courses(db, current_student.student_id, career_id=target_cid, limit=limit)


@router.get("/{course_id}", response_model=CourseResponse)
def get_course_by_id(
    course_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course '{course_id}' not found.")

    scp = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == current_student.student_id,
        StudentCourseProgress.course_id == course_id,
    ).first()

    skill_details = [
        CourseSkillDetail(
            skill_id=cs.skill_id,
            skill_name=cs.skill.skill_name if cs.skill else cs.skill_id,
            coverage_level=cs.coverage_level,
            importance=cs.importance,
        )
        for cs in course.skills
    ]

    completed_lessons = json.loads(scp.completed_lessons_json) if (scp and scp.completed_lessons_json) else []

    return CourseResponse(
        course_id=course.course_id,
        course_name=course.course_name,
        provider=course.provider,
        description=course.description,
        category=course.category,
        difficulty=course.difficulty,
        duration_hours=course.duration_hours,
        format=course.format,
        rating=course.rating,
        url=course.url,
        language=course.language,
        skills=skill_details,
        progress_percentage=scp.progress_percentage if scp else 0,
        status=scp.status if scp else "not_started",
        last_lesson_id=scp.last_lesson_id if scp else None,
        last_lesson_title=scp.last_lesson_title if scp else None,
        completed_lessons=completed_lessons,
        total_lessons=len(course.lessons) if course.lessons else (scp.total_lessons if scp else 5),
        last_accessed_at=scp.last_accessed_at if scp else None,
    )


@router.get("/{course_id}/skills")
def get_course_skills(course_id: str, db: Session = Depends(get_db)):
    """Fetch skills taught by a specific course."""
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course '{course_id}' not found.",
        )
    return {
        "course_id": course.course_id,
        "course_name": course.course_name,
        "skills": [
            {
                "skill_id": cs.skill_id,
                "skill_name": cs.skill.skill_name if cs.skill else cs.skill_id,
                "category": cs.skill.category if cs.skill else "General",
                "coverage_level": cs.coverage_level,
                "importance": cs.importance,
            }
            for cs in course.skills
        ],
    }


@router.get("/{course_id}/progress", response_model=CourseProgressDetailResponse)
def get_course_progress(
    course_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns exact saved course progress, last learning position, and completion criteria.
    Enforces student isolation.
    """
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course '{course_id}' not found.")

    scp = (
        db.query(StudentCourseProgress)
        .filter(
            StudentCourseProgress.student_id == current_student.student_id,
            StudentCourseProgress.course_id == course_id,
        )
        .first()
    )

    actual_lessons = course.lessons
    total_l = len(actual_lessons) or (scp.total_lessons if scp else 5)
    completed_lessons = json.loads(scp.completed_lessons_json) if (scp and scp.completed_lessons_json) else []

    first_lid = actual_lessons[0].lesson_id if actual_lessons else "lesson-1"
    first_ltitle = actual_lessons[0].title if actual_lessons else f"Lesson 1: Foundations of {course.course_name}"
    curr_lid = scp.last_lesson_id if scp else first_lid
    curr_ltitle = scp.last_lesson_title if scp else first_ltitle

    next_lid = None
    next_ltitle = None
    for l in actual_lessons:
        if l.lesson_id not in completed_lessons:
            next_lid = l.lesson_id
            next_ltitle = l.title
            break

    # Authoritative progress math
    calc_percentage = int(round((len(completed_lessons) / total_l) * 100)) if total_l > 0 else (scp.progress_percentage if scp else 0)

    # Check for pending resume suggestion if course is completed
    suggestion = None
    if scp and scp.status == "completed":
        sug_record = (
            db.query(CourseResumeSuggestion)
            .filter(
                CourseResumeSuggestion.student_id == current_student.student_id,
                CourseResumeSuggestion.course_id == course_id,
            )
            .first()
        )
        if sug_record:
            suggestion = {
                "suggestion_id": sug_record.suggestion_id,
                "title": sug_record.title,
                "description": sug_record.description,
                "suggested_content": sug_record.suggested_content,
                "status": sug_record.status,
            }

    return CourseProgressDetailResponse(
        course_id=course.course_id,
        course_name=course.course_name,
        progress_percentage=calc_percentage,
        status=scp.status if scp else "not_started",
        enrollment_status=scp.enrollment_status if scp else "enrolled",
        current_lesson_id=curr_lid,
        current_lesson_title=curr_ltitle,
        last_lesson_id=curr_lid,
        last_lesson_title=curr_ltitle,
        last_position_seconds=scp.last_position_seconds if scp else 0,
        total_lessons=total_l,
        completed_lessons_count=len(completed_lessons),
        completed_lessons=completed_lessons,
        last_accessed_at=scp.last_accessed_at if scp else None,
        next_lesson_id=next_lid,
        next_lesson_title=next_ltitle,
        next_lesson_to_continue=next_lid,
        resume_suggestion=suggestion,
        final_assessment_score=scp.final_assessment_score if scp else None,
        final_assessment_passed=bool(scp.final_assessment_passed) if scp else False,
        assessment_attempts_count=scp.assessment_attempts_count if scp else 0,
        is_completed=bool(scp and scp.status == "completed"),
    )


@router.put("/{course_id}/progress")
def update_course_progress(
    course_id: str,
    payload: CourseProgressUpdate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Saves student learning position, completed lessons, and progress persistently.
    When course reaches 100%, triggers CourseResumeSuggestion and updates skill evidence.
    """
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course '{course_id}' not found.")

    scp = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == current_student.student_id,
        StudentCourseProgress.course_id == course_id,
    ).first()

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    completed_lessons = payload.completed_lessons if payload.completed_lessons is not None else payload.completed_lesson_ids
    if completed_lessons is None:
        completed_lessons = json.loads(scp.completed_lessons_json) if (scp and scp.completed_lessons_json) else []
    total_l = len(course.lessons) or (scp.total_lessons if scp else 5)
    completed_count = payload.completed_lessons_count if payload.completed_lessons_count is not None else len(completed_lessons)

    # Authoritative progress percentage: (completed required lessons / total required lessons) * 100
    if payload.progress_percentage is not None and payload.completed_lessons is None and payload.completed_lessons_count is None:
        calc_percentage = payload.progress_percentage
    else:
        calc_percentage = int(round((completed_count / total_l) * 100)) if total_l > 0 else 0

    # Course completion rule:
    # A course is completed ONLY when final assessment score > 50 AND all required lessons are completed
    has_passed_assessment = bool(scp and scp.final_assessment_passed is True and (scp.final_assessment_score or 0) > 50.0)
    all_lessons_done = (completed_count >= total_l)
    is_completed = bool(has_passed_assessment and all_lessons_done)
    status_str = "completed" if is_completed else ("ready_for_assessment" if all_lessons_done else ("in_progress" if completed_count > 0 else "not_started"))

    if not scp:
        scp = StudentCourseProgress(
            student_id=current_student.student_id,
            course_id=course_id,
            progress_percentage=calc_percentage,
            status=status_str,
            completed_at=now_str if is_completed else None,
            enrollment_status="completed" if is_completed else "enrolled",
            last_lesson_id=payload.last_lesson_id or payload.current_lesson_id or (course.lessons[0].lesson_id if course.lessons else f"{course_id}_L1"),
            last_lesson_title=payload.last_lesson_title or payload.current_lesson_title or (course.lessons[0].title if course.lessons else f"Lesson 1: Foundations of {course.course_name}"),
            last_position_seconds=payload.last_position_seconds or payload.position_seconds or 0,
            total_lessons=total_l,
            completed_lessons_count=completed_count,
            completed_lessons_json=json.dumps(completed_lessons),
            last_accessed_at=now_str,
            final_assessment_score=None,
            final_assessment_passed=False,
            assessment_attempts_count=0,
        )
        db.add(scp)
    else:
        scp.progress_percentage = calc_percentage
        scp.status = status_str
        scp.total_lessons = total_l
        scp.completed_lessons_count = completed_count
        scp.completed_lessons_json = json.dumps(completed_lessons)
        scp.last_accessed_at = now_str
        if is_completed:
            scp.enrollment_status = "completed"
            if not scp.completed_at:
                scp.completed_at = now_str
        else:
            if scp.status != "completed":
                scp.completed_at = None

        lid = payload.last_lesson_id or payload.current_lesson_id
        if lid:
            scp.last_lesson_id = lid
        ltitle = payload.last_lesson_title or payload.current_lesson_title
        if ltitle:
            scp.last_lesson_title = ltitle
        pos = payload.last_position_seconds if payload.last_position_seconds is not None else payload.position_seconds
        if pos is not None:
            scp.last_position_seconds = pos

    suggestion_info = None

    if is_completed:
        # 1. Record persistent learning activity
        act = LearningActivity(
            activity_id=f"ACT_{uuid.uuid4().hex[:8]}",
            student_id=current_student.student_id,
            activity_date=datetime.utcnow().strftime("%Y-%m-%d"),
            activity_type="Course Completion",
            activity_name=f"Completed {course.course_name}",
            duration_minutes=int(course.duration_hours or 10) * 60,
            activity_count=1,
        )
        db.add(act)

        # 2. Update multi-source learning evidence for all skills mapped to this course
        skill_names = []
        for cs in course.skills:
            if cs.skill:
                skill_names.append(cs.skill.skill_name)
                # Calibrate student skill evidence with course completion context
                update_or_create_student_skill(
                    db=db,
                    student_id=current_student.student_id,
                    skill_id=cs.skill_id,
                )

        # 3. Create persistent CourseResumeSuggestion for student review
        existing_sug = (
            db.query(CourseResumeSuggestion)
            .filter(
                CourseResumeSuggestion.student_id == current_student.student_id,
                CourseResumeSuggestion.course_id == course_id,
            )
            .first()
        )
        if not existing_sug:
            primary_s_name = skill_names[0] if skill_names else course.category
            primary_s_id = course.skills[0].skill_id if course.skills else None
            skills_summary = ", ".join(skill_names[:3]) if skill_names else course.category

            sug = CourseResumeSuggestion(
                suggestion_id=f"SUG-{uuid.uuid4().hex[:8].upper()}",
                student_id=current_student.student_id,
                course_id=course_id,
                skill_id=primary_s_id,
                course_name=course.course_name,
                skill_name=primary_s_name,
                suggestion_type="course_completion",
                title=f"Course Completion: {course.course_name}",
                description=f"You completed {course.course_name}. Would you like to add this verified course and skills ({skills_summary}) to your resume profile?",
                suggested_content=f"{course.course_name} ({course.provider}) — Completed coursework covering {skills_summary}.",
                status="pending",
                created_at=now_str,
            )
            db.add(sug)
            suggestion_info = {
                "suggestion_id": sug.suggestion_id,
                "title": sug.title,
                "description": sug.description,
                "suggested_content": sug.suggested_content,
            }
        else:
            suggestion_info = {
                "suggestion_id": existing_sug.suggestion_id,
                "title": existing_sug.title,
                "description": existing_sug.description,
                "suggested_content": existing_sug.suggested_content,
                "status": existing_sug.status,
            }

    db.commit()

    return {
        "status": "success",
        "message": f"Course '{course.course_name}' progress saved at {payload.progress_percentage}%.",
        "progress_percentage": payload.progress_percentage,
        "is_completed": is_completed,
        "resume_suggestion": suggestion_info,
    }


@router.post("/{course_id}/complete")
def complete_course(
    course_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course '{course_id}' not found.")

    all_lessons = [l.lesson_id for l in course.lessons] if course.lessons else [f"{course_id}_L{i}" for i in range(1, 6)]
    last_l = course.lessons[-1] if course.lessons else None

    # Mark all student lesson progress as completed
    now_ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    for l_id in all_lessons:
        slp = db.query(StudentLessonProgress).filter(
            StudentLessonProgress.student_id == current_student.student_id,
            StudentLessonProgress.lesson_id == l_id,
        ).first()
        if not slp:
            slp = StudentLessonProgress(
                student_id=current_student.student_id,
                course_id=course_id,
                lesson_id=l_id,
                status="completed",
                notes_read=True,
                is_assessment_unlocked=True,
                assessment_passed=True,
                completed_at=now_ts,
                last_accessed_at=now_ts,
            )
            db.add(slp)
        else:
            slp.status = "completed"
            slp.assessment_passed = True
            if not slp.completed_at:
                slp.completed_at = now_ts

    db.commit()

    return update_course_progress(
        course_id=course_id,
        payload=CourseProgressUpdate(
            progress_percentage=100,
            current_lesson_id=last_l.lesson_id if last_l else f"{course_id}_L5",
            current_lesson_title=last_l.title if last_l else "Course Complete",
            completed_lessons=all_lessons,
        ),
        current_student=current_student,
        db=db,
    )


@router.get("/{course_id}/syllabus", response_model=CourseSyllabusResponse)
def get_course_syllabus(
    course_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns the complete subject-specific syllabus for a course with student-isolated progress.
    """
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course '{course_id}' not found.")

    scp = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == current_student.student_id,
        StudentCourseProgress.course_id == course_id,
    ).first()

    completed_lessons = json.loads(scp.completed_lessons_json) if (scp and scp.completed_lessons_json) else []

    slp_records = db.query(StudentLessonProgress).filter(
        StudentLessonProgress.student_id == current_student.student_id,
        StudentLessonProgress.course_id == course_id,
    ).all()
    slp_map = {p.lesson_id: p for p in slp_records}

    lessons = course.lessons
    total_l = len(lessons) or 5
    completed_count = len(completed_lessons)

    lesson_items = []
    next_lid = None
    for idx, l in enumerate(lessons):
        slp = slp_map.get(l.lesson_id)
        is_comp = bool((l.lesson_id in completed_lessons) or (slp and slp.status == "completed"))
        is_unlocked = bool((idx == 0) or (idx > 0 and (lessons[idx - 1].lesson_id in completed_lessons or (slp_map.get(lessons[idx - 1].lesson_id) and slp_map.get(lessons[idx - 1].lesson_id).status == "completed"))))

        if is_comp:
            stat = "completed"
        elif is_unlocked:
            stat = "in_progress" if (slp and slp.status == "in_progress") else "ready"
            if not next_lid:
                next_lid = l.lesson_id
        else:
            stat = "locked"

        prereq_explanation = None
        if not is_unlocked and idx > 0:
            prev_l = lessons[idx - 1]
            prereq_explanation = f"Complete Lesson {prev_l.lesson_number} ({prev_l.title}) and pass its assessment to unlock."

        lesson_items.append(
            LessonSummaryItem(
                lesson_id=l.lesson_id,
                lesson_number=l.lesson_number,
                title=l.title,
                overview=l.overview,
                estimated_minutes=l.estimated_minutes,
                status=stat,
                is_unlocked=is_unlocked,
                is_completed=is_comp,
                prerequisite_explanation=prereq_explanation,
            )
        )

    pct = int(round((completed_count / total_l) * 100)) if total_l > 0 else 0
    has_passed_assessment = bool(scp and scp.final_assessment_passed is True and (scp.final_assessment_score or 0) > 50.0)
    all_lessons_done = (completed_count >= total_l)
    is_course_done = bool(has_passed_assessment and all_lessons_done)
    stat_str = "completed" if is_course_done else ("ready_for_assessment" if all_lessons_done else ("in_progress" if pct > 0 else "not_started"))

    return CourseSyllabusResponse(
        course_id=course.course_id,
        course_name=course.course_name,
        provider=course.provider,
        difficulty=course.difficulty,
        duration_hours=course.duration_hours,
        rating=course.rating,
        category=course.category,
        total_lessons=total_l,
        completed_lessons_count=completed_count,
        progress_percentage=pct,
        status=stat_str,
        next_lesson_id=next_lid,
        lessons=lesson_items,
        final_assessment_score=scp.final_assessment_score if scp else None,
        final_assessment_passed=bool(scp.final_assessment_passed) if scp else False,
        assessment_attempts_count=scp.assessment_attempts_count if scp else 0,
        is_assessment_ready=all_lessons_done,
        is_completed=is_course_done,
    )


@router.get("/{course_id}/lessons/{lesson_id}", response_model=LessonDetailResponse)
def get_lesson_detail(
    course_id: str,
    lesson_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns full study material, code examples, exercises, and resources for a specific lesson.
    Enforces student isolation and records active learning position.
    """
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course '{course_id}' not found.")

    lesson = db.query(CourseLesson).filter(
        CourseLesson.course_id == course_id,
        CourseLesson.lesson_id == lesson_id,
    ).first()
    if not lesson:
        raise HTTPException(status_code=404, detail=f"Lesson '{lesson_id}' not found for course '{course_id}'.")

    all_lessons = course.lessons
    curr_idx = -1
    for idx, l in enumerate(all_lessons):
        if l.lesson_id == lesson_id:
            curr_idx = idx
            break
    prev_id = all_lessons[curr_idx - 1].lesson_id if curr_idx > 0 else None
    next_id = all_lessons[curr_idx + 1].lesson_id if (curr_idx >= 0 and curr_idx < len(all_lessons) - 1) else None

    now_ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    slp = db.query(StudentLessonProgress).filter(
        StudentLessonProgress.student_id == current_student.student_id,
        StudentLessonProgress.lesson_id == lesson_id,
    ).first()
    if not slp:
        slp = StudentLessonProgress(
            student_id=current_student.student_id,
            course_id=course_id,
            lesson_id=lesson_id,
            status="in_progress",
            resources_reviewed_json="[]",
            is_assessment_unlocked=False,
            notes_read=True,
            last_accessed_at=now_ts,
        )
        db.add(slp)
        db.commit()
    else:
        slp.notes_read = True
        slp.last_accessed_at = now_ts
        if slp.status == "not_started":
            slp.status = "in_progress"
        db.commit()

    total_l = len(course.lessons) or 5
    scp = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == current_student.student_id,
        StudentCourseProgress.course_id == course_id,
    ).first()
    if not scp:
        scp = StudentCourseProgress(
            student_id=current_student.student_id,
            course_id=course_id,
            progress_percentage=0,
            status="in_progress",
            enrollment_status="enrolled",
            last_lesson_id=lesson.lesson_id,
            last_lesson_title=lesson.title,
            total_lessons=total_l,
            completed_lessons_count=0,
            completed_lessons_json="[]",
            last_accessed_at=now_ts,
        )
        db.add(scp)
        db.commit()
    else:
        scp.last_lesson_id = lesson.lesson_id
        scp.last_lesson_title = lesson.title
        scp.last_accessed_at = now_ts
        if scp.status == "not_started":
            scp.status = "in_progress"
        db.commit()

    reviewed_res = json.loads(slp.resources_reviewed_json) if slp.resources_reviewed_json else []

    resource_objs = []
    for r in lesson.resources:
        resource_objs.append(
            LessonResourceResponse(
                resource_id=r.resource_id,
                lesson_id=r.lesson_id,
                course_id=r.course_id,
                resource_order=r.resource_order,
                resource_type=r.resource_type,
                title=r.title,
                url=r.url,
                description=r.description,
                provider_name=r.provider_name,
                is_verified=r.is_verified,
                is_reviewed=(r.resource_id in reviewed_res),
            )
        )

    # Unlock assessment when prerequisites are met: notes read and at least one resource reviewed (or all required if resources exist)
    can_unlock_assessment = bool(slp.notes_read and (len(reviewed_res) > 0 or len(lesson.resources) == 0))
    if can_unlock_assessment and not slp.is_assessment_unlocked:
        slp.is_assessment_unlocked = True
        db.commit()

    objectives = json.loads(lesson.learning_objectives_json) if lesson.learning_objectives_json else []
    concepts = json.loads(lesson.key_concepts_json) if lesson.key_concepts_json else []
    code_examples = json.loads(lesson.code_examples_json) if lesson.code_examples_json else []
    exercises = json.loads(lesson.practice_exercises_json) if lesson.practice_exercises_json else []

    return LessonDetailResponse(
        lesson_id=lesson.lesson_id,
        course_id=course.course_id,
        course_name=course.course_name,
        course_provider=course.provider,
        lesson_number=lesson.lesson_number,
        title=lesson.title,
        overview=lesson.overview,
        learning_objectives=objectives,
        key_concepts=concepts,
        study_notes=lesson.study_notes,
        step_by_step_explanation=lesson.step_by_step_explanation,
        code_examples=code_examples,
        practice_exercises=exercises,
        estimated_minutes=lesson.estimated_minutes,
        assessment_prerequisites=lesson.assessment_prerequisites,
        completion_criteria=lesson.completion_criteria,
        is_project_provided=lesson.is_project_provided,
        resources=resource_objs,
        status=slp.status,
        notes_read=slp.notes_read,
        resources_reviewed=reviewed_res,
        is_assessment_unlocked=slp.is_assessment_unlocked,
        assessment_score=slp.assessment_score,
        assessment_passed=slp.assessment_passed,
        prev_lesson_id=prev_id,
        next_lesson_id=next_id,
    )


@router.post("/{course_id}/lessons/{lesson_id}/review-resource")
def review_lesson_resource(
    course_id: str,
    lesson_id: str,
    payload: Optional[ReviewResourceRequest] = None,
    resource_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Records that a student has reviewed a learning resource. Unlocks assessment upon satisfying criteria.
    """
    target_rid = payload.resource_id if (payload and payload.resource_id) else resource_id
    if not target_rid:
        raise HTTPException(status_code=400, detail="Resource ID must be provided.")

    slp = db.query(StudentLessonProgress).filter(
        StudentLessonProgress.student_id == current_student.student_id,
        StudentLessonProgress.lesson_id == lesson_id,
    ).first()
    if not slp:
        slp = StudentLessonProgress(
            student_id=current_student.student_id,
            course_id=course_id,
            lesson_id=lesson_id,
            status="in_progress",
            resources_reviewed_json="[]",
            notes_read=True,
            last_accessed_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        )
        db.add(slp)

    reviewed = json.loads(slp.resources_reviewed_json) if slp.resources_reviewed_json else []
    if target_rid not in reviewed:
        reviewed.append(target_rid)
        slp.resources_reviewed_json = json.dumps(reviewed)

    slp.is_assessment_unlocked = True
    db.commit()

    return {
        "status": "success",
        "message": f"Resource '{target_rid}' marked as reviewed.",
        "resources_reviewed": reviewed,
        "is_assessment_unlocked": slp.is_assessment_unlocked,
    }


@router.post("/{course_id}/lessons/{lesson_id}/complete")
def complete_lesson(
    course_id: str,
    lesson_id: str,
    payload: Optional[CompleteLessonRequest] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Marks a lesson as completed, recalculates authoritative course progress,
    and advances the student to the next lesson or triggers course completion.
    """
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail=f"Course '{course_id}' not found.")

    lesson = db.query(CourseLesson).filter(
        CourseLesson.course_id == course_id,
        CourseLesson.lesson_id == lesson_id,
    ).first()
    if not lesson:
        raise HTTPException(status_code=404, detail=f"Lesson '{lesson_id}' not found.")

    now_ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Update StudentLessonProgress
    slp = db.query(StudentLessonProgress).filter(
        StudentLessonProgress.student_id == current_student.student_id,
        StudentLessonProgress.lesson_id == lesson_id,
    ).first()
    if not slp:
        slp = StudentLessonProgress(
            student_id=current_student.student_id,
            course_id=course_id,
            lesson_id=lesson_id,
            status="completed",
            notes_read=True,
            is_assessment_unlocked=True,
            assessment_passed=True if (payload and payload.assessment_passed) else True,
            completed_at=now_ts,
            last_accessed_at=now_ts,
        )
        db.add(slp)
    else:
        slp.status = "completed"
        slp.completed_at = now_ts
        if payload and payload.assessment_passed is not None:
            slp.assessment_passed = payload.assessment_passed

    # 2. Update StudentCourseProgress
    scp = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == current_student.student_id,
        StudentCourseProgress.course_id == course_id,
    ).first()

    actual_lessons = course.lessons
    total_l = len(actual_lessons) or 5

    completed_lessons = json.loads(scp.completed_lessons_json) if (scp and scp.completed_lessons_json) else []
    if lesson_id not in completed_lessons:
        completed_lessons.append(lesson_id)

    completed_count = len(completed_lessons)
    pct = int(round((completed_count / total_l) * 100)) if total_l > 0 else 0
    all_lessons_done = (completed_count >= total_l)
    has_passed_assessment = bool(scp and scp.final_assessment_passed is True and (scp.final_assessment_score or 0) > 50.0)
    is_course_done = bool(has_passed_assessment and all_lessons_done)
    stat_str = "completed" if is_course_done else ("ready_for_assessment" if all_lessons_done else "in_progress")

    next_lid = None
    next_ltitle = None
    for l in actual_lessons:
        if l.lesson_id not in completed_lessons:
            next_lid = l.lesson_id
            next_ltitle = l.title
            break

    if not scp:
        scp = StudentCourseProgress(
            student_id=current_student.student_id,
            course_id=course_id,
            progress_percentage=pct,
            status=stat_str,
            completed_at=now_ts if is_course_done else None,
            enrollment_status="completed" if is_course_done else "enrolled",
            last_lesson_id=lesson_id,
            last_lesson_title=lesson.title,
            total_lessons=total_l,
            completed_lessons_count=completed_count,
            completed_lessons_json=json.dumps(completed_lessons),
            last_accessed_at=now_ts,
        )
        db.add(scp)
    else:
        scp.progress_percentage = pct
        scp.status = stat_str
        scp.total_lessons = total_l
        scp.completed_lessons_count = completed_count
        scp.completed_lessons_json = json.dumps(completed_lessons)
        scp.last_lesson_id = lesson_id
        scp.last_lesson_title = lesson.title
        scp.last_accessed_at = now_ts
        if is_course_done:
            scp.enrollment_status = "completed"
            if not scp.completed_at:
                scp.completed_at = now_ts

    suggestion_info = None
    if is_course_done:
        act = LearningActivity(
            activity_id=f"ACT_{uuid.uuid4().hex[:8]}",
            student_id=current_student.student_id,
            activity_date=datetime.utcnow().strftime("%Y-%m-%d"),
            activity_type="Course Completion",
            activity_name=f"Completed {course.course_name}",
            duration_minutes=int(course.duration_hours or 10) * 60,
            activity_count=1,
        )
        db.add(act)

        skill_names = []
        for cs in course.skills:
            if cs.skill:
                skill_names.append(cs.skill.skill_name)
                update_or_create_student_skill(
                    db=db,
                    student_id=current_student.student_id,
                    skill_id=cs.skill_id,
                )

        existing_sug = db.query(CourseResumeSuggestion).filter(
            CourseResumeSuggestion.student_id == current_student.student_id,
            CourseResumeSuggestion.course_id == course_id,
        ).first()
        if not existing_sug:
            primary_s_name = skill_names[0] if skill_names else course.category
            primary_s_id = course.skills[0].skill_id if course.skills else None
            skills_summary = ", ".join(skill_names[:3]) if skill_names else course.category

            sug = CourseResumeSuggestion(
                suggestion_id=f"SUG-{uuid.uuid4().hex[:8].upper()}",
                student_id=current_student.student_id,
                course_id=course_id,
                skill_id=primary_s_id,
                course_name=course.course_name,
                skill_name=primary_s_name,
                suggestion_type="course_completion",
                title=f"Course Completion: {course.course_name}",
                description=f"You completed {course.course_name}. Would you like to add this verified course and skills ({skills_summary}) to your resume profile?",
                suggested_content=f"{course.course_name} ({course.provider}) — Completed coursework covering {skills_summary}.",
                status="pending",
                created_at=now_ts,
            )
            db.add(sug)
            suggestion_info = {
                "suggestion_id": sug.suggestion_id,
                "title": sug.title,
                "description": sug.description,
                "suggested_content": sug.suggested_content,
            }
        else:
            suggestion_info = {
                "suggestion_id": existing_sug.suggestion_id,
                "title": existing_sug.title,
                "description": existing_sug.description,
                "suggested_content": existing_sug.suggested_content,
                "status": existing_sug.status,
            }

    db.commit()

    return {
        "status": "success",
        "message": f"Lesson '{lesson.title}' completed successfully.",
        "completed_lessons_count": completed_count,
        "total_lessons": total_l,
        "progress_percentage": pct,
        "is_course_completed": is_course_done,
        "next_lesson_id": next_lid,
        "next_lesson_title": next_ltitle,
        "resume_suggestion": suggestion_info,
    }

