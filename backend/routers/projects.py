from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database.connection import get_db
from database.models import Project, Student, StudentProjectProgress
from schemas.project import ProjectResponse, ProjectRecommendation, ProjectProgressUpdate, ProjectSkillDetail
from schemas.common import MessageResponse
from routers.auth import get_current_student
from services.recommendation_service import get_personalized_projects
from services.skill_gap_service import update_or_create_student_skill

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
def get_all_projects(
    difficulty: Optional[str] = None,
    career_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    query = db.query(Project)
    if difficulty:
        query = query.filter(Project.difficulty.ilike(f"%{difficulty}%"))
    if career_id:
        query = query.filter(Project.career_id == career_id)
    projects = query.all()

    progress_map = {
        spp.project_id: (spp.status, spp.github_url)
        for spp in db.query(StudentProjectProgress).filter(StudentProjectProgress.student_id == current_student.student_id).all()
    }

    result = []
    for p in projects:
        stat, gh = progress_map.get(p.project_id, ("not_started", None))
        skills_details = [
            ProjectSkillDetail(
                skill_id=ps.skill_id,
                skill_name=ps.skill.skill_name if ps.skill else ps.skill_id,
                required_level=ps.required_level,
                importance=ps.importance,
            )
            for ps in p.skills
        ]
        p_skills_str = ", ".join([ps.skill_name for ps in skills_details[:3]]) if skills_details else "engineering methodologies"
        c_name = p.career.career_name if p.career else "Software Engineering"
        prob_stmt = (
            f"Problem: Industry systems require scalable, production-grade implementations for {p.project_name.lower()}. "
            f"Use Case: Build a reliable architecture addressing {p.description.rstrip('.').lower()}, integrating {p_skills_str} aligned with {c_name} workflows. "
            f"Expected Outcome: A tested, documented, and deployable portfolio artifact demonstrating practical engineering competency."
        )

        result.append(
            ProjectResponse(
                project_id=p.project_id,
                project_name=p.project_name,
                description=p.description,
                category=p.category,
                difficulty=p.difficulty,
                estimated_duration_weeks=p.estimated_duration_weeks,
                career_id=p.career_id,
                career_name=p.career.career_name if p.career else None,
                learning_outcomes=p.learning_outcomes,
                problem_statement=prob_stmt,
                reason=f"Recommended for practical {c_name} portfolio evidence.",
                skills=skills_details,
                match_percentage=85,
                status=stat,
                github_url=gh,
            )
        )
    return result


@router.get("/recommendations", response_model=List[ProjectRecommendation])
def get_project_recommendations(
    limit: int = 10,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_personalized_projects(db, current_student.student_id, limit=limit)


@router.get("/recommended", response_model=List[ProjectRecommendation])
def get_project_recommendations_alias(
    limit: int = 10,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_personalized_projects(db, current_student.student_id, limit=limit)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_by_id(
    project_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    p = db.query(Project).filter(Project.project_id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    spp = db.query(StudentProjectProgress).filter(
        StudentProjectProgress.student_id == current_student.student_id,
        StudentProjectProgress.project_id == project_id,
    ).first()

    skills_details = [
        ProjectSkillDetail(
            skill_id=ps.skill_id,
            skill_name=ps.skill.skill_name if ps.skill else ps.skill_id,
            required_level=ps.required_level,
            importance=ps.importance,
        )
        for ps in p.skills
    ]

    p_skills_str = ", ".join([ps.skill_name for ps in skills_details[:3]]) if skills_details else "engineering methodologies"
    c_name = p.career.career_name if p.career else "Software Engineering"
    prob_stmt = (
        f"Problem: Industry systems require scalable, production-grade implementations for {p.project_name.lower()}. "
        f"Use Case: Build a reliable architecture addressing {p.description.rstrip('.').lower()}, integrating {p_skills_str} aligned with {c_name} workflows. "
        f"Expected Outcome: A tested, documented, and deployable portfolio artifact demonstrating practical engineering competency."
    )

    return ProjectResponse(
        project_id=p.project_id,
        project_name=p.project_name,
        description=p.description,
        category=p.category,
        difficulty=p.difficulty,
        estimated_duration_weeks=p.estimated_duration_weeks,
        career_id=p.career_id,
        career_name=p.career.career_name if p.career else None,
        learning_outcomes=p.learning_outcomes,
        problem_statement=prob_stmt,
        reason=f"Recommended for practical {c_name} portfolio evidence.",
        skills=skills_details,
        match_percentage=88,
        status=spp.status if spp else "not_started",
        github_url=spp.github_url if spp else None,
    )


@router.get("/{project_id}/skills")
def get_project_skills(project_id: str, db: Session = Depends(get_db)):
    """Fetch skills developed by a specific project."""
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found.",
        )
    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "skills": [
            {
                "skill_id": ps.skill_id,
                "skill_name": ps.skill.skill_name if ps.skill else ps.skill_id,
                "category": ps.skill.category if ps.skill else "General",
                "required_level": ps.required_level,
                "importance": ps.importance,
            }
            for ps in project.skills
        ],
    }


@router.post("/{project_id}/start", response_model=MessageResponse)
def start_project(
    project_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    spp = db.query(StudentProjectProgress).filter(
        StudentProjectProgress.student_id == current_student.student_id,
        StudentProjectProgress.project_id == project_id,
    ).first()

    if not spp:
        spp = StudentProjectProgress(
            student_id=current_student.student_id,
            project_id=project_id,
            progress_percentage=10,
            status="in_progress",
        )
        db.add(spp)
    else:
        spp.status = "in_progress"

    db.commit()
    return MessageResponse(message=f"Project '{project_id}' started and added as evidence project.")


@router.put("/{project_id}/progress", response_model=MessageResponse)
def update_project_progress(
    project_id: str,
    payload: ProjectProgressUpdate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    spp = db.query(StudentProjectProgress).filter(
        StudentProjectProgress.student_id == current_student.student_id,
        StudentProjectProgress.project_id == project_id,
    ).first()

    if not spp:
        spp = StudentProjectProgress(
            student_id=current_student.student_id,
            project_id=project_id,
            progress_percentage=payload.progress_percentage,
            status="completed" if payload.progress_percentage == 100 else "in_progress",
            github_url=payload.github_url,
        )
        db.add(spp)
    else:
        spp.progress_percentage = payload.progress_percentage
        spp.status = "completed" if payload.progress_percentage == 100 else "in_progress"
        if payload.github_url:
            spp.github_url = payload.github_url

    # When project reaches 100% completion, update project evidence on all associated skills
    if payload.progress_percentage >= 100:
        p = db.query(Project).filter(Project.project_id == project_id).first()
        if p and p.skills:
            diff_map = {"beginner": 70, "intermediate": 80, "advanced": 90}
            proj_score = diff_map.get(str(p.difficulty).lower(), 75)
            for ps in p.skills:
                update_or_create_student_skill(
                    db=db,
                    student_id=current_student.student_id,
                    skill_id=ps.skill_id,
                    project_score=proj_score,
                )

    db.commit()
    return MessageResponse(message=f"Project progress updated to {payload.progress_percentage}%.")


@router.post("/{project_id}/complete", response_model=MessageResponse)
def complete_project(
    project_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return update_project_progress(
        project_id=project_id,
        payload=ProjectProgressUpdate(progress_percentage=100),
        current_student=current_student,
        db=db,
    )
