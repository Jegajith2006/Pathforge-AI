from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import (
    Student,
    StudentCourseProgress,
    StudentProjectProgress,
    Notification,
    Certificate,
    CareerSkill,
    CourseSkill,
    ProjectSkill,
    Course,
    Project,
    ResumeDocument,
)
from routers.auth import get_current_student
from services.skill_gap_service import analyze_student_skill_gap, compute_career_readiness
from services.career_readiness_service import compute_career_skill_radar
from services.skill_progression_service import get_student_career_progression
from services.roadmap_service import generate_topological_roadmap
from services.recommendation_service import get_personalized_courses, get_personalized_projects

router = APIRouter(prefix="/api/dashboard", tags=["Comprehensive Dashboard"])


@router.get("")
def get_dashboard_summary(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    # Check if student has uploaded any active resume
    active_resume = db.query(ResumeDocument).filter(
        ResumeDocument.student_id == current_student.student_id,
        ResumeDocument.is_active == True,
    ).first()
    resume_status = "Active" if active_resume else "Not uploaded"

    courses_completed = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == current_student.student_id,
        StudentCourseProgress.status == "completed"
    ).count()

    projects_completed = db.query(StudentProjectProgress).filter(
        StudentProjectProgress.student_id == current_student.student_id,
        StudentProjectProgress.status == "completed"
    ).count()

    certs_count = db.query(Certificate).filter(
        Certificate.student_id == current_student.student_id
    ).count()

    unread_notifications = db.query(Notification).filter(
        Notification.student_id == current_student.student_id,
        Notification.is_read == False
    ).count()

    # If student has not selected a career yet, return accurate empty state
    if not current_student.target_career_id:
        return {
            "student": {
                "student_id": current_student.student_id,
                "full_name": f"{current_student.first_name} {current_student.last_name}".strip(),
                "initials": f"{current_student.first_name[:1]}{current_student.last_name[:1]}".upper() if current_student.first_name else "ST",
                "email": current_student.email,
                "degree": current_student.degree,
                "college": current_student.college,
                "cgpa": current_student.cgpa,
                "target_career": None,
                "target_career_id": None,
            },
            "readiness": {
                "title": "PathForge AI Career Readiness Indicator",
                "overall_readiness": 0,
                "overall_score": 0,
                "career_readiness_score": 0,
                "confidence_score": 0.0,
                "target_career_id": None,
                "target_career_name": None,
                "skill_match_percentage": 0,
                "mastery_percentage": 0,
                "evidence_percentage": 0,
                "readiness_level": "Awaiting Career Selection",
                "readiness_tier": "Awaiting Career Selection",
                "verified_skills_count": 0,
                "total_required_skills": 0,
                "gap_count": 0,
                "explanation": "Choose your target career to calibrate readiness against industry competency benchmarks.",
                "next_best_action": "Select a target career track.",
                "disclaimer": "This is an educational career readiness indicator, not an official hiring score.",
            },
            "radar_data": [],
            "metrics": {
                "skill_match": "0%",
                "mastery": "0%",
                "evidence": "0%",
                "courses_progress": f"{courses_completed} / 0",
                "projects_verified": f"{projects_completed} / 0",
                "credentials_count": certs_count,
                "core_competencies": "0 / 0",
                "sprint_pace": "Choose Target Career",
            },
            "next_best_action": {
                "title": "Choose Target Career",
                "reason": "Select your career path to unlock tailored competencies, gap analysis, and personalized roadmap.",
                "expected_readiness_boost": "+0%",
            },
            "priority_gaps": [],
            "skill_progression": {
                "completed_skills": [],
                "total_required_skills": 0,
                "next_recommended_skill": None,
            },
            "roadmap_summary": {
                "progress_percentage": 0,
                "completed_milestones": 0,
                "total_milestones": 0,
                "next_milestone": "Choose Target Career",
            },
            "recommended_courses": [],
            "recommended_projects": [],
            "unread_notifications_count": unread_notifications,
            "resume_status": resume_status,
        }

    # 1. Skill Gap Analysis & Readiness
    gap_data = analyze_student_skill_gap(db, current_student.student_id)
    readiness = compute_career_readiness(db, current_student.student_id)

    # 2. Dynamic 6-axis skill radar based on student's actual evidence
    radar_data = compute_career_skill_radar(db, current_student.student_id, current_student.target_career_id)

    # 3. Learning progression & prerequisites DAG
    progression = get_student_career_progression(db, current_student.student_id, current_student.target_career_id)
    completed_skills_count = len(progression.get("completed_skills", []))
    total_required_skills = progression.get("total_required_skills", 0)

    # 4. Roadmap
    roadmap = generate_topological_roadmap(db, current_student.student_id)

    # 5. Recommendations
    courses = get_personalized_courses(db, current_student.student_id, limit=6)
    projects = get_personalized_projects(db, current_student.student_id, limit=4)

    # Track relevant course & project totals
    career_skills = db.query(CareerSkill).filter(CareerSkill.career_id == current_student.target_career_id).all()
    c_skill_ids = [cs.skill_id for cs in career_skills]
    total_track_courses = db.query(CourseSkill.course_id).filter(CourseSkill.skill_id.in_(c_skill_ids)).distinct().count() if c_skill_ids else 0
    if total_track_courses == 0:
        total_track_courses = db.query(Course).count()

    total_track_projects = db.query(ProjectSkill.project_id).filter(ProjectSkill.skill_id.in_(c_skill_ids)).distinct().count() if c_skill_ids else 0
    if total_track_projects == 0:
        total_track_projects = db.query(Project).count()

    top_gaps = gap_data.get("gaps", [])[:4]

    # Dynamic next best action based on skill progression DAG
    next_skill = progression.get("next_recommended_skill")
    if next_skill:
        next_action = {
            "title": f"Master {next_skill['skill_name']}",
            "reason": f"Prerequisite-verified next step for {gap_data['career_name']}. Pass assessment at >=80% threshold to qualify completion.",
            "expected_readiness_boost": f"+{next_skill.get('projected_readiness_lift', 12)}%",
        }
    elif top_gaps:
        next_action = {
            "title": f"Master {top_gaps[0]['skill_name']}",
            "reason": f"Required for {gap_data['career_name']} and currently below target threshold.",
            "expected_readiness_boost": f"+{top_gaps[0].get('projected_readiness_lift', 10)}%",
        }
    else:
        next_action = {
            "title": "All Track Skills Mastered",
            "reason": "Outstanding performance! All required track skills have met the 80% completion criteria.",
            "expected_readiness_boost": "+0%",
        }

    roadmap_progress = roadmap.get("current_progress_percentage", 0)
    sprint_pace = f"{roadmap_progress}% On track" if roadmap_progress > 0 else "Awaiting Diagnostic Assessment"

    return {
        "student": {
            "student_id": current_student.student_id,
            "full_name": f"{current_student.first_name} {current_student.last_name}".strip(),
            "initials": f"{current_student.first_name[:1]}{current_student.last_name[:1]}".upper() if current_student.first_name else "ST",
            "email": current_student.email,
            "degree": current_student.degree,
            "college": current_student.college,
            "cgpa": current_student.cgpa,
            "target_career": gap_data["career_name"],
            "target_career_id": gap_data["career_id"],
        },
        "readiness": readiness,
        "radar_data": radar_data,
        "metrics": {
            "skill_match": f"{gap_data['skill_match_pct']}%",
            "mastery": f"{gap_data['avg_mastery_pct']}%",
            "evidence": f"{gap_data['evidence_pct']}%",
            "courses_progress": f"{courses_completed} / {total_track_courses or 10}",
            "projects_verified": f"{projects_completed} / {total_track_projects or 4}",
            "credentials_count": certs_count,
            "core_competencies": f"{completed_skills_count} / {total_required_skills}",
            "sprint_pace": sprint_pace,
        },
        "next_best_action": next_action,
        "priority_gaps": top_gaps,
        "skill_progression": progression,
        "roadmap_summary": {
            "progress_percentage": roadmap_progress,
            "completed_milestones": roadmap.get("completed_milestones", 0),
            "total_milestones": roadmap.get("total_milestones", 0),
            "next_milestone": roadmap.get("next_milestone_title", "Start Track"),
        },
        "recommended_courses": courses,
        "recommended_projects": projects,
        "unread_notifications_count": unread_notifications,
        "resume_status": resume_status,
    }
