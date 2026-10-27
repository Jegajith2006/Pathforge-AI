import json
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from config import settings
from database.connection import get_db
from database.models import (
    Student,
    ResumeAnalysis,
    Skill,
    StudentSkill,
    ResumeDocument,
    CourseResumeSuggestion,
    StudentResumeProfileEntry,
    LearningActivity,
)
from schemas.resume import (
    ResumeUploadResponse,
    ResumeAnalysisResponse,
    ResumeExtractedSkill,
    ResumeExtractedProject,
    ResumeExtractedCertificate,
    ResumeExtractedExperience,
    ResumeHistoryItem,
    ResumeSuggestionItem,
    ResumeProfileEntryItem,
)
from schemas.common import MessageResponse
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
    normalizes skills, saves upload history, and updates exposure evidence in student_skills.
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

    resume_id = f"RES-{uuid.uuid4().hex[:8].upper()}"
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

    try:
        analysis_data = parse_and_analyze_resume(
            db=db,
            student_id=current_student.student_id,
            file_path=destination,
            original_filename=file.filename,
            resume_id=resume_id,
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


@router.get("/history", response_model=List[ResumeHistoryItem])
def get_resume_history(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns the persistent history of all uploaded resumes for the authenticated student.
    Strictly isolated to current student.
    """
    docs = (
        db.query(ResumeDocument)
        .filter(ResumeDocument.student_id == current_student.student_id)
        .order_by(ResumeDocument.upload_timestamp.desc())
        .all()
    )

    history = []
    for d in docs:
        skills = json.loads(d.extracted_skills_json) if d.extracted_skills_json else []
        projects = json.loads(d.extracted_projects_json) if d.extracted_projects_json else []
        certs = json.loads(d.extracted_certificates_json) if d.extracted_certificates_json else []

        history.append(
            ResumeHistoryItem(
                resume_id=d.resume_id,
                student_id=d.student_id,
                original_filename=d.original_filename,
                upload_timestamp=d.upload_timestamp,
                file_size_bytes=d.file_size_bytes,
                analysis_status=d.analysis_status,
                analysis_version=d.analysis_version,
                is_active=bool(d.is_active),
                total_skills_detected=len(skills),
                total_projects_detected=len(projects),
                total_certificates_detected=len(certs),
                analysis_summary=d.analysis_summary,
                error_message=d.error_message,
            )
        )
    return history


@router.get("/suggestions", response_model=List[ResumeSuggestionItem])
def get_resume_suggestions(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns pending resume improvement suggestions generated from course completions.
    """
    suggestions = (
        db.query(CourseResumeSuggestion)
        .filter(
            CourseResumeSuggestion.student_id == current_student.student_id,
            CourseResumeSuggestion.status == "pending",
        )
        .order_by(CourseResumeSuggestion.created_at.desc())
        .all()
    )
    return [
        ResumeSuggestionItem(
            suggestion_id=s.suggestion_id,
            student_id=s.student_id,
            course_id=s.course_id,
            skill_id=s.skill_id,
            course_name=s.course_name,
            skill_name=s.skill_name,
            suggestion_type=s.suggestion_type,
            title=s.title,
            description=s.description,
            suggested_content=s.suggested_content,
            status=s.status,
            created_at=s.created_at,
            resolved_at=s.resolved_at,
        )
        for s in suggestions
    ]


@router.post("/suggestions/{suggestion_id}/approve", response_model=MessageResponse)
def approve_resume_suggestion(
    suggestion_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Student reviews and accepts a course completion suggestion.
    Adds the coursework/skill entry to their verified resume profile without altering original upload.
    """
    sug = (
        db.query(CourseResumeSuggestion)
        .filter(
            CourseResumeSuggestion.suggestion_id == suggestion_id,
            CourseResumeSuggestion.student_id == current_student.student_id,
        )
        .first()
    )
    if not sug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume suggestion '{suggestion_id}' not found.",
        )

    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    sug.status = "approved"
    sug.resolved_at = now_iso

    entry = StudentResumeProfileEntry(
        entry_id=f"RPE-{uuid.uuid4().hex[:8].upper()}",
        student_id=current_student.student_id,
        entry_type=sug.suggestion_type,
        title=sug.title,
        detail=sug.suggested_content,
        source_course_id=sug.course_id,
        added_at=now_iso,
    )
    db.add(entry)

    # Record learning activity
    act = LearningActivity(
        activity_id=f"ACT_{uuid.uuid4().hex[:8]}",
        student_id=current_student.student_id,
        activity_date=datetime.utcnow().strftime("%Y-%m-%d"),
        activity_type="Resume Profile Update",
        activity_name=f"Approved course completion '{sug.course_name}' for Resume Profile",
        duration_minutes=10,
        activity_count=1,
    )
    db.add(act)

    db.commit()
    return MessageResponse(
        message=f"Course '{sug.course_name}' verified coursework added to your Resume Profile."
    )


@router.post("/suggestions/{suggestion_id}/dismiss", response_model=MessageResponse)
def dismiss_resume_suggestion(
    suggestion_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Student dismisses a course completion resume suggestion."""
    sug = (
        db.query(CourseResumeSuggestion)
        .filter(
            CourseResumeSuggestion.suggestion_id == suggestion_id,
            CourseResumeSuggestion.student_id == current_student.student_id,
        )
        .first()
    )
    if not sug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume suggestion '{suggestion_id}' not found.",
        )

    sug.status = "dismissed"
    sug.resolved_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    return MessageResponse(message="Suggestion dismissed.")


@router.get("/profile-entries", response_model=List[ResumeProfileEntryItem])
def get_resume_profile_entries(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Returns approved course completion additions in student's resume profile."""
    entries = (
        db.query(StudentResumeProfileEntry)
        .filter(StudentResumeProfileEntry.student_id == current_student.student_id)
        .order_by(StudentResumeProfileEntry.added_at.desc())
        .all()
    )
    return [
        ResumeProfileEntryItem(
            entry_id=e.entry_id,
            student_id=e.student_id,
            entry_type=e.entry_type,
            title=e.title,
            detail=e.detail,
            source_course_id=e.source_course_id,
            added_at=e.added_at,
        )
        for e in entries
    ]


@router.post("/analyze", response_model=ResumeAnalysisResponse)
def analyze_latest_resume(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Re-runs analysis on the active/latest uploaded resume.
    """
    active_doc = (
        db.query(ResumeDocument)
        .filter(
            ResumeDocument.student_id == current_student.student_id,
            ResumeDocument.is_active == True,
        )
        .first()
    )
    if active_doc and Path(active_doc.file_path).exists():
        return parse_and_analyze_resume(
            db=db,
            student_id=current_student.student_id,
            file_path=Path(active_doc.file_path),
            original_filename=active_doc.original_filename,
            resume_id=active_doc.resume_id,
        )

    student_files = list(settings.UPLOAD_DIR.glob(f"{current_student.student_id}_*"))
    if student_files:
        latest_file = max(student_files, key=lambda f: f.stat().st_mtime)
        return parse_and_analyze_resume(db, current_student.student_id, latest_file, latest_file.name)

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
    """Returns the latest active resume analysis results for the student."""
    active_doc = (
        db.query(ResumeDocument)
        .filter(
            ResumeDocument.student_id == current_student.student_id,
            ResumeDocument.is_active == True,
        )
        .order_by(ResumeDocument.upload_timestamp.desc())
        .first()
    )
    if not active_doc:
        active_doc = (
            db.query(ResumeDocument)
            .filter(ResumeDocument.student_id == current_student.student_id)
            .order_by(ResumeDocument.upload_timestamp.desc())
            .first()
        )

    if active_doc:
        detected_skills = json.loads(active_doc.extracted_skills_json) if active_doc.extracted_skills_json else []
        extracted_projects = json.loads(active_doc.extracted_projects_json) if active_doc.extracted_projects_json else []
        extracted_certificates = json.loads(active_doc.extracted_certificates_json) if active_doc.extracted_certificates_json else []
        extracted_experience = json.loads(active_doc.extracted_experience_json) if active_doc.extracted_experience_json else []
        extracted_education = json.loads(active_doc.extracted_education_json) if active_doc.extracted_education_json else []

        return {
            "student_id": current_student.student_id,
            "resume_id": active_doc.resume_id,
            "upload_timestamp": active_doc.upload_timestamp,
            "filename": active_doc.original_filename,
            "total_skills_detected": len(detected_skills),
            "total_projects_detected": len(extracted_projects),
            "total_certificates_detected": len(extracted_certificates),
            "total_experience_detected": len(extracted_experience),
            "detected_skills": detected_skills,
            "unmatched_skills": [],
            "extracted_projects": extracted_projects,
            "extracted_certificates": extracted_certificates,
            "extracted_experience": extracted_experience,
            "extracted_education": extracted_education,
            "analysis_summary": active_doc.analysis_summary or "Active resume analysis.",
            "disclaimer": "Resume evidence indicates demonstrated exposure, not verified mastery. Mastery requires assessment and project proof.",
        }

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
    analysis = get_latest_resume_analysis(current_student=current_student, db=db)
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
    analysis = get_latest_resume_analysis(current_student=current_student, db=db)
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
    analysis = get_latest_resume_analysis(current_student=current_student, db=db)
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
    """
    Returns specific resume metadata and extracted entities.
    Enforces authorization: student can only view their own resume.
    """
    doc = (
        db.query(ResumeDocument)
        .filter(
            ResumeDocument.resume_id == resume_id,
            ResumeDocument.student_id == current_student.student_id,
        )
        .first()
    )

    if not doc:
        # Fallback check if resume_id exists in ResumeAnalysis
        analysis_exists = (
            db.query(ResumeAnalysis)
            .filter(
                ResumeAnalysis.resume_id == resume_id,
                ResumeAnalysis.student_id == current_student.student_id,
            )
            .first()
        )
        if not analysis_exists:
            # Check if this resume belongs to another student to raise 403 vs 404
            other_doc = db.query(ResumeDocument).filter(ResumeDocument.resume_id == resume_id).first()
            if other_doc and other_doc.student_id != current_student.student_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You do not own this resume record.",
                )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resume '{resume_id}' not found.",
            )

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

    skills = json.loads(doc.extracted_skills_json) if doc.extracted_skills_json else []
    projects = json.loads(doc.extracted_projects_json) if doc.extracted_projects_json else []
    certs = json.loads(doc.extracted_certificates_json) if doc.extracted_certificates_json else []
    experience = json.loads(doc.extracted_experience_json) if doc.extracted_experience_json else []
    education = json.loads(doc.extracted_education_json) if doc.extracted_education_json else []

    return {
        "resume_id": doc.resume_id,
        "student_id": doc.student_id,
        "filename": doc.original_filename,
        "upload_timestamp": doc.upload_timestamp,
        "file_size_bytes": doc.file_size_bytes,
        "analysis_status": doc.analysis_status,
        "is_active": doc.is_active,
        "total_skills_detected": len(skills),
        "total_projects_detected": len(projects),
        "total_certificates_detected": len(certs),
        "total_experience_detected": len(experience),
        "detected_skills": skills,
        "extracted_projects": projects,
        "extracted_certificates": certs,
        "extracted_experience": experience,
        "extracted_education": education,
        "analysis_summary": doc.analysis_summary,
    }


@router.get("/{resume_id}/download")
def download_resume(
    resume_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Secure file download endpoint.
    Strictly verifies student ownership before returning the file.
    """
    doc = db.query(ResumeDocument).filter(ResumeDocument.resume_id == resume_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume '{resume_id}' not found.",
        )

    if doc.student_id != current_student.student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot download another student's resume.",
        )

    fpath = Path(doc.file_path)
    if not fpath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored resume file not found on disk.",
        )

    return FileResponse(
        path=str(fpath),
        filename=doc.original_filename,
        media_type="application/octet-stream",
    )


@router.delete("/{resume_id}", response_model=MessageResponse)
def delete_resume(
    resume_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Deletes an uploaded resume record and physical file for the student.
    Does NOT delete the student's independent assessments, courses, or verified skills.
    """
    doc = db.query(ResumeDocument).filter(ResumeDocument.resume_id == resume_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume '{resume_id}' not found.",
        )

    if doc.student_id != current_student.student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot delete another student's resume.",
        )

    was_active = doc.is_active
    fpath = Path(doc.file_path)
    if fpath.exists():
        try:
            fpath.unlink()
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    if was_active:
        remaining = (
            db.query(ResumeDocument)
            .filter(ResumeDocument.student_id == current_student.student_id)
            .order_by(ResumeDocument.upload_timestamp.desc())
            .first()
        )
        if remaining:
            remaining.is_active = True
            db.commit()

    return MessageResponse(message=f"Resume '{resume_id}' deleted successfully.")


@router.post("/{resume_id}/reanalyze", response_model=ResumeAnalysisResponse)
def reanalyze_resume(
    resume_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Re-runs analysis on a specific uploaded resume.
    """
    doc = db.query(ResumeDocument).filter(ResumeDocument.resume_id == resume_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume '{resume_id}' not found.",
        )

    if doc.student_id != current_student.student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot re-analyze another student's resume.",
        )

    fpath = Path(doc.file_path)
    if not fpath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored resume file not found on disk for re-analysis.",
        )

    return parse_and_analyze_resume(
        db=db,
        student_id=current_student.student_id,
        file_path=fpath,
        original_filename=doc.original_filename,
        resume_id=doc.resume_id,
    )


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
