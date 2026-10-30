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
from database.connection import init_db, SessionLocal
from database.models import (
    Student,
    Mentor,
    MentorStudentAssignment,
    MentorshipRequest,
    Notification,
)

client = TestClient(app)


def helper_register_and_login_mentor(name: str, expertise: str = "Machine Learning"):
    unique_email = f"mentor.{uuid.uuid4().hex[:8]}@pathforge.ai"
    reg_payload = {
        "name": name,
        "email": unique_email,
        "password": "Password123!",
        "title": f"Senior {expertise} Lead",
        "experience_years": 8,
        "expertise_areas": [expertise, "Cloud Architecture"],
        "company": "DeepMind Partner Labs",
        "linkedin_url": "https://linkedin.com/in/test-mentor-p4",
        "bio": "Senior industry mentor dedicated to portfolio reviews and career acceleration.",
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
        "last_name": name.split()[-1] if len(name.split()) > 1 else "Scholar",
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
def setup_test_db():
    init_db()


def test_01_discover_mentors():
    """Verify that mentor directory queries real mentors from database with rich profile attributes."""
    mentor_id, _, email = helper_register_and_login_mentor("Dr. Elena Rostova", "Generative AI")

    res = client.get("/api/mentors")
    assert res.status_code == 200, res.text
    mentors = res.json()
    assert isinstance(mentors, list)
    assert len(mentors) >= 1

    found = next((m for m in mentors if m.get("mentor_id") == mentor_id), None)
    assert found is not None
    assert found["name"] == "Dr. Elena Rostova"
    assert "Generative AI" in str(found["expertise"])
    assert found["company"] == "DeepMind Partner Labs"
    assert "rating" in found
    assert "availability" in found


def test_02_student_submit_mentorship_request_and_notification():
    """Verify Student submits a mentorship request; persisted as pending and creates mentor notification."""
    student_id, student_hdrs, _ = helper_register_and_login_student("Aria Stark")
    mentor_id, mentor_hdrs, _ = helper_register_and_login_mentor("Dr. Marcus Vance", "MLOps & Systems")

    req_payload = {
        "mentor_id": mentor_id,
        "career_goal": "Machine Learning Engineer",
        "message": "I would love your guidance on my production MLOps capstone project.",
        "topic": "Capstone Guidance",
        "preferred_date": "2026-11-15",
    }

    res = client.post("/api/student/mentorship-requests", json=req_payload, headers=student_hdrs)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "pending"
    request_id = data["request_id"]
    assert request_id.startswith("REQ-")

    # Verify persisted in DB
    db = SessionLocal()
    try:
        db_req = db.query(MentorshipRequest).filter(MentorshipRequest.request_id == request_id).first()
        assert db_req is not None
        assert db_req.student_id == student_id
        assert db_req.mentor_id == mentor_id
        assert db_req.status == "pending"
        assert db_req.career_goal == "Machine Learning Engineer"

        # Verify notification created for mentor
        notif = db.query(Notification).filter(
            Notification.mentor_id == mentor_id,
            Notification.type == "mentorship_request",
        ).first()
        assert notif is not None
        assert "Aria" in notif.message
    finally:
        db.close()


def test_03_prevent_duplicate_pending_requests():
    """Verify that a student cannot submit duplicate pending requests to the same mentor."""
    student_id, student_hdrs, _ = helper_register_and_login_student("Jon Snow")
    mentor_id, mentor_hdrs, _ = helper_register_and_login_mentor("Prof. Charles Xavier", "Neuro-Symbolic AI")

    req_payload = {
        "mentor_id": mentor_id,
        "career_goal": "AI Research Scientist",
        "message": "Requesting mentorship on reasoning architectures.",
    }

    # First request succeeds
    res1 = client.post("/api/student/mentorship-requests", json=req_payload, headers=student_hdrs)
    assert res1.status_code == 200, res1.text

    # Second duplicate request must be rejected with 400
    res2 = client.post("/api/student/mentorship-requests", json=req_payload, headers=student_hdrs)
    assert res2.status_code == 400, res2.text
    assert "pending" in res2.json()["detail"].lower()


def test_04_student_views_own_requests_and_isolation():
    """Verify that students can track their own requests and cannot view another student's requests."""
    student_a_id, student_a_hdrs, _ = helper_register_and_login_student("Student Alpha")
    student_b_id, student_b_hdrs, _ = helper_register_and_login_student("Student Beta")
    mentor_id, _, _ = helper_register_and_login_mentor("Dr. Walter White", "Data Science")

    # Alpha requests mentorship
    res = client.post(
        "/api/student/mentorship-requests",
        json={"mentor_id": mentor_id, "career_goal": "Data Scientist", "message": "Alpha request"},
        headers=student_a_hdrs,
    )
    assert res.status_code == 200
    req_a_id = res.json()["request_id"]

    # Alpha views their request list
    list_a = client.get("/api/student/mentorship-requests", headers=student_a_hdrs)
    assert list_a.status_code == 200
    reqs_a = list_a.json()
    assert any(r["request_id"] == req_a_id for r in reqs_a)

    # Beta views their request list; must NOT contain Alpha's request
    list_b = client.get("/api/student/mentorship-requests", headers=student_b_hdrs)
    assert list_b.status_code == 200
    reqs_b = list_b.json()
    assert not any(r["request_id"] == req_a_id for r in reqs_b)


def test_05_mentor_views_incoming_requests_and_cross_tenant_isolation():
    """Verify Mentor views requests sent to them; Mentor C cannot accept/reject Mentor B's request."""
    student_id, student_hdrs, _ = helper_register_and_login_student("Katniss Everdeen")
    mentor_b_id, mentor_b_hdrs, _ = helper_register_and_login_mentor("Haymitch Abernathy", "Strategy")
    mentor_c_id, mentor_c_hdrs, _ = helper_register_and_login_mentor("Effie Trinket", "Communication")

    # Katniss sends request to Mentor B
    req_res = client.post(
        "/api/student/mentorship-requests",
        json={"mentor_id": mentor_b_id, "career_goal": "Senior Strategy Lead", "message": "Need survival guidance"},
        headers=student_hdrs,
    )
    assert req_res.status_code == 200
    req_id = req_res.json()["request_id"]

    # Mentor B can see the request
    b_list = client.get("/api/mentor/requests", headers=mentor_b_hdrs)
    assert b_list.status_code == 200
    b_reqs = b_list.json()
    assert any(r["request_id"] == req_id for r in b_reqs)

    # Mentor C CANNOT see Mentor B's request
    c_list = client.get("/api/mentor/requests", headers=mentor_c_hdrs)
    assert c_list.status_code == 200
    c_reqs = c_list.json()
    assert not any(r["request_id"] == req_id for r in c_reqs)

    # Mentor C attempts to accept Mentor B's request -> must return 403 Forbidden
    hack_res = client.post(
        f"/api/mentor/requests/{req_id}/accept",
        json={"response_note": "Illegitimate accept"},
        headers=mentor_c_hdrs,
    )
    assert hack_res.status_code == 403, hack_res.text
    assert "forbidden" in hack_res.json()["detail"].lower() or "cannot respond" in hack_res.json()["detail"].lower()


def test_06_acceptance_workflow_cohort_integration():
    """Verify Acceptance Workflow:
    - Status updated to accepted
    - MentorStudentAssignment activated
    - Student appears in mentor's assigned students cohort
    - Student receives acceptance notification
    - Student's request status reflects accepted
    """
    student_id, student_hdrs, _ = helper_register_and_login_student("Luke Skywalker")
    mentor_id, mentor_hdrs, _ = helper_register_and_login_mentor("Master Yoda", "Jedi Engineering")

    # 1. Luke requests mentorship
    req_res = client.post(
        "/api/student/mentorship-requests",
        json={
            "mentor_id": mentor_id,
            "career_goal": "Force Architect",
            "message": "Train me, master.",
        },
        headers=student_hdrs,
    )
    assert req_res.status_code == 200
    req_id = req_res.json()["request_id"]

    # 2. Master Yoda accepts request with response note
    accept_res = client.post(
        f"/api/mentor/requests/{req_id}/accept",
        json={"response_note": "Do or do not, there is no try. Welcome to the cohort."},
        headers=mentor_hdrs,
    )
    assert accept_res.status_code == 200, accept_res.text
    accept_data = accept_res.json()
    assert accept_data["status"] == "accepted"

    # 3. Verify active assignment in DB
    db = SessionLocal()
    try:
        assign = db.query(MentorStudentAssignment).filter(
            MentorStudentAssignment.student_id == student_id,
            MentorStudentAssignment.mentor_id == mentor_id,
            MentorStudentAssignment.status == "active",
        ).first()
        assert assign is not None, "Active MentorStudentAssignment was not created"

        # 4. Verify student notification
        notif = db.query(Notification).filter(
            Notification.student_id == student_id,
            Notification.type == "mentorship_accepted",
        ).first()
        assert notif is not None
        assert "accepted" in notif.message.lower()
    finally:
        db.close()

    # 5. Verify student appears in mentor's cohort endpoint
    cohort_res = client.get("/api/mentor/students", headers=mentor_hdrs)
    assert cohort_res.status_code == 200
    cohort = cohort_res.json()
    assert any(s["student_id"] == student_id for s in cohort)

    # 6. Verify student sees accepted status in request list
    st_reqs = client.get("/api/student/mentorship-requests", headers=student_hdrs).json()
    my_req = next((r for r in st_reqs if r["request_id"] == req_id), None)
    assert my_req is not None
    assert my_req["status"] == "accepted"
    assert "Do or do not" in my_req["response_note"]

    # 7. Submitting another request while actively assigned must fail with 400
    dup_active = client.post(
        "/api/student/mentorship-requests",
        json={"mentor_id": mentor_id, "career_goal": "Jedi Knight", "message": "Again please"},
        headers=student_hdrs,
    )
    assert dup_active.status_code == 400
    assert "active mentorship" in dup_active.json()["detail"].lower() or "already exists" in dup_active.json()["detail"].lower()


def test_07_rejection_workflow():
    """Verify Rejection Workflow:
    - Status updated to rejected
    - No active assignment created
    - Student receives rejection notification
    - Student sees rejected status with mentor response note
    """
    student_id, student_hdrs, _ = helper_register_and_login_student("Frodo Baggins")
    mentor_id, mentor_hdrs, _ = helper_register_and_login_mentor("Saruman The White", "Staff Operations")

    # 1. Frodo requests mentorship
    req_res = client.post(
        "/api/student/mentorship-requests",
        json={
            "mentor_id": mentor_id,
            "career_goal": "Ring Bearer",
            "message": "Need advice on Mordor deployment.",
        },
        headers=student_hdrs,
    )
    assert req_res.status_code == 200
    req_id = req_res.json()["request_id"]

    # 2. Saruman rejects request
    rej_res = client.post(
        f"/api/mentor/requests/{req_id}/reject",
        json={"response_note": "Currently operating at full tower capacity."},
        headers=mentor_hdrs,
    )
    assert rej_res.status_code == 200, rej_res.text
    rej_data = rej_res.json()
    assert rej_data["status"] == "rejected"

    # 3. Verify NO active assignment created
    db = SessionLocal()
    try:
        assign = db.query(MentorStudentAssignment).filter(
            MentorStudentAssignment.student_id == student_id,
            MentorStudentAssignment.mentor_id == mentor_id,
            MentorStudentAssignment.status == "active",
        ).first()
        assert assign is None, "Assignment should NOT exist after rejection"

        # 4. Verify rejection notification
        notif = db.query(Notification).filter(
            Notification.student_id == student_id,
            Notification.type == "mentorship_rejected",
        ).first()
        assert notif is not None
        assert "declined" in notif.message.lower()
    finally:
        db.close()

    # 5. Verify student does NOT appear in mentor's assigned cohort
    cohort = client.get("/api/mentor/students", headers=mentor_hdrs).json()
    assert not any(s["student_id"] == student_id for s in cohort)

    # 6. Verify student sees rejected status
    st_reqs = client.get("/api/student/mentorship-requests", headers=student_hdrs).json()
    my_req = next((r for r in st_reqs if r["request_id"] == req_id), None)
    assert my_req is not None
    assert my_req["status"] == "rejected"
    assert "full tower capacity" in my_req["response_note"]


def test_08_student_cancellation_workflow():
    """Verify Student Cancellation Workflow:
    - Student cancels pending request
    - Status marked as cancelled
    - Another student cannot cancel
    - Cannot accept/reject cancelled request
    """
    student_a_id, student_a_hdrs, _ = helper_register_and_login_student("Harry Potter")
    student_b_id, student_b_hdrs, _ = helper_register_and_login_student("Ron Weasley")
    mentor_id, mentor_hdrs, _ = helper_register_and_login_mentor("Severus Snape", "Potions & ML")

    # 1. Harry submits request
    req_res = client.post(
        "/api/student/mentorship-requests",
        json={"mentor_id": mentor_id, "career_goal": "Auror", "message": "Potions help please"},
        headers=student_a_hdrs,
    )
    assert req_res.status_code == 200
    req_id = req_res.json()["request_id"]

    # 2. Ron cannot cancel Harry's request (403)
    hack_cancel = client.delete(f"/api/student/mentorship-requests/{req_id}", headers=student_b_hdrs)
    assert hack_cancel.status_code == 403

    # 3. Harry cancels own request (200)
    cancel_res = client.delete(f"/api/student/mentorship-requests/{req_id}", headers=student_a_hdrs)
    assert cancel_res.status_code == 200
    assert "cancelled" in cancel_res.json()["message"].lower()

    # 4. Status is now cancelled
    st_reqs = client.get("/api/student/mentorship-requests", headers=student_a_hdrs).json()
    my_req = next((r for r in st_reqs if r["request_id"] == req_id), None)
    assert my_req is not None
    assert my_req["status"] == "cancelled"

    # 5. Mentor cannot accept a cancelled request (400)
    accept_cancelled = client.post(
        f"/api/mentor/requests/{req_id}/accept",
        json={"response_note": "Too late"},
        headers=mentor_hdrs,
    )
    assert accept_cancelled.status_code == 400
    assert "cannot be processed" in accept_cancelled.json()["detail"].lower()
