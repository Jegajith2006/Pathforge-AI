"""
PathForge AI - Personalized Recommendation Orchestrator
Coordinates ML ranking pipelines for courses, projects, and career opportunities.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from database.models import (
    Student,
    Course,
    Project,
    CompanyJob,
    StudentSkill,
    StudentCourseProgress,
    StudentProjectProgress,
    CareerSkill,
    CourseSkill,
)
from services.skill_gap_service import analyze_student_skill_gap
from ml.course_recommendation import rank_course_recommendations
from ml.project_recommendation import rank_project_recommendations
from ml.job_matching import compute_job_matches


def get_personalized_courses(
    db: Session,
    student_id: str,
    career_id: Optional[str] = None,
    limit: int = 12,
) -> List[Dict[str, Any]]:
    """Generates personalized course recommendations strictly scoped to the student's active career skills."""
    gap_data = analyze_student_skill_gap(db, student_id, career_id=career_id)
    skill_gaps = gap_data["gaps"]
    career_name = gap_data.get("career_name", "Target Career")
    target_career_id = career_id or gap_data.get("career_id")

    # Retrieve required skills for this career
    career_skills = (
        db.query(CareerSkill).filter(CareerSkill.career_id == target_career_id).all()
        if target_career_id
        else []
    )
    required_skill_ids = {cs.skill_id for cs in career_skills}
    if not required_skill_ids:
        return []

    # Query strictly courses covering at least one skill required by the career
    career_courses = (
        db.query(Course)
        .join(CourseSkill, Course.course_id == CourseSkill.course_id)
        .filter(CourseSkill.skill_id.in_(required_skill_ids))
        .distinct()
        .all()
    )

    progress_map = {
        scp.course_id: (scp.progress_percentage, scp.status)
        for scp in db.query(StudentCourseProgress).filter(StudentCourseProgress.student_id == student_id).all()
    }

    seen_ids = set()
    courses_payload = []
    for c in career_courses:
        if c.course_id in seen_ids:
            continue
        seen_ids.add(c.course_id)

        prog_pct, stat = progress_map.get(c.course_id, (0, "not_started"))
        # Phase 15: Filter out completed courses unless retake requested
        if prog_pct >= 100 or stat == "completed":
            continue

        courses_payload.append({
            "course_id": c.course_id,
            "course_name": c.course_name,
            "provider": c.provider,
            "description": c.description,
            "category": c.category,
            "difficulty": c.difficulty,
            "duration_hours": c.duration_hours,
            "rating": c.rating,
            "url": c.url,
            "career_id": target_career_id,
            "career_name": career_name,
            "skills": [
                {"skill_id": cs.skill_id, "skill_name": cs.skill.skill_name if cs.skill else cs.skill_id}
                for cs in c.skills
            ],
            "progress": prog_pct,
        })

    return rank_course_recommendations(
        skill_gaps=skill_gaps,
        courses=courses_payload,
        top_k=limit,
        career_name=career_name,
    )


def get_personalized_projects(db: Session, student_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Generates practical portfolio project recommendations to close active skill gaps."""
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student or not student.target_career_id:
        return []

    target_career_id = student.target_career_id
    gap_data = analyze_student_skill_gap(db, student_id)
    skill_gaps = gap_data["gaps"]
    career_name = gap_data.get("career_name") or (student.career.career_name if student.career else "Target Career")

    all_projects = db.query(Project).all()

    progress_map = {
        spp.project_id: (spp.status, spp.github_url, spp.progress_percentage)
        for spp in db.query(StudentProjectProgress).filter(StudentProjectProgress.student_id == student_id).all()
    }

    seen_ids = set()
    projects_payload = []
    for p in all_projects:
        if p.project_id in seen_ids:
            continue
        seen_ids.add(p.project_id)

        stat, gh, prog_pct = progress_map.get(p.project_id, ("not_started", None, 0))
        # Phase 15: Filter out completed projects
        if stat == "completed" or (prog_pct and prog_pct >= 100):
            continue

        projects_payload.append({
            "project_id": p.project_id,
            "project_name": p.project_name,
            "description": p.description,
            "category": p.category,
            "difficulty": p.difficulty,
            "estimated_duration_weeks": p.estimated_duration_weeks,
            "career_id": p.career_id,
            "learning_outcomes": p.learning_outcomes,
            "skills": [
                {"skill_id": ps.skill_id, "skill_name": ps.skill.skill_name if ps.skill else ps.skill_id}
                for ps in p.skills
            ],
            "status": stat,
            "github_url": gh,
        })

    return rank_project_recommendations(
        skill_gaps=skill_gaps,
        projects=projects_payload,
        target_career_id=target_career_id,
        top_k=limit,
        career_name=career_name,
    )


def get_personalized_recommendations(
    db: Session,
    student_id: str,
    limit_courses: int = 8,
    limit_projects: int = 6,
) -> Dict[str, Any]:
    """Generates unified, skill-gap anchored course and project recommendations."""
    gap_data = analyze_student_skill_gap(db, student_id)
    courses = get_personalized_courses(db, student_id, limit=limit_courses)
    projects = get_personalized_projects(db, student_id, limit=limit_projects)

    return {
        "career_id": gap_data["career_id"],
        "career": gap_data["career_name"],
        "career_name": gap_data["career_name"],
        "skill_gaps": gap_data["gaps"],
        "courses": courses,
        "projects": projects,
        "total_courses_recommended": len(courses),
        "total_projects_recommended": len(projects),
    }


def get_personalized_jobs(db: Session, student_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Generates personalized job opportunity matches for the student using BGE and demonstrated skills."""
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        return []

    target_career_id = student.target_career_id
    jobs_query = db.query(CompanyJob)
    if target_career_id:
        career_jobs = jobs_query.filter(CompanyJob.career_id == target_career_id).all()
        if len(career_jobs) >= 5:
            jobs = career_jobs
        else:
            jobs = jobs_query.limit(40).all()
    else:
        jobs = jobs_query.limit(40).all()

    student_skills_records = (
        db.query(StudentSkill)
        .filter(StudentSkill.student_id == student_id)
        .all()
    )
    student_skills = [
        ss.skill.skill_name
        for ss in student_skills_records
        if ss.skill and ss.final_mastery > 25
    ]
    student_mastery_map = {
        ss.skill.skill_name.lower(): ss.final_mastery
        for ss in student_skills_records
        if ss.skill
    }

    student_bg = f"{student.degree} {student.department}, {student.college}. CGPA: {student.cgpa}. Preferred: {student.learning_mode}"

    jobs_payload = []
    for j in jobs:
        jobs_payload.append({
            "job_id": j.job_id,
            "job_title": j.job_title,
            "company_name": j.company.company_name if j.company else "Tech Enterprise",
            "location": j.location,
            "experience_required": j.experience_required,
            "employment_type": j.employment_type,
            "description": j.description,
            "required_skills": j.required_skills,
        })

    return compute_job_matches(
        student_skills=student_skills,
        student_background_text=student_bg,
        jobs=jobs_payload,
        student_mastery_map=student_mastery_map,
        top_k=limit,
    )
