from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectResponse, ProjectCreate, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse], summary="List All Hands-On Projects")
def get_projects(db: Session = Depends(get_db)):
    """Retrieves portfolio and industry capstone projects."""
    return db.query(Project).all()


@router.get("/{project_id}", response_model=ProjectResponse, summary="Get Project Details")
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Returns details, milestones, and status for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    return project


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED, summary="Create Project")
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    """Creates a new project record."""
    project = Project(**project_in.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=ProjectResponse, summary="Update Project Status & Progress")
def update_project(project_id: int, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    """Updates progress or links for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project
