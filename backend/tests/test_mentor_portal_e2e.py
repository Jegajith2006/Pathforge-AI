import os
import sys
import uuid
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
from database.connection import init_db, get_db
from database.models import (
    Student,
    Mentor,
    MentorStudentAssignment,
    MentorshipSession,
    MentorFeedback,
    MentorMessage,
    MentorResource,
    StudentSkill,
)

client = TestClient(app)


def test_mentor_registration_and_validation():
    """Tests Phase 4 & Phase 17: Mentor registration, Pydantic validation, password hashing."""
    init_db()

    unique_email = f"test.mentor.{uuid.uuid4().hex[:6]}@pathforge.ai"
    payload = {
        "name": "Dr. Sarah Connor",
        "email": unique_email,
        "password": "securepassword123",
        "title": "Director of Machine Learning",
        "experience_years": 8,
        "expertise_areas": ["Machine Learning", "Deep Learning", "Generative AI"],
        "company": "Cyberdyne AI Research",
        "linkedin_url": "https://linkedin.com/in/sarah-connor-ai",
        "bio": "Experienced ML researcher specializing in generative models and safety.",
    }

    res = client.post("/api/auth/register/mentor", json=payload)
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

    assert data["role"] == "mentor"
    assert data["email"] == unique_email
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["name"] == "Dr. Sarah Connor"
    mentor_id = data["user_id"]
    assert mentor_id.startswith("M")

    # Duplicate registration must fail
    dup_res = client.post("/api/auth/register/mentor", json=payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"].lower()


def test_dual_role_login_and_routing():
    """Tests Phase 5: Student login vs Mentor login and profile resolution."""
    # 1. Login as Student
    student_res = client.post("/api/auth/login", json={"email": "alex.chen@stanford.edu", "password": "password123"})
    assert student_res.status_code == 200
    student_data = student_res.json()
    assert student_data["role"] == "student"
    assert "access_token" in student_data
    student_token = student_data["access_token"]

    # 2. Login as Mentor
    mentor_res = client.post("/api/auth/login", json={"email": "alex.mentor@pathforge.ai", "password": "password123"})
    assert mentor_res.status_code == 200
    mentor_data = mentor_res.json()
    assert mentor_data["role"] == "mentor"
    assert "access_token" in mentor_data
    mentor_token = mentor_data["access_token"]

    # 3. GET /api/auth/me for student
    me_student = client.get("/api/auth/me", headers={"Authorization": f"Bearer {student_token}"})
    assert me_student.status_code == 200
    assert me_student.json()["role"] == "student"
    assert me_student.json()["student_id"] == "U001"

    # 4. GET /api/auth/me for mentor
    me_mentor = client.get("/api/auth/me", headers={"Authorization": f"Bearer {mentor_token}"})
    assert me_mentor.status_code == 200
    assert me_mentor.json()["role"] == "mentor"
    assert "Dr. Alex Chen" in me_mentor.json()["name"]


def test_role_based_access_control():
    """Tests Phase 5 & Phase 17: Students cannot access mentor endpoints, and vice versa."""
    student_res = client.post("/api/auth/login", json={"email": "alex.chen@stanford.edu", "password": "password123"})
    student_token = student_res.json()["access_token"]

    mentor_res = client.post("/api/auth/login", json={"email": "alex.mentor@pathforge.ai", "password": "password123"})
    mentor_token = mentor_res.json()["access_token"]

    # Student attempting to access mentor dashboard -> 403 Forbidden
    forbidden_res = client.get("/api/mentor/dashboard", headers={"Authorization": f"Bearer {student_token}"})
    assert forbidden_res.status_code == 403
    assert "not authorized for mentor" in forbidden_res.json()["detail"].lower()

    # Mentor accessing mentor dashboard -> 200 OK
    allowed_res = client.get("/api/mentor/dashboard", headers={"Authorization": f"Bearer {mentor_token}"})
    assert allowed_res.status_code == 200


def test_mentor_dashboard_database_backed_metrics():
    """Tests Phase 6: Mentor dashboard returns authentic, database-backed metrics."""
    mentor_res = client.post("/api/auth/login", json={"email": "alex.mentor@pathforge.ai", "password": "password123"})
    mentor_token = mentor_res.json()["access_token"]

    res = client.get("/api/mentor/dashboard", headers={"Authorization": f"Bearer {mentor_token}"})
    assert res.status_code == 200
    data = res.json()

    assert "metrics" in data
    assert data["metrics"]["assigned_students"] >= 1
    assert data["metrics"]["upcoming_sessions"] >= 1
    assert data["metrics"]["project_reviews_completed"] >= 1
    assert isinstance(data["upcoming_sessions"], list)
    assert isinstance(data["student_progress_overview"], list)
    assert isinstance(data["recent_messages"], list)
    assert isinstance(data["career_distribution"], list)


def test_student_isolation_and_assignment():
    """Tests Phase 7: Mentor cannot inspect unassigned students."""
    mentor_res = client.post("/api/auth/login", json={"email": "alex.mentor@pathforge.ai", "password": "password123"})
    mentor_token = mentor_res.json()["access_token"]

    # Student U001 is assigned to Dr. Alex Chen
    ok_res = client.get("/api/mentor/students/U001", headers={"Authorization": f"Bearer {mentor_token}"})
    assert ok_res.status_code == 200
    assert ok_res.json()["student_id"] == "U001"

    # Create unassigned dummy student ID or query unassigned student U199
    unassigned_res = client.get("/api/mentor/students/U199", headers={"Authorization": f"Bearer {mentor_token}"})
    assert unassigned_res.status_code == 403
    assert "not assigned to you" in unassigned_res.json()["detail"].lower()


def test_session_lifecycle():
    """Tests Phase 8: Session creation and status update."""
    mentor_res = client.post("/api/auth/login", json={"email": "alex.mentor@pathforge.ai", "password": "password123"})
    mentor_token = mentor_res.json()["access_token"]

    # Create session with unique topic and time to prevent duplicate session conflicts
    unique_suffix = uuid.uuid4().hex[:6]
    unique_topic = f"NAS Review {unique_suffix}"
    session_payload = {
        "student_id": "U001",
        "topic": unique_topic,
        "session_date": "2026-10-25",
        "start_time": f"03:{unique_suffix[:2]} PM",
        "end_time": "04:00 PM",
        "platform": "Google Meet",
        "meeting_link": "https://meet.google.com/test-session",
        "notes": "Discuss evolutionary NAS milestone",
    }
    create_res = client.post("/api/mentor/sessions", json=session_payload, headers={"Authorization": f"Bearer {mentor_token}"})
    assert create_res.status_code == 200
    assert "scheduled successfully" in create_res.json()["message"]

    # Verify session appears in sessions list
    list_res = client.get("/api/mentor/sessions", headers={"Authorization": f"Bearer {mentor_token}"})
    assert list_res.status_code == 200
    sessions = list_res.json()
    new_sess = next((s for s in sessions if s["topic"] == unique_topic), None)
    assert new_sess is not None

    # Update session status
    update_res = client.patch(
        f"/api/mentor/sessions/{new_sess['session_id']}/status",
        json={"status": "completed"},
        headers={"Authorization": f"Bearer {mentor_token}"},
    )
    assert update_res.status_code == 200


def test_project_review_and_evidence_recalibration():
    """Tests Phase 10: Project review submission and skill evidence recalculation."""
    mentor_res = client.post("/api/auth/login", json={"email": "alex.mentor@pathforge.ai", "password": "password123"})
    mentor_token = mentor_res.json()["access_token"]

    review_payload = {
        "student_id": "U001",
        "project_id": "P001",
        "skill_id": "SK001",
        "rating": 5,
        "strengths": "Exceptional deep learning pipeline with clear tensor shapes.",
        "improvement_areas": "Add ONNX model export for low-latency inference.",
        "comments": "High quality artifact ready for portfolio submission.",
        "recommended_action": "Proceed to deployment milestone.",
    }
    submit_res = client.post("/api/mentor/project-reviews", json=review_payload, headers={"Authorization": f"Bearer {mentor_token}"})
    assert submit_res.status_code == 200
    assert "mentor evidence calibrated" in submit_res.json()["message"].lower()


def test_messages_and_resources():
    """Tests Phase 12 & Phase 13: Messaging and learning resources."""
    mentor_res = client.post("/api/auth/login", json={"email": "alex.mentor@pathforge.ai", "password": "password123"})
    mentor_token = mentor_res.json()["access_token"]

    # Send message
    msg_res = client.post(
        "/api/mentor/messages",
        json={"student_id": "U001", "content": "Keep up the great work on your ML pipeline!"},
        headers={"Authorization": f"Bearer {mentor_token}"},
    )
    assert msg_res.status_code == 200

    # Create resource
    res_payload = {
        "title": "Transformers from Scratch",
        "description": "Step by step multi-head attention tutorial in PyTorch.",
        "category": "Deep Learning",
        "url": "https://example.com/transformers-guide",
        "tags": "PyTorch, Attention",
    }
    create_res = client.post("/api/mentor/resources", json=res_payload, headers={"Authorization": f"Bearer {mentor_token}"})
    assert create_res.status_code == 200

    # Get resources
    get_res = client.get("/api/mentor/resources", headers={"Authorization": f"Bearer {mentor_token}"})
    assert get_res.status_code == 200
    resources = get_res.json()
    assert any(r["title"] == "Transformers from Scratch" for r in resources)
