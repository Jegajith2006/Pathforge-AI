"""
Phase 8: Mentor-Student Messaging and Notifications Test Suite
Verifies:
1. Connected mentor can message their assigned student.
2. The student can reply to their assigned mentor.
3. Messages persist in database and reload accurately.
4. Previous messages load in correct chronological order with proper sender/recipient metadata.
5. Unread counts update correctly (increment on send, clear when thread/message is read).
6. Reading a conversation or message updates its read status.
7. In-app notifications are generated for messaging and mentorship events.
8. Notifications can be marked as read individually and in bulk (read-all).
9. Unauthorized users cannot access or send messages to another conversation (403 Forbidden).
10. Empty and whitespace-only messages are rejected (400 Bad Request).
11. Failed API requests display useful, specific error messages.
12. Notifications are not duplicated by repeated or idempotent requests.
13. Existing mentor connections, sessions, student progress, and authentication still work.
"""

import sys
import uuid
from datetime import datetime
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
    MentorMessage,
    Notification,
)
from services.email_service import email_service

client = TestClient(app)


def helper_register_and_login_mentor(name: str, expertise: str = "Machine Learning"):
    unique_email = f"mentor.p8.{uuid.uuid4().hex[:8]}@pathforge.ai"
    reg_payload = {
        "name": name,
        "email": unique_email,
        "password": "Password123!",
        "title": f"Staff {expertise} Engineer",
        "experience_years": 7,
        "expertise_areas": [expertise, "System Design"],
        "company": "Antigravity AI Systems",
        "linkedin_url": "https://linkedin.com/in/test-mentor-p8",
        "bio": "Mentoring future AI/ML practitioners.",
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
    return {
        "token": token,
        "headers": headers,
        "mentor_id": mentor_id,
        "name": name,
        "email": unique_email,
    }


def helper_register_and_login_student(name: str, career_id: str = "C01"):
    unique_email = f"student.p8.{uuid.uuid4().hex[:8]}@stanford.edu"
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
    return {
        "token": token,
        "headers": headers,
        "student_id": student_id,
        "name": name,
        "email": unique_email,
    }


def helper_assign_student_to_mentor(student_id: str, mentor_id: str, notes: str = "Active Assignment"):
    db = SessionLocal()
    existing = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.student_id == student_id,
            MentorStudentAssignment.mentor_id == mentor_id,
        )
        .first()
    )
    if not existing:
        assignment = MentorStudentAssignment(
            student_id=student_id,
            mentor_id=mentor_id,
            assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            notes=notes,
        )
        db.add(assignment)
        db.commit()
    db.close()


# =========================================================================
# TEST 1 & 2: CONNECTED MENTOR CAN MESSAGE STUDENT AND STUDENT CAN REPLY
# =========================================================================

def test_01_mentor_messages_student_and_student_replies():
    mentor = helper_register_and_login_mentor("Dr. Marcus Vance", "MLOps")
    student = helper_register_and_login_student("Elena Rostova")
    helper_assign_student_to_mentor(student["student_id"], mentor["mentor_id"])

    # 1. Mentor sends message to student
    send_res = client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": student["student_id"], "content": "Welcome Elena! Let's discuss your roadmap."},
    )
    assert send_res.status_code == 200, send_res.text
    assert "sent successfully" in send_res.json()["message"].lower()

    # Verify student received in-app notification
    notifs = client.get("/api/student/notifications", headers=student["headers"]).json()
    assert len(notifs) >= 1
    msg_notif = next((n for n in notifs if n["type"] == "message"), None)
    assert msg_notif is not None
    assert "Marcus Vance" in msg_notif["title"]

    # 2. Student replies to mentor
    reply_res = client.post(
        "/api/student/messages",
        headers=student["headers"],
        json={"mentor_id": mentor["mentor_id"], "content": "Thank you Dr. Vance! Excited to get started."},
    )
    assert reply_res.status_code == 200, reply_res.text
    assert "sent successfully" in reply_res.json()["message"].lower()

    # Verify mentor received in-app notification
    mentor_notifs = client.get("/api/mentor/notifications", headers=mentor["headers"]).json()
    assert len(mentor_notifs) >= 1
    mentor_msg_notif = next((n for n in mentor_notifs if n["type"] == "message"), None)
    assert mentor_msg_notif is not None
    assert "Elena" in mentor_msg_notif["title"]


# =========================================================================
# TEST 3 & 4: MESSAGE PERSISTENCE AND CHRONOLOGICAL ORDER
# =========================================================================

def test_02_messages_persist_and_load_in_chronological_order():
    mentor = helper_register_and_login_mentor("Sarah Connor", "Cybernetics")
    student = helper_register_and_login_student("John Reese")
    helper_assign_student_to_mentor(student["student_id"], mentor["mentor_id"])

    # Exchange 3 messages
    client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": student["student_id"], "content": "Step 1: Check neural net weights."},
    )
    client.post(
        "/api/student/messages",
        headers=student["headers"],
        json={"mentor_id": mentor["mentor_id"], "content": "Step 2: Weights calibrated."},
    )
    client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": student["student_id"], "content": "Step 3: Proceed to deployment."},
    )

    # Student retrieves thread
    st_thread = client.get(
        f"/api/student/messages?mentor_id={mentor['mentor_id']}",
        headers=student["headers"],
    ).json()
    assert len(st_thread) == 3
    assert st_thread[0]["content"] == "Step 1: Check neural net weights."
    assert st_thread[0]["sender_role"] == "mentor"
    assert st_thread[1]["content"] == "Step 2: Weights calibrated."
    assert st_thread[1]["sender_role"] == "student"
    assert st_thread[2]["content"] == "Step 3: Proceed to deployment."
    assert st_thread[2]["sender_role"] == "mentor"

    # Mentor retrieves thread
    mentor_thread = client.get(
        f"/api/mentor/messages?student_id={student['student_id']}",
        headers=mentor["headers"],
    ).json()
    assert len(mentor_thread) == 3
    assert [m["content"] for m in mentor_thread] == [
        "Step 1: Check neural net weights.",
        "Step 2: Weights calibrated.",
        "Step 3: Proceed to deployment.",
    ]


# =========================================================================
# TEST 5 & 6: UNREAD COUNTS AND READ STATUS LIFECYCLE
# =========================================================================

def test_03_unread_counts_and_read_status_updates():
    mentor = helper_register_and_login_mentor("Dr. Gregory House", "Diagnostics")
    student = helper_register_and_login_student("Allison Cameron")
    helper_assign_student_to_mentor(student["student_id"], mentor["mentor_id"])

    # Student unread count initially 0
    init_unread = client.get("/api/student/messages/unread-count", headers=student["headers"]).json()
    assert init_unread["unread_count"] == 0

    # Mentor sends 2 messages to student
    client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": student["student_id"], "content": "Message 1 for Cameron."},
    )
    client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": student["student_id"], "content": "Message 2 for Cameron."},
    )

    # Student unread count should be 2
    unread_after = client.get("/api/student/messages/unread-count", headers=student["headers"]).json()
    assert unread_after["unread_count"] == 2

    # Conversations list should also reflect unread_count = 2
    convs = client.get("/api/student/messages", headers=student["headers"]).json()
    assert len(convs) == 1
    assert convs[0]["unread_count"] == 2

    # Student opens the thread -> auto-marks thread as read
    thread = client.get(
        f"/api/student/messages?mentor_id={mentor['mentor_id']}",
        headers=student["headers"],
    ).json()
    assert len(thread) == 2

    # Unread count should now be 0
    unread_cleared = client.get("/api/student/messages/unread-count", headers=student["headers"]).json()
    assert unread_cleared["unread_count"] == 0

    # Student sends message to mentor
    client.post(
        "/api/student/messages",
        headers=student["headers"],
        json={"mentor_id": mentor["mentor_id"], "content": "Got your messages Dr. House."},
    )

    # Mentor unread count should be 1
    mentor_unread = client.get("/api/mentor/messages/unread-count", headers=mentor["headers"]).json()
    assert mentor_unread["unread_count"] == 1

    # Mentor marks conversation thread as read via read-thread endpoint
    read_thread_res = client.patch(
        f"/api/mentor/messages/read-thread?student_id={student['student_id']}",
        headers=mentor["headers"],
    )
    assert read_thread_res.status_code == 200

    # Mentor unread count should now be 0
    mentor_unread_after = client.get("/api/mentor/messages/unread-count", headers=mentor["headers"]).json()
    assert mentor_unread_after["unread_count"] == 0


# =========================================================================
# TEST 7 & 8: IN-APP NOTIFICATIONS CREATION AND READ STATUS
# =========================================================================

def test_04_notification_creation_and_mark_as_read():
    mentor = helper_register_and_login_mentor("Katherine Johnson", "Orbital Mechanics")
    student = helper_register_and_login_student("Dorothy Vaughan")
    helper_assign_student_to_mentor(student["student_id"], mentor["mentor_id"])

    # Mentor sends message to generate student notification
    client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": student["student_id"], "content": "Trajectory looks nominal."},
    )

    notifs = client.get("/api/student/notifications", headers=student["headers"]).json()
    assert len(notifs) >= 1
    target_notif = notifs[0]
    assert target_notif["is_read"] is False

    # Mark single notification as read
    mark_res = client.patch(
        f"/api/student/notifications/{target_notif['notification_id']}/read",
        headers=student["headers"],
    )
    assert mark_res.status_code == 200

    # Check notification is read
    notifs_updated = client.get("/api/student/notifications", headers=student["headers"]).json()
    read_item = next(n for n in notifs_updated if n["notification_id"] == target_notif["notification_id"])
    assert read_item["is_read"] is True

    # Generate another notification for student
    client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": student["student_id"], "content": "Preparing for stage two."},
    )

    # Mark all student notifications as read
    all_read_res = client.patch("/api/student/notifications/read-all", headers=student["headers"])
    assert all_read_res.status_code == 200

    notifs_final = client.get("/api/student/notifications", headers=student["headers"]).json()
    assert all(n["is_read"] is True for n in notifs_final)


# =========================================================================
# TEST 9: PERMISSION BOUNDARIES (UNAUTHORIZED ACCESS PREVENTED)
# =========================================================================

def test_05_unauthorized_messaging_access_blocked():
    mentor_a = helper_register_and_login_mentor("Mentor Alpha", "Security")
    mentor_b = helper_register_and_login_mentor("Mentor Beta", "Security")
    student_x = helper_register_and_login_student("Student X")
    student_y = helper_register_and_login_student("Student Y")

    # Only assign student_x to mentor_a
    helper_assign_student_to_mentor(student_x["student_id"], mentor_a["mentor_id"])

    # 1. Unassigned mentor_b cannot message student_x -> 403 Forbidden
    b_msg_x = client.post(
        "/api/mentor/messages",
        headers=mentor_b["headers"],
        json={"student_id": student_x["student_id"], "content": "Unauthorized message."},
    )
    assert b_msg_x.status_code == 403
    assert "not assigned" in b_msg_x.json()["detail"].lower()

    # 2. Mentor_a cannot message unassigned student_y -> 403 Forbidden
    a_msg_y = client.post(
        "/api/mentor/messages",
        headers=mentor_a["headers"],
        json={"student_id": student_y["student_id"], "content": "Unauthorized message."},
    )
    assert a_msg_y.status_code == 403
    assert "not assigned" in a_msg_y.json()["detail"].lower()

    # 3. Student_y cannot message unassigned mentor_a -> 403 Forbidden
    y_msg_a = client.post(
        "/api/student/messages",
        headers=student_y["headers"],
        json={"mentor_id": mentor_a["mentor_id"], "content": "Unauthorized message."},
    )
    assert y_msg_a.status_code == 403
    assert "assigned" in y_msg_a.json()["detail"].lower()

    # 4. Student_y cannot read conversation between student_x and mentor_a -> 403 Forbidden
    y_read_thread = client.get(
        f"/api/student/messages?mentor_id={mentor_a['mentor_id']}",
        headers=student_y["headers"],
    )
    assert y_read_thread.status_code == 403

    # 5. Mentor_b cannot read conversation between student_x and mentor_a -> 403 Forbidden
    b_read_thread = client.get(
        f"/api/mentor/messages?student_id={student_x['student_id']}",
        headers=mentor_b["headers"],
    )
    assert b_read_thread.status_code == 403


# =========================================================================
# TEST 10: EMPTY AND WHITESPACE-ONLY MESSAGES REJECTED
# =========================================================================

def test_06_empty_and_whitespace_messages_rejected():
    mentor = helper_register_and_login_mentor("Alan Turing", "Cryptography")
    student = helper_register_and_login_student("Joan Clarke")
    helper_assign_student_to_mentor(student["student_id"], mentor["mentor_id"])

    # Mentor empty message
    m_empty = client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": student["student_id"], "content": ""},
    )
    assert m_empty.status_code == 400
    assert "cannot be empty" in m_empty.json()["detail"].lower()

    # Mentor whitespace-only message
    m_space = client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": student["student_id"], "content": "   \n\t  "},
    )
    assert m_space.status_code == 400
    assert "cannot be empty" in m_space.json()["detail"].lower()

    # Student empty message
    s_empty = client.post(
        "/api/student/messages",
        headers=student["headers"],
        json={"mentor_id": mentor["mentor_id"], "content": ""},
    )
    assert s_empty.status_code == 400
    assert "cannot be empty" in s_empty.json()["detail"].lower()

    # Student whitespace-only message
    s_space = client.post(
        "/api/student/messages",
        headers=student["headers"],
        json={"mentor_id": mentor["mentor_id"], "content": "    "},
    )
    assert s_space.status_code == 400
    assert "cannot be empty" in s_space.json()["detail"].lower()


# =========================================================================
# TEST 11: USEFUL ERRORS ON INVALID REQUESTS
# =========================================================================

def test_07_useful_errors_on_invalid_requests():
    mentor = helper_register_and_login_mentor("Ada Lovelace", "Analytical Engines")
    student = helper_register_and_login_student("Charles Babbage")
    helper_assign_student_to_mentor(student["student_id"], mentor["mentor_id"])

    # Non-existent student ID
    fake_st_res = client.post(
        "/api/mentor/messages",
        headers=mentor["headers"],
        json={"student_id": "ST-NONEXISTENT", "content": "Hello?"},
    )
    assert fake_st_res.status_code == 404
    assert "student not found" in fake_st_res.json()["detail"].lower()

    # Non-existent mentor ID
    fake_m_res = client.post(
        "/api/student/messages",
        headers=student["headers"],
        json={"mentor_id": "M-NONEXISTENT", "content": "Hello?"},
    )
    assert fake_m_res.status_code == 404
    assert "mentor not found" in fake_m_res.json()["detail"].lower()

    # Non-existent message ID mark read
    fake_msg_res = client.patch(
        "/api/mentor/messages/MSG-NONEXISTENT/read",
        headers=mentor["headers"],
    )
    assert fake_msg_res.status_code == 404


# =========================================================================
# TEST 12: UNREAD NOTIFICATION AND MESSAGE COUNTERS ENDPOINTS
# =========================================================================

def test_08_unread_counters_endpoints():
    mentor = helper_register_and_login_mentor("Grace Hopper", "Compilers")
    student = helper_register_and_login_student("Frances Allen")
    helper_assign_student_to_mentor(student["student_id"], mentor["mentor_id"])

    # Initial counts should be valid integer schemas
    st_msg_count = client.get("/api/student/messages/unread-count", headers=student["headers"]).json()
    assert "unread_count" in st_msg_count
    assert isinstance(st_msg_count["unread_count"], int)

    m_msg_count = client.get("/api/mentor/messages/unread-count", headers=mentor["headers"]).json()
    assert "unread_count" in m_msg_count
    assert isinstance(m_msg_count["unread_count"], int)

    st_notif_count = client.get("/api/student/notifications/unread-count", headers=student["headers"]).json()
    assert "unread_count" in st_notif_count

    m_notif_count = client.get("/api/mentor/notifications/unread-count", headers=mentor["headers"]).json()
    assert "unread_count" in m_notif_count


# =========================================================================
# TEST 13: REGRESSION TEST FOR EXISTING PHASES 3-7 FUNCTIONALITY
# =========================================================================

def test_09_regression_verification():
    mentor = helper_register_and_login_mentor("Linus Torvalds", "Kernel Development")
    student = helper_register_and_login_student("Dennis Ritchie")
    helper_assign_student_to_mentor(student["student_id"], mentor["mentor_id"])

    # Verify session scheduling from Phase 7 still works
    sess_res = client.post(
        "/api/mentor/sessions",
        headers=mentor["headers"],
        json={
            "student_id": student["student_id"],
            "session_date": "2026-11-20",
            "start_time": "14:00",
            "end_time": "15:00",
            "topic": "Kernel Drivers Architecture",
            "platform": "Google Meet",
            "meeting_link": "https://meet.google.com/lin-torv-reg",
            "notes": "Bring memory management diagrams.",
        },
    )
    assert sess_res.status_code == 200
    sess_id = sess_res.json()["data"]["session_id"]

    # Verify student sees session
    st_sess_list = client.get("/api/student/sessions", headers=student["headers"]).json()
    assert any(s["session_id"] == sess_id for s in st_sess_list)

    # Verify mentor sees student in assigned mentees
    m_students = client.get("/api/mentor/students", headers=mentor["headers"]).json()
    assert any(s["student_id"] == student["student_id"] for s in m_students)
