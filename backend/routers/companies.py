from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Company, CompanyJob, CompanySkill, Student, StudentSkill
from routers.auth import get_current_student

router = APIRouter(tags=["Company Intelligence"])


class CompanyMatchRequest(BaseModel):
    company_id: str
    target_role: Optional[str] = None


@router.get("/api/companies")
def get_all_companies(
    search: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    query = db.query(Company)
    if search:
        query = query.filter(Company.company_name.ilike(f"%{search}%") | Company.description.ilike(f"%{search}%"))
    comps = query.all()

    # Get student skills to calculate company match
    student_skills = {
        ss.skill.skill_name.lower(): ss.final_mastery
        for ss in db.query(StudentSkill).filter(StudentSkill.student_id == current_student.student_id).all()
        if ss.skill
    }

    result = []
    for c in comps:
        # Find active jobs for company
        job = db.query(CompanyJob).filter(CompanyJob.company_id == c.company_id).first()
        role_title = job.job_title if job else "Software Engineer"
        req_skills_str = job.required_skills if job else "Python, SQL, Algorithms"
        req_skills_list = [s.strip() for s in req_skills_str.split(",")]

        # Dynamic continuous match calculation based on evidence-grounded skill mastery
        if req_skills_list:
            total_mastery = sum(min(100.0, float(student_skills.get(s.lower(), 0.0))) for s in req_skills_list)
            match_pct = int(round(total_mastery / len(req_skills_list)))
            match_pct = min(100, max(0, match_pct))
        else:
            match_pct = 0

        result.append({
            "company_id": c.company_id,
            "company_name": c.company_name,
            "industry": c.industry,
            "company_size": c.company_size,
            "location": c.location,
            "description": c.description,
            "target_role": role_title,
            "match_percentage": f"{match_pct}%",
            "skills": req_skills_list,
        })

    result.sort(key=lambda x: int(x["match_percentage"].replace("%", "")), reverse=True)
    return result


@router.get("/api/companies/{company_id}")
def get_company_by_id(company_id: str, db: Session = Depends(get_db)):
    c = db.query(Company).filter(Company.company_id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found.")
    return {
        "company_id": c.company_id,
        "company_name": c.company_name,
        "industry": c.industry,
        "company_size": c.company_size,
        "location": c.location,
        "description": c.description,
        "career_categories": c.career_categories,
    }


@router.get("/api/companies/{company_id}/jobs")
def get_company_jobs(company_id: str, db: Session = Depends(get_db)):
    jobs = db.query(CompanyJob).filter(CompanyJob.company_id == company_id).all()
    return [
        {
            "job_id": j.job_id,
            "job_title": j.job_title,
            "location": j.location,
            "experience_required": j.experience_required,
            "employment_type": j.employment_type,
            "required_skills": j.required_skills,
            "description": j.description,
        }
        for j in jobs
    ]


@router.get("/api/company/skills")
def get_company_skills(
    company_id: Optional[str] = None,
    career_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CompanySkill)
    if company_id:
        query = query.filter(CompanySkill.company_id == company_id)
    if career_id:
        query = query.filter(CompanySkill.career_id == career_id)

    skills = query.limit(50).all()
    return [
        {
            "company_name": cs.company.company_name if cs.company else cs.company_id,
            "career_name": cs.career.career_name if cs.career else cs.career_id,
            "skill_name": cs.skill.skill_name if cs.skill else cs.skill_id,
            "required_level": cs.required_level,
            "importance": cs.importance,
        }
        for cs in skills
    ]


@router.post("/api/company/match")
def analyze_company_match(
    payload: CompanyMatchRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    c = db.query(Company).filter(Company.company_id == payload.company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found.")

    student_skills = {
        ss.skill.skill_name.lower(): ss.final_mastery
        for ss in db.query(StudentSkill).filter(StudentSkill.student_id == current_student.student_id).all()
        if ss.skill
    }

    job = db.query(CompanyJob).filter(CompanyJob.company_id == c.company_id).first()
    req_skills = [s.strip() for s in (job.required_skills if job else "Python, SQL, Machine Learning").split(",")]

    matched = [s for s in req_skills if student_skills.get(s.lower(), 0) >= 70]
    missing = [s for s in req_skills if student_skills.get(s.lower(), 0) < 70]

    if req_skills:
        total_mastery = sum(min(100.0, float(student_skills.get(s.lower(), 0.0))) for s in req_skills)
        match_pct = int(round(total_mastery / len(req_skills)))
        match_pct = min(100, max(0, match_pct))
    else:
        match_pct = 0

    return {
        "company_name": c.company_name,
        "role_title": job.job_title if job else "Software Engineer",
        "student_match": f"{match_pct}%",
        "matched_skills": matched,
        "missing_skills": missing if missing else ["Advanced System Architecture"],
        "recommendation": f"To optimize your profile for {c.company_name}, prioritize closing your {missing[0] if missing else 'Docker'} gap.",
    }
