from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.company import Company, CompanyRole

router = APIRouter(prefix="/api/company-matches", tags=["Company Match"])


@router.get("", summary="List Target Company Role Matches (Demo Data)")
def get_company_matches(db: Session = Depends(get_db)):
    """
    Returns AI target company matches and career opportunities aligned with current competencies.
    All records are clearly designated as simulated demo benchmarks.
    """
    roles = db.query(CompanyRole).join(Company).all()
    matches = []
    for role in roles:
        matches.append({
            "id": role.id,
            "company_id": role.company_id,
            "company_name": role.company.name if role.company else "Unknown Company",
            "company_website": role.company.website if role.company else None,
            "company_description": role.company.description if role.company else None,
            "role_title": role.role_title,
            "description": role.description,
            "required_skills": role.required_skills or [],
            "match_score": role.match_score,
            "readiness_level": role.readiness_level,
            "is_demo_data": True,
            "created_at": role.created_at,
        })
    return matches
