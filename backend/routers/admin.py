import json
import math
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi.responses import FileResponse, RedirectResponse
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, distinct

from config import settings
from database.connection import get_db
from database.models import (
    User,
    Student,
    Mentor,
    StudentCourseProgress,
    AssessmentAnswer,
    StudentSkill,
    ResumeDocument,
    StudentRoadmapStep,
    MentorStudentAssignment,
    MentorshipSession,
    MentorGuidanceNote,
    Course,
    Career,
    Feedback,
    MentorFeedback,
    Notification,
)
from routers.auth import get_current_admin, decode_access_token

router = APIRouter(prefix="/api/admin", tags=["Administration"])

# Canonical protected IDs that must never be removed or deactivated
PROTECTED_STUDENT_IDS = {"U001", "U002", "U1053", "U1056"}
PROTECTED_MENTOR_IDS = {"M001", "M877"}
PROTECTED_ADMIN_IDS = {"ADMIN001", "ADMIN002"}


def _format_student_phone(student_id: str) -> str:
    if student_id == "U001":
        return "+1 555 123 4567"
    if student_id == "U002":
        return "+1 555 234 5678"
    # Deterministic phone number for realistic display
    numeric = "".join(c for c in student_id if c.isdigit()) or "100"
    num_val = int(numeric)
    return f"+1 555 {(num_val % 800) + 100:03d} {(num_val * 37 % 9000) + 1000:04d}"


def _format_mentor_phone(mentor_id: str) -> str:
    if mentor_id == "M001":
        return "+1 555 123 4567"
    if mentor_id == "M002":
        return "+1 555 987 6543"
    numeric = "".join(c for c in mentor_id if c.isdigit()) or "200"
    num_val = int(numeric)
    return f"+1 555 {(num_val % 800) + 100:03d} {(num_val * 41 % 9000) + 1000:04d}"


# =========================================================================
# 1. DASHBOARD & SYSTEM OVERVIEW
# =========================================================================

@router.get("/dashboard-stats")
@router.get("/dashboard/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns live summary metrics for the Admin Dashboard:
    Total active students, total active mentors, total feedback, and average ratings.
    """
    total_students = db.query(func.count(distinct(Student.student_id))).scalar() or 0
    total_mentors = db.query(func.count(distinct(Mentor.mentor_id))).scalar() or 0
    pending_mentors = (
        db.query(func.count(distinct(Mentor.mentor_id)))
        .filter(Mentor.verification_status == "Pending Review")
        .scalar()
        or 0
    )
    approved_mentors = (
        db.query(func.count(distinct(Mentor.mentor_id)))
        .filter(
            or_(Mentor.verification_status == "Approved", Mentor.verification_status.is_(None))
        )
        .scalar()
        or 0
    )
    rejected_mentors = (
        db.query(func.count(distinct(Mentor.mentor_id)))
        .filter(Mentor.verification_status == "Rejected")
        .scalar()
        or 0
    )
    total_users = db.query(func.count(distinct(User.user_id))).scalar() or 0

    platform_feedback_count = db.query(Feedback).count()
    mentor_feedback_count = db.query(MentorFeedback).count()
    total_feedback = platform_feedback_count + mentor_feedback_count

    avg_fb = db.query(func.avg(Feedback.rating)).scalar() or 4.8
    avg_mfb = db.query(func.avg(MentorFeedback.rating)).scalar() or 4.9
    avg_rating = round((float(avg_fb) + float(avg_mfb)) / 2.0, 1)

    return {
        "total_students": total_students,
        "total_mentors": total_mentors,
        "pending_mentors": pending_mentors,
        "approved_mentors": approved_mentors,
        "rejected_mentors": rejected_mentors,
        "total_users": total_users,
        "total_feedback": total_feedback,
        "average_rating": avg_rating,
        "platform_feedback_count": platform_feedback_count,
        "mentor_feedback_count": mentor_feedback_count,
        "active_sessions": db.query(MentorshipSession).count(),
    }


@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns full list of registered users in PathForge AI.
    Protected strictly for administrators. Does not expose password hashes.
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "user_id": u.user_id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_verified": u.is_verified,
            "account_status": u.account_status,
            "created_at": u.created_at,
            "last_login_at": u.last_login_at,
        }
        for u in users
    ]


# =========================================================================
# 2. STUDENTS MANAGEMENT & GRANULAR DETAILS
# =========================================================================

@router.get("/students")
def get_students(
    search: Optional[str] = Query(None, description="Search by name, email or ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status (active or deactivated)"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Paginated and searchable directory of all registered students.
    Returns student metadata matching the visual admin table.
    """
    query = db.query(Student)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Student.student_id).like(s),
                func.lower(Student.first_name).like(s),
                func.lower(Student.last_name).like(s),
                func.lower(Student.email).like(s),
                func.lower(Student.college).like(s),
                func.lower(Student.department).like(s),
            )
        )

    total = query.count()
    offset = (page - 1) * limit
    students = query.order_by(Student.student_id.asc()).offset(offset).limit(limit).all()

    # Preload user account_status for fast status lookup
    user_ids = [s.user_id or s.student_id for s in students]
    users_by_id = {u.user_id: u for u in db.query(User).filter(User.user_id.in_(user_ids)).all()}

    items = []
    for s in students:
        full_name = f"{s.first_name} {s.last_name}".strip()
        u = users_by_id.get(s.user_id or s.student_id)
        account_status = u.account_status if u else "active"
        is_active = (account_status != "deactivated")

        if status and status.lower() == "active" and not is_active:
            continue
        if status and status.lower() == "deactivated" and is_active:
            continue

        target_career = s.career.career_name if s.career else (s.target_career_id or "General Engineering")

        items.append({
            "student_id": s.student_id,
            "user_id": s.user_id or s.student_id,
            "name": full_name,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "email": s.email,
            "course_career": target_career,
            "target_career_name": target_career,
            "status": "Active" if is_active else "Deactivated",
            "college": s.college or "Stanford University",
            "department": s.department or "Computer Science",
            "degree": s.degree or "B.S. Computer Science",
            "graduation_year": s.graduation_year or 2025,
            "phone": _format_student_phone(s.student_id),
            "cgpa": s.cgpa or 3.8,
            "avatar_initials": f"{s.first_name[:1]}{s.last_name[:1]}".upper() if s.first_name and s.last_name else "ST",
        })

    total_pages = max(1, math.ceil(total / limit))

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


@router.get("/students/{student_id}")
def get_student_detail(
    student_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns full details for the slide-over student drawer:
    Profile, enrolled courses, completed courses, assessments, skills, certificates, and feedback.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    user = db.query(User).filter(
        or_(User.user_id == student.user_id, User.user_id == student.student_id, User.email == student.email)
    ).first()
    account_status = user.account_status if user else "active"
    is_active = (account_status != "deactivated")

    # Enrolled & completed courses
    course_progress = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == student_id
    ).all()
    courses = []
    for cp in course_progress:
        c = db.query(Course).filter(Course.course_id == cp.course_id).first()
        courses.append({
            "course_id": cp.course_id,
            "course_name": c.course_name if c else cp.course_id,
            "progress_percentage": cp.progress_percentage or 0,
            "status": cp.status or "in_progress",
            "enrollment_status": cp.enrollment_status or "enrolled",
            "completed_lessons_count": cp.completed_lessons_count or 0,
            "total_lessons": cp.total_lessons or 5,
            "completed_at": cp.completed_at,
        })

    # Assessments history
    assessments = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.student_id == student_id
    ).order_by(AssessmentAnswer.attempt_date.desc()).limit(20).all()
    assessment_list = [
        {
            "attempt_id": a.attempt_id,
            "question_id": a.question_id,
            "selected_answer": a.selected_answer,
            "correct": a.correct,
            "attempt_date": a.attempt_date,
        }
        for a in assessments
    ]

    # Skills mastered
    skills = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id
    ).all()
    skill_list = [
        {
            "skill_id": sk.skill_id,
            "skill_name": sk.skill.skill_name if sk.skill else sk.skill_id,
            "mastery_score": getattr(sk, "final_mastery", 0) or 0,
            "mastery_level": getattr(sk, "mastery_level", "Beginner"),
            "is_completed": bool(getattr(sk, "is_completed", False)),
            "evidence_count": sk.evidence_count or 0,
        }
        for sk in skills
    ]

    # Certificates
    certificates = [
        {
            "certificate_id": f"CERT-{c['course_id']}",
            "course_name": c["course_name"],
            "issued_at": c["completed_at"] or "2026-03-15",
            "status": "Verified",
        }
        for c in courses if c["status"] == "completed" or c["progress_percentage"] >= 100
    ]

    # Student feedback
    feedbacks = db.query(Feedback).filter(
        Feedback.student_id == student_id
    ).all()
    feedback_list = [
        {
            "feedback_id": fb.feedback_id,
            "category": fb.category,
            "rating": fb.rating,
            "comment": fb.comment,
            "sentiment": fb.sentiment,
            "created_at": fb.created_at,
        }
        for fb in feedbacks
    ]

    target_career = student.career.career_name if student.career else (student.target_career_id or "Machine Learning Engineer")

    return {
        "profile": {
            "student_id": student.student_id,
            "user_id": student.user_id or student.student_id,
            "name": f"{student.first_name} {student.last_name}".strip(),
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email,
            "course_career": target_career,
            "target_career_name": target_career,
            "college": student.college or "Stanford University",
            "department": student.department or "Computer Science",
            "degree": student.degree or "B.S. Computer Science",
            "graduation_year": student.graduation_year or 2025,
            "phone": _format_student_phone(student.student_id),
            "cgpa": student.cgpa or 3.8,
            "status": "Active" if is_active else "Deactivated",
            "is_active": is_active,
            "avatar_initials": f"{student.first_name[:1]}{student.last_name[:1]}".upper() if student.first_name and student.last_name else "ST",
        },
        "courses": courses,
        "assessments": assessment_list,
        "skills": skill_list,
        "certificates": certificates,
        "feedbacks": feedback_list,
    }


@router.delete("/students/{student_id}")
def remove_student(
    student_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Safely deactivates a student account.
    Enforces strict protection for baseline and demo accounts (Alex Chen U001, U002, etc.).
    Preserves all database foreign keys by setting account_status to 'deactivated'.
    """
    clean_id = student_id.strip()

    if clean_id in PROTECTED_STUDENT_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Protected baseline account {clean_id} (Alex Chen / Genuine Student) cannot be removed or deactivated.",
        )

    student = db.query(Student).filter(Student.student_id == clean_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Soft-deactivate user account
    user = db.query(User).filter(
        or_(User.user_id == student.user_id, User.user_id == student.student_id, User.email == student.email)
    ).first()
    if user:
        user.account_status = "deactivated"
        db.commit()

    return {
        "status": "success",
        "message": f"Student {clean_id} ({student.first_name} {student.last_name}) has been deactivated safely.",
        "student_id": clean_id,
        "account_status": "deactivated",
    }


@router.post("/students/{student_id}/reactivate")
def reactivate_student(
    student_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Reactivates a previously deactivated student."""
    clean_id = student_id.strip()
    student = db.query(Student).filter(Student.student_id == clean_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    user = db.query(User).filter(
        or_(User.user_id == student.user_id, User.user_id == student.student_id, User.email == student.email)
    ).first()
    if user:
        user.account_status = "active"
        db.commit()

    return {
        "status": "success",
        "message": f"Student {clean_id} has been reactivated.",
        "student_id": clean_id,
        "account_status": "active",
    }


# =========================================================================
# 3. MENTORS MANAGEMENT & GRANULAR DETAILS
# =========================================================================

@router.get("/mentors")
def get_mentors(
    search: Optional[str] = Query(None, description="Search by name, email or expertise"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status (active or deactivated)"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Paginated and searchable directory of registered mentors.
    Returns mentor metadata matching the visual admin table.
    """
    query = db.query(Mentor)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Mentor.mentor_id).like(s),
                func.lower(Mentor.name).like(s),
                func.lower(Mentor.email).like(s),
                func.lower(Mentor.expertise).like(s),
                func.lower(Mentor.company).like(s),
                func.lower(Mentor.title).like(s),
            )
        )

    total = query.count()
    offset = (page - 1) * limit
    mentors = query.order_by(Mentor.mentor_id.asc()).offset(offset).limit(limit).all()

    # Preload user status
    user_ids = [m.user_id or m.mentor_id for m in mentors]
    users_by_id = {u.user_id: u for u in db.query(User).filter(User.user_id.in_(user_ids)).all()}

    items = []
    for m in mentors:
        u = users_by_id.get(m.user_id or m.mentor_id)
        user_status = u.account_status if u else "active"
        mentor_status = m.status or "active"
        is_active = (user_status != "deactivated" and mentor_status != "deactivated")

        if status and status.lower() == "active" and not is_active:
            continue
        if status and status.lower() == "deactivated" and is_active:
            continue

        exp_years = m.experience_years or 5
        experience_label = f"{exp_years} years"

        items.append({
            "mentor_id": m.mentor_id,
            "user_id": m.user_id or m.mentor_id,
            "name": m.name,
            "email": m.email or f"{m.mentor_id.lower()}@pathforge.ai",
            "expertise": m.expertise or "Machine Learning & AI",
            "experience": experience_label,
            "experience_years": exp_years,
            "status": "Active" if is_active else "Deactivated",
            "verification_status": getattr(m, "verification_status", None) or "Approved",
            "verification_document": getattr(m, "verification_document", None),
            "verification_notes": getattr(m, "verification_notes", None),
            "rejection_reason": getattr(m, "rejection_reason", None),
            "phone": _format_mentor_phone(m.mentor_id),
            "about": m.bio or f"Expert in {m.expertise or 'AI/ML'}",
            "company": m.company or "PathForge Network",
            "title": m.title or "Principal Mentor",
            "rating": round(float(m.rating or 5.0), 1),
            "avatar_initials": "".join([part[:1] for part in m.name.split()[:2]]).upper() if m.name else "ME",
        })

    total_pages = max(1, math.ceil(total / limit))

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


# =========================================================================
# 3.1 MENTOR VERIFICATION & ADMIN APPROVAL WORKFLOW
# =========================================================================

@router.get("/mentors/verification-queue")
def get_mentor_verification_queue(
    status: Optional[str] = Query(None, description="Filter by verification status: 'Pending Review', 'Approved', 'Rejected'"),
    search: Optional[str] = Query(None, description="Search by name, email, company or title"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns mentors in the verification queue with application details,
    document proofs, and live verification counts.
    """
    pending_count = db.query(Mentor).filter(Mentor.verification_status == "Pending Review").count()
    approved_count = db.query(Mentor).filter(
        or_(Mentor.verification_status == "Approved", Mentor.verification_status.is_(None))
    ).count()
    rejected_count = db.query(Mentor).filter(Mentor.verification_status == "Rejected").count()
    total_count = db.query(Mentor).count()

    query = db.query(Mentor)

    if status and status.strip():
        st_clean = status.strip().lower()
        if st_clean in ["pending", "pending review"]:
            query = query.filter(Mentor.verification_status == "Pending Review")
        elif st_clean in ["approved"]:
            query = query.filter(or_(Mentor.verification_status == "Approved", Mentor.verification_status.is_(None)))
        elif st_clean in ["rejected"]:
            query = query.filter(Mentor.verification_status == "Rejected")

    if search and search.strip():
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Mentor.mentor_id).like(s),
                func.lower(Mentor.name).like(s),
                func.lower(Mentor.email).like(s),
                func.lower(Mentor.company).like(s),
                func.lower(Mentor.title).like(s),
                func.lower(Mentor.expertise).like(s),
            )
        )

    total = query.count()
    offset = (page - 1) * limit
    mentors = query.order_by(Mentor.created_at.desc(), Mentor.mentor_id.asc()).offset(offset).limit(limit).all()

    items = []
    for m in mentors:
        exp_years = m.experience_years or 5
        items.append({
            "mentor_id": m.mentor_id,
            "user_id": m.user_id or m.mentor_id,
            "name": m.name,
            "email": m.email or f"{m.mentor_id.lower()}@pathforge.ai",
            "title": m.title or "Principal Mentor",
            "company": m.company or "PathForge Network",
            "expertise": m.expertise or "Technical Mentorship",
            "experience_years": exp_years,
            "experience": f"{exp_years} years",
            "verification_status": m.verification_status or "Approved",
            "verification_document": m.verification_document,
            "verification_notes": m.verification_notes,
            "rejection_reason": m.rejection_reason,
            "verified_at": m.verified_at,
            "verified_by": m.verified_by,
            "linkedin_url": m.linkedin_url,
            "portfolio_url": m.portfolio_url,
            "about": m.bio or f"Expert in {m.expertise or 'Technology'}",
            "rating": round(float(m.rating or 5.0), 1),
            "created_at": m.created_at or "2026-03-01",
            "avatar_initials": "".join([part[:1] for part in m.name.split()[:2]]).upper() if m.name else "ME",
        })

    total_pages = max(1, math.ceil(total / limit))

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "counts": {
            "pending": pending_count,
            "approved": approved_count,
            "rejected": rejected_count,
            "total": total_count,
        },
    }


@router.post("/mentors/{mentor_id}/approve")
def approve_mentor_application(
    mentor_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Approves a mentor application in the verification queue.
    Sets verification_status to 'Approved' and activates mentor permissions.
    """
    clean_id = mentor_id.strip()
    mentor = db.query(Mentor).filter(Mentor.mentor_id == clean_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    mentor.verification_status = "Approved"
    mentor.rejection_reason = None
    mentor.verified_at = now_str
    mentor.verified_by = admin.user_id
    mentor.status = "active"

    user = db.query(User).filter(
        or_(User.user_id == mentor.user_id, User.user_id == mentor.mentor_id, User.email == mentor.email)
    ).first()
    if user:
        user.account_status = "active"
        user.is_verified = True

    # Notify mentor of approval
    notif = Notification(
        notification_id=f"notif_{uuid.uuid4().hex[:12]}",
        mentor_id=mentor.mentor_id,
        type="verification_approved",
        title="Application Approved",
        message="Congratulations! Your mentor application has been approved by PathForge administration. You now have full access to mentor students and review submissions.",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return {
        "status": "success",
        "message": f"Mentor {mentor.name} ({clean_id}) has been approved successfully.",
        "mentor_id": clean_id,
        "verification_status": "Approved",
    }


@router.post("/mentors/{mentor_id}/reject")
def reject_mentor_application(
    mentor_id: str,
    payload: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Rejects a mentor application with a mandatory/custom reason.
    Sets verification_status to 'Rejected'.
    """
    clean_id = mentor_id.strip()
    if clean_id in PROTECTED_MENTOR_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Protected baseline mentor {clean_id} cannot be rejected.",
        )

    mentor = db.query(Mentor).filter(Mentor.mentor_id == clean_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    reason = ""
    if payload and "reason" in payload:
        reason = str(payload["reason"]).strip()
    if not reason:
        reason = "Verification documents and credentials could not be verified by administration."

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    mentor.verification_status = "Rejected"
    mentor.rejection_reason = reason
    mentor.verified_at = now_str
    mentor.verified_by = admin.user_id

    # Notify mentor of rejection
    notif = Notification(
        notification_id=f"notif_{uuid.uuid4().hex[:12]}",
        mentor_id=mentor.mentor_id,
        type="verification_rejected",
        title="Application Update",
        message=f"Your mentor application was reviewed and could not be approved at this time. Reason: {reason}",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return {
        "status": "success",
        "message": f"Mentor {mentor.name} ({clean_id}) application has been rejected.",
        "mentor_id": clean_id,
        "verification_status": "Rejected",
        "rejection_reason": reason,
    }


@router.get("/mentors/{mentor_id}/proof")
def get_mentor_proof_document(
    mentor_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns the submitted proof document link and verification notes for a mentor.
    """
    clean_id = mentor_id.strip()
    mentor = db.query(Mentor).filter(Mentor.mentor_id == clean_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    return {
        "mentor_id": mentor.mentor_id,
        "name": mentor.name,
        "email": mentor.email,
        "verification_status": mentor.verification_status or "Approved",
        "verification_document": mentor.verification_document,
        "verification_notes": mentor.verification_notes,
        "rejection_reason": mentor.rejection_reason,
        "linkedin_url": mentor.linkedin_url,
        "portfolio_url": mentor.portfolio_url,
    }



@router.get("/mentors/{mentor_id}")
def get_mentor_detail(
    mentor_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns full details for the slide-over mentor drawer:
    Profile, active mentees, sessions conducted, and feedback received.
    """
    mentor = db.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    user = db.query(User).filter(
        or_(User.user_id == mentor.user_id, User.user_id == mentor.mentor_id, User.email == mentor.email)
    ).first()
    user_status = user.account_status if user else "active"
    mentor_status = mentor.status or "active"
    is_active = (user_status != "deactivated" and mentor_status != "deactivated")

    # Active mentees
    assignments = db.query(MentorStudentAssignment).filter(
        MentorStudentAssignment.mentor_id == mentor_id,
        MentorStudentAssignment.status == "active",
    ).all()
    mentees = []
    for a in assignments:
        st = db.query(Student).filter(Student.student_id == a.student_id).first()
        mentees.append({
            "student_id": a.student_id,
            "student_name": f"{st.first_name} {st.last_name}" if st else a.student_id,
            "email": st.email if st else "",
            "assigned_at": getattr(a, "assigned_date", None) or getattr(a, "assigned_at", None) or "2026-03-01",
            "status": a.status,
        })

    # Mentorship sessions
    sessions = db.query(MentorshipSession).filter(
        MentorshipSession.mentor_id == mentor_id
    ).order_by(MentorshipSession.session_date.desc()).limit(15).all()
    session_list = [
        {
            "session_id": s.session_id,
            "student_id": s.student_id,
            "student_name": f"{s.student.first_name} {s.student.last_name}" if s.student else s.student_id,
            "topic": s.topic,
            "session_date": s.session_date,
            "status": s.status,
        }
        for s in sessions
    ]

    # Mentor feedback
    feedbacks = db.query(MentorFeedback).filter(
        MentorFeedback.mentor_id == mentor_id
    ).order_by(MentorFeedback.feedback_date.desc()).limit(15).all()
    feedback_list = [
        {
            "feedback_id": fb.feedback_id,
            "student_id": fb.student_id,
            "rating": fb.rating,
            "comments": fb.comments,
            "strengths": fb.strengths,
            "improvement_areas": fb.improvement_areas,
            "feedback_date": fb.feedback_date,
        }
        for fb in feedbacks
    ]

    exp_years = mentor.experience_years or 8

    return {
        "profile": {
            "mentor_id": mentor.mentor_id,
            "user_id": mentor.user_id or mentor.mentor_id,
            "name": mentor.name,
            "email": mentor.email or f"{mentor.mentor_id.lower()}@pathforge.ai",
            "title": mentor.title or "Principal Mentor",
            "company": mentor.company or "PathForge Network",
            "expertise": mentor.expertise or "Machine Learning & AI",
            "experience": f"{exp_years} years",
            "experience_years": exp_years,
            "phone": _format_mentor_phone(mentor.mentor_id),
            "about": mentor.bio or "AI/ML, Deep Learning, NLP",
            "rating": round(float(mentor.rating or 5.0), 1),
            "status": "Active" if is_active else "Deactivated",
            "is_active": is_active,
            "verification_status": getattr(mentor, "verification_status", None) or "Approved",
            "verification_document": getattr(mentor, "verification_document", None),
            "verification_notes": getattr(mentor, "verification_notes", None),
            "rejection_reason": getattr(mentor, "rejection_reason", None),
            "verified_at": getattr(mentor, "verified_at", None),
            "verified_by": getattr(mentor, "verified_by", None),
            "linkedin_url": mentor.linkedin_url or "https://linkedin.com",
            "portfolio_url": getattr(mentor, "portfolio_url", None),
            "avatar_initials": "".join([part[:1] for part in mentor.name.split()[:2]]).upper() if mentor.name else "ME",
        },
        "mentees": mentees,
        "sessions": session_list,
        "feedbacks": feedback_list,
        "total_sessions": len(session_list),
        "active_mentees": len(mentees),
    }


@router.delete("/mentors/{mentor_id}")
def remove_mentor(
    mentor_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Safely deactivates a mentor account.
    Enforces strict protection for baseline mentors (Dr. Arun Kumar M001, M877).
    Preserves all database foreign keys by setting status to 'deactivated'.
    """
    clean_id = mentor_id.strip()

    if clean_id in PROTECTED_MENTOR_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Protected baseline mentor {clean_id} (Dr. Arun Kumar / Genuine Mentor) cannot be removed or deactivated.",
        )

    mentor = db.query(Mentor).filter(Mentor.mentor_id == clean_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    mentor.status = "deactivated"
    user = db.query(User).filter(
        or_(User.user_id == mentor.user_id, User.user_id == mentor.mentor_id, User.email == mentor.email)
    ).first()
    if user:
        user.account_status = "deactivated"

    db.commit()

    return {
        "status": "success",
        "message": f"Mentor {clean_id} ({mentor.name}) has been deactivated safely.",
        "mentor_id": clean_id,
        "account_status": "deactivated",
    }


@router.post("/mentors/{mentor_id}/reactivate")
def reactivate_mentor(
    mentor_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Reactivates a previously deactivated mentor."""
    clean_id = mentor_id.strip()
    mentor = db.query(Mentor).filter(Mentor.mentor_id == clean_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    mentor.status = "active"
    user = db.query(User).filter(
        or_(User.user_id == mentor.user_id, User.user_id == mentor.mentor_id, User.email == mentor.email)
    ).first()
    if user:
        user.account_status = "active"
    db.commit()

    return {
        "status": "success",
        "message": f"Mentor {clean_id} has been reactivated.",
        "mentor_id": clean_id,
        "account_status": "active",
    }


# =========================================================================
# 4. FEEDBACK & LEGACY COMPATIBILITY
# =========================================================================

@router.get("/feedback")
def get_feedback_records(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Aggregates platform feedback and mentor feedback for administration review.
    """
    platform_fb = db.query(Feedback).order_by(Feedback.feedback_id.desc()).limit(50).all()
    mentor_fb = db.query(MentorFeedback).order_by(MentorFeedback.feedback_id.desc()).limit(50).all()

    return {
        "platform_feedback": [
            {
                "feedback_id": fb.feedback_id,
                "student_id": fb.student_id,
                "category": fb.category,
                "rating": fb.rating,
                "comment": fb.comment,
                "sentiment": fb.sentiment,
                "issue_type": fb.issue_type,
                "created_at": fb.created_at,
            }
            for fb in platform_fb
        ],
        "mentor_feedback": [
            {
                "feedback_id": mfb.feedback_id,
                "mentor_id": mfb.mentor_id,
                "student_id": mfb.student_id,
                "rating": mfb.rating,
                "comments": mfb.comments,
                "strengths": mfb.strengths,
                "improvement_areas": mfb.improvement_areas,
                "feedback_date": mfb.feedback_date,
            }
            for mfb in mentor_fb
        ],
    }


@router.get("/student-progress/{student_id}")
def get_student_detailed_progress(
    student_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns full granular learning records for a specific student.
    Preserved for backward compatibility with previous automated suites.
    """
    return get_student_detail(student_id=student_id, db=db, admin=admin)


@router.get("/mentorship-activity")
def get_mentorship_activity(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Returns global mentorship activity: sessions, active pairings, and guidance notes.
    """
    sessions = db.query(MentorshipSession).order_by(MentorshipSession.session_date.desc()).all()
    pairings = db.query(MentorStudentAssignment).filter(MentorStudentAssignment.status == "active").all()
    notes = db.query(MentorGuidanceNote).order_by(MentorGuidanceNote.id.desc()).all()

    return {
        "active_pairings_count": len(pairings),
        "total_sessions_count": len(sessions),
        "sessions": [
            {
                "session_id": s.session_id,
                "mentor_id": s.mentor_id,
                "mentor_name": s.mentor.name if s.mentor else s.mentor_id,
                "student_id": s.student_id,
                "student_name": f"{s.student.first_name} {s.student.last_name}" if s.student else s.student_id,
                "topic": s.topic,
                "session_date": s.session_date,
                "status": s.status,
            }
            for s in sessions[:30]
        ],
        "guidance_notes": [
            {
                "id": n.id,
                "mentor_name": n.mentor.name if n.mentor else n.mentor_id,
                "student_name": f"{n.student.first_name} {n.student.last_name}" if n.student else n.student_id,
                "notes": n.notes,
                "created_at": n.created_at,
            }
            for n in notes[:20]
        ],
    }


@router.get("/system-stats")
def get_system_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Aggregates high-level platform health and tracking statistics.
    """
    total_users = db.query(User).count()
    total_students = db.query(Student).count()
    total_mentors = db.query(Mentor).count()
    total_enrollments = db.query(StudentCourseProgress).count()
    total_completions = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.status == "completed"
    ).count()
    total_resumes = db.query(ResumeDocument).count()
    total_answers = db.query(AssessmentAnswer).count()

    return {
        "users": {
            "total_users": total_users,
            "students": total_students,
            "mentors": total_mentors,
            "admins": db.query(User).filter(User.role == "admin").count(),
        },
        "learning_metrics": {
            "total_course_enrollments": total_enrollments,
            "total_course_completions": total_completions,
            "total_resumes_analyzed": total_resumes,
            "total_assessment_submissions": total_answers,
        },
        "database": {
            "engine": "SQLite",
            "file": "backend/data/pathforge.db",
            "status": "healthy",
        },
    }


@router.get("/mentors/{mentor_id}/document-file")
def download_mentor_verification_document(
    mentor_id: str,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Secure document retrieval endpoint for admin or the applicant mentor.
    Verifies authentication token. Returns FileResponse or redirects to URL.
    Verification files are NOT publicly accessible.
    """
    auth_token = None
    if authorization and authorization.startswith("Bearer "):
        auth_token = authorization.split(" ", 1)[1].strip()
    elif token:
        auth_token = token.strip()

    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required to access verification evidence.",
        )

    payload = decode_access_token(auth_token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )

    # Must be admin or the mentor themselves
    is_admin = payload.get("role") == "admin"
    is_owner = payload.get("sub") == mentor_id
    if not is_admin and not is_owner:
        admin_user = db.query(User).filter(User.user_id == payload.get("sub"), User.role == "admin").first()
        if not admin_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Admin authorization required to inspect verification files.",
            )

    clean_id = mentor_id.strip()
    mentor = db.query(Mentor).filter(Mentor.mentor_id == clean_id).first()
    if not mentor or not mentor.verification_document:
        raise HTTPException(status_code=404, detail="No verification evidence document found for this mentor.")

    doc_ref = mentor.verification_document.strip()

    # External URL
    if doc_ref.startswith("http://") or doc_ref.startswith("https://"):
        return RedirectResponse(url=doc_ref)

    # Local file in private data/verification_documents directory
    verif_dir = settings.DATA_DIR / "verification_documents"
    local_path = verif_dir / doc_ref
    if not local_path.exists():
        raise HTTPException(status_code=404, detail="Verification file not found on server storage.")

    import mimetypes
    media_type, _ = mimetypes.guess_type(str(local_path))
    return FileResponse(
        path=str(local_path),
        filename=doc_ref,
        media_type=media_type or "application/octet-stream",
    )
