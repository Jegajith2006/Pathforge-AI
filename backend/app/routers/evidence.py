from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.evidence import Evidence
from app.models.user import User
from app.schemas.evidence import EvidenceResponse, EvidenceCreate, EvidenceUpdate

router = APIRouter(prefix="/api/evidence", tags=["Evidence & Portfolio"])


@router.get("", response_model=List[EvidenceResponse], summary="List Verification Evidence Items")
def get_evidence(db: Session = Depends(get_db)):
    """Retrieves all submitted and verified evidence items."""
    return db.query(Evidence).order_by(Evidence.created_at.desc()).all()


@router.post("", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED, summary="Submit New Evidence")
def create_evidence(evidence_in: EvidenceCreate, db: Session = Depends(get_db)):
    """Submits a new artifact for skill or project verification."""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    evidence = Evidence(
        user_id=evidence_in.user_id or user.id,
        title=evidence_in.title,
        description=evidence_in.description,
        evidence_type=evidence_in.evidence_type,
        url=evidence_in.url,
        verification_status=evidence_in.verification_status or "Pending",
        portfolio_ready=evidence_in.portfolio_ready or False,
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence


@router.get("/{evidence_id}", response_model=EvidenceResponse, summary="Get Evidence Item")
def get_evidence_item(evidence_id: int, db: Session = Depends(get_db)):
    """Returns details for single evidence artifact."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Evidence item {evidence_id} not found")
    return evidence


@router.put("/{evidence_id}", response_model=EvidenceResponse, summary="Update Evidence Item")
def update_evidence(evidence_id: int, evidence_in: EvidenceUpdate, db: Session = Depends(get_db)):
    """Updates evidence verification status or artifact details."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Evidence item {evidence_id} not found")

    update_data = evidence_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(evidence, field, value)

    db.commit()
    db.refresh(evidence)
    return evidence


@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Evidence Item")
def delete_evidence(evidence_id: int, db: Session = Depends(get_db)):
    """Deletes an evidence artifact."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Evidence item {evidence_id} not found")

    db.delete(evidence)
    db.commit()
    return None
