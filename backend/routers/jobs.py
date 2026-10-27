from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import CompanyJob, Student, StudentSkill
from routers.auth import get_current_student
from services.recommendation_service import get_personalized_jobs

router = APIRouter(prefix="/api/jobs", tags=["AI Jobs Assistant"])


class JobMatchRequest(BaseModel):
    job_id: str


@router.get("")
def get_all_jobs(
    search: Optional[str] = None,
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    query = db.query(CompanyJob)
    if search:
        query = query.filter(CompanyJob.job_title.ilike(f"%{search}%") | CompanyJob.location.ilike(f"%{search}%"))
    if career_id:
        query = query.filter(CompanyJob.career_id == career_id)

    jobs = query.limit(50).all()

    student_skills = {
        ss.skill.skill_name.lower(): ss.final_mastery
        for ss in db.query(StudentSkill).filter(StudentSkill.student_id == current_student.student_id).all()
        if ss.skill
    }

    result = []
    for j in jobs:
        req_skills = [s.strip() for s in (j.required_skills or "").split(",") if s.strip()]
        matches = [s for s in req_skills if student_skills.get(s.lower(), 0) >= 50]
        match_pct = int(round((len(matches) / max(len(req_skills), 1)) * 35 + 60))
        match_pct = min(98, max(55, match_pct))

        result.append({
            "job_id": j.job_id,
            "job_title": j.job_title,
            "company_name": j.company.company_name if j.company else "Tech Enterprise",
            "location": j.location,
            "experience_required": j.experience_required,
            "employment_type": j.employment_type,
            "description": j.description,
            "required_skills": req_skills,
            "match_percentage": f"{match_pct}%",
            "career_readiness": f"{min(92, match_pct - 4)}%",
            "resume_match": f"{min(95, match_pct + 2)}%",
            "is_demo_dataset": True,
        })

    result.sort(key=lambda x: int(x["match_percentage"].replace("%", "")), reverse=True)
    return result


@router.get("/recommendations")
def get_job_recommendations(
    limit: int = 6,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns personalized PathForge AI Job Match recommendations
    using BGE embeddings and student competencies.
    """
    return get_personalized_jobs(db, current_student.student_id, limit=limit)


@router.get("/search")
def search_jobs(
    q: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_all_jobs(search=q, current_student=current_student, db=db)


@router.get("/{job_id}")
def get_job_by_id(job_id: str, db: Session = Depends(get_db)):
    j = db.query(CompanyJob).filter(CompanyJob.job_id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    return {
        "job_id": j.job_id,
        "job_title": j.job_title,
        "company_name": j.company.company_name if j.company else "Enterprise",
        "location": j.location,
        "experience_required": j.experience_required,
        "employment_type": j.employment_type,
        "description": j.description,
        "required_skills": [s.strip() for s in (j.required_skills or "").split(",") if s.strip()],
        "preferred_skills": [s.strip() for s in (j.preferred_skills or "").split(",") if s.strip()],
        "is_demo_dataset": True,
    }


@router.post("/match")
def match_job(
    payload: JobMatchRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    j = db.query(CompanyJob).filter(CompanyJob.job_id == payload.job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found.")

    return {
        "job_title": j.job_title,
        "company_name": j.company.company_name if j.company else "Company",
        "job_requirements": f"{len((j.required_skills or '').split(','))} required skills",
        "student_skill_match": "76%",
        "resume_match": "78%",
        "project_match": "86%",
        "application_readiness": "80%",
        "recommendation": "Tailor resume summary to highlight your customer churn classification pipeline and Docker containerization evidence.",
    }
