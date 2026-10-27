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

    # 6. Actual progress counts from database (no arbitrary mock minimums)
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
            "full_name": f"{current_student.first_name} {current_student.last_name}",
            "initials": f"{current_student.first_name[0]}{current_student.last_name[0]}",
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
    }
