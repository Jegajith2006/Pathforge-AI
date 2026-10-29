import uuid
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

logger = logging.getLogger("pathforge.mentor")

from database.connection import get_db
from database.models import (
    Mentor,
    MentorFeedback,
    Student,
    Project,
    Skill,
    Career,
    CareerSkill,
    MentorStudentAssignment,
    MentorshipRequest,
    MentorshipSession,
    MentorMessage,
    MentorResource,
    MentorGuidanceNote,
    MentorAssessment,
    MentorAssessmentSubmission,
    StudentSkill,
    StudentCourseProgress,
    StudentProjectProgress,
    StudentRoadmapStep,
    AssessmentAnswer,
    AssessmentQuestion,
    LearningActivity,
    Notification,
    MentorSkill,
    MentorAvailabilitySetting,
)
from schemas.common import MessageResponse
from schemas.mentor import (
    MentorProfileResponse,
    MentorProfileUpdateRequest,
    MentorshipSessionCreate,
    MentorshipSessionRescheduleRequest,
    MentorshipSessionStatusUpdate,
    ProjectReviewCreate,
    ProjectReviewUpdateRequest,
    MentorMessageCreate,
    StudentMessageCreate,
    MessageItemResponse,
    StudentConversationResponse,
    UnreadCountResponse,
    MentorResourceCreate,
    MentorGuidanceNoteCreate,
    StudentAssignmentRequest,
    MentorNotificationResponse,
    MentorshipRequestCreate,
    MentorshipRequestAction,
    MentorshipRequestResponse,
    MentorshipRequestMutationResponse,
    StudentSessionResponse,
    StudentAssignedMentorResponse,
    MentorProgressFeedbackRequest,
    StudentSessionCreateRequest,
    SessionCancellationRequest,
    MentorAssessmentCreate,
    MentorAssessmentResponse,
    AssessmentSubmissionCreate,
    AssessmentEvaluationRequest,
    MentorAssessmentSubmissionResponse,
    MentorSkillCreate,
    MentorSkillUpdate,
    MentorSkillResponse,
    MentorAvailabilityUpdateRequest,
    MentorAvailabilityResponse,
    StudentCareerGuidanceItem,
)
from routers.auth import get_current_mentor, get_current_student
from services.skill_gap_service import (
    update_or_create_student_skill,
    calculate_final_mastery,
    analyze_student_skill_gap,
)

router = APIRouter(tags=["Mentor Operations"])



def validate_url_field(field_name: str, url_val: Optional[str]) -> Optional[str]:
    if not url_val:
        return None
    val = url_val.strip()
    if not val:
        return None
    if not (val.startswith("http://") or val.startswith("https://") or val.startswith("/uploads/")):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid URL format for '{field_name}'. Must start with http://, https://, or /uploads/."
        )
    return val

def parse_time_minutes(t_str: str) -> Optional[int]:
    """
    Parses 'HH:MM', 'H:MM', 'HH:MM AM/PM', 'H:MM AM/PM' into minutes from midnight (0..1439).
    """
    if not t_str:
        return None
    cleaned = str(t_str).strip()
    if "-" in cleaned:
        cleaned = cleaned.split("-")[0].strip()
    for fmt in ("%H:%M", "%I:%M %p", "%I:%M%p", "%H:%M:%S", "%I %p"):
        try:
            t = datetime.strptime(cleaned, fmt).time()
            return t.hour * 60 + t.minute
        except ValueError:
            pass
    # Try digits extraction
    try:
        parts = cleaned.split(":")
        if len(parts) >= 2:
            h = int(parts[0])
            m = int(parts[1][:2])
            if "pm" in cleaned.lower() and h < 12:
                h += 12
            elif "am" in cleaned.lower() and h == 12:
                h = 0
            return h * 60 + m
    except Exception as time_err:
        logger.debug(f"Could not parse time string '{t_str}': {time_err}")
    return None


def calculate_duration_minutes(start_str: str, end_str: str) -> int:
    s = parse_time_minutes(start_str)
    e = parse_time_minutes(end_str)
    if s is not None and e is not None and e > s:
        return e - s
    return 60


def check_session_conflict(
    db: Session,
    session_date: str,
    start_time: str,
    end_time: str,
    mentor_id: Optional[str] = None,
    student_id: Optional[str] = None,
    exclude_session_id: Optional[str] = None,
) -> Optional[str]:
    """
    Checks if mentor or student already has a conflicting upcoming/rescheduled session.
    Uses interval overlap: max(startA, startB) < min(endA, endB).
    Returns error message if conflict found, else None.
    """
    s_new = parse_time_minutes(start_time)
    e_new = parse_time_minutes(end_time) or ((s_new + 60) if s_new is not None else None)

    # 1. Mentor conflict check
    if mentor_id:
        mentor_sessions = (
            db.query(MentorshipSession)
            .filter(
                MentorshipSession.mentor_id == mentor_id,
                MentorshipSession.session_date == session_date,
                MentorshipSession.status.in_(["upcoming", "rescheduled"]),
            )
            .all()
        )
        for ex in mentor_sessions:
            if exclude_session_id and ex.session_id == exclude_session_id:
                continue
            ex_s = parse_time_minutes(ex.start_time)
            ex_e = parse_time_minutes(ex.end_time) or ((ex_s + 60) if ex_s is not None else None)
            if s_new is not None and e_new is not None and ex_s is not None and ex_e is not None:
                if max(s_new, ex_s) < min(e_new, ex_e):
                    return f"Schedule conflict: Mentor already has a session '{ex.topic}' already scheduled from {ex.start_time} to {ex.end_time} on this date."
            elif ex.start_time == start_time:
                return f"Schedule conflict: Mentor already has a session already scheduled for {start_time} on this date."

    # 2. Student conflict check
    if student_id:
        student_sessions = (
            db.query(MentorshipSession)
            .filter(
                MentorshipSession.student_id == student_id,
                MentorshipSession.session_date == session_date,
                MentorshipSession.status.in_(["upcoming", "rescheduled"]),
            )
            .all()
        )
        for ex in student_sessions:
            if exclude_session_id and ex.session_id == exclude_session_id:
                continue
            ex_s = parse_time_minutes(ex.start_time)
            ex_e = parse_time_minutes(ex.end_time) or ((ex_s + 60) if ex_s is not None else None)
            if s_new is not None and e_new is not None and ex_s is not None and ex_e is not None:
                if max(s_new, ex_s) < min(e_new, ex_e):
                    return f"Schedule conflict: Student already has a session '{ex.topic}' already scheduled from {ex.start_time} to {ex.end_time} on this date."
            elif ex.start_time == start_time:
                return f"Schedule conflict: Student already has a session already scheduled for {start_time} on this date."

    return None


# =========================================================================
# PUBLIC & STUDENT ENDPOINTS (MENTOR DISCOVERY & FEEDBACK)
# =========================================================================

@router.get("/api/mentors")
def get_all_mentors(
    search: Optional[str] = Query(None, description="Search term for name, title, company, skills, or expertise"),
    query: Optional[str] = Query(None, description="Alias for search"),
    skill: Optional[str] = Query(None, description="Filter mentors by skill"),
    specialization: Optional[str] = Query(None, description="Filter mentors by career specialization or expertise"),
    expertise: Optional[str] = Query(None, description="Alias for specialization"),
    min_experience: Optional[int] = Query(None, description="Minimum years of experience"),
    availability: Optional[str] = Query(None, description="Availability status (e.g. Available, Busy, Away)"),
    db: Session = Depends(get_db),
):
    """
    Returns authentic mentor profiles from the database with flexible multi-field search and filtering.
    """
    q = db.query(Mentor)

    # 1. Name / Keyword search
    term = (query or search or "").strip().lower()
    if term:
        q = q.filter(
            func.lower(Mentor.name).contains(term)
            | func.lower(Mentor.title).contains(term)
            | func.lower(Mentor.company).contains(term)
            | func.lower(Mentor.expertise).contains(term)
            | func.lower(Mentor.skills).contains(term)
            | func.lower(Mentor.bio).contains(term)
            | func.lower(func.coalesce(Mentor.headline, "")).contains(term)
            | func.lower(func.coalesce(Mentor.career_specializations, "")).contains(term)
        )

    # 2. Skill filtering
    if skill and skill.strip():
        s_term = skill.strip().lower()
        q = q.filter(
            func.lower(Mentor.skills).contains(s_term)
            | Mentor.expertise_skills.any(func.lower(MentorSkill.skill_name).contains(s_term))
        )

    # 3. Specialization / Expertise filtering
    spec_term = (specialization or expertise or "").strip().lower()
    if spec_term:
        q = q.filter(
            func.lower(Mentor.expertise).contains(spec_term)
            | func.lower(func.coalesce(Mentor.career_specializations, "")).contains(spec_term)
        )

    # 4. Minimum experience
    if min_experience is not None:
        q = q.filter(Mentor.experience_years >= min_experience)

    # 5. Availability status filter
    if availability and availability.strip():
        av_term = availability.strip().lower()
        q = q.filter(func.lower(Mentor.availability) == av_term)

    mentors = q.all()
    results = []
    for m in mentors:
        headline = m.headline or (f"{m.title} at {m.company}" if (m.title and m.company) else (m.title or m.expertise))
        results.append({
            "mentor_id": m.mentor_id,
            "name": m.name,
            "email": m.email,
            "title": m.title or m.expertise,
            "headline": headline,
            "company": m.company or "PathForge Network",
            "profile_picture": m.profile_picture or "",
            "expertise": m.expertise,
            "experience_years": m.experience_years,
            "skills": m.skills,
            "bio": m.bio,
            "education": m.education or "",
            "certifications": m.certifications or "",
            "languages": m.languages or "English",
            "career_specializations": m.career_specializations or m.expertise,
            "availability": m.availability or "Available",
            "max_capacity": getattr(m, "max_capacity", 15) or 15,
            "rating": m.rating if m.rating is not None else 4.8,
            "linkedin_url": m.linkedin_url or "",
            "github_url": m.github_url or "",
            "portfolio_url": m.portfolio_url or "",
        })
    return results


@router.get("/api/mentors/{mentor_id}")
def get_mentor_by_id(mentor_id: str, db: Session = Depends(get_db)):
    """
    Retrieves a mentor's complete public profile, expertise skills list, and availability details.
    """
    m = db.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Mentor '{mentor_id}' not found.")

    # Retrieve structured skills
    skills_list = [
        {
            "id": s.id,
            "skill_id": s.skill_id,
            "skill_name": s.skill_name,
            "category": s.category,
            "proficiency_level": s.proficiency_level,
            "years_of_experience": s.years_of_experience,
            "is_willing_to_mentor": s.is_willing_to_mentor,
        }
        for s in m.expertise_skills
    ] if m.expertise_skills else [
        {
            "id": idx + 1,
            "skill_id": None,
            "skill_name": sk.strip(),
            "category": "General",
            "proficiency_level": "Advanced",
            "years_of_experience": m.experience_years,
            "is_willing_to_mentor": True,
        }
        for idx, sk in enumerate((m.skills or "").split(",")) if sk.strip()
    ]

    # Retrieve availability configuration
    avail_setting = m.availability_setting
    avail_days = [d.strip() for d in avail_setting.available_days.split(",") if d.strip()] if avail_setting else [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    ]
    avail_unavail = [d.strip() for d in (avail_setting.unavailable_dates or "").split(",") if d.strip()] if avail_setting else []
    avail_data = {
        "available_days": avail_days,
        "start_time": avail_setting.start_time if avail_setting else "09:00",
        "end_time": avail_setting.end_time if avail_setting else "17:00",
        "session_duration": avail_setting.session_duration if avail_setting else 60,
        "timezone": avail_setting.timezone if avail_setting else "UTC",
        "unavailable_dates": avail_unavail,
        "notes": avail_setting.notes if avail_setting else None,
    }

    headline = m.headline or (f"{m.title} at {m.company}" if (m.title and m.company) else (m.title or m.expertise))
    return {
        "mentor_id": m.mentor_id,
        "name": m.name,
        "email": m.email,
        "title": m.title or m.expertise,
        "headline": headline,
        "company": m.company or "PathForge Network",
        "profile_picture": m.profile_picture or "",
        "expertise": m.expertise,
        "experience_years": m.experience_years,
        "skills": m.skills,
        "bio": m.bio,
        "education": m.education or "",
        "certifications": m.certifications or "",
        "languages": m.languages or "English",
        "career_specializations": m.career_specializations or m.expertise,
        "availability": m.availability or "Available",
        "max_capacity": getattr(m, "max_capacity", 15) or 15,
        "rating": m.rating if m.rating is not None else 4.8,
        "linkedin_url": m.linkedin_url or "",
        "github_url": m.github_url or "",
        "portfolio_url": m.portfolio_url or "",
        "skills_list": skills_list,
        "availability_settings": avail_data,
    }


@router.post("/api/mentor/request", response_model=MentorshipRequestMutationResponse)
@router.post("/api/student/mentorship-requests", response_model=MentorshipRequestMutationResponse)
def request_mentorship(
    payload: Dict[str, Any],
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Submits an authenticated mentorship request from the student to the mentor.
    Validates mentor existence, prevents duplicate pending requests and duplicate active assignments.
    Persists the request in database with 'pending' status and alerts the mentor.
    """
    mentor_id = payload.get("mentor_id")
    if not mentor_id:
        raise HTTPException(status_code=400, detail="mentor_id is required.")

    message = (payload.get("message") or payload.get("topic") or "I would like guidance on my learning path and career progression.").strip()
    career_goal = payload.get("career_goal") or (current_student.career.career_name if current_student.career else "Career Mentorship")

    m = db.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    # 1. Prevent duplicate active assignments
    active_assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id == mentor_id,
            MentorStudentAssignment.student_id == current_student.student_id,
            MentorStudentAssignment.status == "active",
        )
        .first()
    )
    if active_assignment:
        raise HTTPException(
            status_code=400,
            detail=f"You already have an active mentorship connection with {m.name}.",
        )

    # 2. Prevent duplicate pending requests
    existing_pending = (
        db.query(MentorshipRequest)
        .filter(
            MentorshipRequest.mentor_id == mentor_id,
            MentorshipRequest.student_id == current_student.student_id,
            MentorshipRequest.status == "pending",
        )
        .first()
    )
    if existing_pending:
        raise HTTPException(
            status_code=400,
            detail=f"A pending mentorship request has already been submitted to {m.name}. Please wait for their response.",
        )

    req_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_req = MentorshipRequest(
        request_id=req_id,
        student_id=current_student.student_id,
        mentor_id=mentor_id,
        message=message,
        career_goal=career_goal,
        status="pending",
        created_at=now_str,
    )
    db.add(new_req)

    # Trigger mentor notification
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=mentor_id,
        student_id=current_student.student_id,
        type="mentorship_request",
        title=f"New mentorship request from {current_student.first_name} {current_student.last_name}",
        message=f"{current_student.first_name} requested mentorship for '{career_goal}': \"{message[:120]}...\"",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return MentorshipRequestMutationResponse(
        message=f"Mentorship request submitted successfully to {m.name}.",
        request_id=req_id,
        status="pending",
    )


@router.get("/api/student/mentorship-requests", response_model=List[MentorshipRequestResponse])
def get_student_mentorship_requests(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns all mentorship requests submitted by the authenticated student.
    Persists actual status (pending, accepted, rejected, cancelled).
    """
    requests = (
        db.query(MentorshipRequest)
        .filter(MentorshipRequest.student_id == current_student.student_id)
        .order_by(desc(MentorshipRequest.created_at))
        .all()
    )

    results = []
    for r in requests:
        m = db.query(Mentor).filter(Mentor.mentor_id == r.mentor_id).first()
        results.append(
            MentorshipRequestResponse(
                request_id=r.request_id,
                student_id=r.student_id,
                student_name=f"{current_student.first_name} {current_student.last_name}",
                student_email=current_student.email,
                student_career=current_student.career.career_name if current_student.career else "Career Mentorship",
                mentor_id=r.mentor_id,
                mentor_name=m.name if m else "Mentor",
                mentor_title=m.title or m.expertise if m else "",
                mentor_company=m.company or "PathForge Network" if m else "",
                mentor_rating=m.rating if m and m.rating is not None else 4.8,
                message=r.message,
                career_goal=r.career_goal,
                status=r.status,
                response_note=r.response_note,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )
    return results


@router.delete("/api/student/mentorship-requests/{request_id}", response_model=MentorshipRequestMutationResponse)
def cancel_student_mentorship_request(
    request_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Allows the student to cancel their own pending mentorship request.
    """
    req = db.query(MentorshipRequest).filter(MentorshipRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Mentorship request not found.")

    if req.student_id != current_student.student_id:
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: You cannot cancel another student's request.",
        )

    if req.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a request that has already been {req.status}.",
        )

    req.status = "cancelled"
    req.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()

    return MentorshipRequestMutationResponse(
        message="Mentorship request cancelled successfully.",
        request_id=req.request_id,
        status="cancelled",
    )


@router.get("/api/student/sessions", response_model=List[StudentSessionResponse])
def get_student_sessions(
    status: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns all mentorship sessions scheduled for the authenticated student.
    Ordered by session_date desc, start_time asc.
    """
    query = db.query(MentorshipSession).filter(MentorshipSession.student_id == current_student.student_id)
    if status:
        query = query.filter(MentorshipSession.status == status.strip().lower())

    sessions = query.order_by(desc(MentorshipSession.session_date), MentorshipSession.start_time.asc()).all()
    results = []
    for s in sessions:
        m = db.query(Mentor).filter(Mentor.mentor_id == s.mentor_id).first()
        dur = calculate_duration_minutes(s.start_time, s.end_time)
        results.append(
            StudentSessionResponse(
                session_id=s.session_id,
                mentor_id=s.mentor_id,
                mentor_name=m.name if m else "Mentor",
                mentor_title=m.title or m.expertise if m else "",
                mentor_company=m.company or "PathForge Network" if m else "",
                mentor_avatar=getattr(m, "avatar", None),
                student_id=s.student_id,
                topic=s.topic,
                session_date=s.session_date,
                start_time=s.start_time,
                end_time=s.end_time,
                duration_minutes=dur,
                platform=s.platform or "Google Meet",
                meeting_link=s.meeting_link,
                status=s.status,
                notes=s.notes,
                created_at=s.created_at,
            )
        )
    return results


@router.get("/api/student/sessions/{session_id}")
def get_student_session_detail(
    session_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Retrieves full details for a single mentorship session belonging to the student.
    Enforces student authorization (returns 403 Forbidden for sessions of other students).
    """
    sess = db.query(MentorshipSession).filter(MentorshipSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Mentorship session not found.")
    if sess.student_id != current_student.student_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another student's session.")

    m = db.query(Mentor).filter(Mentor.mentor_id == sess.mentor_id).first()
    dur = calculate_duration_minutes(sess.start_time, sess.end_time)
    return {
        "session_id": sess.session_id,
        "mentor_id": sess.mentor_id,
        "mentor_name": m.name if m else "Mentor",
        "mentor_title": m.title or m.expertise if m else "",
        "mentor_company": m.company or "PathForge Network" if m else "",
        "mentor_avatar": getattr(m, "avatar", None),
        "student_id": sess.student_id,
        "student_name": f"{current_student.first_name} {current_student.last_name}",
        "topic": sess.topic,
        "session_date": sess.session_date,
        "start_time": sess.start_time,
        "end_time": sess.end_time,
        "duration_minutes": dur,
        "platform": sess.platform or "Google Meet",
        "meeting_link": sess.meeting_link,
        "status": sess.status,
        "notes": sess.notes,
        "created_at": sess.created_at,
    }


@router.post("/api/student/sessions", response_model=MessageResponse)
def create_student_session_request(
    payload: StudentSessionCreateRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Allows a student to schedule or request a 1:1 mentorship session with their assigned mentor.
    Validates active relationship, past date, end_time > start_time, and schedule conflicts.
    """
    # 1. Verify active student-mentor assignment
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.student_id == current_student.student_id,
            MentorStudentAssignment.mentor_id == payload.mentor_id,
            MentorStudentAssignment.status == "active",
        )
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot schedule sessions with mentors who are not actively assigned to you.",
        )

    mentor = db.query(Mentor).filter(Mentor.mentor_id == payload.mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    # 2. Date format and past-date validation
    clean_date = payload.session_date.strip()
    try:
        sess_date_obj = datetime.strptime(clean_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session date format. Expected YYYY-MM-DD.")

    if sess_date_obj < datetime.now().date():
        raise HTTPException(status_code=400, detail="Cannot schedule sessions in the past.")

    clean_start = payload.start_time.strip()
    clean_end = payload.end_time.strip()

    # 3. Validate end time > start time
    s_min = parse_time_minutes(clean_start)
    e_min = parse_time_minutes(clean_end)
    if s_min is not None and e_min is not None and e_min <= s_min:
        raise HTTPException(status_code=400, detail="Session end time must be after start time.")

    # 4. Meeting link validation
    meeting_link = (payload.meeting_link or "").strip()
    if meeting_link:
        if not (meeting_link.startswith("http://") or meeting_link.startswith("https://")):
            raise HTTPException(status_code=400, detail="Meeting link must be a valid URL starting with http:// or https://.")
    else:
        meeting_link = "https://meet.google.com/pathforge-ai"

    # 4b. Mentor Availability validation
    avail_setting = mentor.availability_setting
    if avail_setting:
        # Check unavailable dates
        unavail = [d.strip() for d in (avail_setting.unavailable_dates or "").split(",") if d.strip()]
        if clean_date in unavail:
            raise HTTPException(
                status_code=400,
                detail=f"Mentor {mentor.name} is unavailable on {clean_date}."
            )

        # Check day of week
        weekday_name = sess_date_obj.strftime("%A")
        allowed_days = [d.strip() for d in (avail_setting.available_days or "").split(",") if d.strip()]
        if allowed_days and weekday_name not in allowed_days:
            raise HTTPException(
                status_code=400,
                detail=f"Mentor {mentor.name} is not available on {weekday_name}s. Available days: {', '.join(allowed_days)}."
            )

        # Check working hours
        if avail_setting.start_time and avail_setting.end_time:
            w_start = parse_time_minutes(avail_setting.start_time)
            w_end = parse_time_minutes(avail_setting.end_time)
            if s_min is not None and e_min is not None and w_start is not None and w_end is not None:
                if s_min < w_start or e_min > w_end:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Session hours ({clean_start} - {clean_end}) fall outside mentor's available window ({avail_setting.start_time} - {avail_setting.end_time})."
                    )

    # 5. Overlapping conflict check
    conflict_err = check_session_conflict(
        db=db,
        session_date=clean_date,
        start_time=clean_start,
        end_time=clean_end,
        mentor_id=payload.mentor_id,
        student_id=current_student.student_id,
    )
    if conflict_err:
        raise HTTPException(status_code=400, detail=conflict_err)

    new_id = f"SES-{uuid.uuid4().hex[:6].upper()}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    sess = MentorshipSession(
        session_id=new_id,
        mentor_id=payload.mentor_id,
        student_id=current_student.student_id,
        topic=payload.topic.strip(),
        session_date=clean_date,
        start_time=clean_start,
        end_time=clean_end,
        platform=payload.platform or "Google Meet",
        meeting_link=meeting_link,
        status="upcoming",
        notes=payload.notes.strip() if payload.notes else None,
        created_at=now_str,
    )
    db.add(sess)

    # Dispatches in-app notification to mentor
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=payload.mentor_id,
        student_id=current_student.student_id,
        type="session_scheduled",
        title=f"Mentorship Session Scheduled by {current_student.first_name}",
        message=f"Student {current_student.first_name} {current_student.last_name} scheduled a 1:1 session '{payload.topic.strip()}' on {clean_date} at {clean_start}.",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return MessageResponse(
        message=f"Mentorship session scheduled successfully (ID: {new_id}).",
        data={"session_id": new_id},
    )


@router.patch("/api/student/sessions/{session_id}/cancel", response_model=MessageResponse)
def cancel_student_session(
    session_id: str,
    payload: Optional[SessionCancellationRequest] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Allows a student to cancel their own scheduled mentorship session.
    Preserves cancellation status and reason in database without erasing history.
    """
    sess = db.query(MentorshipSession).filter(MentorshipSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Mentorship session not found.")
    if sess.student_id != current_student.student_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot cancel another student's session.")

    if sess.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel an already completed session.")
    if sess.status == "cancelled":
        raise HTTPException(status_code=400, detail="This session is already cancelled.")

    reason = (payload.reason.strip() if payload and payload.reason else "Cancelled by student")
    sess.status = "cancelled"
    sess.notes = f"{sess.notes or ''} [Cancellation reason: {reason}]".strip()

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=sess.mentor_id,
        student_id=current_student.student_id,
        type="session_cancelled",
        title="Session Cancelled by Mentee",
        message=f"Student {current_student.first_name} {current_student.last_name} cancelled session '{sess.topic}'. Reason: {reason}",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return MessageResponse(message="Session cancelled successfully.")


@router.patch("/api/student/sessions/{session_id}/reschedule", response_model=MessageResponse)
def reschedule_student_session(
    session_id: str,
    payload: MentorshipSessionRescheduleRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Allows a student to reschedule their own upcoming or rescheduled session.
    Validates new date, end_time > start_time, and interval conflicts for both participants.
    """
    sess = db.query(MentorshipSession).filter(MentorshipSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Mentorship session not found.")
    if sess.student_id != current_student.student_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot reschedule another student's session.")

    if sess.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot reschedule an already {sess.status} session.")

    clean_date = payload.session_date.strip()
    try:
        new_date_obj = datetime.strptime(clean_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session date format. Expected YYYY-MM-DD.")

    if new_date_obj < datetime.now().date():
        raise HTTPException(status_code=400, detail="Cannot reschedule sessions to a past date.")

    clean_start = payload.start_time.strip()
    clean_end = payload.end_time.strip()

    s_min = parse_time_minutes(clean_start)
    e_min = parse_time_minutes(clean_end)
    if s_min is not None and e_min is not None and e_min <= s_min:
        raise HTTPException(status_code=400, detail="Session end time must be after start time.")

    # Conflict check
    conflict_err = check_session_conflict(
        db=db,
        session_date=clean_date,
        start_time=clean_start,
        end_time=clean_end,
        mentor_id=sess.mentor_id,
        student_id=current_student.student_id,
        exclude_session_id=session_id,
    )
    if conflict_err:
        raise HTTPException(status_code=400, detail=conflict_err)

    sess.session_date = clean_date
    sess.start_time = clean_start
    sess.end_time = clean_end
    if payload.meeting_link:
        clean_link = payload.meeting_link.strip()
        if clean_link and not (clean_link.startswith("http://") or clean_link.startswith("https://")):
            raise HTTPException(status_code=400, detail="Meeting link must be a valid URL starting with http:// or https://.")
        sess.meeting_link = clean_link
    if payload.notes:
        sess.notes = payload.notes.strip()
    sess.status = "rescheduled"

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=sess.mentor_id,
        student_id=current_student.student_id,
        type="session_rescheduled",
        title="Session Rescheduled by Mentee",
        message=f"Student {current_student.first_name} {current_student.last_name} rescheduled session '{sess.topic}' to {clean_date} at {clean_start}.",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return MessageResponse(message=f"Session rescheduled successfully for {sess.session_date} at {sess.start_time}.")


@router.get("/api/student/my-mentors", response_model=List[StudentAssignedMentorResponse])
def get_student_my_mentors(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns mentors who have an active assignment with the authenticated student.
    Includes mentor profile details, assignment date, notes, and count of upcoming sessions.
    """
    assignments = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.student_id == current_student.student_id,
            MentorStudentAssignment.status == "active",
        )
        .order_by(desc(MentorStudentAssignment.assigned_date))
        .all()
    )
    assigned_mentor_ids = [a.mentor_id for a in assignments]
    accepted_reqs = (
        db.query(MentorshipRequest)
        .filter(
            MentorshipRequest.student_id == current_student.student_id,
            MentorshipRequest.status == "accepted",
        )
        .all()
    )
    need_commit = False
    for r in accepted_reqs:
        if r.mentor_id not in assigned_mentor_ids:
            new_assign = MentorStudentAssignment(
                mentor_id=r.mentor_id,
                student_id=current_student.student_id,
                assigned_date=r.updated_at or r.created_at or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                status="active",
                notes=r.response_note or r.message or "Accepted mentorship request",
            )
            db.add(new_assign)
            assignments.append(new_assign)
            assigned_mentor_ids.append(r.mentor_id)
            need_commit = True
    if need_commit:
        db.commit()
    results = []
    for a in assignments:
        m = db.query(Mentor).filter(Mentor.mentor_id == a.mentor_id).first()
        if not m:
            continue
        upcoming_count = (
            db.query(MentorshipSession)
            .filter(
                MentorshipSession.student_id == current_student.student_id,
                MentorshipSession.mentor_id == a.mentor_id,
                MentorshipSession.status == "upcoming",
            )
            .count()
        )
        skills_list = [s.strip() for s in m.skills.split(",") if s.strip()] if m.skills else []
        results.append(
            StudentAssignedMentorResponse(
                assignment_id=str(a.id),
                mentor_id=m.mentor_id,
                mentor_name=m.name,
                mentor_email=m.email or "",
                mentor_title=m.title or m.expertise or "Technical Mentor",
                mentor_company=m.company or "PathForge Network",
                mentor_avatar=getattr(m, "avatar", None),
                mentor_bio=m.bio,
                mentor_rating=m.rating if m.rating is not None else 4.9,
                mentor_skills=skills_list,
                mentor_expertise=m.expertise,
                assigned_at=a.assigned_date or "",
                notes=a.notes,
                status=a.status,
                upcoming_sessions_count=upcoming_count,
            )
        )
    return results


@router.get("/api/student/notifications", response_model=List[MentorNotificationResponse])
def get_student_notifications(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns in-app notifications dispatched to the authenticated student.
    """
    notifs = (
        db.query(Notification)
        .filter(Notification.student_id == current_student.student_id)
        .order_by(desc(Notification.created_at))
        .limit(50)
        .all()
    )
    return [
        MentorNotificationResponse(
            notification_id=n.notification_id,
            type=n.type,
            title=n.title,
            message=n.message,
            is_read=bool(n.is_read),
            created_at=n.created_at,
        )
        for n in notifs
    ]


@router.patch("/api/student/notifications/{notification_id}/read", response_model=MessageResponse)
def mark_student_notification_read(
    notification_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    n = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found.")
    if n.student_id != current_student.student_id:
        raise HTTPException(status_code=403, detail="Forbidden.")
    n.is_read = True
    db.commit()
    return MessageResponse(message="Notification marked as read.")


@router.patch("/api/student/notifications/read-all", response_model=MessageResponse)
def mark_all_student_notifications_read(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.student_id == current_student.student_id,
        Notification.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return MessageResponse(message="All notifications marked as read.")


@router.get("/api/mentor/feedback")
def get_student_mentor_feedback(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    feedbacks = (
        db.query(MentorFeedback)
        .filter(MentorFeedback.student_id == current_student.student_id)
        .order_by(desc(MentorFeedback.feedback_date))
        .all()
    )

    return [
        {
            "feedback_id": f.feedback_id,
            "mentor_id": f.mentor_id,
            "mentor_name": f.mentor.name if f.mentor else "Expert Mentor",
            "project_name": f.project.project_name if f.project else f.project_id,
            "skill_name": f.skill.skill_name if f.skill else f.skill_id,
            "rating": float(f.rating),
            "comments": f.comments,
            "strengths": f.strengths,
            "improvement_areas": f.improvement_areas,
            "recommended_action": f.recommended_action,
            "date": f.feedback_date,
        }
        for f in feedbacks
    ]


from pydantic import BaseModel


class MentorFeedbackDirectSubmit(BaseModel):
    mentor_id: str = "M001"
    project_id: str
    skill_id: str
    rating: int  # 1-5
    strengths: Optional[str] = "Good progress"
    improvement_areas: Optional[str] = "Continue practice"
    comments: Optional[str] = "Keep up the work"
    recommended_action: Optional[str] = "Next module"
    student_id: Optional[str] = None


@router.post("/api/mentor/feedback", response_model=MessageResponse)
def submit_mentor_feedback(
    payload: MentorFeedbackDirectSubmit,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    target_student_id = payload.student_id or current_student.student_id

    # Resolve skill
    skill = db.query(Skill).filter(Skill.skill_id == payload.skill_id).first()
    if not skill:
        skill = db.query(Skill).filter(Skill.skill_name.ilike(payload.skill_id)).first()
    target_skill_id = skill.skill_id if skill else payload.skill_id

    # Create or update feedback record
    feedback_date = datetime.now().strftime("%Y-%m-%d")
    fb_record = MentorFeedback(
        feedback_id=f"FB-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=payload.mentor_id,
        student_id=target_student_id,
        project_id=payload.project_id,
        skill_id=target_skill_id,
        rating=payload.rating,
        strengths=payload.strengths or "",
        improvement_areas=payload.improvement_areas or "",
        comments=payload.comments or "",
        recommended_action=payload.recommended_action or "",
        feedback_date=feedback_date,
    )
    db.add(fb_record)

    # Calibrate demonstrated skill evidence: 1-5 rating -> 20-100% scale
    mentor_score = min(100, max(20, int(round((payload.rating / 5.0) * 100))))
    update_or_create_student_skill(
        db=db,
        student_id=target_student_id,
        skill_id=target_skill_id,
        mentor_score=mentor_score,
    )

    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        student_id=target_student_id,
        mentor_id=payload.mentor_id,
        type="feedback_submitted",
        title="Mentor Feedback Received",
        message=f"Mentor feedback calibrated for skill {target_skill_id}.",
        is_read=False,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(notif)
    db.commit()

    return MessageResponse(
        message=f"Mentor feedback recorded and calibrated to {mentor_score}% for skill {target_skill_id}."
    )


# =========================================================================
# PROTECTED MENTOR PORTAL ENDPOINTS (ROLE: MENTOR)
# =========================================================================

@router.get("/api/mentor/dashboard")
def get_mentor_dashboard(
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Returns authentic, real database-backed metrics and overview for the authenticated mentor.
    """
    mentor_id = current_mentor.mentor_id

    # 1. Assigned students
    assigned_records = (
        db.query(MentorStudentAssignment)
        .filter(MentorStudentAssignment.mentor_id == mentor_id, MentorStudentAssignment.status == "active")
        .all()
    )
    assigned_student_ids = [a.student_id for a in assigned_records]
    assigned_count = len(assigned_student_ids)

    # 2. Upcoming sessions
    upcoming_sessions = (
        db.query(MentorshipSession)
        .filter(
            MentorshipSession.mentor_id == mentor_id,
            MentorshipSession.status == "upcoming",
        )
        .order_by(MentorshipSession.session_date.asc())
        .limit(10)
        .all()
    )
    upcoming_count = len(upcoming_sessions)

    # 3. Completed project reviews
    completed_reviews = (
        db.query(MentorFeedback)
        .filter(MentorFeedback.mentor_id == mentor_id)
        .all()
    )
    completed_reviews_count = len(completed_reviews)

    # 4. Average mentor rating
    if completed_reviews:
        ratings = [f.rating for f in completed_reviews]
        avg_rating = round(sum(ratings) / len(ratings), 1)
    else:
        avg_rating = current_mentor.rating if current_mentor.rating is not None else 0.0

    # 5. Build detailed upcoming sessions list
    formatted_sessions = []
    for s in upcoming_sessions[:5]:
        st = db.query(Student).filter(Student.student_id == s.student_id).first()
        formatted_sessions.append({
            "session_id": s.session_id,
            "student_id": s.student_id,
            "student_name": f"{st.first_name} {st.last_name}" if st else "Student",
            "topic": s.topic,
            "session_date": s.session_date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "platform": s.platform,
            "meeting_link": s.meeting_link,
            "status": s.status,
        })

    # 6. Student progress overview (from assigned students)
    student_progress_list = []
    assigned_students = (
        db.query(Student)
        .filter(Student.student_id.in_(assigned_student_ids))
        .all()
        if assigned_student_ids
        else []
    )

    career_counts: Dict[str, int] = {}
    total_progress_sum = 0

    for st in assigned_students:
        career_name = st.career.career_name if st.career else "Data Scientist"
        career_counts[career_name] = career_counts.get(career_name, 0) + 1

        # Calculate progress from completed roadmap steps / courses
        total_steps = db.query(StudentRoadmapStep).filter(StudentRoadmapStep.student_id == st.student_id).count()
        completed_steps = db.query(StudentRoadmapStep).filter(
            StudentRoadmapStep.student_id == st.student_id,
            StudentRoadmapStep.status == "completed",
        ).count()
        if total_steps > 0:
            progress_pct = int(round((completed_steps / total_steps) * 100))
        else:
            # Fallback to average skill mastery
            skills = db.query(StudentSkill).filter(StudentSkill.student_id == st.student_id).all()
            if skills:
                avg_m = sum(s.final_mastery or 0 for s in skills) / len(skills)
                progress_pct = min(100, int(avg_m))
            else:
                progress_pct = 0

        total_progress_sum += progress_pct
        student_progress_list.append({
            "student_id": st.student_id,
            "name": f"{st.first_name} {st.last_name}",
            "career_name": career_name,
            "progress_pct": progress_pct,
            "degree": st.degree,
            "email": st.email,
        })

    avg_student_progress = int(round(total_progress_sum / len(assigned_students))) if assigned_students else 0

    # 7. Recent messages
    recent_msgs = (
        db.query(MentorMessage)
        .filter(MentorMessage.mentor_id == mentor_id)
        .order_by(desc(MentorMessage.created_at))
        .limit(6)
        .all()
    )
    formatted_msgs = []
    for m in recent_msgs:
        st = db.query(Student).filter(Student.student_id == m.student_id).first()
        formatted_msgs.append({
            "message_id": m.message_id,
            "student_id": m.student_id,
            "student_name": f"{st.first_name} {st.last_name}" if st else "Student",
            "content": m.content,
            "sender_role": m.sender_role,
            "is_read": m.is_read,
            "created_at": m.created_at,
        })

    # 8. Career distribution donut
    career_distribution = []
    for c_name, count in career_counts.items():
        pct = int(round((count / assigned_count) * 100)) if assigned_count else 0
        career_distribution.append({
            "career_name": c_name,
            "count": count,
            "percentage": pct,
        })
    if not career_distribution and assigned_count == 0:
        career_distribution = []

    # 9. Skill Development Insights (weekly breakdown from real database records)
    now = datetime.now()
    week_counts = {
        1: {"assessments": 0, "projects": 0, "skills_improved": 0},
        2: {"assessments": 0, "projects": 0, "skills_improved": 0},
        3: {"assessments": 0, "projects": 0, "skills_improved": 0},
        4: {"assessments": 0, "projects": 0, "skills_improved": 0},
    }

    if assigned_student_ids:
        # Assessment answers
        answers = db.query(AssessmentAnswer).filter(AssessmentAnswer.student_id.in_(assigned_student_ids)).all()
        for ans in answers:
            try:
                ad = datetime.strptime(ans.attempt_date[:10], "%Y-%m-%d").date()
                diff_weeks = (now.date() - ad).days // 7
                target_week = 4 - diff_weeks
                if target_week in week_counts:
                    week_counts[target_week]["assessments"] += 1
                elif target_week < 1:
                    week_counts[1]["assessments"] += 1
            except Exception:
                week_counts[4]["assessments"] += 1

        # Project progress
        projs = db.query(StudentProjectProgress).filter(
            StudentProjectProgress.student_id.in_(assigned_student_ids),
            StudentProjectProgress.status == "completed",
        ).all()
        for p in projs:
            if p.completed_at:
                try:
                    pd = datetime.strptime(p.completed_at[:10], "%Y-%m-%d").date()
                    diff_weeks = (now.date() - pd).days // 7
                    target_week = 4 - diff_weeks
                    if target_week in week_counts:
                        week_counts[target_week]["projects"] += 1
                    elif target_week < 1:
                        week_counts[1]["projects"] += 1
                except Exception:
                    week_counts[4]["projects"] += 1
            else:
                week_counts[4]["projects"] += 1

        # Mentor feedback (skills improved)
        for fb in completed_reviews:
            try:
                fd = datetime.strptime(fb.feedback_date[:10], "%Y-%m-%d").date()
                diff_weeks = (now.date() - fd).days // 7
                target_week = 4 - diff_weeks
                if target_week in week_counts:
                    week_counts[target_week]["skills_improved"] += 1
                elif target_week < 1:
                    week_counts[1]["skills_improved"] += 1
            except Exception:
                week_counts[4]["skills_improved"] += 1

    skill_insights = [
        {
            "week": f"Week {w}",
            "assessments": week_counts[w]["assessments"],
            "projects": week_counts[w]["projects"],
            "skills_improved": week_counts[w]["skills_improved"],
        }
        for w in [1, 2, 3, 4]
    ]

    return {
        "mentor_id": mentor_id,
        "mentor_name": current_mentor.name,
        "mentor_title": current_mentor.title or current_mentor.expertise,
        "metrics": {
            "assigned_students": assigned_count,
            "upcoming_sessions": upcoming_count,
            "project_reviews_completed": completed_reviews_count,
            "completed_reviews": completed_reviews_count,
            "mentor_rating": avg_rating,
            "avg_progress": avg_student_progress,
            "avg_student_progress": avg_student_progress,
        },
        "upcoming_sessions": formatted_sessions,
        "student_progress_overview": student_progress_list[:6],
        "recent_messages": formatted_msgs,
        "career_distribution": career_distribution,
        "students_by_goal": career_distribution,
        "skill_insights": skill_insights,
        "impact_summary": {
            "students_mentored": assigned_count,
            "avg_progress_pct": avg_student_progress,
            "projects_reviewed": completed_reviews_count,
            "student_rating": avg_rating,
        },
    }


# =========================================================================
# MENTORSHIP REQUEST MANAGEMENT (INCOMING REQUESTS)
# =========================================================================

@router.get("/api/mentor/requests", response_model=List[MentorshipRequestResponse])
@router.get("/api/mentor/mentorship-requests", response_model=List[MentorshipRequestResponse])
def get_mentor_incoming_requests(
    status_filter: Optional[str] = None,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Returns incoming mentorship requests for the authenticated mentor.
    Permits filtering by status (pending, accepted, rejected, cancelled).
    """
    mentor_ids = [current_mentor.mentor_id]
    if current_mentor.user_id and current_mentor.user_id not in mentor_ids:
        mentor_ids.append(current_mentor.user_id)

    query = (
        db.query(MentorshipRequest)
        .filter(MentorshipRequest.mentor_id.in_(mentor_ids))
    )
    if status_filter:
        query = query.filter(MentorshipRequest.status == status_filter.strip())

    requests = query.order_by(desc(MentorshipRequest.created_at)).all()

    results = []
    for r in requests:
        st = db.query(Student).filter(Student.student_id == r.student_id).first()
        readiness = 0
        if st:
            steps_total = db.query(StudentRoadmapStep).filter(StudentRoadmapStep.student_id == st.student_id).count()
            steps_done = db.query(StudentRoadmapStep).filter(
                StudentRoadmapStep.student_id == st.student_id,
                StudentRoadmapStep.status == "completed",
            ).count()
            if steps_total > 0:
                readiness = int(round((steps_done / steps_total) * 100))
            else:
                skills = db.query(StudentSkill).filter(StudentSkill.student_id == st.student_id).all()
                if skills:
                    readiness = int(round(sum(s.final_mastery or 0 for s in skills) / len(skills)))

        results.append(
            MentorshipRequestResponse(
                request_id=r.request_id,
                student_id=r.student_id,
                student_name=f"{st.first_name} {st.last_name}" if st else "Student",
                student_email=st.email if st else "",
                student_career=st.career.career_name if st and st.career else "Career Mentorship",
                student_readiness=readiness,
                mentor_id=r.mentor_id,
                mentor_name=current_mentor.name,
                mentor_title=current_mentor.title or current_mentor.expertise,
                mentor_company=current_mentor.company or "PathForge Network",
                mentor_rating=current_mentor.rating if current_mentor.rating is not None else 4.8,
                message=r.message,
                career_goal=r.career_goal,
                status=r.status,
                response_note=r.response_note,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )
    return results


@router.patch("/api/mentor/requests/{request_id}/status", response_model=MentorshipRequestMutationResponse)
def respond_to_mentorship_request(
    request_id: str,
    payload: MentorshipRequestAction,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Accepts or rejects an incoming mentorship request for the authenticated mentor.
    - If accepted: sets status to 'accepted', creates or activates MentorStudentAssignment,
      and dispatches student notification.
    - If rejected: sets status to 'rejected', ensures no active assignment is created,
      and dispatches student notification.
    Enforces that only the intended mentor can accept/reject the request.
    """
    req = db.query(MentorshipRequest).filter(MentorshipRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Mentorship request not found.")

    mentor_ids = [current_mentor.mentor_id]
    if current_mentor.user_id and current_mentor.user_id not in mentor_ids:
        mentor_ids.append(current_mentor.user_id)

    if req.mentor_id not in mentor_ids:
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: You cannot respond to requests intended for another mentor.",
        )

    if req.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"This mentorship request has already been {req.status} and cannot be processed.",
        )

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if payload.status == "accepted":
        req.status = "accepted"
        req.response_note = payload.response_note
        req.updated_at = now_str

        # Create or activate student-mentor relationship
        assignment = (
            db.query(MentorStudentAssignment)
            .filter(
                MentorStudentAssignment.mentor_id == current_mentor.mentor_id,
                MentorStudentAssignment.student_id == req.student_id,
            )
            .first()
        )
        if assignment:
            assignment.status = "active"
            if payload.response_note:
                assignment.notes = f"Accepted: {payload.response_note}"
        else:
            assignment = MentorStudentAssignment(
                mentor_id=current_mentor.mentor_id,
                student_id=req.student_id,
                assigned_date=now_str,
                status="active",
                notes=payload.response_note or req.message,
            )
            db.add(assignment)

        # Notify student
        notif = Notification(
            notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            student_id=req.student_id,
            mentor_id=current_mentor.mentor_id,
            type="mentorship_accepted",
            title=f"Mentorship Accepted by {current_mentor.name}!",
            message=f"Mentor {current_mentor.name} accepted your mentorship request. You are now connected in their active cohort.",
            is_read=False,
            created_at=now_str,
        )
        db.add(notif)
        db.commit()

        return MentorshipRequestMutationResponse(
            message="Mentorship request accepted. Student connected to your cohort.",
            request_id=req.request_id,
            status="accepted",
        )

    elif payload.status == "rejected":
        req.status = "rejected"
        req.response_note = payload.response_note
        req.updated_at = now_str

        # Notify student (ensure NO active assignment is created)
        notif = Notification(
            notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            student_id=req.student_id,
            mentor_id=current_mentor.mentor_id,
            type="mentorship_rejected",
            title=f"Mentorship Request Declined by {current_mentor.name}",
            message=f"Mentorship request declined by {current_mentor.name}. Note: {payload.response_note}" if payload.response_note else f"Mentor {current_mentor.name} is unable to accept your request at this time.",
            is_read=False,
            created_at=now_str,
        )
        db.add(notif)
        db.commit()

        return MentorshipRequestMutationResponse(
            message="Mentorship request declined.",
            request_id=req.request_id,
            status="rejected",
        )


@router.post("/api/mentor/requests/{request_id}/accept", response_model=MentorshipRequestMutationResponse)
def accept_mentorship_request(
    request_id: str,
    payload: Optional[MentorshipRequestAction] = None,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    act = payload or MentorshipRequestAction(status="accepted")
    act.status = "accepted"
    return respond_to_mentorship_request(request_id, act, current_mentor, db)


@router.post("/api/mentor/requests/{request_id}/reject", response_model=MentorshipRequestMutationResponse)
def reject_mentorship_request(
    request_id: str,
    payload: Optional[MentorshipRequestAction] = None,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    act = payload or MentorshipRequestAction(status="rejected")
    act.status = "rejected"
    return respond_to_mentorship_request(request_id, act, current_mentor, db)


# =========================================================================
# MY STUDENTS & ASSIGNMENTS
# =========================================================================

def check_mentor_student_authorized(mentor: Mentor, student_id: str, db: Session) -> bool:
    """
    Checks if student_id is an authorized mentee of mentor.
    Verifies active MentorStudentAssignment or accepted MentorshipRequest.
    If an accepted request exists without an active assignment, auto-creates it.
    """
    mentor_ids = [mentor.mentor_id]
    if mentor.user_id and mentor.user_id not in mentor_ids:
        mentor_ids.append(mentor.user_id)

    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id.in_(mentor_ids),
            MentorStudentAssignment.student_id == student_id,
            MentorStudentAssignment.status == "active",
        )
        .first()
    )
    if assignment:
        return True

    # Check for accepted mentorship request
    req = (
        db.query(MentorshipRequest)
        .filter(
            MentorshipRequest.mentor_id.in_(mentor_ids),
            MentorshipRequest.student_id == student_id,
            MentorshipRequest.status == "accepted",
        )
        .first()
    )
    if req:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        new_assignment = MentorStudentAssignment(
            mentor_id=mentor.mentor_id,
            student_id=student_id,
            assigned_date=req.updated_at or req.created_at or now_str,
            status="active",
            notes=req.response_note or req.message or "Accepted mentorship request",
        )
        db.add(new_assignment)
        db.commit()
        return True

    return False


@router.get("/api/mentor/students")
def get_assigned_students(
    search: Optional[str] = None,
    career_filter: Optional[str] = None,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Returns list of students assigned to the authenticated mentor.
    Supports filtering by search query and career goal.
    """
    mentor_ids = [current_mentor.mentor_id]
    if current_mentor.user_id and current_mentor.user_id not in mentor_ids:
        mentor_ids.append(current_mentor.user_id)

    assignments = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id.in_(mentor_ids),
            MentorStudentAssignment.status == "active"
        )
        .all()
    )
    assignment_map = {a.student_id: a for a in assignments}
    student_ids = list(assignment_map.keys())

    # Include any student whose mentorship request was accepted
    accepted_reqs = (
        db.query(MentorshipRequest)
        .filter(
            MentorshipRequest.mentor_id.in_(mentor_ids),
            MentorshipRequest.status == "accepted"
        )
        .all()
    )
    req_map = {r.student_id: r for r in accepted_reqs}
    need_commit = False
    for r in accepted_reqs:
        if r.student_id not in assignment_map:
            new_assign = MentorStudentAssignment(
                mentor_id=current_mentor.mentor_id,
                student_id=r.student_id,
                assigned_date=r.updated_at or r.created_at or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                status="active",
                notes=r.response_note or r.message or "Accepted mentorship request",
            )
            db.add(new_assign)
            assignment_map[r.student_id] = new_assign
            student_ids.append(r.student_id)
            need_commit = True

    if need_commit:
        db.commit()

    if not student_ids:
        return []

    query = db.query(Student).filter(Student.student_id.in_(student_ids))

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Student.first_name.ilike(search_fmt))
            | (Student.last_name.ilike(search_fmt))
            | (Student.email.ilike(search_fmt))
            | (Student.department.ilike(search_fmt))
            | (Student.college.ilike(search_fmt))
        )

    students = query.all()

    result = []
    for st in students:
        career_name = st.career.career_name if st.career else "Machine Learning Engineer"
        if career_filter and career_filter.lower() != "all" and career_filter.lower() not in career_name.lower():
            continue

        # Compute readiness and progress
        skills = db.query(StudentSkill).filter(StudentSkill.student_id == st.student_id).all()
        avg_mastery = sum(s.final_mastery or 0 for s in skills) / len(skills) if skills else 72.0
        skill_names = [s.skill.skill_name for s in skills if s.skill and s.skill.skill_name]
        if not skill_names:
            skill_names = ["Python", "Data Analysis", "System Design", "Machine Learning"]

        courses_done = (
            db.query(StudentCourseProgress)
            .filter(StudentCourseProgress.student_id == st.student_id, StudentCourseProgress.status == "completed")
            .count()
        )
        projects_done = (
            db.query(StudentProjectProgress)
            .filter(StudentProjectProgress.student_id == st.student_id, StudentProjectProgress.status == "completed")
            .count()
        )
        projects_in_prog = (
            db.query(StudentProjectProgress)
            .filter(StudentProjectProgress.student_id == st.student_id, StudentProjectProgress.status == "in_progress")
            .count()
        )
        assessments_done = (
            db.query(AssessmentAnswer)
            .filter(AssessmentAnswer.student_id == st.student_id)
            .count()
        )

        # Roadmap progress calculation
        total_steps = db.query(StudentRoadmapStep).filter(StudentRoadmapStep.student_id == st.student_id).count()
        completed_steps = db.query(StudentRoadmapStep).filter(
            StudentRoadmapStep.student_id == st.student_id,
            StudentRoadmapStep.status == "completed"
        ).count()
        roadmap_pct = int(round((completed_steps / total_steps) * 100)) if total_steps > 0 else 0

        # Skills completed vs remaining
        career_skills_count = (
            db.query(CareerSkill).filter(CareerSkill.career_id == st.target_career_id).count()
            if st.target_career_id else len(skills)
        )
        skills_completed = sum(1 for s in skills if s.is_completed or (s.final_mastery and s.final_mastery >= 70))
        skills_remaining = max(0, (career_skills_count if career_skills_count > 0 else len(skills)) - skills_completed)

        # Overall progress
        overall_progress = roadmap_pct if total_steps > 0 else int(round(avg_mastery * 0.7 + (courses_done * 10)))
        overall_progress = min(100, max(0, overall_progress))

        readiness_pct = int(min(100, max(20, round(avg_mastery * 0.9 + (projects_done * 5)))))

        # Last activity date (untracked falls back to None)
        latest_act = (
            db.query(LearningActivity)
            .filter(LearningActivity.student_id == st.student_id)
            .order_by(desc(LearningActivity.activity_date))
            .first()
        )
        last_active_date = latest_act.activity_date if latest_act else None
        if not last_active_date:
            latest_course = (
                db.query(StudentCourseProgress)
                .filter(StudentCourseProgress.student_id == st.student_id, StudentCourseProgress.last_accessed_at.isnot(None))
                .order_by(desc(StudentCourseProgress.last_accessed_at))
                .first()
            )
            if latest_course and latest_course.last_accessed_at:
                last_active_date = str(latest_course.last_accessed_at)[:10]

        # Upcoming mentorship session with this mentor
        upcoming_sess = (
            db.query(MentorshipSession)
            .filter(
                MentorshipSession.mentor_id.in_(mentor_ids),
                MentorshipSession.student_id == st.student_id,
                MentorshipSession.status.in_(["upcoming", "rescheduled"]),
            )
            .order_by(MentorshipSession.session_date.asc(), MentorshipSession.start_time.asc())
            .first()
        )
        upcoming_session_info = {
            "session_id": upcoming_sess.session_id,
            "topic": upcoming_sess.topic,
            "session_date": upcoming_sess.session_date,
            "start_time": upcoming_sess.start_time,
            "platform": upcoming_sess.platform,
            "meeting_link": upcoming_sess.meeting_link,
            "status": upcoming_sess.status,
        } if upcoming_sess else None

        # Assessment average score
        scores = []
        course_progs = db.query(StudentCourseProgress).filter(
            StudentCourseProgress.student_id == st.student_id,
            StudentCourseProgress.final_assessment_score.isnot(None),
        ).all()
        for cp in course_progs:
            if cp.final_assessment_score is not None:
                scores.append(float(cp.final_assessment_score))
        avg_score = round(sum(scores) / len(scores), 1) if scores else None

        assign = assignment_map.get(st.student_id)
        req = req_map.get(st.student_id)
        raw_conn_date = (assign.assigned_date if assign and assign.assigned_date else (req.updated_at or req.created_at if req else None))
        clean_conn_date = str(raw_conn_date)[:10] if raw_conn_date else "Active"
        conn_notes = (assign.notes if assign and assign.notes else (req.response_note or req.message if req else None)) or "Active mentorship connection"

        result.append({
            "student_id": st.student_id,
            "name": f"{st.first_name} {st.last_name}",
            "first_name": st.first_name,
            "last_name": st.last_name,
            "email": st.email,
            "avatar": getattr(st, "avatar", None),
            "college": st.college or "Not available",
            "department": st.department or "Not available",
            "degree": st.degree or "Not available",
            "graduation_year": st.graduation_year,
            "cgpa": st.cgpa,
            "target_career_id": st.target_career_id,
            "target_career_name": career_name,
            "roadmap_name": f"{career_name} Learning Path",
            "roadmap_progress_pct": roadmap_pct,
            "skills_completed": skills_completed,
            "skills_remaining": skills_remaining,
            "skills_list": skill_names[:6],
            "skills_text": ", ".join(skill_names[:4]),
            "overall_progress": overall_progress,
            "readiness_pct": readiness_pct,
            "mastery_pct": int(round(avg_mastery)),
            "courses_completed": courses_done,
            "projects_verified": projects_done,
            "projects_completed": projects_done,
            "projects_in_progress": projects_in_prog,
            "assessments_completed": assessments_done,
            "avg_assessment_score": avg_score,
            "last_active": last_active_date or "Today",
            "last_active_date": last_active_date,
            "upcoming_session": upcoming_session_info,
            "connection_status": "active",
            "connection_date": clean_conn_date,
            "notes": conn_notes,
        })

    return result


@router.get("/api/mentor/students/{student_id}")
def get_student_detail(
    student_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Enforces that mentor is authorized to inspect this specific student.
    Returns comprehensive student profile, demonstrated skill evidence, roadmap, and reviews.
    """
    mentor_id = current_mentor.mentor_id
    if not check_mentor_student_authorized(current_mentor, student_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: Student '{student_id}' is not assigned to you.",
        )

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Fetch skills
    student_skills = db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
    skills_data = [
        {
            "skill_id": s.skill_id,
            "skill_name": s.skill.skill_name if s.skill else s.skill_id,
            "final_mastery": s.final_mastery or 0,
            "mastery_level": s.mastery_level or "Beginner",
            "self_declared_score": s.self_declared_score or 0,
            "resume_score": s.resume_score or 0,
            "assessment_score": s.assessment_score or 0,
            "project_score": s.project_score or 0,
            "certificate_score": s.certificate_score or 0,
            "mentor_score": s.mentor_score or 0,
            "is_completed": bool(s.is_completed),
        }
        for s in student_skills
    ]

    # Fetch roadmap steps
    steps = (
        db.query(StudentRoadmapStep)
        .filter(StudentRoadmapStep.student_id == student_id)
        .order_by(StudentRoadmapStep.step_number.asc())
        .all()
    )
    steps_data = [
        {
            "id": stp.id,
            "step_number": stp.step_number,
            "milestone_name": stp.milestone_name,
            "status": stp.status,
            "estimated_weeks": stp.estimated_weeks,
        }
        for stp in steps
    ]

    # Fetch reviews by this mentor
    reviews = (
        db.query(MentorFeedback)
        .filter(MentorFeedback.student_id == student_id, MentorFeedback.mentor_id == mentor_id)
        .order_by(desc(MentorFeedback.feedback_date))
        .all()
    )
    reviews_data = [
        {
            "feedback_id": r.feedback_id,
            "project_id": r.project_id,
            "project_name": r.project.project_name if r.project else r.project_id,
            "skill_name": r.skill.skill_name if r.skill else r.skill_id,
            "rating": r.rating,
            "strengths": r.strengths,
            "improvement_areas": r.improvement_areas,
            "comments": r.comments,
            "recommended_action": r.recommended_action,
            "feedback_date": r.feedback_date,
        }
        for r in reviews
    ]

    # Fetch career guidance notes
    notes = (
        db.query(MentorGuidanceNote)
        .filter(MentorGuidanceNote.student_id == student_id, MentorGuidanceNote.mentor_id == mentor_id)
        .order_by(desc(MentorGuidanceNote.created_at))
        .all()
    )
    notes_data = [
        {
            "id": n.id,
            "notes": n.notes,
            "recommended_courses": n.recommended_courses,
            "recommended_projects": n.recommended_projects,
            "action_items": n.action_items,
            "created_at": n.created_at,
        }
        for n in notes
    ]

    # Fetch course progress
    course_prog = db.query(StudentCourseProgress).filter(StudentCourseProgress.student_id == student_id).all()
    courses_data = [
        {
            "course_id": cp.course_id,
            "course_name": cp.course.course_name if cp.course else cp.course_id,
            "progress_percentage": cp.progress_percentage,
            "status": cp.status,
            "completed_at": cp.completed_at,
            "final_assessment_score": cp.final_assessment_score,
            "completed_lessons_count": cp.completed_lessons_count,
            "total_lessons": cp.total_lessons,
        }
        for cp in course_prog
    ]

    # Fetch project progress
    proj_prog = db.query(StudentProjectProgress).filter(StudentProjectProgress.student_id == student_id).all()
    projects_data = [
        {
            "project_id": pp.project_id,
            "project_name": pp.project.project_name if pp.project else pp.project_id,
            "progress_percentage": pp.progress_percentage,
            "status": pp.status,
            "github_url": pp.github_url or "",
            "completed_at": pp.completed_at,
        }
        for pp in proj_prog
    ]

    # Fetch learning activities
    activities = (
        db.query(LearningActivity)
        .filter(LearningActivity.student_id == student_id)
        .order_by(desc(LearningActivity.activity_date))
        .limit(10)
        .all()
    )
    activities_data = [
        {
            "activity_id": act.activity_id,
            "activity_name": act.activity_name,
            "activity_type": act.activity_type,
            "duration_minutes": act.duration_minutes,
            "activity_date": act.activity_date,
        }
        for act in activities
    ]

    avg_mastery = sum(s["final_mastery"] for s in skills_data) / len(skills_data) if skills_data else 0
    courses_done = sum(1 for c in courses_data if c["status"] == "completed")
    projects_done = sum(1 for p in projects_data if p["status"] == "completed")
    assessments_done = db.query(AssessmentAnswer).filter(AssessmentAnswer.student_id == student_id).count()
    readiness_pct = int(min(100, max(20, round(avg_mastery * 0.9 + (projects_done * 5))))) if skills_data else 0

    # Fetch mentorship sessions between this mentor and student
    sess_records = (
        db.query(MentorshipSession)
        .filter(
            MentorshipSession.mentor_id == mentor_id,
            MentorshipSession.student_id == student_id,
        )
        .order_by(desc(MentorshipSession.session_date), MentorshipSession.start_time.asc())
        .all()
    )
    sessions_data = [
        {
            "session_id": s.session_id,
            "topic": s.topic,
            "session_date": s.session_date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "platform": s.platform,
            "meeting_link": s.meeting_link,
            "status": s.status,
            "notes": s.notes,
            "created_at": s.created_at,
        }
        for s in sess_records
    ]

    return {
        "student_id": student.student_id,
        "name": f"{student.first_name} {student.last_name}",
        "first_name": student.first_name,
        "last_name": student.last_name,
        "email": student.email,
        "college": student.college,
        "department": student.department,
        "degree": student.degree,
        "graduation_year": student.graduation_year,
        "cgpa": student.cgpa,
        "target_career_id": student.target_career_id,
        "target_career_name": student.career.career_name if student.career else "Machine Learning Engineer",
        "readiness_pct": readiness_pct,
        "mastery_pct": int(round(avg_mastery)),
        "courses_completed": courses_done,
        "projects_verified": projects_done,
        "assessments_completed": assessments_done,
        "skills": skills_data,
        "roadmap_steps": steps_data,
        "reviews": reviews_data,
        "guidance_notes": notes_data,
        "course_progress": courses_data,
        "project_progress": projects_data,
        "learning_activities": activities_data,
        "sessions": sessions_data,
    }


@router.get("/api/mentor/students/{student_id}/progress")
def get_student_progress(
    student_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Connects Mentor Portal to PathForge AI student-learning data.
    Returns comprehensive progress:
    A. Student Overview
    B. Skill Progress & Gap Analysis
    C. Learning Roadmap
    D. Assessment Performance
    E. Project Progress & Reviews
    F. Mentorship History & Permitted Notes
    G. Traceable Mentor Insights
    H. Visualizations Precomputations
    """
    mentor_id = current_mentor.mentor_id
    if not check_mentor_student_authorized(current_mentor, student_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: Student '{student_id}' is not an active mentee of yours.",
        )

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # 1. Student Skills & Gap Analysis
    skills = db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
    avg_mastery = sum(s.final_mastery or 0 for s in skills) / len(skills) if skills else 72.0

    gap_analysis_data = {}
    try:
        gap_analysis_data = analyze_student_skill_gap(db, student_id)
    except Exception:
        gap_analysis_data = {"gaps": []}

    gaps_list = gap_analysis_data.get("gaps", [])

    known_skills = []
    learning_skills = []
    improving_skills = []

    for s in skills:
        s_item = {
            "skill_id": s.skill_id,
            "skill_name": s.skill.skill_name if s.skill else s.skill_id,
            "category": s.skill.category if s.skill else "Technical",
            "final_mastery": s.final_mastery or 0,
            "mastery_level": s.mastery_level or "Beginner",
            "self_declared_score": s.self_declared_score or 0,
            "resume_score": s.resume_score or 0,
            "assessment_score": s.assessment_score or 0,
            "project_score": s.project_score or 0,
            "certificate_score": s.certificate_score or 0,
            "mentor_score": s.mentor_score or 0,
            "is_completed": bool(s.is_completed),
            "completion_status": s.completion_status or ("completed" if s.is_completed else "in_progress"),
        }
        if s.is_completed or (s.final_mastery and s.final_mastery >= 70):
            known_skills.append(s_item)
        elif s.final_mastery and s.final_mastery > 0:
            learning_skills.append(s_item)
        else:
            improving_skills.append(s_item)

    career_skills_count = (
        db.query(CareerSkill).filter(CareerSkill.career_id == student.target_career_id).count()
        if student.target_career_id else len(skills)
    )
    skills_completed_count = len(known_skills)
    skills_remaining_count = max(0, (career_skills_count if career_skills_count > 0 else len(skills)) - skills_completed_count)

    # 2. Roadmap & Learning Steps
    roadmap_steps = (
        db.query(StudentRoadmapStep)
        .filter(StudentRoadmapStep.student_id == student_id)
        .order_by(StudentRoadmapStep.step_number.asc())
        .all()
    )
    total_steps = len(roadmap_steps)
    completed_steps = sum(1 for r in roadmap_steps if r.status == "completed")
    in_prog_steps = sum(1 for r in roadmap_steps if r.status == "in_progress")
    pending_steps = sum(1 for r in roadmap_steps if r.status == "pending")
    roadmap_completion_pct = int(round((completed_steps / total_steps) * 100)) if total_steps > 0 else 0

    steps_data = [
        {
            "id": r.id,
            "step_number": r.step_number,
            "milestone_name": r.milestone_name,
            "skill_id": r.skill_id,
            "status": r.status,
            "estimated_weeks": r.estimated_weeks,
            "completed_at": r.completed_at,
        }
        for r in roadmap_steps
    ]

    # 3. Courses & Progress
    courses = db.query(StudentCourseProgress).filter(StudentCourseProgress.student_id == student_id).all()
    courses_completed = sum(1 for c in courses if c.status == "completed")
    courses_data = [
        {
            "course_id": c.course_id,
            "course_name": c.course.course_name if c.course else c.course_id,
            "progress_percentage": c.progress_percentage,
            "status": c.status,
            "completed_at": c.completed_at,
            "final_assessment_score": c.final_assessment_score,
            "completed_lessons_count": c.completed_lessons_count,
            "total_lessons": c.total_lessons,
        }
        for c in courses
    ]

    # 4. Projects & Reviews
    projects = db.query(StudentProjectProgress).filter(StudentProjectProgress.student_id == student_id).all()
    projects_completed = sum(1 for p in projects if p.status == "completed")
    projects_in_progress = sum(1 for p in projects if p.status == "in_progress")

    # Fetch reviews by this mentor
    mentor_feedbacks = (
        db.query(MentorFeedback)
        .filter(MentorFeedback.student_id == student_id, MentorFeedback.mentor_id == mentor_id)
        .order_by(desc(MentorFeedback.feedback_date))
        .all()
    )
    feedback_map = {fb.project_id: fb for fb in mentor_feedbacks if fb.project_id}

    projects_data = []
    for p in projects:
        proj_obj = p.project
        rev = feedback_map.get(p.project_id)
        projects_data.append({
            "project_id": p.project_id,
            "project_name": proj_obj.project_name if proj_obj else p.project_id,
            "category": proj_obj.category if proj_obj else "Engineering",
            "difficulty": proj_obj.difficulty if proj_obj else "Intermediate",
            "description": proj_obj.description if proj_obj else "Hands-on implementation project.",
            "learning_outcomes": proj_obj.learning_outcomes if proj_obj else "Demonstrate applied competency.",
            "progress_percentage": p.progress_percentage,
            "status": p.status,
            "github_url": p.github_url or "",
            "completed_at": p.completed_at,
            "has_mentor_review": rev is not None,
            "mentor_review": {
                "feedback_id": rev.feedback_id,
                "rating": rev.rating,
                "strengths": rev.strengths,
                "improvement_areas": rev.improvement_areas,
                "comments": rev.comments,
                "recommended_action": rev.recommended_action,
                "feedback_date": rev.feedback_date,
            } if rev else None,
        })

    # 5. Assessment Performance
    answers = (
        db.query(AssessmentAnswer)
        .filter(AssessmentAnswer.student_id == student_id)
        .order_by(desc(AssessmentAnswer.attempt_date))
        .all()
    )
    total_answers = len(answers)
    correct_count = sum(1 for a in answers if a.correct)
    accuracy_pct = int(round((correct_count / total_answers) * 100)) if total_answers else 0

    scores = []
    for c in courses:
        if c.final_assessment_score is not None:
            scores.append(float(c.final_assessment_score))
    avg_score = round(sum(scores) / len(scores), 1) if scores else (accuracy_pct if total_answers > 0 else None)

    weak_skills = []
    strong_skills = []
    for s in skills:
        score = s.assessment_score or s.final_mastery or 0
        sk_name = s.skill.skill_name if s.skill else s.skill_id
        if score >= 80:
            strong_skills.append({"skill_name": sk_name, "score": score})
        elif score > 0 and score < 60:
            weak_skills.append({"skill_name": sk_name, "score": score})

    recent_attempts = [
        {
            "attempt_id": a.attempt_id,
            "question_id": a.question_id,
            "skill_name": a.question.skill.skill_name if (a.question and a.question.skill) else a.question_id,
            "correct": a.correct,
            "time_taken_seconds": a.time_taken_seconds,
            "attempt_date": a.attempt_date,
        }
        for a in answers[:15]
    ]

    # 6. Activities & Last Active Date
    activities = (
        db.query(LearningActivity)
        .filter(LearningActivity.student_id == student_id)
        .order_by(desc(LearningActivity.activity_date))
        .limit(10)
        .all()
    )
    activities_data = [
        {
            "activity_id": act.activity_id,
            "activity_name": act.activity_name,
            "activity_type": act.activity_type,
            "duration_minutes": act.duration_minutes,
            "activity_date": act.activity_date,
        }
        for act in activities
    ]

    last_active_date = activities_data[0]["activity_date"] if activities_data else None
    if not last_active_date:
        for c in courses:
            if c.last_accessed_at:
                last_active_date = str(c.last_accessed_at)[:10]
                break

    # 7. Mentorship Sessions & Guidance Notes
    sessions = (
        db.query(MentorshipSession)
        .filter(
            MentorshipSession.mentor_id == mentor_id,
            MentorshipSession.student_id == student_id,
        )
        .order_by(desc(MentorshipSession.session_date), MentorshipSession.start_time.asc())
        .all()
    )
    sessions_data = [
        {
            "session_id": s.session_id,
            "topic": s.topic,
            "session_date": s.session_date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "platform": s.platform,
            "meeting_link": s.meeting_link,
            "status": s.status,
            "notes": s.notes,
            "created_at": s.created_at,
        }
        for s in sessions
    ]

    upcoming_session = next(
        (s for s in sessions_data if s["status"] in ["upcoming", "rescheduled"]),
        None
    )

    guidance_notes = (
        db.query(MentorGuidanceNote)
        .filter(MentorGuidanceNote.student_id == student_id, MentorGuidanceNote.mentor_id == mentor_id)
        .order_by(desc(MentorGuidanceNote.created_at))
        .all()
    )
    notes_data = [
        {
            "id": n.id,
            "notes": n.notes,
            "recommended_courses": n.recommended_courses,
            "recommended_projects": n.recommended_projects,
            "action_items": n.action_items,
            "created_at": n.created_at,
        }
        for n in guidance_notes
    ]

    feedbacks_data = [
        {
            "feedback_id": fb.feedback_id,
            "project_name": fb.project.project_name if fb.project else "General Project",
            "skill_name": fb.skill.skill_name if fb.skill else "Applied Competency",
            "rating": fb.rating,
            "strengths": fb.strengths,
            "improvement_areas": fb.improvement_areas,
            "comments": fb.comments,
            "recommended_action": fb.recommended_action,
            "feedback_date": fb.feedback_date,
        }
        for fb in mentor_feedbacks
    ]

    # Overall progress & readiness calculation
    overall_progress = roadmap_completion_pct if total_steps > 0 else int(round(avg_mastery * 0.7 + (courses_completed * 10)))
    overall_progress = min(100, max(0, overall_progress))
    readiness_pct = int(min(100, max(20, round(avg_mastery * 0.9 + (projects_completed * 5))))) if skills else 0

    # 8. Deterministic Mentor Insights
    insights = []
    # A. Critical Skill Gaps
    for g in gaps_list:
        if g.get("gap", 0) >= 30 or g.get("status") in ["Critical Gap", "Major Gap"]:
            insights.append({
                "id": f"ins-gap-{g.get('skill_id')}",
                "category": "skill_gap",
                "severity": "high",
                "title": f"Critical Skill Gap: {g.get('skill_name')}",
                "observation": f"Demonstrated mastery is {g.get('current_mastery', 0)}%, falling {g.get('gap')}% short of target requirement for {student.career.career_name if student.career else 'Career'}.",
                "recommendation": f"Focus on {g.get('skill_name')} foundational exercises and schedule an assessment calibration.",
                "metric": f"Gap: {g.get('gap')}%",
            })
            if len(insights) >= 2:
                break

    # B. Stalled / Active Milestone
    active_step = next((r for r in roadmap_steps if r.status == "in_progress"), None)
    if active_step:
        insights.append({
            "id": f"ins-step-{active_step.id}",
            "category": "milestone",
            "severity": "info",
            "title": f"Active Milestone: {active_step.milestone_name}",
            "observation": f"Student is actively working on Step {active_step.step_number} in their roadmap.",
            "recommendation": "Review recent code commits or task checklist to help unblock milestone completion.",
            "metric": f"Step {active_step.step_number}",
        })

    # C. Low Assessment Score Alert
    if weak_skills:
        w = weak_skills[0]
        insights.append({
            "id": f"ins-weak-{w['skill_name']}",
            "category": "assessment",
            "severity": "warning",
            "title": f"Low Assessment Score: {w['skill_name']}",
            "observation": f"Recent assessment score was {w['score']}%, below the 60% competency threshold.",
            "recommendation": "Recommend supplemental reading or targeted lab exercises before re-attempting assessment.",
            "metric": f"Score: {w['score']}%",
        })

    # D. Projects Ready for Review
    for p in projects_data:
        if (p["status"] == "completed" or p["github_url"]) and not p["has_mentor_review"]:
            insights.append({
                "id": f"ins-proj-{p['project_id']}",
                "category": "project_review",
                "severity": "warning",
                "title": f"Project Awaiting Code Review: {p['project_name']}",
                "observation": "Student completed project tasks and submitted code repository.",
                "recommendation": "Conduct architectural review and calibrate mentor evaluation score.",
                "metric": p["status"],
            })
            break

    # E. Engagement / 1:1 Check-in
    if not upcoming_session:
        insights.append({
            "id": "ins-session-needed",
            "category": "support",
            "severity": "info",
            "title": "Mentorship Check-in Recommended",
            "observation": "No upcoming 1:1 mentorship sessions scheduled with this student.",
            "recommendation": "Schedule a session to align on roadmap velocity and career readiness.",
            "metric": "No Session Scheduled",
        })

    # F. High Competency Strength
    if strong_skills:
        s_best = strong_skills[0]
        insights.append({
            "id": f"ins-strong-{s_best['skill_name']}",
            "category": "strength",
            "severity": "success",
            "title": f"Demonstrated Mastery: {s_best['skill_name']}",
            "observation": f"Exceptional competency validated with {s_best['score']}% mastery score.",
            "recommendation": "Encourage student to tackle advanced capstone architectures in this domain.",
            "metric": f"Mastery: {s_best['score']}%",
        })

    # 9. Visualizations Datasets
    visualizations = {
        "roadmap_chart": {
            "completed": completed_steps,
            "in_progress": in_prog_steps,
            "pending": pending_steps,
            "total": total_steps,
            "completion_pct": roadmap_completion_pct,
        },
        "skills_ratio_chart": {
            "completed": len(known_skills),
            "in_progress": len(learning_skills),
            "remaining": len(improving_skills),
            "total": len(skills),
        },
        "project_status_chart": {
            "completed": projects_completed,
            "in_progress": projects_in_progress,
            "not_started": max(0, len(projects) - projects_completed - projects_in_progress),
            "total": len(projects),
        },
        "assessment_trend": [
            {
                "date": a["attempt_date"][:10] if a.get("attempt_date") else "Recent",
                "score": 100 if a.get("correct") else 0,
                "skill": a.get("skill_name", "Skill"),
            }
            for a in recent_attempts[:8]
        ],
    }

    return {
        # Section A: Student Overview
        "overview": {
            "student_id": student.student_id,
            "name": f"{student.first_name} {student.last_name}",
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email,
            "avatar": getattr(student, "avatar", None),
            "college": student.college or "Not available",
            "department": student.department or "Not available",
            "degree": student.degree or "Not available",
            "graduation_year": student.graduation_year,
            "cgpa": student.cgpa,
            "target_career_id": student.target_career_id,
            "target_career_name": student.career.career_name if student.career else "Not available",
            "target_career_description": student.career.description if student.career else "Not available",
            "career_focus": student.career.core_focus if student.career else "Not available",
            "weekly_learning_hours": student.weekly_learning_hours,
            "learning_mode": student.learning_mode,
            "preferred_difficulty": student.preferred_difficulty,
            "readiness_pct": readiness_pct,
            "mastery_pct": int(round(avg_mastery)),
            "last_active_date": last_active_date or "Not available",
        },
        # Section B: Skill Progress & Skill Gap Analysis
        "skill_progress": {
            "known_skills": known_skills,
            "learning_skills": learning_skills,
            "improving_skills": improving_skills,
            "skills_completed_count": skills_completed_count,
            "skills_remaining_count": skills_remaining_count,
            "gap_analysis": gaps_list,
            "all_skills": [s for s in known_skills + learning_skills + improving_skills],
        },
        # Section C: Learning Roadmap
        "roadmap": {
            "roadmap_title": f"{student.career.career_name if student.career else 'Career'} Learning Path",
            "total_steps": total_steps,
            "completed_steps": completed_steps,
            "in_progress_steps": in_prog_steps,
            "pending_steps": pending_steps,
            "completion_pct": roadmap_completion_pct,
            "steps": steps_data,
            "recent_activities": activities_data,
        },
        # Section D: Assessment Performance
        "assessment_performance": {
            "total_questions_attempted": total_answers,
            "accuracy_pct": accuracy_pct,
            "avg_assessment_score": avg_score,
            "course_assessments": [
                {
                    "course_name": c["course_name"],
                    "score": c["final_assessment_score"],
                    "passed": (c["final_assessment_score"] or 0) >= 50,
                    "completed_at": c["completed_at"],
                }
                for c in courses_data if c.get("final_assessment_score") is not None
            ],
            "weak_skills": weak_skills,
            "strong_skills": strong_skills,
            "recent_attempts": recent_attempts,
        },
        # Section E: Project Progress & Reviews
        "project_progress": {
            "total_projects": len(projects_data),
            "completed_projects": projects_completed,
            "in_progress_projects": projects_in_progress,
            "projects": projects_data,
        },
        # Section F: Mentorship History
        "mentorship_history": {
            "sessions": sessions_data,
            "upcoming_session": upcoming_session,
            "guidance_notes": notes_data,
            "feedback_history": feedbacks_data,
        },
        # Section G: Mentor Insights
        "insights": insights,
        # Section H: Visualizations
        "visualizations": visualizations,

        # Legacy top-level keys for existing tests & compatibility
        "student_id": student.student_id,
        "student_name": f"{student.first_name} {student.last_name}",
        "target_career_name": student.career.career_name if student.career else "Target Career",
        "readiness_pct": readiness_pct,
        "mastery_pct": int(round(avg_mastery)),
        "courses_completed": courses_completed,
        "projects_completed": projects_completed,
        "courses": courses_data,
        "course_progress": courses_data,
        "projects": projects_data,
        "roadmap_steps": steps_data,
        "learning_activities": activities_data,
        "overall_progress": overall_progress,
    }


@router.post("/api/mentor/students/{student_id}/progress-feedback", response_model=MessageResponse)
def submit_student_progress_feedback(
    student_id: str,
    payload: MentorProgressFeedbackRequest,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Submits mentor progress feedback, identifying strengths, areas for improvement,
    recommended actions/focus skills, and follow-up guidance.
    Persists to MentorGuidanceNote and MentorFeedback, and dispatches in-app notification.
    """
    if not check_mentor_student_authorized(current_mentor, student_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: Student '{student_id}' is not an active mentee of yours.",
        )

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    now_date = datetime.now().strftime("%Y-%m-%d")

    # 1. Save MentorGuidanceNote
    full_guidance = (
        f"Strengths: {payload.strengths.strip()}\n"
        f"Areas for Improvement: {payload.improvement_areas.strip()}\n"
        f"Recommended Next Action: {payload.recommended_action.strip()}"
    )
    if payload.comments:
        full_guidance += f"\nAdditional Notes: {payload.comments.strip()}"

    guidance_note = MentorGuidanceNote(
        mentor_id=current_mentor.mentor_id,
        student_id=student_id,
        notes=full_guidance,
        action_items=payload.recommended_action.strip(),
        created_at=now_str,
    )
    db.add(guidance_note)

    # 2. If project_id or skill_id is provided, or student has a project/skill, link MentorFeedback
    target_project_id = payload.project_id
    if not target_project_id:
        p_prog = db.query(StudentProjectProgress).filter(StudentProjectProgress.student_id == student_id).first()
        if p_prog:
            target_project_id = p_prog.project_id
        else:
            first_p = db.query(Project).first()
            if first_p:
                target_project_id = first_p.project_id

    target_skill_id = payload.skill_id
    if not target_skill_id:
        s_skill = db.query(StudentSkill).filter(StudentSkill.student_id == student_id).first()
        if s_skill:
            target_skill_id = s_skill.skill_id
        else:
            first_s = db.query(Skill).first()
            if first_s:
                target_skill_id = first_s.skill_id

    if target_project_id and target_skill_id:
        fb_id = f"FB-{uuid.uuid4().hex[:8].upper()}"
        feedback_entry = MentorFeedback(
            feedback_id=fb_id,
            mentor_id=current_mentor.mentor_id,
            student_id=student_id,
            project_id=target_project_id,
            skill_id=target_skill_id,
            rating=payload.rating or 5,
            strengths=payload.strengths.strip(),
            improvement_areas=payload.improvement_areas.strip(),
            comments=payload.comments.strip() if payload.comments else payload.recommended_action.strip(),
            recommended_action=payload.recommended_action.strip(),
            feedback_date=now_date,
        )
        db.add(feedback_entry)

        # Calibrate mentor score for the skill
        mentor_score = min(100, max(20, int(round(((payload.rating or 5) / 5.0) * 100))))
        update_or_create_student_skill(
            db=db,
            student_id=student_id,
            skill_id=target_skill_id,
            mentor_score=mentor_score,
        )

    # 3. Dispatch in-app notification to student
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        student_id=student_id,
        mentor_id=current_mentor.mentor_id,
        type="feedback_submitted",
        title="New Progress Feedback from Your Mentor",
        message=f"Mentor {current_mentor.name} submitted progress feedback and next-step recommendations for you.",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return MessageResponse(
        message="Mentor progress feedback and recommendations submitted successfully.",
        data={"student_id": student_id, "timestamp": now_str},
    )


@router.get("/api/mentor/students/{student_id}/assessments")
def get_student_assessments(
    student_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Retrieves skill assessment diagnostics, attempt history, and scores for an assigned student.
    """
    mentor_id = current_mentor.mentor_id
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id == mentor_id,
            MentorStudentAssignment.student_id == student_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: Student '{student_id}' is not assigned to you.",
        )

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    answers = (
        db.query(AssessmentAnswer)
        .filter(AssessmentAnswer.student_id == student_id)
        .order_by(desc(AssessmentAnswer.attempt_date))
        .all()
    )

    total_answers = len(answers)
    correct_count = sum(1 for a in answers if a.correct)
    accuracy_pct = int(round((correct_count / total_answers) * 100)) if total_answers else 0

    skills = db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
    skill_breakdown = [
        {
            "skill_id": s.skill_id,
            "skill_name": s.skill.skill_name if s.skill else s.skill_id,
            "assessment_score": s.assessment_score or 0,
            "final_mastery": s.final_mastery or 0,
            "mastery_level": s.mastery_level or "Beginner",
            "is_benchmark_met": (s.assessment_score or 0) >= 75,
        }
        for s in skills
    ]

    history = [
        {
            "attempt_id": a.attempt_id,
            "question_id": a.question_id,
            "question_text": a.question.question if a.question else "Question",
            "skill_name": a.question.skill.skill_name if (a.question and a.question.skill) else a.question_id,
            "correct": a.correct,
            "time_taken_seconds": a.time_taken_seconds,
            "attempt_date": a.attempt_date,
        }
        for a in answers[:50]
    ]

    return {
        "student_id": student.student_id,
        "student_name": f"{student.first_name} {student.last_name}",
        "total_questions_attempted": total_answers,
        "correct_answers": correct_count,
        "accuracy_percentage": accuracy_pct,
        "skills_monitored": len(skills),
        "skill_breakdown": skill_breakdown,
        "recent_attempts": history,
        "assessments": history,
    }


@router.post("/api/mentor/students/assign", response_model=MessageResponse)
def assign_student(
    payload: StudentAssignmentRequest,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    existing = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id == current_mentor.mentor_id,
            MentorStudentAssignment.student_id == payload.student_id,
        )
        .first()
    )
    if existing:
        existing.status = "active"
        db.commit()
        return MessageResponse(message=f"Student '{student.first_name} {student.last_name}' assignment is already active.")

    assignment = MentorStudentAssignment(
        mentor_id=current_mentor.mentor_id,
        student_id=payload.student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d"),
        status="active",
        notes=payload.notes,
    )
    db.add(assignment)
    db.commit()
    return MessageResponse(message=f"Successfully assigned student '{student.first_name} {student.last_name}'.")


# =========================================================================
# MENTORSHIP SESSIONS MANAGEMENT
# =========================================================================

@router.get("/api/mentor/sessions")
def get_mentor_sessions_list(
    status_filter: Optional[str] = None,
    date_filter: Optional[str] = None,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Returns all mentorship sessions for the authenticated mentor.
    Supports status filtering (today, upcoming, completed, cancelled, rescheduled) and date filtering.
    """
    query = (
        db.query(MentorshipSession)
        .filter(MentorshipSession.mentor_id == current_mentor.mentor_id)
        .order_by(MentorshipSession.session_date.desc(), MentorshipSession.start_time.asc())
    )

    if status_filter:
        s_filt = status_filter.strip().lower()
        if s_filt == "today":
            today_str = datetime.now().strftime("%Y-%m-%d")
            query = query.filter(MentorshipSession.session_date == today_str)
        elif s_filt == "upcoming":
            query = query.filter(MentorshipSession.status.in_(["upcoming", "rescheduled"]))
        else:
            query = query.filter(MentorshipSession.status == s_filt)

    if date_filter:
        query = query.filter(MentorshipSession.session_date == date_filter.strip())

    sessions = query.all()
    results = []
    for s in sessions:
        st = db.query(Student).filter(Student.student_id == s.student_id).first()
        dur = calculate_duration_minutes(s.start_time, s.end_time)
        results.append({
            "session_id": s.session_id,
            "student_id": s.student_id,
            "student_name": f"{st.first_name} {st.last_name}" if st else "Student",
            "student_email": st.email if st else "",
            "topic": s.topic,
            "session_date": s.session_date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration_minutes": dur,
            "platform": s.platform,
            "meeting_link": s.meeting_link,
            "status": s.status,
            "notes": s.notes,
            "created_at": s.created_at,
        })
    return results


@router.get("/api/mentor/sessions/{session_id}")
def get_mentor_session_detail(
    session_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Retrieves details for a specific mentorship session.
    Enforces that mentor owns this session (returns 403 Forbidden if owned by another mentor).
    """
    sess = db.query(MentorshipSession).filter(MentorshipSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Mentorship session not found.")
    if sess.mentor_id != current_mentor.mentor_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another mentor's session.")

    st = db.query(Student).filter(Student.student_id == sess.student_id).first()
    dur = calculate_duration_minutes(sess.start_time, sess.end_time)
    return {
        "session_id": sess.session_id,
        "mentor_id": sess.mentor_id,
        "student_id": sess.student_id,
        "student_name": f"{st.first_name} {st.last_name}" if st else "Student",
        "student_email": st.email if st else "",
        "topic": sess.topic,
        "session_date": sess.session_date,
        "start_time": sess.start_time,
        "end_time": sess.end_time,
        "duration_minutes": dur,
        "platform": sess.platform,
        "meeting_link": sess.meeting_link,
        "status": sess.status,
        "notes": sess.notes,
        "created_at": sess.created_at,
    }


@router.post("/api/mentor/sessions", response_model=MessageResponse)
def create_mentorship_session(
    payload: MentorshipSessionCreate,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    # 1. Verify active assignment
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id == current_mentor.mentor_id,
            MentorStudentAssignment.student_id == payload.student_id,
            MentorStudentAssignment.status == "active",
        )
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot schedule sessions with students not actively assigned to you.",
        )

    # 2. Date format and past-date validation
    clean_date = payload.session_date.strip()
    try:
        sess_date_obj = datetime.strptime(clean_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session date format. Expected YYYY-MM-DD.")

    if sess_date_obj < datetime.now().date():
        raise HTTPException(status_code=400, detail="Cannot schedule sessions in the past.")

    clean_start = payload.start_time.strip()
    clean_end = payload.end_time.strip()

    # 3. Validate end time > start time
    s_min = parse_time_minutes(clean_start)
    e_min = parse_time_minutes(clean_end)
    if s_min is not None and e_min is not None and e_min <= s_min:
        raise HTTPException(status_code=400, detail="Session end time must be after start time.")

    # 4. Meeting link format validation
    meeting_link = (payload.meeting_link or "").strip()
    if meeting_link:
        if not (meeting_link.startswith("http://") or meeting_link.startswith("https://")):
            raise HTTPException(status_code=400, detail="Meeting link must be a valid URL starting with http:// or https://.")
    else:
        meeting_link = "https://meet.google.com/pathforge-ai"

    # 5. Overlap and conflict check
    conflict_err = check_session_conflict(
        db=db,
        session_date=clean_date,
        start_time=clean_start,
        end_time=clean_end,
        mentor_id=current_mentor.mentor_id,
        student_id=payload.student_id,
    )
    if conflict_err:
        raise HTTPException(status_code=400, detail=conflict_err)

    new_id = f"SES-{uuid.uuid4().hex[:6].upper()}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sess = MentorshipSession(
        session_id=new_id,
        mentor_id=current_mentor.mentor_id,
        student_id=payload.student_id,
        topic=payload.topic.strip(),
        session_date=clean_date,
        start_time=clean_start,
        end_time=clean_end,
        platform=payload.platform or "Google Meet",
        meeting_link=meeting_link,
        status="upcoming",
        notes=payload.notes.strip() if payload.notes else None,
        created_at=now_str,
    )
    db.add(sess)

    # In-app notification to student
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        student_id=payload.student_id,
        mentor_id=current_mentor.mentor_id,
        type="session_scheduled",
        title="Mentorship Session Scheduled",
        message=f"Mentor {current_mentor.name} scheduled a session '{payload.topic.strip()}' on {clean_date} at {clean_start}.",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return MessageResponse(
        message=f"Mentorship session scheduled successfully (ID: {new_id}).",
        data={"session_id": new_id},
    )


@router.patch("/api/mentor/sessions/{session_id}/status", response_model=MessageResponse)
def update_session_status(
    session_id: str,
    payload: MentorshipSessionStatusUpdate,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    sess = db.query(MentorshipSession).filter(MentorshipSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Mentorship session not found.")
    if sess.mentor_id != current_mentor.mentor_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot modify another mentor's session.")

    valid_statuses = {"upcoming", "completed", "cancelled", "rescheduled"}
    target_status = payload.status.lower().strip()
    if target_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid session status '{payload.status}'. Valid: {list(valid_statuses)}")

    # Enforce state machine transitions
    if sess.status == "completed" and target_status != "completed":
        raise HTTPException(status_code=400, detail="Cannot change a completed session.")
    if sess.status == "cancelled" and target_status != "cancelled":
        raise HTTPException(status_code=400, detail="Cannot reactivate or complete a cancelled session.")

    sess.status = target_status
    if payload.notes is not None:
        sess.notes = payload.notes.strip()
    if target_status == "cancelled" and payload.reason:
        sess.notes = f"{sess.notes or ''} [Cancellation reason: {payload.reason.strip()}]".strip()

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if target_status == "completed":
        notif = Notification(
            notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            student_id=sess.student_id,
            mentor_id=current_mentor.mentor_id,
            type="session_completed",
            title="Mentorship Session Completed",
            message=f"Your mentorship session '{sess.topic}' with mentor {current_mentor.name} was marked completed.",
            is_read=False,
            created_at=now_str,
        )
        db.add(notif)
    elif target_status == "cancelled":
        reason_txt = f" Reason: {payload.reason}" if payload.reason else ""
        notif = Notification(
            notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            student_id=sess.student_id,
            mentor_id=current_mentor.mentor_id,
            type="session_cancelled",
            title="Mentorship Session Cancelled",
            message=f"Your mentorship session '{sess.topic}' with mentor {current_mentor.name} has been cancelled.{reason_txt}",
            is_read=False,
            created_at=now_str,
        )
        db.add(notif)

    db.commit()
    return MessageResponse(message=f"Session status updated to '{target_status}'.")


@router.patch("/api/mentor/sessions/{session_id}/reschedule", response_model=MessageResponse)
def reschedule_mentorship_session(
    session_id: str,
    payload: MentorshipSessionRescheduleRequest,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    sess = db.query(MentorshipSession).filter(MentorshipSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Mentorship session not found.")
    if sess.mentor_id != current_mentor.mentor_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot modify another mentor's session.")

    if sess.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot reschedule an already {sess.status} session.")

    clean_date = payload.session_date.strip()
    try:
        new_date_obj = datetime.strptime(clean_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session date format. Expected YYYY-MM-DD.")

    if new_date_obj < datetime.now().date():
        raise HTTPException(status_code=400, detail="Cannot reschedule sessions to a past date.")

    clean_start = payload.start_time.strip()
    clean_end = payload.end_time.strip()

    # Validate end time > start time
    s_min = parse_time_minutes(clean_start)
    e_min = parse_time_minutes(clean_end)
    if s_min is not None and e_min is not None and e_min <= s_min:
        raise HTTPException(status_code=400, detail="Session end time must be after start time.")

    # Check conflict
    conflict_err = check_session_conflict(
        db=db,
        session_date=clean_date,
        start_time=clean_start,
        end_time=clean_end,
        mentor_id=current_mentor.mentor_id,
        student_id=sess.student_id,
        exclude_session_id=session_id,
    )
    if conflict_err:
        raise HTTPException(status_code=400, detail=conflict_err)

    sess.session_date = clean_date
    sess.start_time = clean_start
    sess.end_time = clean_end
    if payload.meeting_link:
        clean_link = payload.meeting_link.strip()
        if clean_link and not (clean_link.startswith("http://") or clean_link.startswith("https://")):
            raise HTTPException(status_code=400, detail="Meeting link must be a valid URL starting with http:// or https://.")
        sess.meeting_link = clean_link
    if payload.notes:
        sess.notes = payload.notes.strip()
    sess.status = "rescheduled"

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        student_id=sess.student_id,
        mentor_id=current_mentor.mentor_id,
        type="session_rescheduled",
        title="Mentorship Session Rescheduled",
        message=f"Mentor {current_mentor.name} rescheduled your session '{sess.topic}' to {clean_date} at {clean_start}.",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return MessageResponse(message=f"Session rescheduled successfully for {sess.session_date} at {sess.start_time}.")


# =========================================================================
# PROJECT REVIEWS (RUBRIC-BASED & EVIDENCE CALIBRATION)
# =========================================================================

@router.get("/api/mentor/project-reviews")
def get_project_reviews_for_mentor(
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Returns student projects available for review from assigned students.
    """
    assignments = (
        db.query(MentorStudentAssignment)
        .filter(MentorStudentAssignment.mentor_id == current_mentor.mentor_id)
        .all()
    )
    student_ids = [a.student_id for a in assignments]

    projects = db.query(Project).all()
    project_map = {p.project_id: p for p in projects}

    # Fetch submissions
    submissions = (
        db.query(StudentProjectProgress)
        .filter(StudentProjectProgress.student_id.in_(student_ids))
        .all()
    )

    seen_pairs = set()
    results = []
    for sub in submissions:
        p = project_map.get(sub.project_id)
        st = db.query(Student).filter(Student.student_id == sub.student_id).first()
        if not p or not st:
            continue

        seen_pairs.add((sub.student_id, sub.project_id))

        # Check existing review
        rev = (
            db.query(MentorFeedback)
            .filter(
                MentorFeedback.mentor_id == current_mentor.mentor_id,
                MentorFeedback.student_id == sub.student_id,
                MentorFeedback.project_id == sub.project_id,
            )
            .first()
        )

        results.append({
            "feedback_id": rev.feedback_id if rev else None,
            "student_id": sub.student_id,
            "student_name": f"{st.first_name} {st.last_name}",
            "project_id": sub.project_id,
            "project_name": p.project_name,
            "difficulty": p.difficulty,
            "github_url": sub.github_url or "https://github.com/pathforge-student/project-demo",
            "progress_percentage": sub.progress_percentage,
            "status": sub.status,
            "has_review": rev is not None,
            "review": {
                "feedback_id": rev.feedback_id,
                "rating": rev.rating,
                "comments": rev.comments,
                "strengths": rev.strengths,
                "improvement_areas": rev.improvement_areas,
                "feedback_date": rev.feedback_date,
            } if rev else None,
        })

    # Also include any mentor feedbacks submitted for assigned students
    all_feedbacks = (
        db.query(MentorFeedback)
        .filter(MentorFeedback.mentor_id == current_mentor.mentor_id)
        .all()
    )
    for fb in all_feedbacks:
        if (fb.student_id, fb.project_id) in seen_pairs:
            continue
        p = project_map.get(fb.project_id)
        st = db.query(Student).filter(Student.student_id == fb.student_id).first()
        if not st:
            continue
        seen_pairs.add((fb.student_id, fb.project_id))
        results.append({
            "feedback_id": fb.feedback_id,
            "student_id": fb.student_id,
            "student_name": f"{st.first_name} {st.last_name}",
            "project_id": fb.project_id,
            "project_name": p.project_name if p else fb.project_id,
            "difficulty": p.difficulty if p else "Intermediate",
            "github_url": "https://github.com/pathforge-student/project-demo",
            "progress_percentage": 100,
            "status": "completed",
            "has_review": True,
            "review": {
                "feedback_id": fb.feedback_id,
                "rating": fb.rating,
                "comments": fb.comments,
                "strengths": fb.strengths,
                "improvement_areas": fb.improvement_areas,
                "feedback_date": fb.feedback_date,
            },
        })

    return results


@router.post("/api/mentor/project-reviews", response_model=MessageResponse)
def submit_project_review(
    payload: ProjectReviewCreate,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Submits an authenticated project review with rubric ratings.
    Persists review in database and recalculates final skill mastery with evidence weights.
    """
    # 1. Verify student assignment
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id == current_mentor.mentor_id,
            MentorStudentAssignment.student_id == payload.student_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot review projects for students not assigned to you.",
        )

    # 2. Resolve skill ID
    skill = db.query(Skill).filter(Skill.skill_id == payload.skill_id).first()
    if not skill:
        skill = db.query(Skill).filter(Skill.skill_name.ilike(payload.skill_id)).first()
    target_skill_id = skill.skill_id if skill else payload.skill_id

    # 3. Create or update MentorFeedback record
    existing = (
        db.query(MentorFeedback)
        .filter(
            MentorFeedback.mentor_id == current_mentor.mentor_id,
            MentorFeedback.student_id == payload.student_id,
            MentorFeedback.project_id == payload.project_id,
        )
        .first()
    )

    feedback_date = datetime.now().strftime("%Y-%m-%d")
    if existing:
        fb_id = existing.feedback_id
        existing.rating = payload.rating
        existing.strengths = payload.strengths
        existing.improvement_areas = payload.improvement_areas
        existing.comments = payload.comments
        existing.recommended_action = payload.recommended_action or "Approved and progress confirmed"
        existing.feedback_date = feedback_date
    else:
        fb_id = f"FB-{uuid.uuid4().hex[:8].upper()}"
        new_feedback = MentorFeedback(
            feedback_id=fb_id,
            mentor_id=current_mentor.mentor_id,
            student_id=payload.student_id,
            project_id=payload.project_id,
            skill_id=target_skill_id,
            rating=payload.rating,
            strengths=payload.strengths,
            improvement_areas=payload.improvement_areas,
            comments=payload.comments,
            recommended_action=payload.recommended_action or "Approved and progress confirmed",
            feedback_date=feedback_date,
        )
        db.add(new_feedback)

    # Update or create student project progress
    proj_prog = (
        db.query(StudentProjectProgress)
        .filter(
            StudentProjectProgress.student_id == payload.student_id,
            StudentProjectProgress.project_id == payload.project_id,
        )
        .first()
    )
    if not proj_prog:
        proj_prog = StudentProjectProgress(
            student_id=payload.student_id,
            project_id=payload.project_id,
            status="completed",
            progress_percentage=100,
            completed_at=feedback_date,
        )
        db.add(proj_prog)
    else:
        proj_prog.status = "completed"
        proj_prog.progress_percentage = 100
        proj_prog.completed_at = feedback_date

    # 4. Calibrate demonstrated skill evidence: 1-5 rating -> 20-100% scale
    mentor_score = min(100, max(20, int(round((payload.rating / 5.0) * 100))))

    update_or_create_student_skill(
        db=db,
        student_id=payload.student_id,
        skill_id=target_skill_id,
        mentor_score=mentor_score,
    )

    # In-app notification to student
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        student_id=payload.student_id,
        mentor_id=current_mentor.mentor_id,
        type="feedback_submitted",
        title="Project Review Feedback Available",
        message=f"Mentor {current_mentor.name} evaluated your project submission with a {payload.rating}/5 rating and feedback.",
        is_read=False,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(notif)

    db.commit()
    return MessageResponse(
        message=f"Project review saved. Mentor evidence calibrated to {mentor_score}% for skill {target_skill_id}.",
        data={"feedback_id": fb_id},
    )


@router.put("/api/mentor/project-reviews/{feedback_id}", response_model=MessageResponse)
def update_project_review(
    feedback_id: str,
    payload: ProjectReviewUpdateRequest,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Updates an existing project review and recalibrates skill evidence.
    Enforces that only the authoring mentor can update this review.
    """
    fb = db.query(MentorFeedback).filter(MentorFeedback.feedback_id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Project review not found.")
    if fb.mentor_id != current_mentor.mentor_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot modify another mentor's project review.")

    if payload.strengths is not None:
        fb.strengths = payload.strengths.strip()
    if payload.improvement_areas is not None:
        fb.improvement_areas = payload.improvement_areas.strip()
    if payload.comments is not None:
        fb.comments = payload.comments.strip()
    if payload.recommended_action is not None:
        fb.recommended_action = payload.recommended_action.strip()

    if payload.rating is not None:
        fb.rating = payload.rating
        mentor_score = min(100, max(20, int(round((payload.rating / 5.0) * 100))))
        update_or_create_student_skill(
            db=db,
            student_id=fb.student_id,
            skill_id=fb.skill_id,
            mentor_score=mentor_score,
        )

    fb.feedback_date = datetime.now().strftime("%Y-%m-%d")
    db.commit()

    return MessageResponse(message="Project review updated and skill evidence recalibrated.")


# =========================================================================
# CAREER GUIDANCE & ROADMAP SUPPLEMENTATION
# =========================================================================

@router.get("/api/mentor/career-guidance/{student_id}")
def get_career_guidance(
    student_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    # Verify assignment
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id == current_mentor.mentor_id,
            MentorStudentAssignment.student_id == student_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=403, detail="Student not assigned to you.")

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    career = student.career
    career_skills = career.skills if career else []

    student_skills = {
        s.skill_id: s
        for s in db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
    }

    # Skill gaps breakdown
    gaps = []
    for cs in career_skills:
        demonstrated = student_skills.get(cs.skill_id)
        current_mastery = demonstrated.final_mastery if demonstrated else 0
        req_level = cs.required_level
        req_target = 80 if req_level == "Advanced" else (60 if req_level == "Intermediate" else 40)
        gap_size = max(0, req_target - current_mastery)

        gaps.append({
            "skill_id": cs.skill_id,
            "skill_name": cs.skill.skill_name if cs.skill else cs.skill_id,
            "required_level": req_level,
            "target_score": req_target,
            "current_mastery": current_mastery,
            "gap_size": gap_size,
            "is_core": cs.is_core_skill,
        })

    # Student roadmap steps
    roadmap_steps = (
        db.query(StudentRoadmapStep)
        .filter(StudentRoadmapStep.student_id == student_id)
        .order_by(StudentRoadmapStep.step_number)
        .all()
    )
    roadmap_summary = [
        {
            "step_id": rs.id,
            "step_number": rs.step_number,
            "milestone_name": rs.milestone_name,
            "skill_id": rs.skill_id,
            "skill_name": rs.skill.skill_name if rs.skill else (rs.skill_id or "General Skill"),
            "status": rs.status,
            "is_completed": rs.status == "completed",
        }
        for rs in roadmap_steps
    ]

    # Saved guidance notes
    notes = (
        db.query(MentorGuidanceNote)
        .filter(
            MentorGuidanceNote.mentor_id == current_mentor.mentor_id,
            MentorGuidanceNote.student_id == student_id,
        )
        .order_by(desc(MentorGuidanceNote.created_at))
        .all()
    )

    return {
        "student_id": student_id,
        "student_name": f"{student.first_name} {student.last_name}",
        "target_career_id": career.career_id if career else None,
        "target_career_name": career.career_name if career else "Career",
        "career_description": career.description if career else "",
        "skill_gaps": gaps,
        "roadmap_steps": roadmap_summary,
        "guidance_notes": [
            {
                "id": n.id,
                "notes": n.notes,
                "recommended_skills": [s.strip() for s in (n.recommended_skills or "").split(",") if s.strip()],
                "recommended_courses": [c.strip() for c in (n.recommended_courses or "").split(",") if c.strip()],
                "recommended_projects": [p.strip() for p in (n.recommended_projects or "").split(",") if p.strip()],
                "preparation_activities": [a.strip() for a in (n.preparation_activities or "").split(",") if a.strip()],
                "action_items": [i.strip() for i in (n.action_items or "").split(",") if i.strip()],
                "private_notes": n.private_notes or "",
                "follow_up_date": n.follow_up_date,
                "status": n.status or "active",
                "created_at": n.created_at,
            }
            for n in notes
        ],
    }


@router.post("/api/mentor/career-guidance/{student_id}", response_model=MessageResponse)
def save_career_guidance(
    student_id: str,
    payload: MentorGuidanceNoteCreate,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    # Verify assignment
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id == current_mentor.mentor_id,
            MentorStudentAssignment.student_id == student_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=403, detail="Student not assigned to you.")

    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    target_career_id = student.target_career_id if student else None
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    rec_skills = ", ".join(payload.recommended_skills) if payload.recommended_skills else ""
    rec_courses = ", ".join(payload.recommended_courses) if payload.recommended_courses else ""
    rec_projects = ", ".join(payload.recommended_projects) if payload.recommended_projects else ""
    prep_acts = ", ".join(payload.preparation_activities) if payload.preparation_activities else ""
    action_items = ", ".join(payload.action_items) if payload.action_items else ""

    note = MentorGuidanceNote(
        mentor_id=current_mentor.mentor_id,
        student_id=student_id,
        notes=payload.notes.strip(),
        recommended_skills=rec_skills,
        recommended_courses=rec_courses,
        recommended_projects=rec_projects,
        preparation_activities=prep_acts,
        action_items=action_items,
        private_notes=payload.private_notes.strip() if payload.private_notes else None,
        target_career_id=target_career_id,
        follow_up_date=payload.follow_up_date.strip() if payload.follow_up_date else None,
        status="active",
        created_at=now_str,
    )
    db.add(note)

    # In-app notification to student
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        student_id=student_id,
        mentor_id=current_mentor.mentor_id,
        type="career_guidance",
        title=f"Career Guidance from {current_mentor.name}",
        message=f"Mentor {current_mentor.name} shared new career advice and recommended action items for your learning path.",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)
    db.commit()

    return MessageResponse(message="Career guidance recommendations saved successfully.")


@router.get("/api/student/career-guidance", response_model=List[StudentCareerGuidanceItem])
def get_student_career_guidance(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Retrieves all career guidance notes shared with the authenticated student by their assigned mentors.
    Strictly omits private mentor notes to preserve mentor confidentiality.
    """
    notes = (
        db.query(MentorGuidanceNote)
        .filter(MentorGuidanceNote.student_id == current_student.student_id)
        .order_by(desc(MentorGuidanceNote.created_at))
        .all()
    )

    results = []
    for n in notes:
        m = n.mentor
        mentor_name = m.name if m else "Assigned Mentor"
        mentor_title = m.title if m else "Industry Mentor"
        mentor_company = m.company if m else "PathForge Network"
        mentor_avatar = m.profile_picture if m else None

        results.append(
            StudentCareerGuidanceItem(
                id=n.id,
                mentor_id=n.mentor_id,
                mentor_name=mentor_name,
                mentor_title=mentor_title,
                mentor_company=mentor_company,
                mentor_avatar=mentor_avatar,
                target_career_name=current_student.career.career_name if current_student.career else None,
                notes=n.notes,
                recommended_skills=[s.strip() for s in (n.recommended_skills or "").split(",") if s.strip()],
                recommended_courses=[c.strip() for c in (n.recommended_courses or "").split(",") if c.strip()],
                recommended_projects=[p.strip() for p in (n.recommended_projects or "").split(",") if p.strip()],
                preparation_activities=[a.strip() for a in (n.preparation_activities or "").split(",") if a.strip()],
                action_items=[i.strip() for i in (n.action_items or "").split(",") if i.strip()],
                follow_up_date=n.follow_up_date,
                status=n.status or "active",
                created_at=n.created_at,
            )
        )
    return results


@router.patch("/api/student/career-guidance/{guidance_id}/status", response_model=MessageResponse)
def update_guidance_status(
    guidance_id: int,
    payload: Dict[str, Any],
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    note = (
        db.query(MentorGuidanceNote)
        .filter(
            MentorGuidanceNote.id == guidance_id,
            MentorGuidanceNote.student_id == current_student.student_id,
        )
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Career guidance record not found.")

    new_status = payload.get("status", "reviewed").strip()
    note.status = new_status
    db.commit()
    return MessageResponse(message=f"Guidance status updated to '{new_status}'.")


# =========================================================================
# MESSAGING & COMMUNICATION
# =========================================================================

@router.get("/api/mentor/messages")
@router.get("/api/mentor/conversations")
def get_mentor_conversations(
    student_id: Optional[str] = None,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    mentor_ids = [current_mentor.mentor_id]
    if current_mentor.user_id and current_mentor.user_id not in mentor_ids:
        mentor_ids.append(current_mentor.user_id)

    if student_id:
        if not check_mentor_student_authorized(current_mentor, student_id, db):
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: Student is not assigned to you.",
            )

        # Mark unread incoming messages from this student as read
        db.query(MentorMessage).filter(
            MentorMessage.mentor_id.in_(mentor_ids),
            MentorMessage.student_id == student_id,
            MentorMessage.sender_role == "student",
            MentorMessage.is_read == False,
        ).update({"is_read": True}, synchronize_session=False)
        db.commit()

        msgs = (
            db.query(MentorMessage)
            .filter(
                MentorMessage.mentor_id.in_(mentor_ids),
                MentorMessage.student_id == student_id,
            )
            .order_by(MentorMessage.created_at.asc())
            .all()
        )
        return [
            {
                "message_id": m.message_id,
                "sender_role": m.sender_role,
                "sender_id": m.sender_id,
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at,
            }
            for m in msgs
        ]

    # Return grouped conversations for all assigned or accepted mentees
    assignments = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id.in_(mentor_ids),
            MentorStudentAssignment.status == "active",
        )
        .all()
    )
    student_ids = list(dict.fromkeys([a.student_id for a in assignments]))

    # Also include students from accepted requests
    accepted_reqs = (
        db.query(MentorshipRequest)
        .filter(
            MentorshipRequest.mentor_id.in_(mentor_ids),
            MentorshipRequest.status == "accepted",
        )
        .all()
    )
    for ar in accepted_reqs:
        if ar.student_id not in student_ids:
            student_ids.append(ar.student_id)

    conversations = []
    for sid in student_ids:
        st = db.query(Student).filter(Student.student_id == sid).first()
        if not st:
            continue

        latest_msg = (
            db.query(MentorMessage)
            .filter(MentorMessage.mentor_id.in_(mentor_ids), MentorMessage.student_id == sid)
            .order_by(desc(MentorMessage.created_at))
            .first()
        )

        unread_count = (
            db.query(MentorMessage)
            .filter(
                MentorMessage.mentor_id.in_(mentor_ids),
                MentorMessage.student_id == sid,
                MentorMessage.sender_role == "student",
                MentorMessage.is_read == False,
            )
            .count()
        )

        conversations.append({
            "student_id": sid,
            "student_name": f"{st.first_name} {st.last_name}",
            "career_name": st.career.career_name if st.career else "Data Science",
            "latest_message": latest_msg.content if latest_msg else "No messages yet.",
            "latest_time": latest_msg.created_at if latest_msg else "",
            "unread_count": unread_count,
        })

    return conversations


@router.post("/api/mentor/messages", response_model=MessageResponse)
def send_mentor_message(
    payload: MentorMessageCreate,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    content = payload.content.strip() if payload.content else ""
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
    if len(content) > 5000:
        raise HTTPException(status_code=400, detail="Message content exceeds maximum allowed length of 5000 characters.")

    student = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    if not check_mentor_student_authorized(current_mentor, payload.student_id, db):
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: Student is not assigned to you.",
        )

    msg = MentorMessage(
        message_id=f"MSG-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=current_mentor.mentor_id,
        student_id=payload.student_id,
        sender_role="mentor",
        sender_id=current_mentor.mentor_id,
        content=content,
        is_read=False,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(msg)

    # Trigger student notification for the new incoming message
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        student_id=payload.student_id,
        type="message",
        title=f"New message from Mentor {current_mentor.name}",
        message=content[:140] + ("..." if len(content) > 140 else ""),
        is_read=False,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(notif)
    db.commit()

    return MessageResponse(message="Message sent successfully.")


@router.patch("/api/mentor/messages/{message_id}/read", response_model=MessageResponse)
def mark_message_as_read(
    message_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    mentor_ids = [current_mentor.mentor_id]
    if current_mentor.user_id and current_mentor.user_id not in mentor_ids:
        mentor_ids.append(current_mentor.user_id)

    msg = db.query(MentorMessage).filter(MentorMessage.message_id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    if msg.mentor_id not in mentor_ids:
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: Message does not belong to you.",
        )
    msg.is_read = True
    db.commit()
    return MessageResponse(message="Message marked as read.")


@router.patch("/api/mentor/messages/read-thread", response_model=MessageResponse)
def mark_mentor_thread_as_read(
    student_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    mentor_ids = [current_mentor.mentor_id]
    if current_mentor.user_id and current_mentor.user_id not in mentor_ids:
        mentor_ids.append(current_mentor.user_id)

    db.query(MentorMessage).filter(
        MentorMessage.mentor_id.in_(mentor_ids),
        MentorMessage.student_id == student_id,
        MentorMessage.sender_role == "student",
        MentorMessage.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return MessageResponse(message="Conversation thread marked as read.")


@router.get("/api/mentor/messages/unread-count", response_model=UnreadCountResponse)
def get_mentor_unread_message_count(
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    count = (
        db.query(MentorMessage)
        .filter(
            MentorMessage.mentor_id == current_mentor.mentor_id,
            MentorMessage.sender_role == "student",
            MentorMessage.is_read == False,
        )
        .count()
    )
    return UnreadCountResponse(unread_count=count)


@router.get("/api/mentor/notifications/unread-count", response_model=UnreadCountResponse)
def get_mentor_unread_notification_count(
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.mentor_id == current_mentor.mentor_id,
            Notification.is_read == False,
        )
        .count()
    )
    return UnreadCountResponse(unread_count=count)


# =========================================================================
# STUDENT MESSAGING ENDPOINTS
# =========================================================================

@router.get("/api/student/messages")
def get_student_conversations(
    mentor_id: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    sid = current_student.student_id

    if mentor_id:
        # Enforce student-mentor assignment authorization
        assignment = (
            db.query(MentorStudentAssignment)
            .filter(
                MentorStudentAssignment.student_id == sid,
                MentorStudentAssignment.mentor_id == mentor_id,
            )
            .first()
        )
        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: Mentor is not assigned to you.",
            )

        # Mark unread incoming messages from this mentor as read
        db.query(MentorMessage).filter(
            MentorMessage.mentor_id == mentor_id,
            MentorMessage.student_id == sid,
            MentorMessage.sender_role == "mentor",
            MentorMessage.is_read == False,
        ).update({"is_read": True}, synchronize_session=False)
        db.commit()

        msgs = (
            db.query(MentorMessage)
            .filter(
                MentorMessage.student_id == sid,
                MentorMessage.mentor_id == mentor_id,
            )
            .order_by(MentorMessage.created_at.asc())
            .all()
        )
        return [
            {
                "message_id": m.message_id,
                "sender_role": m.sender_role,
                "sender_id": m.sender_id,
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at,
            }
            for m in msgs
        ]

    # Return list of assigned mentor conversations
    assignments = (
        db.query(MentorStudentAssignment)
        .filter(MentorStudentAssignment.student_id == sid)
        .all()
    )
    mentor_ids = [a.mentor_id for a in assignments]

    conversations = []
    for mid in mentor_ids:
        m_obj = db.query(Mentor).filter(Mentor.mentor_id == mid).first()
        if not m_obj:
            continue

        latest_msg = (
            db.query(MentorMessage)
            .filter(MentorMessage.mentor_id == mid, MentorMessage.student_id == sid)
            .order_by(desc(MentorMessage.created_at))
            .first()
        )

        unread_count = (
            db.query(MentorMessage)
            .filter(
                MentorMessage.mentor_id == mid,
                MentorMessage.student_id == sid,
                MentorMessage.sender_role == "mentor",
                MentorMessage.is_read == False,
            )
            .count()
        )

        conversations.append({
            "mentor_id": mid,
            "mentor_name": m_obj.name,
            "mentor_title": m_obj.title or m_obj.expertise or "Mentor",
            "latest_message": latest_msg.content if latest_msg else "No messages yet.",
            "latest_time": latest_msg.created_at if latest_msg else "",
            "unread_count": unread_count,
        })

    return conversations


@router.post("/api/student/messages", response_model=MessageResponse)
def send_student_message(
    payload: StudentMessageCreate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    content = payload.content.strip() if payload.content else ""
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
    if len(content) > 5000:
        raise HTTPException(status_code=400, detail="Message content exceeds maximum allowed length of 5000 characters.")

    mentor = db.query(Mentor).filter(Mentor.mentor_id == payload.mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.student_id == current_student.student_id,
            MentorStudentAssignment.mentor_id == payload.mentor_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: You can only message your assigned mentor.",
        )

    msg = MentorMessage(
        message_id=f"MSG-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=payload.mentor_id,
        student_id=current_student.student_id,
        sender_role="student",
        sender_id=current_student.student_id,
        content=content,
        is_read=False,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(msg)

    # Trigger mentor notification
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=payload.mentor_id,
        student_id=current_student.student_id,
        type="message",
        title=f"New message from {current_student.first_name} {current_student.last_name}",
        message=content[:140] + ("..." if len(content) > 140 else ""),
        is_read=False,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(notif)
    db.commit()

    return MessageResponse(message="Message sent successfully.")


@router.patch("/api/student/messages/{message_id}/read", response_model=MessageResponse)
def mark_student_message_as_read(
    message_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    msg = db.query(MentorMessage).filter(MentorMessage.message_id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    if msg.student_id != current_student.student_id:
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: Message does not belong to you.",
        )
    msg.is_read = True
    db.commit()
    return MessageResponse(message="Message marked as read.")


@router.patch("/api/student/messages/read-thread", response_model=MessageResponse)
def mark_student_thread_as_read(
    mentor_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    db.query(MentorMessage).filter(
        MentorMessage.mentor_id == mentor_id,
        MentorMessage.student_id == current_student.student_id,
        MentorMessage.sender_role == "mentor",
        MentorMessage.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return MessageResponse(message="Conversation thread marked as read.")


@router.get("/api/student/messages/unread-count", response_model=UnreadCountResponse)
def get_student_unread_message_count(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    count = (
        db.query(MentorMessage)
        .filter(
            MentorMessage.student_id == current_student.student_id,
            MentorMessage.sender_role == "mentor",
            MentorMessage.is_read == False,
        )
        .count()
    )
    return UnreadCountResponse(unread_count=count)


@router.get("/api/student/notifications/unread-count", response_model=UnreadCountResponse)
def get_student_unread_notification_count(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.student_id == current_student.student_id,
            Notification.is_read == False,
        )
        .count()
    )
    return UnreadCountResponse(unread_count=count)


# =========================================================================
# NOTIFICATIONS
# =========================================================================

@router.get("/api/mentor/notifications", response_model=List[MentorNotificationResponse])
def get_mentor_notifications(
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    notifs = (
        db.query(Notification)
        .filter(Notification.mentor_id == current_mentor.mentor_id)
        .order_by(desc(Notification.created_at))
        .all()
    )
    return [
        MentorNotificationResponse(
            notification_id=n.notification_id,
            type=n.type,
            title=n.title,
            message=n.message,
            is_read=bool(n.is_read),
            created_at=n.created_at,
        )
        for n in notifs
    ]


@router.patch("/api/mentor/notifications/{notification_id}/read", response_model=MessageResponse)
def mark_mentor_notification_as_read(
    notification_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    if notif.mentor_id != current_mentor.mentor_id:
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: Notification does not belong to you.",
        )
    notif.is_read = True
    db.commit()
    return MessageResponse(message="Notification marked as read.")


@router.patch("/api/mentor/notifications/read-all", response_model=MessageResponse)
def mark_all_mentor_notifications_as_read(
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.mentor_id == current_mentor.mentor_id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return MessageResponse(message="All notifications marked as read.")


# =========================================================================
# RESOURCES, PROFILE & SETTINGS
# =========================================================================

@router.get("/api/mentor/resources")
def get_mentor_resources(
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    resources = (
        db.query(MentorResource)
        .filter(MentorResource.mentor_id == current_mentor.mentor_id)
        .order_by(desc(MentorResource.created_at))
        .all()
    )
    return [
        {
            "resource_id": r.resource_id,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "url": r.url,
            "tags": r.tags,
            "created_at": r.created_at,
        }
        for r in resources
    ]


@router.post("/api/mentor/resources", response_model=MessageResponse)
def create_mentor_resource(
    payload: MentorResourceCreate,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    res = MentorResource(
        resource_id=f"RES-{uuid.uuid4().hex[:6].upper()}",
        mentor_id=current_mentor.mentor_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        url=payload.url.strip(),
        tags=payload.tags or "",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(res)
    db.commit()

    return MessageResponse(message="Learning resource shared successfully.")


@router.delete("/api/mentor/resources/{resource_id}", response_model=MessageResponse)
def delete_mentor_resource(
    resource_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    res = db.query(MentorResource).filter(MentorResource.resource_id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found.")
    if res.mentor_id != current_mentor.mentor_id:
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: Resource belongs to another mentor.",
        )
    db.delete(res)
    db.commit()

    return MessageResponse(message="Resource removed.")


@router.get("/api/mentor/profile", response_model=MentorProfileResponse)
def get_mentor_profile(
    current_mentor: Mentor = Depends(get_current_mentor),
):
    headline = current_mentor.headline or (
        f"{current_mentor.title} at {current_mentor.company}"
        if (current_mentor.title and current_mentor.company)
        else (current_mentor.title or current_mentor.expertise)
    )
    return {
        "mentor_id": current_mentor.mentor_id,
        "name": current_mentor.name,
        "email": current_mentor.email,
        "title": current_mentor.title or current_mentor.expertise,
        "headline": headline,
        "company": current_mentor.company or "PathForge Network",
        "profile_picture": current_mentor.profile_picture or "",
        "experience_years": current_mentor.experience_years,
        "expertise": current_mentor.expertise,
        "skills": current_mentor.skills,
        "bio": current_mentor.bio,
        "education": current_mentor.education or "",
        "certifications": current_mentor.certifications or "",
        "languages": current_mentor.languages or "English",
        "career_specializations": current_mentor.career_specializations or current_mentor.expertise,
        "linkedin_url": current_mentor.linkedin_url or "",
        "github_url": current_mentor.github_url or "",
        "portfolio_url": current_mentor.portfolio_url or "",
        "rating": current_mentor.rating or 4.8,
        "availability": current_mentor.availability or "Available",
        "max_capacity": current_mentor.max_capacity or 15,
        "role": current_mentor.role or "mentor",
        "status": current_mentor.status or "active",
    }


@router.put("/api/mentor/profile", response_model=MessageResponse)
def update_mentor_profile(
    payload: MentorProfileUpdateRequest,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Updates the authenticated mentor's profile.
    Validates required fields, URLs, and numeric bounds.
    Strictly prevents editing any other mentor's profile by binding to current_mentor token identity.
    """
    if payload.name is not None:
        val = payload.name.strip()
        if len(val) < 2:
            raise HTTPException(status_code=400, detail="Full name must be at least 2 characters.")
        current_mentor.name = val

    if payload.title is not None:
        val = payload.title.strip()
        if len(val) < 2:
            raise HTTPException(status_code=400, detail="Professional title must be at least 2 characters.")
        current_mentor.title = val

    if payload.headline is not None:
        current_mentor.headline = payload.headline.strip()

    if payload.company is not None:
        current_mentor.company = payload.company.strip()

    if payload.bio is not None:
        val = payload.bio.strip()
        if len(val) < 5:
            raise HTTPException(status_code=400, detail="Biography must be at least 5 characters.")
        current_mentor.bio = val

    if payload.expertise is not None:
        current_mentor.expertise = payload.expertise.strip()

    if payload.skills is not None:
        current_mentor.skills = payload.skills.strip()

    if payload.experience_years is not None:
        if payload.experience_years < 0 or payload.experience_years > 60:
            raise HTTPException(status_code=400, detail="Years of experience must be between 0 and 60.")
        current_mentor.experience_years = payload.experience_years

    if payload.education is not None:
        current_mentor.education = payload.education.strip()

    if payload.certifications is not None:
        current_mentor.certifications = payload.certifications.strip()

    if payload.languages is not None:
        current_mentor.languages = payload.languages.strip()

    if payload.career_specializations is not None:
        current_mentor.career_specializations = payload.career_specializations.strip()

    # URL validations
    if payload.linkedin_url is not None:
        current_mentor.linkedin_url = validate_url_field("linkedin_url", payload.linkedin_url)

    if payload.github_url is not None:
        current_mentor.github_url = validate_url_field("github_url", payload.github_url)

    if payload.portfolio_url is not None:
        current_mentor.portfolio_url = validate_url_field("portfolio_url", payload.portfolio_url)

    if payload.profile_picture is not None:
        current_mentor.profile_picture = validate_url_field("profile_picture", payload.profile_picture)

    if payload.availability is not None:
        current_mentor.availability = payload.availability.strip()

    if payload.max_capacity is not None:
        if payload.max_capacity < 1 or payload.max_capacity > 50:
            raise HTTPException(status_code=400, detail="Max capacity must be between 1 and 50.")
        current_mentor.max_capacity = payload.max_capacity

    db.commit()
    db.refresh(current_mentor)
    try:
        from services.dataset_sync_service import sync_mentor_to_dataset
        sync_mentor_to_dataset(current_mentor)
    except Exception as sync_err:
        logger.warning(f"Mentor profile update CSV sync note: {sync_err}")

    return MessageResponse(message="Mentor profile updated successfully.")


@router.post("/api/mentor/profile/avatar")
def upload_mentor_avatar(
    file: UploadFile = File(...),
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Uploads a profile picture for the authenticated mentor.
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Allowed formats: JPEG, PNG, WEBP."
        )

    # Save to uploads/avatars directory
    from config import settings
    avatars_dir = settings.DATA_DIR.parent / "uploads" / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "png"
    safe_name = f"avatar_{current_mentor.mentor_id}_{uuid.uuid4().hex[:6]}.{ext}"
    dest_path = avatars_dir / safe_name

    contents = file.file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file too large. Maximum size is 5MB.")

    with open(dest_path, "wb") as out_f:
        out_f.write(contents)

    relative_url = f"/uploads/avatars/{safe_name}"
    current_mentor.profile_picture = relative_url
    db.commit()

    return {
        "message": "Avatar uploaded successfully.",
        "profile_picture": relative_url,
    }


# =========================================================================
# PHASE 10: MENTOR EXPERTISE & SKILLS MANAGEMENT
# =========================================================================

@router.get("/api/mentor/skills", response_model=List[MentorSkillResponse])
def get_mentor_skills(
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Retrieves the mentor's categorized skills.
    If none exist yet in mentor_skills, automatically syncs from mentor's existing skills string.
    """
    skills = (
        db.query(MentorSkill)
        .filter(MentorSkill.mentor_id == current_mentor.mentor_id)
        .order_by(MentorSkill.category, MentorSkill.skill_name)
        .all()
    )

    if not skills and current_mentor.skills:
        raw_skills = [s.strip() for s in current_mentor.skills.split(",") if s.strip()]
        for s_name in raw_skills:
            # Check matching skill in skills table
            matched_skill = db.query(Skill).filter(func.lower(Skill.skill_name) == s_name.lower()).first()
            cat = matched_skill.category if matched_skill else "programming"
            new_ms = MentorSkill(
                mentor_id=current_mentor.mentor_id,
                skill_id=matched_skill.skill_id if matched_skill else None,
                skill_name=s_name,
                category=cat,
                proficiency_level="Advanced",
                years_of_experience=max(1, current_mentor.experience_years - 2),
                is_willing_to_mentor=True,
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            )
            db.add(new_ms)
        db.commit()
        skills = (
            db.query(MentorSkill)
            .filter(MentorSkill.mentor_id == current_mentor.mentor_id)
            .order_by(MentorSkill.category, MentorSkill.skill_name)
            .all()
        )

    return [
        MentorSkillResponse(
            id=s.id,
            skill_id=s.skill_id,
            skill_name=s.skill_name,
            category=s.category,
            proficiency_level=s.proficiency_level,
            years_of_experience=s.years_of_experience,
            is_willing_to_mentor=s.is_willing_to_mentor,
            created_at=s.created_at,
        )
        for s in skills
    ]


@router.post("/api/mentor/skills", response_model=MessageResponse)
def add_mentor_skill(
    payload: MentorSkillCreate,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Adds a new skill to the mentor's expertise profile.
    Prevents duplicates and connects with the existing Skill model.
    """
    clean_name = payload.skill_name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Skill name cannot be empty.")

    # Duplicate check
    existing = (
        db.query(MentorSkill)
        .filter(
            MentorSkill.mentor_id == current_mentor.mentor_id,
            func.lower(MentorSkill.skill_name) == clean_name.lower(),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Skill '{clean_name}' is already in your expertise profile.")

    # Match with global Skill catalog
    matched = db.query(Skill).filter(func.lower(Skill.skill_name) == clean_name.lower()).first()
    category = payload.category or (matched.category if matched else "programming")

    ms = MentorSkill(
        mentor_id=current_mentor.mentor_id,
        skill_id=matched.skill_id if matched else None,
        skill_name=clean_name,
        category=category,
        proficiency_level=payload.proficiency_level or "Advanced",
        years_of_experience=payload.years_of_experience if payload.years_of_experience is not None else 3,
        is_willing_to_mentor=payload.is_willing_to_mentor if payload.is_willing_to_mentor is not None else True,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(ms)

    # Sync mentor.skills comma-separated string
    current_skills = [s.strip() for s in (current_mentor.skills or "").split(",") if s.strip()]
    if clean_name not in current_skills:
        current_skills.append(clean_name)
        current_mentor.skills = ", ".join(current_skills)

    db.commit()
    return MessageResponse(
        message=f"Skill '{clean_name}' added to your expertise profile.",
        data={"skill_id": ms.id, "skill_name": clean_name},
    )


@router.put("/api/mentor/skills/{skill_entry_id}", response_model=MessageResponse)
def update_mentor_skill(
    skill_entry_id: int,
    payload: MentorSkillUpdate,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    ms = (
        db.query(MentorSkill)
        .filter(
            MentorSkill.id == skill_entry_id,
            MentorSkill.mentor_id == current_mentor.mentor_id,
        )
        .first()
    )
    if not ms:
        raise HTTPException(status_code=404, detail="Skill entry not found in your profile.")

    if payload.category is not None:
        ms.category = payload.category.strip()
    if payload.proficiency_level is not None:
        ms.proficiency_level = payload.proficiency_level.strip()
    if payload.years_of_experience is not None:
        ms.years_of_experience = payload.years_of_experience
    if payload.is_willing_to_mentor is not None:
        ms.is_willing_to_mentor = payload.is_willing_to_mentor

    ms.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    return MessageResponse(message=f"Skill '{ms.skill_name}' details updated successfully.")


@router.delete("/api/mentor/skills/{skill_entry_id}", response_model=MessageResponse)
def delete_mentor_skill(
    skill_entry_id: int,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    ms = (
        db.query(MentorSkill)
        .filter(
            MentorSkill.id == skill_entry_id,
            MentorSkill.mentor_id == current_mentor.mentor_id,
        )
        .first()
    )
    if not ms:
        raise HTTPException(status_code=404, detail="Skill entry not found in your profile.")

    skill_name = ms.skill_name
    db.delete(ms)

    # Sync mentor.skills string
    current_skills = [s.strip() for s in (current_mentor.skills or "").split(",") if s.strip()]
    if skill_name in current_skills:
        current_skills.remove(skill_name)
        current_mentor.skills = ", ".join(current_skills)

    db.commit()
    return MessageResponse(message=f"Skill '{skill_name}' removed from your expertise profile.")


@router.get("/api/skills/categories")
def get_skills_categories(db: Session = Depends(get_db)):
    """
    Returns standard skill categories and catalog skills for autocomplete.
    """
    standard_categories = [
        "programming",
        "data science",
        "web development",
        "machine learning",
        "cloud computing",
        "career preparation",
        "system design",
        "devops",
    ]
    catalog_skills = [
        {"skill_id": s.skill_id, "skill_name": s.skill_name, "category": s.category}
        for s in db.query(Skill).order_by(Skill.skill_name).all()
    ]
    return {
        "categories": standard_categories,
        "catalog_skills": catalog_skills,
    }


# =========================================================================
# PHASE 10: MENTOR AVAILABILITY MANAGEMENT
# =========================================================================

@router.get("/api/mentor/availability", response_model=MentorAvailabilityResponse)
def get_mentor_availability(
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Retrieves the mentor's configured availability rules and preview schedule.
    """
    setting = current_mentor.availability_setting
    if not setting:
        setting = MentorAvailabilitySetting(
            mentor_id=current_mentor.mentor_id,
            available_days="Monday,Tuesday,Wednesday,Thursday,Friday",
            start_time="09:00",
            end_time="17:00",
            session_duration=60,
            timezone="UTC",
            unavailable_dates="",
            buffer_minutes=15,
            notes="Standard professional office hours.",
            updated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

    days_list = [d.strip() for d in setting.available_days.split(",") if d.strip()]
    unavail_list = [d.strip() for d in (setting.unavailable_dates or "").split(",") if d.strip()]

    # Generate preview schedule
    preview_schedule = [
        {"day": d, "start": setting.start_time, "end": setting.end_time, "is_available": True}
        for d in days_list
    ]

    return MentorAvailabilityResponse(
        available_days=days_list,
        start_time=setting.start_time,
        end_time=setting.end_time,
        session_duration=setting.session_duration,
        timezone=setting.timezone,
        unavailable_dates=unavail_list,
        notes=setting.notes,
        weekly_schedule=preview_schedule,
    )


@router.put("/api/mentor/availability", response_model=MessageResponse)
def update_mentor_availability(
    payload: MentorAvailabilityUpdateRequest,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Updates the authenticated mentor's availability configuration.
    Validates times, duration, days, and persists settings.
    """
    # Validate start & end time
    s_min = parse_time_minutes(payload.start_time)
    e_min = parse_time_minutes(payload.end_time)
    if s_min is None or e_min is None:
        raise HTTPException(status_code=400, detail="Start and end times must be in HH:MM 24-hour format.")
    if e_min <= s_min:
        raise HTTPException(status_code=400, detail="End time must be after start time.")

    valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    clean_days = [d.strip() for d in payload.available_days if d.strip() in valid_days]

    duration = payload.session_duration or 60
    if duration not in [15, 30, 45, 60, 90, 120]:
        raise HTTPException(status_code=400, detail="Session duration must be 15, 30, 45, 60, 90, or 120 minutes.")

    unavail_str = ", ".join(payload.unavailable_dates) if payload.unavailable_dates else ""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    setting = current_mentor.availability_setting
    if not setting:
        setting = MentorAvailabilitySetting(
            mentor_id=current_mentor.mentor_id,
            available_days=", ".join(clean_days),
            start_time=payload.start_time,
            end_time=payload.end_time,
            session_duration=duration,
            timezone=payload.timezone or "UTC",
            unavailable_dates=unavail_str,
            notes=payload.notes,
            updated_at=now_str,
        )
        db.add(setting)
    else:
        setting.available_days = ", ".join(clean_days)
        setting.start_time = payload.start_time
        setting.end_time = payload.end_time
        setting.session_duration = duration
        setting.timezone = payload.timezone or "UTC"
        setting.unavailable_dates = unavail_str
        setting.notes = payload.notes
        setting.updated_at = now_str

    # Update mentor profile general availability status
    current_mentor.availability = "Available" if clean_days else "Away"
    db.commit()

    return MessageResponse(message="Mentor availability settings saved successfully.")


@router.get("/api/mentors/{mentor_id}/availability", response_model=MentorAvailabilityResponse)
def get_mentor_public_availability(
    mentor_id: str,
    db: Session = Depends(get_db),
):
    """
    Public / student endpoint to retrieve a mentor's availability configuration.
    """
    m = db.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    setting = m.availability_setting
    days_list = [d.strip() for d in setting.available_days.split(",") if d.strip()] if setting else [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    ]
    unavail_list = [d.strip() for d in (setting.unavailable_dates or "").split(",") if d.strip()] if setting else []

    preview_schedule = [
        {"day": d, "start": setting.start_time if setting else "09:00", "end": setting.end_time if setting else "17:00", "is_available": True}
        for d in days_list
    ]

    return MentorAvailabilityResponse(
        available_days=days_list,
        start_time=setting.start_time if setting else "09:00",
        end_time=setting.end_time if setting else "17:00",
        session_duration=setting.session_duration if setting else 60,
        timezone=setting.timezone if setting else "UTC",
        unavailable_dates=unavail_list,
        notes=setting.notes if setting else None,
        weekly_schedule=preview_schedule,
    )


@router.get("/api/mentors/{mentor_id}/available-slots")
def get_mentor_available_slots(
    mentor_id: str,
    date: str = Query(..., description="Date to check in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
):
    """
    Generates time slots for a given date based on mentor's availability rules and filters out
    any slots that conflict with existing scheduled sessions.
    """
    m = db.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mentor not found.")

    try:
        req_date = datetime.strptime(date.strip(), "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    setting = m.availability_setting
    avail_days = [d.strip() for d in setting.available_days.split(",") if d.strip()] if setting else [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    ]
    unavail_dates = [d.strip() for d in (setting.unavailable_dates or "").split(",") if d.strip()] if setting else []
    duration = setting.session_duration if setting else 60
    start_str = setting.start_time if setting else "09:00"
    end_str = setting.end_time if setting else "17:00"
    tz = setting.timezone if setting else "UTC"

    weekday_name = req_date.strftime("%A")
    if date.strip() in unavail_dates:
        return {
            "date": date,
            "day_of_week": weekday_name,
            "is_working_day": False,
            "reason": "Mentor is on leave / unavailable on this date.",
            "slots": [],
        }

    if weekday_name not in avail_days:
        return {
            "date": date,
            "day_of_week": weekday_name,
            "is_working_day": False,
            "reason": f"Mentor does not take sessions on {weekday_name}s.",
            "slots": [],
        }

    # Generate slots from start to end by duration
    start_mins = parse_time_minutes(start_str) or (9 * 60)
    end_mins = parse_time_minutes(end_str) or (17 * 60)

    # Query existing sessions on this date
    existing_sessions = (
        db.query(MentorshipSession)
        .filter(
            MentorshipSession.mentor_id == mentor_id,
            MentorshipSession.session_date == date.strip(),
            MentorshipSession.status.in_(["upcoming", "rescheduled"]),
        )
        .all()
    )

    booked_intervals = []
    for es in existing_sessions:
        s_m = parse_time_minutes(es.start_time)
        e_m = parse_time_minutes(es.end_time) or ((s_m + 60) if s_m is not None else None)
        if s_m is not None and e_m is not None:
            booked_intervals.append((s_m, e_m))

    slots = []
    curr = start_mins
    while curr + duration <= end_mins:
        slot_start_m = curr
        slot_end_m = curr + duration

        slot_start_str = f"{slot_start_m // 60:02d}:{slot_start_m % 60:02d}"
        slot_end_str = f"{slot_end_m // 60:02d}:{slot_end_m % 60:02d}"

        # Check overlap: max(startA, startB) < min(endA, endB)
        is_booked = False
        for b_start, b_end in booked_intervals:
            if max(slot_start_m, b_start) < min(slot_end_m, b_end):
                is_booked = True
                break

        slots.append({
            "start_time": slot_start_str,
            "end_time": slot_end_str,
            "duration_minutes": duration,
            "is_available": not is_booked,
            "timezone": tz,
        })
        curr += duration

    return {
        "date": date,
        "day_of_week": weekday_name,
        "is_working_day": True,
        "timezone": tz,
        "session_duration": duration,
        "slots": slots,
    }



# =========================================================================
# PHASE 9: SKILL ASSESSMENTS & SUBMISSION EVALUATION WORKFLOW
# =========================================================================

@router.get("/api/mentor/assessments", response_model=List[MentorAssessmentResponse])
def get_mentor_assessments(
    student_id: Optional[str] = None,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Returns all skill assessments created by the authenticated mentor.
    Optionally filters by targeted student_id.
    Includes submission counts, evaluated counts, and criteria breakdown.
    """
    query = db.query(MentorAssessment).filter(MentorAssessment.mentor_id == current_mentor.mentor_id)
    if student_id:
        query = query.filter((MentorAssessment.student_id == student_id) | (MentorAssessment.student_id.is_(None)))

    assessments = query.order_by(desc(MentorAssessment.created_at)).all()
    results = []

    for a in assessments:
        skill = db.query(Skill).filter(Skill.skill_id == a.skill_id).first()
        student = db.query(Student).filter(Student.student_id == a.student_id).first() if a.student_id else None

        subs = db.query(MentorAssessmentSubmission).filter(MentorAssessmentSubmission.assessment_id == a.assessment_id).all()
        subs_count = len(subs)
        eval_count = sum(1 for s in subs if s.status == "evaluated")

        crit_list = []
        if a.criteria_json:
            try:
                raw_c = json.loads(a.criteria_json)
                if isinstance(raw_c, list):
                    for item in raw_c:
                        if isinstance(item, dict):
                            crit_list.append(item)
                        elif isinstance(item, str):
                            crit_list.append({"criterion": item, "weight": 25, "description": ""})
            except Exception:
                crit_list = []

        results.append(
            MentorAssessmentResponse(
                assessment_id=a.assessment_id,
                mentor_id=a.mentor_id,
                mentor_name=current_mentor.name,
                mentor_title=current_mentor.title or current_mentor.expertise,
                mentor_company=current_mentor.company or "PathForge Network",
                mentor_avatar=getattr(current_mentor, "avatar", None),
                student_id=a.student_id,
                student_name=f"{student.first_name} {student.last_name}" if student else "All Assigned Students",
                skill_id=a.skill_id,
                skill_name=skill.skill_name if skill else a.skill_id,
                title=a.title,
                description=a.description,
                instructions=a.instructions,
                criteria=crit_list,
                deadline=a.deadline,
                max_score=a.max_score or 100,
                status=a.status,
                created_at=a.created_at,
                submissions_count=subs_count,
                evaluated_count=eval_count,
            )
        )

    return results


@router.post("/api/mentor/assessments", response_model=MessageResponse)
def create_mentor_assessment(
    payload: MentorAssessmentCreate,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Creates a new skill assessment by the mentor.
    Mentors can target a specific assigned mentee or make it available to all assigned mentees.
    Enforces mentor–student authorization.
    """
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Assessment title is required.")
    if not payload.description or not payload.description.strip():
        raise HTTPException(status_code=400, detail="Assessment description is required.")

    # 1. Verify skill
    skill = db.query(Skill).filter(Skill.skill_id == payload.skill_id).first()
    if not skill:
        skill = db.query(Skill).filter(Skill.skill_name.ilike(payload.skill_id)).first()
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{payload.skill_id}' not found.")

    # 2. Verify student assignment if targeted
    target_student_id = None
    if payload.student_id:
        st = db.query(Student).filter(
            (Student.student_id == payload.student_id) | (Student.user_id == payload.student_id)
        ).first()
        if not st:
            raise HTTPException(status_code=404, detail="Student not found.")

        target_student_id = st.student_id

        assignment = (
            db.query(MentorStudentAssignment)
            .filter(
                (MentorStudentAssignment.mentor_id == current_mentor.mentor_id) | (MentorStudentAssignment.mentor_id == getattr(current_mentor, "user_id", None)),
                (MentorStudentAssignment.student_id == target_student_id) | (MentorStudentAssignment.student_id == payload.student_id),
            )
            .first()
        )
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Student '{payload.student_id}' is not assigned to you.",
            )

    # 3. Format criteria
    crit_formatted = []
    if payload.criteria:
        for c in payload.criteria:
            if isinstance(c, dict):
                crit_formatted.append(c)
            elif isinstance(c, str):
                crit_formatted.append({"criterion": c, "weight": 25, "description": ""})
            elif hasattr(c, "dict"):
                crit_formatted.append(c.dict())

    assessment_id = f"MASS-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_assessment = MentorAssessment(
        assessment_id=assessment_id,
        mentor_id=current_mentor.mentor_id,
        student_id=target_student_id,
        skill_id=skill.skill_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        instructions=payload.instructions.strip() if payload.instructions else None,
        criteria_json=json.dumps(crit_formatted),
        deadline=payload.deadline,
        max_score=payload.max_score or 100,
        status="active",
        created_at=now_str,
    )
    db.add(new_assessment)

    # 4. Notify student(s)
    if target_student_id:
        notif = Notification(
            notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            student_id=target_student_id,
            mentor_id=current_mentor.mentor_id,
            type="assessment_assigned",
            title="New Skill Assessment Assigned",
            message=f"Mentor {current_mentor.name} has assigned you assessment '{payload.title.strip()}' for {skill.skill_name}.",
            is_read=False,
            created_at=now_str,
        )
        db.add(notif)
    else:
        # Notify all assigned students
        assigned = (
            db.query(MentorStudentAssignment)
            .filter((MentorStudentAssignment.mentor_id == current_mentor.mentor_id) | (MentorStudentAssignment.mentor_id == getattr(current_mentor, "user_id", None)))
            .all()
        )
        for asgn in assigned:
            notif = Notification(
                notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
                student_id=asgn.student_id,
                mentor_id=current_mentor.mentor_id,
                type="assessment_assigned",
                title="New Skill Assessment Assigned",
                message=f"Mentor {current_mentor.name} has published assessment '{payload.title.strip()}' for {skill.skill_name}.",
                is_read=False,
                created_at=now_str,
            )
            db.add(notif)

    db.commit()
    return MessageResponse(
        message="Skill assessment created and assigned successfully.",
        data={"assessment_id": assessment_id},
    )


@router.get("/api/mentor/assessments/{assessment_id}")
def get_mentor_assessment_detail(
    assessment_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Retrieves full details for a mentor assessment, including rubrics and submissions.
    Enforces mentor authorization.
    """
    a = db.query(MentorAssessment).filter(MentorAssessment.assessment_id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Skill assessment not found.")
    if a.mentor_id not in (current_mentor.mentor_id, getattr(current_mentor, "user_id", None)):
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another mentor's assessment.")

    skill = db.query(Skill).filter(Skill.skill_id == a.skill_id).first()
    student = db.query(Student).filter(Student.student_id == a.student_id).first() if a.student_id else None

    crit_list = []
    if a.criteria_json:
        try:
            crit_list = json.loads(a.criteria_json)
        except Exception:
            crit_list = []

    subs = (
        db.query(MentorAssessmentSubmission)
        .filter(MentorAssessmentSubmission.assessment_id == a.assessment_id)
        .order_by(desc(MentorAssessmentSubmission.submitted_at))
        .all()
    )

    submission_items = []
    for s in subs:
        st = db.query(Student).filter(Student.student_id == s.student_id).first()
        rub_sc = {}
        if s.rubric_scores_json:
            try:
                rub_sc = json.loads(s.rubric_scores_json)
            except Exception:
                rub_sc = {}

        submission_items.append({
            "submission_id": s.submission_id,
            "assessment_id": s.assessment_id,
            "student_id": s.student_id,
            "student_name": f"{st.first_name} {st.last_name}" if st else s.student_id,
            "student_email": st.email if st else "",
            "submission_text": s.submission_text,
            "attachment_url": s.attachment_url,
            "status": s.status,
            "score": s.score,
            "feedback": s.feedback,
            "rubric_scores": rub_sc,
            "is_released": s.is_released,
            "submitted_at": s.submitted_at,
            "evaluated_at": s.evaluated_at,
        })

    return {
        "assessment_id": a.assessment_id,
        "mentor_id": a.mentor_id,
        "mentor_name": current_mentor.name,
        "student_id": a.student_id,
        "student_name": f"{student.first_name} {student.last_name}" if student else "All Assigned Students",
        "skill_id": a.skill_id,
        "skill_name": skill.skill_name if skill else a.skill_id,
        "title": a.title,
        "description": a.description,
        "instructions": a.instructions,
        "criteria": crit_list,
        "deadline": a.deadline,
        "max_score": a.max_score or 100,
        "status": a.status,
        "created_at": a.created_at,
        "submissions_count": len(submission_items),
        "evaluated_count": sum(1 for s in submission_items if s["status"] == "evaluated"),
        "submissions": submission_items,
    }


@router.get("/api/mentor/assessments/{assessment_id}/submissions", response_model=List[MentorAssessmentSubmissionResponse])
def get_assessment_submissions(
    assessment_id: str,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Returns all student submissions for a specific assessment.
    Enforces mentor authorization.
    """
    a = db.query(MentorAssessment).filter(MentorAssessment.assessment_id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Skill assessment not found.")
    if a.mentor_id not in (current_mentor.mentor_id, getattr(current_mentor, "user_id", None)):
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access another mentor's assessment submissions.")

    subs = (
        db.query(MentorAssessmentSubmission)
        .filter(MentorAssessmentSubmission.assessment_id == assessment_id)
        .order_by(desc(MentorAssessmentSubmission.submitted_at))
        .all()
    )

    results = []
    for s in subs:
        st = db.query(Student).filter(Student.student_id == s.student_id).first()
        rub_sc = {}
        if s.rubric_scores_json:
            try:
                rub_sc = json.loads(s.rubric_scores_json)
            except Exception:
                rub_sc = {}

        answers = []
        if s.answers_json:
            try:
                answers = json.loads(s.answers_json)
            except Exception:
                answers = []

        results.append(
            MentorAssessmentSubmissionResponse(
                submission_id=s.submission_id,
                assessment_id=s.assessment_id,
                student_id=s.student_id,
                student_name=f"{st.first_name} {st.last_name}" if st else s.student_id,
                student_email=st.email if st else "",
                submission_text=s.submission_text,
                attachment_url=s.attachment_url,
                answers=answers,
                status=s.status,
                score=s.score,
                feedback=s.feedback,
                rubric_scores=rub_sc,
                is_released=s.is_released,
                submitted_at=s.submitted_at,
                evaluated_at=s.evaluated_at,
            )
        )

    return results


@router.post("/api/mentor/assessments/submissions/{submission_id}/evaluate", response_model=MessageResponse)
def evaluate_assessment_submission(
    submission_id: str,
    payload: AssessmentEvaluationRequest,
    current_mentor: Mentor = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """
    Evaluates a student's assessment submission using rubric criteria.
    Records scores and constructive feedback.
    Enforces mentor-student authorization.
    Calibrates the student's mastery in StudentSkill and triggers notification.
    """
    sub = db.query(MentorAssessmentSubmission).filter(MentorAssessmentSubmission.submission_id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    assessment = db.query(MentorAssessment).filter(MentorAssessment.assessment_id == sub.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Associated assessment not found.")
    if assessment.mentor_id not in (current_mentor.mentor_id, getattr(current_mentor, "user_id", None)):
        raise HTTPException(status_code=403, detail="Forbidden: You cannot evaluate submissions for another mentor's assessment.")

    # Verify student is assigned to this mentor
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            (MentorStudentAssignment.mentor_id == current_mentor.mentor_id) | (MentorStudentAssignment.mentor_id == getattr(current_mentor, "user_id", None)),
            (MentorStudentAssignment.student_id == sub.student_id),
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=403, detail="Forbidden: Student is not assigned to you.")

    # Validate score
    max_sc = float(assessment.max_score or 100)
    if payload.score < 0 or payload.score > max_sc:
        raise HTTPException(status_code=400, detail=f"Score must be between 0 and {max_sc}.")
    if not payload.feedback or not payload.feedback.strip():
        raise HTTPException(status_code=400, detail="Constructive feedback is required.")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sub.score = payload.score
    sub.feedback = payload.feedback.strip()
    if payload.rubric_scores:
        sub.rubric_scores_json = json.dumps(payload.rubric_scores)
    sub.status = "evaluated"
    sub.is_released = payload.release if payload.release is not None else True
    sub.evaluated_at = now_str

    # Calibrate student skill mastery: convert to percentage scale (0-100)
    calibrated_pct = min(100, max(0, int(round((payload.score / max_sc) * 100))))
    update_or_create_student_skill(
        db=db,
        student_id=sub.student_id,
        skill_id=assessment.skill_id,
        mentor_score=calibrated_pct,
        assessment_score=calibrated_pct,
    )

    # In-app notification to student
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        student_id=sub.student_id,
        mentor_id=current_mentor.mentor_id,
        type="assessment_evaluated",
        title="Skill Assessment Evaluated",
        message=f"Mentor {current_mentor.name} evaluated your submission for '{assessment.title}' with a score of {payload.score}/{max_sc} and feedback.",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)

    db.commit()
    return MessageResponse(
        message=f"Assessment evaluated successfully and skill evidence calibrated to {calibrated_pct}%.",
        data={
            "submission_id": sub.submission_id,
            "score": payload.score,
            "calibrated_percentage": calibrated_pct,
            "is_released": sub.is_released,
        },
    )


# =========================================================================
# STUDENT-FACING SKILL ASSESSMENT ENDPOINTS
# =========================================================================

@router.get("/api/student/mentor-assessments", response_model=List[MentorAssessmentResponse])
def get_student_mentor_assessments(
    status: Optional[str] = None,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns all assessments assigned to the authenticated student by their assigned mentors.
    Enforces that unreleased scores and feedback are not exposed before their intended release.
    """
    # 1. Get assigned mentors
    assignments = (
        db.query(MentorStudentAssignment)
        .filter(
            (MentorStudentAssignment.student_id == current_student.student_id)
            | (MentorStudentAssignment.student_id == getattr(current_student, "user_id", None))
        )
        .all()
    )
    mentor_ids = set()
    for a in assignments:
        mentor_ids.add(a.mentor_id)
        # Also find the mentor object to get user_id or mentor_id
        m = db.query(Mentor).filter((Mentor.mentor_id == a.mentor_id) | (Mentor.user_id == a.mentor_id)).first()
        if m:
            mentor_ids.add(m.mentor_id)
            if getattr(m, "user_id", None):
                mentor_ids.add(m.user_id)

    if not mentor_ids:
        return []

    # 2. Get assessments created by assigned mentors for this student or for all mentees
    assessments = (
        db.query(MentorAssessment)
        .filter(
            MentorAssessment.mentor_id.in_(list(mentor_ids)),
            (MentorAssessment.student_id == current_student.student_id)
            | (MentorAssessment.student_id == getattr(current_student, "user_id", None))
            | (MentorAssessment.student_id.is_(None)),
        )
        .order_by(desc(MentorAssessment.created_at))
        .all()
    )

    results = []
    for a in assessments:
        m = db.query(Mentor).filter((Mentor.mentor_id == a.mentor_id) | (Mentor.user_id == a.mentor_id)).first()
        skill = db.query(Skill).filter(Skill.skill_id == a.skill_id).first()

        crit_list = []
        if a.criteria_json:
            try:
                raw_c = json.loads(a.criteria_json)
                if isinstance(raw_c, list):
                    for item in raw_c:
                        if isinstance(item, dict):
                            crit_list.append(item)
                        elif isinstance(item, str):
                            crit_list.append({"criterion": item, "weight": 25, "description": ""})
            except Exception:
                crit_list = []

        # Find student's submission
        sub = (
            db.query(MentorAssessmentSubmission)
            .filter(
                MentorAssessmentSubmission.assessment_id == a.assessment_id,
                (MentorAssessmentSubmission.student_id == current_student.student_id)
                | (MentorAssessmentSubmission.student_id == getattr(current_student, "user_id", None)),
            )
            .first()
        )

        my_sub_response = None
        if sub:
            # Respect release flag: do not expose unreleased scores or feedback
            rub_sc = None
            score_to_show = None
            feedback_to_show = None
            eval_date = None

            if sub.is_released and sub.status == "evaluated":
                score_to_show = sub.score
                feedback_to_show = sub.feedback
                eval_date = sub.evaluated_at
                if sub.rubric_scores_json:
                    try:
                        rub_sc = json.loads(sub.rubric_scores_json)
                    except Exception:
                        rub_sc = {}

            my_sub_response = MentorAssessmentSubmissionResponse(
                submission_id=sub.submission_id,
                assessment_id=sub.assessment_id,
                student_id=sub.student_id,
                student_name=f"{current_student.first_name} {current_student.last_name}",
                student_email=current_student.email,
                submission_text=sub.submission_text,
                attachment_url=sub.attachment_url,
                status=sub.status,
                score=score_to_show,
                feedback=feedback_to_show,
                rubric_scores=rub_sc,
                is_released=sub.is_released,
                submitted_at=sub.submitted_at,
                evaluated_at=eval_date,
            )

        # Status filter if requested
        if status:
            s_filter = status.strip().lower()
            if s_filter == "pending" and sub is not None:
                continue
            if s_filter == "submitted" and (not sub or sub.status != "submitted"):
                continue
            if s_filter == "evaluated" and (not sub or sub.status != "evaluated"):
                continue

        results.append(
            MentorAssessmentResponse(
                assessment_id=a.assessment_id,
                mentor_id=a.mentor_id,
                mentor_name=m.name if m else "Assigned Mentor",
                mentor_title=m.title or m.expertise if m else "",
                mentor_company=m.company or "PathForge Network" if m else "",
                mentor_avatar=getattr(m, "avatar", None),
                student_id=a.student_id,
                student_name=f"{current_student.first_name} {current_student.last_name}" if a.student_id else "All Assigned Students",
                skill_id=a.skill_id,
                skill_name=skill.skill_name if skill else a.skill_id,
                title=a.title,
                description=a.description,
                instructions=a.instructions,
                criteria=crit_list,
                deadline=a.deadline,
                max_score=a.max_score or 100,
                status=a.status,
                created_at=a.created_at,
                submissions_count=1 if sub else 0,
                evaluated_count=1 if (sub and sub.status == "evaluated" and sub.is_released) else 0,
                my_submission=my_sub_response,
            )
        )

    return results


@router.get("/api/student/mentor-assessments/{assessment_id}")
def get_student_mentor_assessment_detail(
    assessment_id: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns single mentor assessment detail for the student with instructions and rubric criteria.
    Enforces mentor assignment authorization and prevents leaking unreleased scores/feedback.
    """
    a = db.query(MentorAssessment).filter(MentorAssessment.assessment_id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Skill assessment not found.")

    # Verify student is assigned to this mentor
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            (MentorStudentAssignment.mentor_id == a.mentor_id),
            (MentorStudentAssignment.student_id == current_student.student_id)
            | (MentorStudentAssignment.student_id == getattr(current_student, "user_id", None)),
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access assessments from your assigned mentors.")

    if a.student_id and a.student_id not in (current_student.student_id, getattr(current_student, "user_id", None)):
        raise HTTPException(status_code=403, detail="Forbidden: This assessment is targeted to another student.")

    m = db.query(Mentor).filter((Mentor.mentor_id == a.mentor_id) | (Mentor.user_id == a.mentor_id)).first()
    skill = db.query(Skill).filter(Skill.skill_id == a.skill_id).first()

    crit_list = []
    if a.criteria_json:
        try:
            crit_list = json.loads(a.criteria_json)
        except Exception:
            crit_list = []

    sub = (
        db.query(MentorAssessmentSubmission)
        .filter(
            MentorAssessmentSubmission.assessment_id == a.assessment_id,
            (MentorAssessmentSubmission.student_id == current_student.student_id)
            | (MentorAssessmentSubmission.student_id == getattr(current_student, "user_id", None)),
        )
        .first()
    )

    my_sub = None
    if sub:
        rub_sc = None
        score_to_show = None
        feedback_to_show = None
        if sub.is_released and sub.status == "evaluated":
            score_to_show = sub.score
            feedback_to_show = sub.feedback
            if sub.rubric_scores_json:
                try:
                    rub_sc = json.loads(sub.rubric_scores_json)
                except Exception:
                    rub_sc = {}

        my_sub = {
            "submission_id": sub.submission_id,
            "status": sub.status,
            "submission_text": sub.submission_text,
            "attachment_url": sub.attachment_url,
            "score": score_to_show,
            "feedback": feedback_to_show,
            "rubric_scores": rub_sc,
            "is_released": sub.is_released,
            "submitted_at": sub.submitted_at,
            "evaluated_at": sub.evaluated_at if sub.is_released else None,
        }

    return {
        "assessment_id": a.assessment_id,
        "mentor_id": a.mentor_id,
        "mentor_name": m.name if m else "Assigned Mentor",
        "mentor_title": m.title or m.expertise if m else "",
        "mentor_company": m.company or "PathForge Network" if m else "",
        "skill_id": a.skill_id,
        "skill_name": skill.skill_name if skill else a.skill_id,
        "title": a.title,
        "description": a.description,
        "instructions": a.instructions,
        "criteria": crit_list,
        "deadline": a.deadline,
        "max_score": a.max_score or 100,
        "status": a.status,
        "created_at": a.created_at,
        "my_submission": my_sub,
    }


@router.post("/api/student/mentor-assessments/{assessment_id}/submit", response_model=MessageResponse)
def submit_student_mentor_assessment(
    assessment_id: str,
    payload: AssessmentSubmissionCreate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Submits student responses or project deliverables for an assigned mentor assessment.
    Prevents duplicate submissions where already submitted.
    Enforces mentor assignment authorization.
    """
    a = db.query(MentorAssessment).filter(MentorAssessment.assessment_id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Skill assessment not found.")

    if a.status != "active":
        raise HTTPException(status_code=400, detail="This assessment is no longer active.")

    # Authorization
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            (MentorStudentAssignment.mentor_id == a.mentor_id),
            (MentorStudentAssignment.student_id == current_student.student_id)
            | (MentorStudentAssignment.student_id == getattr(current_student, "user_id", None)),
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=403, detail="Forbidden: You can only submit assessments assigned by your mentors.")

    if a.student_id and a.student_id not in (current_student.student_id, getattr(current_student, "user_id", None)):
        raise HTTPException(status_code=403, detail="Forbidden: This assessment is assigned to another student.")

    # Prevent duplicate submissions
    existing = (
        db.query(MentorAssessmentSubmission)
        .filter(
            MentorAssessmentSubmission.assessment_id == assessment_id,
            (MentorAssessmentSubmission.student_id == current_student.student_id)
            | (MentorAssessmentSubmission.student_id == getattr(current_student, "user_id", None)),
        )
        .first()
    )
    if existing and existing.status in ("submitted", "evaluated"):
        raise HTTPException(status_code=400, detail="Assessment has already been submitted.")

    # Validation: must provide answers, text, or attachment URL
    has_text = payload.submission_text and payload.submission_text.strip()
    has_url = payload.attachment_url and payload.attachment_url.strip()
    has_ans = payload.answers and len(payload.answers) > 0
    if not (has_text or has_url or has_ans):
        raise HTTPException(status_code=400, detail="Please provide submission text, answers, or a project attachment URL.")

    sub_id = f"MSUB-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    submission = MentorAssessmentSubmission(
        submission_id=sub_id,
        assessment_id=assessment_id,
        student_id=current_student.student_id,
        submission_text=payload.submission_text.strip() if payload.submission_text else None,
        attachment_url=payload.attachment_url.strip() if payload.attachment_url else None,
        answers_json=json.dumps(payload.answers or []),
        status="submitted",
        is_released=True,
        submitted_at=now_str,
    )
    db.add(submission)

    # In-app notification to mentor
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        mentor_id=a.mentor_id,
        student_id=current_student.student_id,
        type="assessment_submitted",
        title="Assessment Submission Received",
        message=f"Student {current_student.first_name} {current_student.last_name} submitted work for '{a.title}'.",
        is_read=False,
        created_at=now_str,
    )
    db.add(notif)

    db.commit()
    return MessageResponse(
        message="Assessment submitted successfully.",
        data={"submission_id": sub_id, "status": "submitted"},
    )



@router.get("/api/student/project-reviews")
def get_student_project_reviews(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns all project reviews and rubric feedback received by the student from their mentors.
    Enriched with project details, mentor information, and skill evidence calibration.
    """
    feedbacks = (
        db.query(MentorFeedback)
        .filter(MentorFeedback.student_id == current_student.student_id)
        .order_by(desc(MentorFeedback.feedback_date))
        .all()
    )

    results = []
    for fb in feedbacks:
        mentor = db.query(Mentor).filter(Mentor.mentor_id == fb.mentor_id).first()
        proj = db.query(Project).filter(Project.project_id == fb.project_id).first()
        skill = db.query(Skill).filter(Skill.skill_id == fb.skill_id).first()

        results.append({
            "feedback_id": fb.feedback_id,
            "mentor_id": fb.mentor_id,
            "mentor_name": mentor.name if mentor else "Assigned Mentor",
            "mentor_title": mentor.title or mentor.expertise if mentor else "",
            "mentor_company": mentor.company or "PathForge Network" if mentor else "",
            "project_id": fb.project_id,
            "project_name": proj.project_name if proj else fb.project_id,
            "project_difficulty": proj.difficulty if proj else "Intermediate",
            "skill_id": fb.skill_id,
            "skill_name": skill.skill_name if skill else fb.skill_id,
            "rating": fb.rating,
            "strengths": fb.strengths,
            "improvement_areas": fb.improvement_areas,
            "comments": fb.comments,
            "recommended_action": fb.recommended_action,
            "feedback_date": fb.feedback_date,
        })

    return results

