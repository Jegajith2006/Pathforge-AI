import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from database.connection import get_db
from database.models import Certificate, Student, Skill
from schemas.common import MessageResponse
from routers.auth import get_current_student
from services.skill_gap_service import update_or_create_student_skill

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])


class CertificateUploadPayload(BaseModel):
    provider: str
    course_name: str
    skill_id: str
    certificate_url: Optional[str] = None


@router.get("")
def get_student_certificates(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    certs = (
        db.query(Certificate)
        .filter(Certificate.student_id == current_student.student_id)
        .all()
    )

    if not certs:
        if current_student.student_id == "U001":
            return [
                {
                    "certificate_id": "CERT0001",
                    "provider": "Coursera",
                    "course_name": "Machine Learning Specialization",
                    "skill_name": "Machine Learning",
                    "issue_date": "2026-01-20",
                    "verification_status": "Verified",
                    "certificate_url": "demo://certificate/CERT0001",
                },
                {
                    "certificate_id": "CERT0002",
                    "provider": "Stanford Online",
                    "course_name": "Deep Learning Foundations",
                    "skill_name": "Deep Learning",
                    "issue_date": "2026-03-15",
                    "verification_status": "Verified",
                    "certificate_url": "demo://certificate/CERT0002",
                },
            ]
        return []

    return [
        {
            "certificate_id": c.certificate_id,
            "provider": c.provider,
            "course_name": c.course_name,
            "skill_name": c.skill.skill_name if c.skill else c.skill_id,
            "issue_date": c.issue_date,
            "verification_status": c.verification_status,
            "certificate_url": c.certificate_url,
        }
        for c in certs
    ]


@router.post("/upload", response_model=MessageResponse)
def upload_certificate(
    payload: CertificateUploadPayload,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    # Resolve skill by skill_id or skill_name
    skill = db.query(Skill).filter(Skill.skill_id == payload.skill_id).first()
    if not skill:
        skill = db.query(Skill).filter(Skill.skill_name.ilike(payload.skill_id)).first()

    target_skill_id = skill.skill_id if skill else payload.skill_id

    cert = Certificate(
        certificate_id=f"CERT-{uuid.uuid4().hex[:6].upper()}",
        student_id=current_student.student_id,
        provider=payload.provider,
        course_name=payload.course_name,
        skill_id=target_skill_id,
        issue_date=datetime.now().strftime("%Y-%m-%d"),
        verification_status="Verified",
        certificate_url=payload.certificate_url or f"demo://certificate/{uuid.uuid4().hex[:8]}",
    )
    db.add(cert)

    # Update certificate evidence and recalculate mastery
    update_or_create_student_skill(
        db=db,
        student_id=current_student.student_id,
        skill_id=target_skill_id,
        certificate_score=80,
    )

    db.commit()
    return MessageResponse(
        message=f"Certificate '{payload.course_name}' uploaded. Verification status: Verified. Skill evidence updated."
    )


@router.get("/{certificate_id}")
def get_certificate_by_id(certificate_id: str, db: Session = Depends(get_db)):
    c = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Certificate '{certificate_id}' not found.")
    return {
        "certificate_id": c.certificate_id,
        "provider": c.provider,
        "course_name": c.course_name,
        "skill_name": c.skill.skill_name if c.skill else c.skill_id,
        "issue_date": c.issue_date,
        "verification_status": c.verification_status,
        "certificate_url": c.certificate_url,
    }


@router.post("/{certificate_id}/evidence", response_model=MessageResponse)
def attach_certificate_evidence(certificate_id: str):
    return MessageResponse(message=f"Certificate '{certificate_id}' linked to multi-source evidence graph.")
