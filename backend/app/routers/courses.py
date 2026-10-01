from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.course import Course
from app.schemas.course import CourseResponse, CourseCreate, CourseUpdate

router = APIRouter(prefix="/api/courses", tags=["Courses"])


@router.get("", response_model=List[CourseResponse], summary="List All Courses")
def get_courses(db: Session = Depends(get_db)):
    """Retrieves all recommended and ongoing learning courses."""
    return db.query(Course).all()


@router.get("/{course_id}", response_model=CourseResponse, summary="Get Course Details")
def get_course(course_id: int, db: Session = Depends(get_db)):
    """Retrieves specific course curriculum details."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Course {course_id} not found")
    return course


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED, summary="Create Course")
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    """Enrolls or registers a new course."""
    course = Course(**course_in.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}", response_model=CourseResponse, summary="Update Course Progress")
def update_course(course_id: int, course_in: CourseUpdate, db: Session = Depends(get_db)):
    """Updates syllabus progress for a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Course {course_id} not found")

    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)
    return course
