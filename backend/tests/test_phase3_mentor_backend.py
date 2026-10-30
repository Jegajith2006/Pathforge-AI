import os
import sys
import uuid
from datetime import datetime
import pytest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
root_dir = backend_dir.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from fastapi.testclient import TestClient
from main import app
from database.connection import init_db, SessionLocal
from database.models import (
    Student,
    Mentor,
    MentorStudentAssignment,
    MentorshipSession,
    MentorFeedback,
    MentorMessage,
    MentorResource,
    Notification,
    StudentSkill,
    Career,
    Skill,
)

client = TestClient(app)


def helper_register_and_login_mentor(name: str, expertise: str = "AI / ML"):
    unique_email = f"mentor.{uuid.uuid4().hex[:8]}@pathforge.ai"
    reg_payload = {
        "name": name,
        "email": unique_email,
        "password": "Password123!",
        "title": f"Lead {expertise} Architect",
        "experience_years": 7,
        "expertise_areas": [expertise, "Cloud Computing"],
        "company": "TechNova Corp",
        "linkedin_url": "https://linkedin.com/in/test-mentor",
        "bio": "Experienced technology mentor and practitioner.",
    }
    res = client.post("/api/auth/register/mentor", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    if data.get("status") == "pending_verification":
        from services.email_service import email_service
        otp = email_service.get_latest_otp_for_email(unique_email)
        v_res = client.post(
            "/api/auth/verify-email",
            json={"challenge_id": data["challenge_id"], "otp": otp},
        )
        assert v_res.status_code == 200, v_res.text
        data = v_res.json()

    token = data["access_token"]
    mentor_id = data["user_id"]
    headers = {"Authorization": f"Bearer {token}"}
    return mentor_id, headers, unique_email


def helper_register_and_login_student(name: str):
    unique_email = f"student.{uuid.uuid4().hex[:8]}@pathforge.ai"
    reg_payload = {
        "email": unique_email,
        "password": "Password123!",
        "first_name": name.split()[0],
        "last_name": name.split()[-1] if len(name.split()) > 1 else "Learner",
        "career_id": "C01",
    }
    res = client.post("/api/auth/register/student", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    if data.get("status") == "pending_verification":
        from services.email_service import email_service
        otp = email_service.get_latest_otp_for_email(unique_email)
        v_res = client.post(
            "/api/auth/verify-email",
            json={"challenge_id": data["challenge_id"], "otp": otp},
        )
        assert v_res.status_code == 200, v_res.text
        data = v_res.json()

    token = data["access_token"]
    student_id = data["user_id"]
    headers = {"Authorization": f"Bearer {token}"}
    return student_id, headers, unique_email


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db()


# -------------------------------------------------------------------------
# 1. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
# -------------------------------------------------------------------------

def test_mentor_auth_and_student_lockout():
    """Verify mentors can authenticate and students cannot access mentor-only endpoints."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Evelyn Vance")
    student_id, student_headers, _ = helper_register_and_login_student("Alex Rivera")

    # Mentor accesses mentor profile successfully
    m_res = client.get("/api/mentor/profile", headers=mentor_headers)
    assert m_res.status_code == 200
    assert m_res.json()["mentor_id"] == mentor_id

    # Student token accessing mentor profile must receive 403 Forbidden
    s_res = client.get("/api/mentor/profile", headers=student_headers)
    assert s_res.status_code == 403
    assert "mentor portal operations" in s_res.json()["detail"].lower()

    # Unauthenticated request must receive 401 Unauthorized
    u_res = client.get("/api/mentor/profile")
    assert u_res.status_code == 401


# -------------------------------------------------------------------------
# 2. MENTOR PROFILE MANAGEMENT & PUBLIC DIRECTORY
# -------------------------------------------------------------------------

def test_mentor_profile_management_and_public_endpoints():
    """Verify mentor profile retrieval, update of max_capacity and availability, and public views."""
    mentor_id, headers, email = helper_register_and_login_mentor("Marcus Holloway")

    # Get initial profile
    res = client.get("/api/mentor/profile", headers=headers)
    assert res.status_code == 200
    profile = res.json()
    assert profile["mentor_id"] == mentor_id
    assert profile["email"] == email
    assert profile["max_capacity"] == 15

    # Update profile
    up_res = client.put(
        "/api/mentor/profile",
        json={
            "bio": "Senior distributed systems architect with 10+ years mentoring.",
            "availability": "Weekdays 4PM-7PM EST",
            "max_capacity": 20,
            "skills": "Go, Distributed Systems, Kubernetes, Kafka",
        },
        headers=headers,
    )
    assert up_res.status_code == 200

    # Verify updated values
    refreshed = client.get("/api/mentor/profile", headers=headers).json()
    assert refreshed["availability"] == "Weekdays 4PM-7PM EST"
    assert refreshed["max_capacity"] == 20
    assert "Kafka" in refreshed["skills"]

    # Public directory test: sensitive fields (like password hash) must not be exposed
    pub_list = client.get("/api/mentors")
    assert pub_list.status_code == 200
    mentors = pub_list.json()
    assert isinstance(mentors, list)
    target = next((m for m in mentors if m["mentor_id"] == mentor_id), None)
    assert target is not None
    assert target["name"] == "Marcus Holloway"
    assert "password_hash" not in target

    pub_single = client.get(f"/api/mentors/{mentor_id}")
    assert pub_single.status_code == 200
    assert pub_single.json()["name"] == "Marcus Holloway"


# -------------------------------------------------------------------------
# 3. DASHBOARD CALCULATIONS & ZERO-COUNT VALIDATION
# -------------------------------------------------------------------------

def test_mentor_dashboard_authentic_calculations():
    """Verify dashboard metrics are computed from real records and return valid 0s when empty."""
    mentor_id, headers, _ = helper_register_and_login_mentor("Maya Lin")

    # Brand new mentor has 0 students, 0 sessions, 0 reviews
    dash_res = client.get("/api/mentor/dashboard", headers=headers)
    assert dash_res.status_code == 200
    data = dash_res.json()

    assert data["metrics"]["assigned_students"] == 0
    assert data["metrics"]["upcoming_sessions"] == 0
    assert data["metrics"]["project_reviews_completed"] == 0
    assert data["metrics"]["completed_reviews"] == 0
    assert data["metrics"]["avg_student_progress"] == 0.0
    assert data["upcoming_sessions"] == []
    assert data["recent_messages"] == []
    assert data["career_distribution"] == []
    assert data["students_by_goal"] == []


# -------------------------------------------------------------------------
# 4. MY STUDENTS & CROSS-MENTOR ISOLATION
# -------------------------------------------------------------------------

def test_assigned_students_and_isolation():
    """Verify assigned student retrieval, deep student progress access, and 403 on unassigned students."""
    mentor_a_id, headers_a, _ = helper_register_and_login_mentor("Mentor Alpha")
    mentor_b_id, headers_b, _ = helper_register_and_login_mentor("Mentor Beta")
    student_id, _, _ = helper_register_and_login_student("Charlie Davis")

    # Assign student to Mentor A only
    db = SessionLocal()
    assignment = MentorStudentAssignment(
        mentor_id=mentor_a_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
        notes="Phase 3 test assignment",
    )
    db.add(assignment)
    db.commit()
    db.close()

    # Mentor A retrieves assigned students
    res_a = client.get("/api/mentor/students", headers=headers_a)
    assert res_a.status_code == 200
    students_a = res_a.json()
    assert any(s["student_id"] == student_id for s in students_a)

    # Mentor A retrieves detailed student profile
    detail_res = client.get(f"/api/mentor/students/{student_id}", headers=headers_a)
    assert detail_res.status_code == 200
    student_detail = detail_res.json()
    assert student_detail["student_id"] == student_id
    assert "skills" in student_detail
    assert "course_progress" in student_detail
    assert "project_progress" in student_detail

    # Mentor A retrieves dedicated progress and assessments
    prog_res = client.get(f"/api/mentor/students/{student_id}/progress", headers=headers_a)
    assert prog_res.status_code == 200
    assert "courses" in prog_res.json()

    ass_res = client.get(f"/api/mentor/students/{student_id}/assessments", headers=headers_a)
    assert ass_res.status_code == 200
    assert "assessments" in ass_res.json()

    # Mentor B attempts to access unassigned student -> must return 403 Forbidden
    detail_b = client.get(f"/api/mentor/students/{student_id}", headers=headers_b)
    assert detail_b.status_code == 403
    assert "not assigned" in detail_b.json()["detail"].lower()

    prog_b = client.get(f"/api/mentor/students/{student_id}/progress", headers=headers_b)
    assert prog_b.status_code == 403

    ass_b = client.get(f"/api/mentor/students/{student_id}/assessments", headers=headers_b)
    assert ass_b.status_code == 403


# -------------------------------------------------------------------------
# 5. MENTORSHIP SESSION LIFECYCLE & STATE TRANSITIONS
# -------------------------------------------------------------------------

def test_mentorship_session_lifecycle_and_validation():
    """Verify session creation, duplicate rejection, detail view, reschedule, and valid state transitions."""
    mentor_id, headers, _ = helper_register_and_login_mentor("Mentor Sessions Expert")
    student_id, _, _ = helper_register_and_login_student("Dana Scully")

    # Assign student
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))
    db.commit()
    db.close()

    # 1. Schedule session
    sess_payload = {
        "student_id": student_id,
        "session_date": "2026-11-15",
        "start_time": "14:00",
        "end_time": "14:45",
        "topic": "System Design Architecture Review",
        "platform": "Google Meet",
        "meeting_link": "https://meet.pathforge.ai/room-101",
    }
    create_res = client.post("/api/mentor/sessions", json=sess_payload, headers=headers)
    assert create_res.status_code == 200
    sess_data = create_res.json()
    session_id = sess_data.get("session_id") or (sess_data.get("data") or {}).get("session_id")
    assert session_id is not None

    # 2. Duplicate session at identical date & time must fail with 400
    dup_res = client.post("/api/mentor/sessions", json=sess_payload, headers=headers)
    assert dup_res.status_code == 400
    assert "already scheduled" in dup_res.json()["detail"].lower()

    # 3. Retrieve session details
    detail_res = client.get(f"/api/mentor/sessions/{session_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["topic"] == "System Design Architecture Review"
    assert detail_res.json()["status"] == "upcoming"

    # 4. Reschedule session
    resched_res = client.patch(
        f"/api/mentor/sessions/{session_id}/reschedule",
        json={
            "session_date": "2026-11-16",
            "start_time": "16:00",
            "end_time": "16:45",
            "notes": "Moved by student request",
        },
        headers=headers,
    )
    assert resched_res.status_code == 200

    refreshed_sess = client.get(f"/api/mentor/sessions/{session_id}", headers=headers).json()
    assert refreshed_sess["session_date"] == "2026-11-16"
    assert refreshed_sess["start_time"] == "16:00"

    # 5. Complete session
    status_res = client.patch(
        f"/api/mentor/sessions/{session_id}/status",
        json={"status": "completed", "notes": "Completed successfully"},
        headers=headers,
    )
    assert status_res.status_code == 200

    # 6. Invalid transition: cannot revert 'completed' to 'upcoming'
    invalid_res = client.patch(
        f"/api/mentor/sessions/{session_id}/status",
        json={"status": "upcoming"},
        headers=headers,
    )
    assert invalid_res.status_code == 400
    assert "completed session" in invalid_res.json()["detail"].lower()

    # 7. Cross-mentor isolation on session
    _, headers_other, _ = helper_register_and_login_mentor("Another Mentor")
    cross_res = client.get(f"/api/mentor/sessions/{session_id}", headers=headers_other)
    assert cross_res.status_code == 403


# -------------------------------------------------------------------------
# 6. PROJECT REVIEWS & SKILL RECALIBRATION
# -------------------------------------------------------------------------

def test_project_review_lifecycle_and_updates():
    """Verify review creation with rubric scores, update via PUT, and cross-mentor isolation."""
    mentor_id, headers, _ = helper_register_and_login_mentor("Dr. Reviewer")
    student_id, _, _ = helper_register_and_login_student("Fox Mulder")

    # Assign student
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))
    db.commit()
    db.close()

    # Create review
    review_payload = {
        "student_id": student_id,
        "project_id": "P01",
        "skill_id": "SK-001",
        "rating": 5,
        "strengths": "Outstanding microservices architecture and documentation.",
        "improvement_areas": "Add integration test coverage for distributed transactions.",
        "comments": "Great progress, ready for production rollout.",
        "rubric_scores": {
            "code_quality": 5,
            "architecture": 5,
            "testing": 4,
            "documentation": 5,
        },
    }
    create_res = client.post("/api/mentor/project-reviews", json=review_payload, headers=headers)
    assert create_res.status_code == 200

    # Get reviews
    reviews_res = client.get("/api/mentor/project-reviews", headers=headers)
    assert reviews_res.status_code == 200
    reviews = reviews_res.json()
    assert len(reviews) >= 1
    review = reviews[0]
    feedback_id = review["feedback_id"]

    # Update review via PUT
    up_res = client.put(
        f"/api/mentor/project-reviews/{feedback_id}",
        json={"comments": "Updated review comments: Excellent work on API design."},
        headers=headers,
    )
    assert up_res.status_code == 200

    # Cross-mentor check on review update
    _, headers_other, _ = helper_register_and_login_mentor("Intruder Mentor")
    cross_up = client.put(
        f"/api/mentor/project-reviews/{feedback_id}",
        json={"comments": "Attempted illegal modification"},
        headers=headers_other,
    )
    assert cross_up.status_code == 403


# -------------------------------------------------------------------------
# 7. MESSAGING & NOTIFICATIONS
# -------------------------------------------------------------------------

def test_messaging_and_notifications_flow():
    """Verify messaging between mentor and assigned student, read receipt, and mentor notifications."""
    mentor_id, headers, _ = helper_register_and_login_mentor("Communication Mentor")
    student_id, _, _ = helper_register_and_login_student("Gillian Anderson")

    # 1. Unassigned student message attempt must fail with 403
    unassigned_res = client.post(
        "/api/mentor/messages",
        json={"student_id": student_id, "content": "Hello unassigned student"},
        headers=headers,
    )
    assert unassigned_res.status_code == 403

    # Assign student
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))
    # Also add a mentor notification
    db.add(Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        student_id=student_id,
        mentor_id=mentor_id,
        type="session",
        title="Session Reminder",
        message="Upcoming review session tomorrow.",
        is_read=False,
        created_at="2026-10-28 10:00:00",
    ))
    db.commit()
    db.close()

    # 2. Send message to assigned student
    msg_res = client.post(
        "/api/mentor/messages",
        json={"student_id": student_id, "content": "Welcome to your PathForge mentorship track!"},
        headers=headers,
    )
    assert msg_res.status_code == 200

    # 3. Retrieve conversation thread
    thread_res = client.get(f"/api/mentor/messages?student_id={student_id}", headers=headers)
    assert thread_res.status_code == 200
    msgs = thread_res.json()
    assert len(msgs) >= 1
    message_id = msgs[0]["message_id"]

    # 4. Mark message as read
    read_res = client.patch(f"/api/mentor/messages/{message_id}/read", headers=headers)
    assert read_res.status_code == 200

    # 5. Mentor notifications
    notifs_res = client.get("/api/mentor/notifications", headers=headers)
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    assert len(notifs) >= 1
    target_notif = notifs[0]
    assert target_notif["is_read"] is False

    # Mark single notification as read
    n_read_res = client.patch(
        f"/api/mentor/notifications/{target_notif['notification_id']}/read",
        headers=headers,
    )
    assert n_read_res.status_code == 200

    # Mark all read
    all_read_res = client.patch("/api/mentor/notifications/read-all", headers=headers)
    assert all_read_res.status_code == 200


# -------------------------------------------------------------------------
# 8. RESOURCES MANAGEMENT
# -------------------------------------------------------------------------

def test_mentor_resources_crud_and_isolation():
    """Verify resource creation, listing, deletion, and cross-mentor protection."""
    mentor_id, headers, _ = helper_register_and_login_mentor("Prof. Charles Xavier")

    # Create resource
    res_payload = {
        "title": "Clean Code and Domain-Driven Design in Python",
        "description": "Essential architectural guide for enterprise Python services.",
        "category": "Architecture",
        "url": "https://pathforge.ai/resources/ddd-python",
        "tags": "python, architecture, ddd",
    }
    create_res = client.post("/api/mentor/resources", json=res_payload, headers=headers)
    assert create_res.status_code == 200

    # List resources
    list_res = client.get("/api/mentor/resources", headers=headers)
    assert list_res.status_code == 200
    resources = list_res.json()
    assert len(resources) >= 1
    resource_id = resources[0]["resource_id"]

    # Cross-mentor delete prevention
    _, headers_other, _ = helper_register_and_login_mentor("Magneto")
    cross_del = client.delete(f"/api/mentor/resources/{resource_id}", headers=headers_other)
    assert cross_del.status_code == 403

    # Valid delete
    del_res = client.delete(f"/api/mentor/resources/{resource_id}", headers=headers)
    assert del_res.status_code == 200

    # 404 on deleting non-existent resource
    del_404 = client.delete(f"/api/mentor/resources/{resource_id}", headers=headers)
    assert del_404.status_code == 404
