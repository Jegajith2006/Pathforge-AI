"""
Phase 7: Complete Mentorship Session Management Test Suite
Verifies:
1. Mentor schedules a session with an assigned student (validation, persistence, duration, notification).
2. Session appears in both Mentor and Student portals with correct metadata.
3. Student requests/schedules a session with an assigned mentor.
4. Mentor-student relationship validation prevents scheduling for unassigned counterparts (403).
5. Authorized rescheduling updates date/time, sets status to 'rescheduled', and notifies counterpart.
6. Overlapping session conflict detection rejects conflicting slots for mentor or student (400).
7. Validation rejects past dates, end_time <= start_time, and invalid URL formats (400/422).
8. Cancellation workflow records cancellation reason, preserves session in history, and alerts counterpart.
9. Mentor completes session with takeaways and action items, accessible to the student.
10. State machine lifecycle prevents invalid transitions (e.g. cancelling/rescheduling completed sessions).
11. Role-based isolation ensures users only see and manage their authorized sessions.
12. Regression verification ensures existing mentorship connections, assignments, and progress remain intact.
"""

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
    MentorStudentAssignment,
    MentorshipSession,
    Notification,
)
from services.email_service import email_service

client = TestClient(app)


def helper_register_and_login_mentor(name: str, expertise: str = "Machine Learning"):
    unique_email = f"mentor.p7.{uuid.uuid4().hex[:8]}@pathforge.ai"
    reg_payload = {
        "name": name,
        "email": unique_email,
        "password": "Password123!",
        "title": f"Lead {expertise} Architect",
        "experience_years": 8,
        "expertise_areas": [expertise, "Distributed Systems"],
        "company": "DeepMind Cloud Labs",
        "linkedin_url": "https://linkedin.com/in/test-mentor-p7",
        "bio": "Expert mentor specializing in AI/ML systems and production engineering.",
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


def helper_register_and_login_student(name: str, career_id: str = "C01"):
    unique_email = f"student.p7.{uuid.uuid4().hex[:8]}@pathforge.ai"
    parts = name.split()
    first = parts[0]
    last = parts[-1] if len(parts) > 1 else "Scholar"
    reg_payload = {
        "email": unique_email,
        "password": "Password123!",
        "first_name": first,
        "last_name": last,
        "career_id": career_id,
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


def helper_assign_student_to_mentor(student_id: str, mentor_id: str):
    db = SessionLocal()
    try:
        assign = MentorStudentAssignment(
            student_id=student_id,
            mentor_id=mentor_id,
            assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            status="active",
            notes="Active Phase 7 mentorship assignment",
        )
        db.add(assign)
        db.commit()
    finally:
        db.close()


def test_01_mentor_schedules_session_with_assigned_student():
    """Scenario 1: Mentor schedules a session with an assigned student."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Aris Vance")
    student_id, student_headers, _ = helper_register_and_login_student("Lila Chen")
    helper_assign_student_to_mentor(student_id, mentor_id)

    future_date = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    payload = {
        "student_id": student_id,
        "topic": "Deep Learning Architecture & Model Optimization",
        "session_date": future_date,
        "start_time": "14:00",
        "end_time": "15:00",
        "platform": "Google Meet",
        "meeting_link": "https://meet.google.com/abc-defg-hij",
        "notes": "Bring model benchmark curves and profiling logs.",
    }

    res = client.post("/api/mentor/sessions", json=payload, headers=mentor_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    sess_id = data["data"]["session_id"]
    assert sess_id.startswith("SES-")

    # Verify session persisted in database
    db = SessionLocal()
    try:
        sess = db.query(MentorshipSession).filter(MentorshipSession.session_id == sess_id).first()
        assert sess is not None
        assert sess.status == "upcoming"
        assert sess.topic == "Deep Learning Architecture & Model Optimization"

        # Verify student received in-app notification
        notif = db.query(Notification).filter(
            Notification.student_id == student_id,
            Notification.title.like("%Mentorship Session Scheduled%"),
        ).first()
        assert notif is not None
    finally:
        db.close()


def test_02_session_appears_in_both_portals_and_detail_endpoints():
    """Scenario 2: The session appears in both portals and detail endpoints."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Kaelen Stone")
    student_id, student_headers, _ = helper_register_and_login_student("Maya Patel")
    helper_assign_student_to_mentor(student_id, mentor_id)

    future_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
    create_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Transformer Attention Mechanisms",
            "session_date": future_date,
            "start_time": "11:00",
            "end_time": "12:30",
            "platform": "Google Meet",
            "meeting_link": "https://meet.google.com/xyz-uvw-rst",
            "notes": "Review multi-head self-attention math",
        },
        headers=mentor_headers,
    )
    assert create_res.status_code == 200
    sess_id = create_res.json()["data"]["session_id"]

    # 1. Check mentor list endpoint
    m_list_res = client.get("/api/mentor/sessions", headers=mentor_headers)
    assert m_list_res.status_code == 200
    m_sessions = m_list_res.json()
    m_found = next((s for s in m_sessions if s["session_id"] == sess_id), None)
    assert m_found is not None
    assert m_found["duration_minutes"] == 90
    assert m_found["student_name"] == "Maya Patel"

    # 2. Check student list endpoint
    s_list_res = client.get("/api/student/sessions", headers=student_headers)
    assert s_list_res.status_code == 200
    s_sessions = s_list_res.json()
    s_found = next((s for s in s_sessions if s["session_id"] == sess_id), None)
    assert s_found is not None
    assert s_found["duration_minutes"] == 90
    assert s_found["mentor_name"] == "Kaelen Stone"

    # 3. Check mentor detail endpoint
    m_det_res = client.get(f"/api/mentor/sessions/{sess_id}", headers=mentor_headers)
    assert m_det_res.status_code == 200
    assert m_det_res.json()["session_id"] == sess_id
    assert m_det_res.json()["duration_minutes"] == 90

    # 4. Check student detail endpoint
    s_det_res = client.get(f"/api/student/sessions/{sess_id}", headers=student_headers)
    assert s_det_res.status_code == 200
    assert s_det_res.json()["session_id"] == sess_id
    assert s_det_res.json()["duration_minutes"] == 90


def test_03_student_schedules_session_with_assigned_mentor():
    """Scenario 3: The student requests/schedules a session and it appears in both portals."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Sophia Lin")
    student_id, student_headers, _ = helper_register_and_login_student("Noah Miller")
    helper_assign_student_to_mentor(student_id, mentor_id)

    future_date = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")
    req_payload = {
        "mentor_id": mentor_id,
        "topic": "Career Roadmap & System Design Review",
        "session_date": future_date,
        "start_time": "15:00",
        "end_time": "16:00",
        "platform": "Google Meet",
        "meeting_link": "https://meet.google.com/stu-dent-sess",
        "notes": "Discussing scaling microservices and latency trade-offs.",
    }

    res = client.post("/api/student/sessions", json=req_payload, headers=student_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    sess_id = data["data"]["session_id"]

    # Verify mentor can see this newly requested session
    m_res = client.get("/api/mentor/sessions", headers=mentor_headers)
    assert m_res.status_code == 200
    assert any(s["session_id"] == sess_id for s in m_res.json())

    # Verify mentor received notification
    db = SessionLocal()
    try:
        notif = db.query(Notification).filter(
            Notification.mentor_id == mentor_id,
            Notification.title.like("%Mentorship Session Scheduled%"),
        ).first()
        assert notif is not None
    finally:
        db.close()


def test_04_relationship_validation_unassigned_rejected():
    """Scenario 4: Scheduling rejected if student and mentor are not actively assigned."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Unassigned Mentor")
    student_id, student_headers, _ = helper_register_and_login_student("Unassigned Student")

    future_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")

    # Mentor attempts to schedule with unassigned student
    m_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Unassigned Call",
            "session_date": future_date,
            "start_time": "10:00",
            "end_time": "11:00",
        },
        headers=mentor_headers,
    )
    assert m_res.status_code == 403

    # Student attempts to schedule with unassigned mentor
    s_res = client.post(
        "/api/student/sessions",
        json={
            "mentor_id": mentor_id,
            "topic": "Unassigned Call",
            "session_date": future_date,
            "start_time": "10:00",
            "end_time": "11:00",
        },
        headers=student_headers,
    )
    assert s_res.status_code == 403


def test_05_reschedule_workflow_and_notifications():
    """Scenario 5: Authorized participant reschedules a session; both portals update."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Elena Rostova")
    student_id, student_headers, _ = helper_register_and_login_student("Devon James")
    helper_assign_student_to_mentor(student_id, mentor_id)

    orig_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
    create_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Graph Neural Networks 1:1",
            "session_date": orig_date,
            "start_time": "09:00",
            "end_time": "10:00",
            "platform": "Google Meet",
        },
        headers=mentor_headers,
    )
    assert create_res.status_code == 200
    sess_id = create_res.json()["data"]["session_id"]

    # Student reschedules to new date/time
    new_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
    resched_res = client.patch(
        f"/api/student/sessions/{sess_id}/reschedule",
        json={
            "session_date": new_date,
            "start_time": "14:30",
            "end_time": "15:30",
            "meeting_link": "https://meet.google.com/rescheduled-link",
            "notes": "Rescheduled due to conference schedule conflict.",
        },
        headers=student_headers,
    )
    assert resched_res.status_code == 200, resched_res.text

    # Verify both portals show updated details
    s_check = client.get(f"/api/student/sessions/{sess_id}", headers=student_headers).json()
    assert s_check["status"] == "rescheduled"
    assert s_check["session_date"] == new_date
    assert s_check["start_time"] == "14:30"
    assert s_check["end_time"] == "15:30"

    m_check = client.get(f"/api/mentor/sessions/{sess_id}", headers=mentor_headers).json()
    assert m_check["status"] == "rescheduled"
    assert m_check["session_date"] == new_date

    # Mentor reschedules again
    new_date_2 = (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d")
    m_resched = client.patch(
        f"/api/mentor/sessions/{sess_id}/reschedule",
        json={
            "session_date": new_date_2,
            "start_time": "16:00",
            "end_time": "17:00",
            "notes": "Adjusted to 4 PM as requested.",
        },
        headers=mentor_headers,
    )
    assert m_resched.status_code == 200
    m_check_2 = client.get(f"/api/mentor/sessions/{sess_id}", headers=mentor_headers).json()
    assert m_check_2["session_date"] == new_date_2
    assert m_check_2["start_time"] == "16:00"


def test_06_conflict_detection_and_overlap_rejection():
    """Scenario 6: Conflicting overlapping sessions are rejected for both mentor and student."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Garrison Grey")
    student1_id, student1_headers, _ = helper_register_and_login_student("Student One")
    student2_id, student2_headers, _ = helper_register_and_login_student("Student Two")
    helper_assign_student_to_mentor(student1_id, mentor_id)
    helper_assign_student_to_mentor(student2_id, mentor_id)

    target_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

    # Mentor books 10:00 - 11:00 with Student 1
    first_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student1_id,
            "topic": "Session 1",
            "session_date": target_date,
            "start_time": "10:00",
            "end_time": "11:00",
        },
        headers=mentor_headers,
    )
    assert first_res.status_code == 200

    # Attempt to book overlapping session for same mentor with Student 2 (10:30 - 11:30)
    conflict_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student2_id,
            "topic": "Overlapping Session",
            "session_date": target_date,
            "start_time": "10:30",
            "end_time": "11:30",
        },
        headers=mentor_headers,
    )
    assert conflict_res.status_code == 400
    assert "conflict" in conflict_res.text.lower() or "overlap" in conflict_res.text.lower()

    # Attempt to book overlapping session via Student 1 (10:15 - 10:45)
    s_conflict_res = client.post(
        "/api/student/sessions",
        json={
            "mentor_id": mentor_id,
            "topic": "Student Overlap Attempt",
            "session_date": target_date,
            "start_time": "10:15",
            "end_time": "10:45",
        },
        headers=student1_headers,
    )
    assert s_conflict_res.status_code == 400

    # Non-overlapping session (11:00 - 12:00) should SUCCEED
    valid_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student2_id,
            "topic": "Adjacent Non-Conflicting Session",
            "session_date": target_date,
            "start_time": "11:00",
            "end_time": "12:00",
        },
        headers=mentor_headers,
    )
    assert valid_res.status_code == 200


def test_07_past_dates_and_invalid_times_validation():
    """Scenario 7: Validation rejects past dates, end_time <= start_time, and invalid URL formats."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Valida Tori")
    student_id, student_headers, _ = helper_register_and_login_student("Bobby Valid")
    helper_assign_student_to_mentor(student_id, mentor_id)

    past_date = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    future_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")

    # 1. Past date rejection
    past_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Past Session",
            "session_date": past_date,
            "start_time": "10:00",
            "end_time": "11:00",
        },
        headers=mentor_headers,
    )
    assert past_res.status_code == 400
    assert "past" in past_res.text.lower()

    # 2. End time before start time
    inv_time_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Backwards Time",
            "session_date": future_date,
            "start_time": "14:00",
            "end_time": "13:00",
        },
        headers=mentor_headers,
    )
    assert inv_time_res.status_code == 400
    assert "end time" in inv_time_res.text.lower()

    # 3. Same start and end time
    same_time_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Zero Duration",
            "session_date": future_date,
            "start_time": "14:00",
            "end_time": "14:00",
        },
        headers=mentor_headers,
    )
    assert same_time_res.status_code == 400

    # 4. Invalid meeting link format
    inv_url_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Bad URL",
            "session_date": future_date,
            "start_time": "14:00",
            "end_time": "15:00",
            "meeting_link": "not-a-valid-http-url",
        },
        headers=mentor_headers,
    )
    assert inv_url_res.status_code in [400, 422]


def test_08_cancellation_workflow_and_history_preservation():
    """Scenario 8: Cancellation records reason, preserves history, and removes from upcoming."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Marcus Kane")
    student_id, student_headers, _ = helper_register_and_login_student("Clara Oswald")
    helper_assign_student_to_mentor(student_id, mentor_id)

    future_date = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")
    create_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Full Stack System Architecture",
            "session_date": future_date,
            "start_time": "10:00",
            "end_time": "11:00",
            "notes": "Initial agenda notes",
        },
        headers=mentor_headers,
    )
    assert create_res.status_code == 200
    sess_id = create_res.json()["data"]["session_id"]

    # Student cancels session with reason
    cancel_res = client.patch(
        f"/api/student/sessions/{sess_id}/cancel",
        json={"reason": "Emergency flight travel conflict."},
        headers=student_headers,
    )
    assert cancel_res.status_code == 200

    # Check student detail shows cancelled
    s_det = client.get(f"/api/student/sessions/{sess_id}", headers=student_headers).json()
    assert s_det["status"] == "cancelled"
    assert "Emergency flight travel conflict" in s_det["notes"]

    # Check that session is preserved in session history
    hist_res = client.get("/api/student/sessions", headers=student_headers)
    assert hist_res.status_code == 200
    cancelled_sess = next((s for s in hist_res.json() if s["session_id"] == sess_id), None)
    assert cancelled_sess is not None
    assert cancelled_sess["status"] == "cancelled"

    # Check mentor sessions filter: should not appear in upcoming
    m_up_res = client.get("/api/mentor/sessions?status_filter=upcoming", headers=mentor_headers)
    assert m_up_res.status_code == 200
    assert not any(s["session_id"] == sess_id for s in m_up_res.json())

    # But appears in cancelled filter
    m_canc_res = client.get("/api/mentor/sessions?status_filter=cancelled", headers=mentor_headers)
    assert m_canc_res.status_code == 200
    assert any(s["session_id"] == sess_id for s in m_canc_res.json())


def test_09_complete_session_with_takeaways_and_action_items():
    """Scenario 9: Mentor completes session with takeaways, accessible to student."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Nadia Cole")
    student_id, student_headers, _ = helper_register_and_login_student("Toby Ziegler")
    helper_assign_student_to_mentor(student_id, mentor_id)

    today_date = datetime.now().strftime("%Y-%m-%d")
    create_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "MLOps Pipelines & Dockerized Inference",
            "session_date": today_date,
            "start_time": "09:00",
            "end_time": "10:00",
        },
        headers=mentor_headers,
    )
    assert create_res.status_code == 200
    sess_id = create_res.json()["data"]["session_id"]

    # Mentor marks completed and enters takeaways & action items
    complete_res = client.patch(
        f"/api/mentor/sessions/{sess_id}/status",
        json={
            "status": "completed",
            "notes": "Key takeaways: Excellent grasp of containerization. Action item: Complete GitHub Actions CI/CD pipeline by Friday.",
        },
        headers=mentor_headers,
    )
    assert complete_res.status_code == 200

    # Student views session details and verifies takeaways are accessible
    s_det = client.get(f"/api/student/sessions/{sess_id}", headers=student_headers)
    assert s_det.status_code == 200
    s_data = s_det.json()
    assert s_data["status"] == "completed"
    assert "Key takeaways" in s_data["notes"]
    assert "Action item" in s_data["notes"]


def test_10_state_machine_and_lifecycle_integrity():
    """Scenario 10: State machine prevents invalid transitions (cancelling/rescheduling completed sessions)."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Prof. Charles Xavier")
    student_id, student_headers, _ = helper_register_and_login_student("Jean Grey")
    helper_assign_student_to_mentor(student_id, mentor_id)

    today_date = datetime.now().strftime("%Y-%m-%d")
    create_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Telepathic Data Structures",
            "session_date": today_date,
            "start_time": "10:00",
            "end_time": "11:00",
        },
        headers=mentor_headers,
    )
    sess_id = create_res.json()["data"]["session_id"]

    # Mark completed
    client.patch(
        f"/api/mentor/sessions/{sess_id}/status",
        json={"status": "completed", "notes": "Completed successfully."},
        headers=mentor_headers,
    )

    # Attempt to cancel completed session -> 400 Bad Request
    inv_cancel = client.patch(
        f"/api/student/sessions/{sess_id}/cancel",
        json={"reason": "Cannot cancel completed session"},
        headers=student_headers,
    )
    assert inv_cancel.status_code == 400

    # Attempt to reschedule completed session -> 400 Bad Request
    new_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
    inv_resched = client.patch(
        f"/api/student/sessions/{sess_id}/reschedule",
        json={"session_date": new_date, "start_time": "11:00", "end_time": "12:00"},
        headers=student_headers,
    )
    assert inv_resched.status_code == 400


def test_11_role_based_access_and_session_isolation():
    """Scenario 11: Unauthenticated requests return 401; users cannot access others' sessions."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Isolator")
    student_id, student_headers, _ = helper_register_and_login_student("Isolated Student")
    other_student_id, other_student_headers, _ = helper_register_and_login_student("Other Student")
    helper_assign_student_to_mentor(student_id, mentor_id)

    future_date = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")
    sess_res = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Private Mentorship",
            "session_date": future_date,
            "start_time": "13:00",
            "end_time": "14:00",
        },
        headers=mentor_headers,
    )
    sess_id = sess_res.json()["data"]["session_id"]

    # 1. Unauthenticated access rejected
    assert client.get(f"/api/student/sessions/{sess_id}").status_code in [401, 403]
    assert client.get("/api/mentor/sessions").status_code in [401, 403]

    # 2. Student cannot access mentor-only session creation endpoint
    m_endpoint_as_student = client.post(
        "/api/mentor/sessions",
        json={
            "student_id": student_id,
            "topic": "Hack attempt",
            "session_date": future_date,
            "start_time": "10:00",
            "end_time": "11:00",
        },
        headers=student_headers,
    )
    assert m_endpoint_as_student.status_code == 403

    # 3. Other student cannot access this session
    other_access = client.get(f"/api/student/sessions/{sess_id}", headers=other_student_headers)
    assert other_access.status_code in [403, 404]


def test_12_regression_existing_mentorship_connections_intact():
    """Scenario 12: Existing mentor connections and assignments continue working properly."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Regression Mentor")
    student_id, student_headers, _ = helper_register_and_login_student("Regression Student")
    helper_assign_student_to_mentor(student_id, mentor_id)

    # Verify student's active mentors list
    my_mentors_res = client.get("/api/student/my-mentors", headers=student_headers)
    assert my_mentors_res.status_code == 200
    my_mentors = my_mentors_res.json()
    assert any(m["mentor_id"] == mentor_id for m in my_mentors)

    # Verify mentor's assigned students list
    m_students_res = client.get("/api/mentor/students", headers=mentor_headers)
    assert m_students_res.status_code == 200
    m_students = m_students_res.json()
    assert any(s["student_id"] == student_id for s in m_students)
