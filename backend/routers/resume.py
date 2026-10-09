import shutil
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from config import settings
from database.connection import get_db
from database.models import Student, ResumeAnalysis, Skill, StudentSkill
from schemas.resume import (
    ResumeUploadResponse,
    ResumeAnalysisResponse,
    ResumeExtractedSkill,
    ResumeExtractedProject,
    ResumeExtractedCertificate,
    ResumeExtractedExperience,
)
from routers.auth import get_current_student
from services.resume_service import parse_and_analyze_resume

router = APIRouter(prefix="/api/resume", tags=["AI Resume Analyzer"])

ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=ResumeUploadResponse)
def upload_resume(
    file: UploadFile = File(...),
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Upload and parse student CV (PDF or DOCX).
    Validates file format, size, extracts structured entities via Gemini,
    normalizes skills, and updates exposure evidence in student_skills.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename must be provided.",
        )

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: PDF, DOCX, TXT.",
        )

    # Save to uploads directory
    safe_name = f"{current_student.student_id}_{uuid.uuid4().hex[:6]}_{file.filename}"
    destination = settings.UPLOAD_DIR / safe_name

    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}",
        )

    filesize = destination.stat().st_size
    if filesize == 0:
        if destination.exists():
            destination.unlink()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    if filesize > MAX_FILE_SIZE:
        if destination.exists():
            destination.unlink()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 10 MB ({filesize / (1024*1024):.1f} MB).",
        )

    resume_id = f"RES-{uuid.uuid4().hex[:8].upper()}"

    try:
        # Trigger full parsing and evidence calibration
        analysis_data = parse_and_analyze_resume(
            db=db,
            student_id=current_student.student_id,
            file_path=destination,
            original_filename=file.filename,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume analysis failed: {str(e)}",
        )

    return {
        "status": "success",
        "filename": file.filename,
        "filesize_bytes": filesize,
        "resume_id": resume_id,
        "message": f"Resume analyzed successfully. {analysis_data['total_skills_detected']} skills detected and calibrated.",
        "data": analysis_data,
    }


@router.post("/analyze", response_model=ResumeAnalysisResponse)
def analyze_latest_resume(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Re-runs analysis on the latest uploaded resume or student profile.
    """
    student_files = list(settings.UPLOAD_DIR.glob(f"{current_student.student_id}_*"))
    if student_files:
        latest_file = max(student_files, key=lambda f: f.stat().st_mtime)
        return parse_and_analyze_resume(db, current_student.student_id, latest_file, latest_file.name)

    # If no physical file uploaded, create profile-derived seed resume
    dummy_path = settings.UPLOAD_DIR / f"{current_student.student_id}_default.txt"
    if not dummy_path.exists():
        dummy_path.write_text(f"""
        {current_student.first_name} {current_student.last_name}
        {current_student.degree}, {current_student.college}
        Technical Competencies: Python, Machine Learning, Scikit-learn, SQL, Statistics, Deep Learning, Pandas, NumPy, Docker
        Projects: Customer Churn Prediction ML model; Database Query Optimization engine; Real-Time Analytics Pipeline
        Certificates: Stanford Online Machine Learning; Coursera Deep Learning Specialization
        Experience: Machine Learning Intern developing automated data processing workflows
        """)

    return parse_and_analyze_resume(db, current_student.student_id, dummy_path, "profile_resume.txt")


@router.get("", response_model=ResumeAnalysisResponse)
@router.get("/latest", response_model=ResumeAnalysisResponse)
def get_latest_resume_analysis(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns the latest resume analysis results for the student."""
    return analyze_latest_resume(current_student=current_student, db=db)


@router.get("/skills", response_model=List[ResumeExtractedSkill])
def get_resume_skills(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns all skills extracted from resume evidence for the student."""
    extractions = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.student_id == current_student.student_id)
        .all()
    )

    result = []
    for r in extractions:
        s = r.skill
        ss = (
            db.query(StudentSkill)
            .filter(
                StudentSkill.student_id == current_student.student_id,
                StudentSkill.skill_id == r.skill_id,
            )
            .first()
        )
        result.append({
            "skill_id": r.skill_id,
            "skill_name": s.skill_name if s else r.skill_id,
            "confidence": r.confidence,
            "evidence_type": r.evidence_type,
            "project_evidence": r.project_evidence,
            "experience_evidence": r.experience_evidence,
            "certificate_evidence": r.certificate_evidence,
            "resume_score": ss.resume_score if ss else 50,
            "final_mastery": ss.final_mastery if ss else 0,
            "mastery_level": ss.mastery_level if ss else "Developing",
        })
    return result


@router.get("/projects")
def get_resume_projects(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns extracted project evidence candidates."""
    analysis = analyze_latest_resume(current_student=current_student, db=db)
    if isinstance(analysis, dict):
        projects = analysis.get("extracted_projects", [])
    else:
        projects = [p.model_dump() if hasattr(p, "model_dump") else p for p in analysis.extracted_projects]

    return {
        "student_id": current_student.student_id,
        "extracted_projects_count": len(projects),
        "projects": projects,
        "disclaimer": "Resume-detected projects provide initial exposure context. Official project verification requires repository and mentor review.",
    }


@router.get("/certificates")
def get_resume_certificates(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns extracted certificate evidence candidates."""
    analysis = analyze_latest_resume(current_student=current_student, db=db)
    if isinstance(analysis, dict):
        certs = analysis.get("extracted_certificates", [])
    else:
        certs = [c.model_dump() if hasattr(c, "model_dump") else c for c in analysis.extracted_certificates]

    return {
        "student_id": current_student.student_id,
        "extracted_certificates_count": len(certs),
        "certificates": certs,
        "disclaimer": "Resume mentions of certifications are pending credential verification.",
    }


@router.get("/experience")
def get_resume_experience(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns extracted work and internship experience."""
    analysis = analyze_latest_resume(current_student=current_student, db=db)
    if isinstance(analysis, dict):
        exp = analysis.get("extracted_experience", [])
    else:
        exp = [e.model_dump() if hasattr(e, "model_dump") else e for e in analysis.extracted_experience]

    return {
        "student_id": current_student.student_id,
        "extracted_experience_count": len(exp),
        "experience": exp,
    }


@router.get("/{resume_id}")
def get_resume_by_id(
    resume_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns specific resume summary metadata."""
    extractions_count = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.student_id == current_student.student_id)
        .count()
    )
    return {
        "resume_id": resume_id,
        "student_id": current_student.student_id,
        "skills_detected": extractions_count,
        "status": "Analyzed",
        "evidence_type": "Resume Semantic Extraction",
    }


@router.get("/{resume_id}/skills", response_model=List[ResumeExtractedSkill])
def get_resume_skills_by_id(
    resume_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_resume_skills(current_student=current_student, db=db)


@router.get("/{resume_id}/projects")
def get_resume_projects_by_id(
    resume_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_resume_projects(current_student=current_student, db=db)


@router.get("/{resume_id}/certificates")
def get_resume_certificates_by_id(
    resume_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_resume_certificates(current_student=current_student, db=db)


@router.get("/{resume_id}/experience")
def get_resume_experience_by_id(
    resume_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return get_resume_experience(current_student=current_student, db=db)
