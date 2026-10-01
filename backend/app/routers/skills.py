from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.skill import Skill
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillUpdate, SkillResponse

router = APIRouter(prefix="/api/skills", tags=["Skills"])


@router.get("", response_model=List[SkillResponse], summary="List All Skills")
def get_skills(db: Session = Depends(get_db)):
    """Retrieves all tracked skills."""
    return db.query(Skill).all()


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED, summary="Create New Skill")
def create_skill(skill_in: SkillCreate, db: Session = Depends(get_db)):
    """Registers a new skill in user skill inventory."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active user found")

    skill = Skill(
        name=skill_in.name,
        category=skill_in.category,
        current_level=skill_in.current_level,
        required_level=skill_in.required_level,
        status=skill_in.status or "In Progress",
        priority=skill_in.priority or "Medium",
        description=skill_in.description,
        user_id=skill_in.user_id or user.id,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.get("/{skill_id}", response_model=SkillResponse, summary="Get Skill by ID")
def get_skill(skill_id: int, db: Session = Depends(get_db)):
    """Returns details for a single skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Skill {skill_id} not found")
    return skill


@router.put("/{skill_id}", response_model=SkillResponse, summary="Update Skill")
def update_skill(skill_id: int, skill_in: SkillUpdate, db: Session = Depends(get_db)):
    """Updates proficiency level or metadata for a skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Skill {skill_id} not found")

    update_data = skill_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(skill, field, value)

    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Skill")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    """Removes a skill from inventory."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Skill {skill_id} not found")

    db.delete(skill)
    db.commit()
    return None
