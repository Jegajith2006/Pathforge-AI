from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database.connection import get_db
from database.models import Course, Student, StudentCourseProgress
from schemas.course import CourseResponse, CourseRecommendation, CourseProgressUpdate, CourseSkillDetail
from schemas.common import MessageResponse
from routers.auth import get_current_student
from services.recommendation_service import get_personalized_courses, get_personalized_recommendations

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
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    query = db.query(Course)
    if category:
        query = query.filter(Course.category.ilike(f"%{category}%"))
    if difficulty:
        query = query.filter(Course.difficulty.ilike(f"%{difficulty}%"))
    courses = query.all()

    progress_map = {
        scp.course_id: (scp.progress_percentage, scp.status)
        for scp in db.query(StudentCourseProgress).filter(StudentCourseProgress.student_id == current_student.student_id).all()
    }

    result = []
    for c in courses:
        prog, stat = progress_map.get(c.course_id, (0, "not_started"))
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
            )
        )
    return result


@router.get("/recommendations", response_model=List[CourseRecommendation])
def get_course_recommendations(
    limit: int = 12,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_personalized_courses(db, current_student.student_id, limit=limit)


@router.get("/recommended", response_model=List[CourseRecommendation])
def get_course_recommendations_alias(
    limit: int = 12,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_personalized_courses(db, current_student.student_id, limit=limit)


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


@router.put("/{course_id}/progress", response_model=MessageResponse)
def update_course_progress(
    course_id: str,
    payload: CourseProgressUpdate,
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

    if not scp:
        scp = StudentCourseProgress(
            student_id=current_student.student_id,
            course_id=course_id,
            progress_percentage=payload.progress_percentage,
            status="completed" if payload.progress_percentage == 100 else "in_progress",
        )
        db.add(scp)
    else:
        scp.progress_percentage = payload.progress_percentage
        scp.status = "completed" if payload.progress_percentage == 100 else "in_progress"

    db.commit()
    return MessageResponse(
        message=f"Course '{course.course_name}' progress updated to {payload.progress_percentage}%."
    )


@router.post("/{course_id}/complete", response_model=MessageResponse)
def complete_course(
    course_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return update_course_progress(
        course_id=course_id,
        payload=CourseProgressUpdate(progress_percentage=100),
        current_student=current_student,
        db=db,
    )
