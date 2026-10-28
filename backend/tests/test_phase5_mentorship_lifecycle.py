"""
Phase 5: Complete Mentorship Lifecycle Test Suite
Verifies:
1. Student-Mentor active relationship verification and duplicate prevention.
2. Mentor My Students inspection with roadmap, skills, reviews, and session history.
3. Student My Mentors and Student Sessions retrieval.
4. Session scheduling, reschedule, cancellation, and completion with notes.
5. Session validation: authorization, unassigned student lockout, conflict detection, state machine invariants.
6. Feedback submission with evidence calibration and notification dispatch.
7. Bi-directional in-app notifications for all lifecycle events.
8. Cross-tenant security and persistent database records.
"""

import os
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import pytest

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from database.connection import SessionLocal
from database.models import (
    Student,
    Mentor,
    MentorshipRequest,
    MentorStudentAssignment,
    MentorshipSession,
    Notification,
    MentorFeedback,
    StudentSkill,
)
from services.email_service import email_service

client = TestClient(app)


def helper_register_and_login_mentor(name: str, expertise: str = "Machine Learning"):
    unique_email = f"mentor.{uuid.uuid4().hex[:8]}@pathforge.ai"
    reg_payload = {
        "name": name,
        "email": unique_email,
        "password": "Password123!",
        "title": f"Staff {expertise} Practitioner",
        "experience_years": 8,
        "expertise_areas": [expertise, "Distributed Systems"],
        "company": "DeepMind AI Labs",
        "linkedin_url": "https://linkedin.com/in/test-mentor",
        "bio": "Experienced technology mentor guiding production AI architecture.",
    }
    res = client.post("/api/auth/register/mentor", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    if data.get("status") == "pending_verification":
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


def test_01_relationship_verification_and_persistence():
    """Verify Student requests mentorship, Mentor accepts, and relationship persists in database."""
    student_id, student_headers, _ = helper_register_and_login_student("Alice Cooper")
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr Bob Stone")

    # 1. Student requests mentorship
    req_payload = {
        "mentor_id": mentor_id,
        "career_goal": "Machine Learning Engineer",
        "message": "Hello Dr Bob, I would love your guidance on ML production architecture.",
    }
    req_res = client.post("/api/mentor/request", json=req_payload, headers=student_headers)
    assert req_res.status_code == 200
    request_id = req_res.json()["request_id"]
    assert request_id is not None

    # 2. Mentor accepts request
    accept_res = client.post(
        f"/api/mentor/requests/{request_id}/accept",
        json={"status": "accepted", "response_note": "Glad to mentor you, Alice!"},
        headers=mentor_headers,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # 3. Verify in database: MentorStudentAssignment is active
    db = SessionLocal()
    assignment = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.mentor_id == mentor_id,
            MentorStudentAssignment.student_id == student_id,
            MentorStudentAssignment.status == "active",
        )
        .first()
    )
    assert assignment is not None
    assert "Alice" in assignment.notes or "Glad to mentor you" in assignment.notes
    db.close()


def test_02_student_my_mentors_and_mentor_my_students():
    """Verify Student sees assigned mentor and Mentor sees assigned student in My Students."""
    student_id, student_headers, _ = helper_register_and_login_student("Clara Oswald")
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("The Doctor")

    # Connect them directly
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
        notes="Time travel and distributed systems guidance",
    ))
    db.commit()
    db.close()

    # Student checks /api/student/my-mentors
    my_mentors_res = client.get("/api/student/my-mentors", headers=student_headers)
    assert my_mentors_res.status_code == 200
    my_mentors = my_mentors_res.json()
    assert len(my_mentors) >= 1
    found = next((m for m in my_mentors if m["mentor_id"] == mentor_id), None)
    assert found is not None
    assert found["mentor_name"] == "The Doctor"
    assert found["status"] == "active"

    # Mentor checks /api/mentor/students
    my_students_res = client.get("/api/mentor/students", headers=mentor_headers)
    assert my_students_res.status_code == 200
    my_students = my_students_res.json()
    assert len(my_students) >= 1
    st_found = next((s for s in my_students if s["student_id"] == student_id), None)
    assert st_found is not None
    assert "Clara" in st_found["name"]

    # Mentor inspects student detail
    detail_res = client.get(f"/api/mentor/students/{student_id}", headers=mentor_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["student_id"] == student_id
    assert "skills" in detail
    assert "roadmap_steps" in detail
    assert "sessions" in detail


def test_03_session_scheduling_and_notification():
    """Verify Mentor schedules session, session is recorded, and Student receives in-app notification."""
    student_id, student_headers, _ = helper_register_and_login_student("Peter Parker")
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Tony Stark")

    # Connect assignment
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
        notes="Avionics and Spider-suit AI",
    ))
    db.commit()
    db.close()

    # Schedule future session
    future_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
    sess_payload = {
        "student_id": student_id,
        "topic": "Neural Suit Telemetry & Quantum AI",
        "session_date": future_date,
        "start_time": "11:00 AM",
        "end_time": "12:00 PM",
        "platform": "Google Meet",
        "meeting_link": "https://meet.google.com/stark-parker",
        "notes": "Bring telemetry logs and sensor calibration data.",
    }
    sched_res = client.post("/api/mentor/sessions", json=sess_payload, headers=mentor_headers)
    assert sched_res.status_code == 200, sched_res.text
    session_id = sched_res.json()["data"]["session_id"]
    assert session_id.startswith("SES-")

    # Check Student sessions endpoint
    student_sess_res = client.get("/api/student/sessions", headers=student_headers)
    assert student_sess_res.status_code == 200
    student_sessions = student_sess_res.json()
    matching = next((s for s in student_sessions if s["session_id"] == session_id), None)
    assert matching is not None
    assert matching["topic"] == "Neural Suit Telemetry & Quantum AI"
    assert matching["session_date"] == future_date
    assert matching["meeting_link"] == "https://meet.google.com/stark-parker"
    assert matching["notes"] == "Bring telemetry logs and sensor calibration data."
    assert matching["status"] == "upcoming"

    # Check Student received in-app notification
    notif_res = client.get("/api/student/notifications", headers=student_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    sched_notif = next((n for n in notifs if n["type"] == "session_scheduled"), None)
    assert sched_notif is not None
    assert "Tony Stark" in sched_notif["message"]


def test_04_session_reschedule_workflow():
    """Verify Mentor reschedules session, database updates, and Student receives reschedule notification."""
    student_id, student_headers, _ = helper_register_and_login_student("Diana Prince")
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Hippolyta Queen")

    # Assign
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))
    db.commit()
    db.close()

    # Schedule session
    sess_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
    sched_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Strategic Systems Architecture",
            "session_date": sess_date,
            "start_time": "02:00 PM",
            "end_time": "03:00 PM",
        },
        headers=mentor_headers,
    )
    assert sched_res.status_code == 200
    session_id = sched_res.json()["data"]["session_id"]

    # Reschedule session
    new_date = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")
    resched_payload = {
        "session_date": new_date,
        "start_time": "04:30 PM",
        "end_time": "05:30 PM",
        "meeting_link": "https://meet.google.com/amazon-strategy",
        "notes": "Moved 1 day later per student schedule request.",
    }
    resched_res = client.patch(
        f"/api/mentor/sessions/{session_id}/reschedule",
        json=resched_payload,
        headers=mentor_headers,
    )
    assert resched_res.status_code == 200
    assert "rescheduled successfully" in resched_res.json()["message"]

    # Verify both portals show updated details
    mentor_sess = client.get(f"/api/mentor/sessions/{session_id}", headers=mentor_headers).json()
    assert mentor_sess["session_date"] == new_date
    assert mentor_sess["start_time"] == "04:30 PM"
    assert mentor_sess["status"] == "rescheduled"
    assert mentor_sess["notes"] == "Moved 1 day later per student schedule request."

    student_sess = client.get("/api/student/sessions", headers=student_headers).json()
    s_record = next((s for s in student_sess if s["session_id"] == session_id), None)
    assert s_record is not None
    assert s_record["session_date"] == new_date
    assert s_record["status"] == "rescheduled"

    # Verify student notification
    notifs = client.get("/api/student/notifications", headers=student_headers).json()
    resched_notif = next((n for n in notifs if n["type"] == "session_rescheduled"), None)
    assert resched_notif is not None
    assert new_date in resched_notif["message"]


def test_05_session_completion_and_notes():
    """Verify Mentor completes session with notes, notes persist, and student notification sent."""
    student_id, student_headers, _ = helper_register_and_login_student("Bruce Wayne")
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Alfred Pennyworth")

    # Assign
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))
    db.commit()
    db.close()

    # Schedule session
    sess_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    sched_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Operational Forensics & Security Deficits",
            "session_date": sess_date,
            "start_time": "09:00 PM",
            "end_time": "10:00 PM",
        },
        headers=mentor_headers,
    )
    assert sched_res.status_code == 200
    session_id = sched_res.json()["data"]["session_id"]

    # Mark completed with session notes
    notes_content = "Excellent grasp of cryptographic algorithms. Action item: Implement zero-trust authentication."
    complete_res = client.patch(
        f"/api/mentor/sessions/{session_id}/status",
        json={"status": "completed", "notes": notes_content},
        headers=mentor_headers,
    )
    assert complete_res.status_code == 200
    assert "completed" in complete_res.json()["message"]

    # Verify student sees completed session and takeaways
    student_sess = client.get("/api/student/sessions?status=completed", headers=student_headers).json()
    completed_record = next((s for s in student_sess if s["session_id"] == session_id), None)
    assert completed_record is not None
    assert completed_record["status"] == "completed"
    assert completed_record["notes"] == notes_content

    # Verify student received session_completed notification
    notifs = client.get("/api/student/notifications", headers=student_headers).json()
    comp_notif = next((n for n in notifs if n["type"] == "session_completed"), None)
    assert comp_notif is not None
    assert "marked completed" in comp_notif["message"]


def test_06_session_validation_and_lockouts():
    """Verify security constraints: unassigned student lockout, conflict detection, invalid state transitions."""
    student_id_1, _, _ = helper_register_and_login_student("Barry Allen")
    student_id_2, _, _ = helper_register_and_login_student("Arthur Curry")
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Professor Charles Xavier")
    unauth_id, unauth_headers, _ = helper_register_and_login_mentor("Magneto Erik")

    # Only assign student_1 to Professor X
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id_1,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))
    db.commit()
    db.close()

    # 1. Attempt to schedule with unassigned student_2 must fail with 403
    future_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    unassigned_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id_2,
            "topic": "Telepathic Signal Processing",
            "session_date": future_date,
            "start_time": "10:00 AM",
            "end_time": "11:00 AM",
        },
        headers=mentor_headers,
    )
    assert unassigned_res.status_code == 403

    # 2. Schedule valid session with student_1
    valid_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id_1,
            "topic": "Speed Force Kinetics",
            "session_date": future_date,
            "start_time": "10:00 AM",
            "end_time": "11:00 AM",
        },
        headers=mentor_headers,
    )
    assert valid_res.status_code == 200
    session_id = valid_res.json()["data"]["session_id"]

    # 3. Schedule conflict on same slot must return 400
    conflict_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id_1,
            "topic": "Speed Force Kinetics Duplicate",
            "session_date": future_date,
            "start_time": "10:00 AM",
            "end_time": "11:00 AM",
        },
        headers=mentor_headers,
    )
    assert conflict_res.status_code == 400
    assert "already scheduled" in conflict_res.json()["detail"].lower()

    # 4. Unauthorized mentor cannot access or modify Professor X's session (403)
    unauth_get = client.get(f"/api/mentor/sessions/{session_id}", headers=unauth_headers)
    assert unauth_get.status_code == 403

    unauth_patch = client.patch(
        f"/api/mentor/sessions/{session_id}/status",
        json={"status": "cancelled"},
        headers=unauth_headers,
    )
    assert unauth_patch.status_code == 403

    # 5. Invalid state transitions:
    # First cancel session
    cancel_res = client.patch(
        f"/api/mentor/sessions/{session_id}/status",
        json={"status": "cancelled"},
        headers=mentor_headers,
    )
    assert cancel_res.status_code == 200

    # Cannot mark cancelled session as completed
    invalid_comp = client.patch(
        f"/api/mentor/sessions/{session_id}/status",
        json={"status": "completed"},
        headers=mentor_headers,
    )
    assert invalid_comp.status_code == 400

    # Cannot reschedule cancelled session
    invalid_resched = client.patch(
        f"/api/mentor/sessions/{session_id}/reschedule",
        json={"session_date": future_date, "start_time": "11:00 AM", "end_time": "12:00 PM"},
        headers=mentor_headers,
    )
    assert invalid_resched.status_code == 400


def test_07_feedback_system_and_student_view():
    """Verify Mentor submits project review feedback, skill is calibrated, and Student views feedback."""
    student_id, student_headers, _ = helper_register_and_login_student("Natasha Romanoff")
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Nick Fury")

    # Assign
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))
    db.commit()
    db.close()

    # Submit project review
    rev_payload = {
        "student_id": student_id,
        "project_id": "P001",
        "skill_id": "SK001",
        "rating": 5,
        "strengths": "Flawless threat modeling and secure architecture implementation.",
        "improvement_areas": "Scale the deployment to high-availability cluster.",
        "comments": "Outstanding execution under tight constraints.",
        "recommended_action": "Proceed to Advanced Distributed Systems module.",
    }
    rev_res = client.post("/api/mentor/project-reviews", json=rev_payload, headers=mentor_headers)
    assert rev_res.status_code == 200, rev_res.text
    assert "calibrated to 100%" in rev_res.json()["message"]

    # Student views feedback via /api/mentor/feedback
    fb_res = client.get("/api/mentor/feedback", headers=student_headers)
    assert fb_res.status_code == 200
    feedbacks = fb_res.json()
    assert len(feedbacks) >= 1
    f_record = next((f for f in feedbacks if f["mentor_id"] == mentor_id), None)
    assert f_record is not None
    assert f_record["rating"] == 5.0
    assert "Flawless threat modeling" in f_record["strengths"]
    assert "Proceed to Advanced Distributed Systems" in f_record["recommended_action"]

    # Check student received feedback_submitted notification
    notifs = client.get("/api/student/notifications", headers=student_headers).json()
    fb_notif = next((n for n in notifs if n["type"] == "feedback_submitted"), None)
    assert fb_notif is not None
    assert "Nick Fury" in fb_notif["message"]


def test_08_notification_read_workflow():
    """Verify marking notifications read individually and all at once for student."""
    student_id, student_headers, _ = helper_register_and_login_student("Steve Rogers")

    # Create test notifications
    db = SessionLocal()
    n1_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    n2_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    db.add(Notification(
        notification_id=n1_id,
        student_id=student_id,
        type="test_event",
        title="Test Notification 1",
        message="Message 1",
        is_read=False,
        created_at=now_str,
    ))
    db.add(Notification(
        notification_id=n2_id,
        student_id=student_id,
        type="test_event",
        title="Test Notification 2",
        message="Message 2",
        is_read=False,
        created_at=now_str,
    ))
    db.commit()
    db.close()

    # Mark n1 read
    mark_res = client.patch(f"/api/student/notifications/{n1_id}/read", headers=student_headers)
    assert mark_res.status_code == 200

    notifs = client.get("/api/student/notifications", headers=student_headers).json()
    n1 = next((n for n in notifs if n["notification_id"] == n1_id), None)
    n2 = next((n for n in notifs if n["notification_id"] == n2_id), None)
    assert n1["is_read"] is True
    assert n2["is_read"] is False

    # Mark all read
    all_res = client.patch("/api/student/notifications/read-all", headers=student_headers)
    assert all_res.status_code == 200

    notifs_after = client.get("/api/student/notifications", headers=student_headers).json()
    n2_after = next((n for n in notifs_after if n["notification_id"] == n2_id), None)
    assert n2_after["is_read"] is True
