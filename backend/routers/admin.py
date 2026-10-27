import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.connection import get_db
from database.models import (
    User,
    Student,
    Mentor,
    StudentCourseProgress,
    AssessmentAnswer,
    StudentSkill,
    ResumeDocument,
    StudentRoadmapStep,
    MentorStudentAssignment,
    MentorshipSession,
    MentorGuidanceNote,
    Course,
    Career,
)
from routers.auth import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Administration"])


@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns full list of registered users in PathForge AI.
    Protected strictly for administrators. Does not expose password hashes.
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "user_id": u.user_id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_verified": u.is_verified,
            "account_status": u.account_status,
            "created_at": u.created_at,
            "last_login_at": u.last_login_at,
        }
        for u in users
    ]


@router.get("/students")
def get_all_students(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns all registered students with aggregate learning progress metrics.
    """
    students = db.query(Student).all()
    result = []
    for s in students:
        enrolled_count = db.query(StudentCourseProgress).filter(
            StudentCourseProgress.student_id == s.student_id
        ).count()
        completed_count = db.query(StudentCourseProgress).filter(
            StudentCourseProgress.student_id == s.student_id,
            StudentCourseProgress.status == "completed",
        ).count()
        assessment_count = db.query(AssessmentAnswer).filter(
            AssessmentAnswer.student_id == s.student_id
        ).count()
        resume_count = db.query(ResumeDocument).filter(
            ResumeDocument.student_id == s.student_id
        ).count()

        result.append({
            "student_id": s.student_id,
            "user_id": s.user_id or s.student_id,
            "full_name": f"{s.first_name} {s.last_name}",
            "email": s.email,
            "college": s.college,
            "department": s.department,
            "degree": s.degree,
            "graduation_year": s.graduation_year,
            "cgpa": s.cgpa,
            "target_career_id": s.target_career_id,
            "target_career_name": s.career.career_name if s.career else "Unassigned",
            "enrolled_courses": enrolled_count,
            "completed_courses": completed_count,
            "assessments_taken": assessment_count,
            "resumes_uploaded": resume_count,
        })
    return result


@router.get("/mentors")
def get_all_mentors(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns all registered mentors with mentorship stats.
    """
    mentors = db.query(Mentor).all()
    result = []
    for m in mentors:
        assigned_students = db.query(MentorStudentAssignment).filter(
            MentorStudentAssignment.mentor_id == m.mentor_id,
            MentorStudentAssignment.status == "active",
        ).count()
        sessions_count = db.query(MentorshipSession).filter(
            MentorshipSession.mentor_id == m.mentor_id
        ).count()

        result.append({
            "mentor_id": m.mentor_id,
            "user_id": m.user_id or m.mentor_id,
            "name": m.name,
            "email": m.email,
            "title": m.title,
            "company": m.company,
            "expertise": m.expertise,
            "experience_years": m.experience_years,
            "rating": m.rating,
            "status": m.status,
            "active_mentees": assigned_students,
            "total_sessions": sessions_count,
        })
    return result


@router.get("/student-progress/{student_id}")
def get_student_detailed_progress(
    student_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns full granular learning records for a specific student.
    Includes course completions, lesson tracking, assessment answers,
    skill evidence, and resume analysis history.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    courses = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == student_id
    ).all()
    course_list = []
    for c in courses:
        course_meta = db.query(Course).filter(Course.course_id == c.course_id).first()
        course_list.append({
            "course_id": c.course_id,
            "course_name": course_meta.course_name if course_meta else c.course_id,
            "status": c.status,
            "enrollment_status": c.enrollment_status,
            "progress_percentage": c.progress_percentage,
            "completed_lessons_count": c.completed_lessons_count,
            "total_lessons": c.total_lessons,
            "last_lesson_title": c.last_lesson_title,
            "completed_at": c.completed_at,
            "last_accessed_at": c.last_accessed_at,
        })

    assessments = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.student_id == student_id
    ).order_by(AssessmentAnswer.attempt_date.desc()).all()
    assessment_list = [
        {
            "attempt_id": a.attempt_id,
            "question_id": a.question_id,
            "selected_answer": a.selected_answer,
            "correct": a.correct,
            "attempt_date": a.attempt_date,
        }
        for a in assessments
    ]

    skills = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id
    ).all()
    skill_list = [
        {
            "skill_id": sk.skill_id,
            "skill_name": sk.skill.skill_name if sk.skill else sk.skill_id,
            "mastery_score": getattr(sk, "final_mastery", 0),
            "final_mastery": getattr(sk, "final_mastery", 0),
            "mastery_level": getattr(sk, "mastery_level", "Missing"),
            "evidence_count": sk.evidence_count,
            "is_completed": getattr(sk, "is_completed", False),
            "completion_status": getattr(sk, "completion_status", "not_started"),
            "best_assessment_score": getattr(sk, "best_assessment_score", 0),
        }
        for sk in skills
    ]

    resumes = db.query(ResumeDocument).filter(
        ResumeDocument.student_id == student_id
    ).order_by(ResumeDocument.upload_timestamp.desc()).all()
    resume_list = [
        {
            "resume_id": r.resume_id,
            "filename": r.original_filename,
            "upload_timestamp": r.upload_timestamp,
            "is_active": r.is_active,
            "analysis_status": r.analysis_status,
            "analysis_summary": r.analysis_summary,
        }
        for r in resumes
    ]

    milestones = db.query(StudentRoadmapStep).filter(
        StudentRoadmapStep.student_id == student_id
    ).order_by(StudentRoadmapStep.step_number).all()
    roadmap_list = [
        {
            "step_number": m.step_number,
            "milestone_name": m.milestone_name,
            "status": m.status,
            "completed_at": m.completed_at,
        }
        for m in milestones
    ]

    return {
        "student_profile": {
            "student_id": student.student_id,
            "user_id": student.user_id or student.student_id,
            "name": f"{student.first_name} {student.last_name}",
            "email": student.email,
            "college": student.college,
            "target_career": student.career.career_name if student.career else student.target_career_id,
        },
        "courses": course_list,
        "assessments": assessment_list,
        "skills": skill_list,
        "resumes": resume_list,
        "roadmap": roadmap_list,
    }


@router.get("/mentorship-activity")
def get_mentorship_activity(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns global mentorship activity: sessions, active pairings, and guidance notes.
    """
    sessions = db.query(MentorshipSession).order_by(MentorshipSession.session_date.desc()).all()
    pairings = db.query(MentorStudentAssignment).filter(MentorStudentAssignment.status == "active").all()
    notes = db.query(MentorGuidanceNote).order_by(MentorGuidanceNote.id.desc()).all()

    return {
        "active_pairings_count": len(pairings),
        "total_sessions_count": len(sessions),
        "sessions": [
            {
                "session_id": s.session_id,
                "mentor_id": s.mentor_id,
                "mentor_name": s.mentor.name if s.mentor else s.mentor_id,
                "student_id": s.student_id,
                "student_name": f"{s.student.first_name} {s.student.last_name}" if s.student else s.student_id,
                "topic": s.topic,
                "session_date": s.session_date,
                "status": s.status,
            }
            for s in sessions[:30]
        ],
        "guidance_notes": [
            {
                "id": n.id,
                "mentor_name": n.mentor.name if n.mentor else n.mentor_id,
                "student_name": f"{n.student.first_name} {n.student.last_name}" if n.student else n.student_id,
                "notes": n.notes,
                "created_at": n.created_at,
            }
            for n in notes[:20]
        ],
    }


@router.get("/system-stats")
def get_system_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Aggregates high-level platform health and tracking statistics.
    """
    total_users = db.query(User).count()
    total_students = db.query(Student).count()
    total_mentors = db.query(Mentor).count()
    total_enrollments = db.query(StudentCourseProgress).count()
    total_completions = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.status == "completed"
    ).count()
    total_resumes = db.query(ResumeDocument).count()
    total_answers = db.query(AssessmentAnswer).count()

    return {
        "users": {
            "total_users": total_users,
            "students": total_students,
            "mentors": total_mentors,
            "admins": db.query(User).filter(User.role == "admin").count(),
        },
        "learning_metrics": {
            "total_course_enrollments": total_enrollments,
            "total_course_completions": total_completions,
            "total_resumes_analyzed": total_resumes,
            "total_assessment_submissions": total_answers,
        },
        "database": {
            "engine": "SQLite",
            "file": "backend/data/pathforge.db",
            "status": "healthy",
        },
    }
