import io
import uuid
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_fresh_student_isolation_and_empty_states():
    """Verify that a brand new student does not inherit demo data, career selections, or false readiness."""
    uid = uuid.uuid4().hex[:6]
    email = f"fresh.student.{uid}@test.edu"
    password = "Password123!"

    # 1. Register new student without predefined career
    reg_res = client.post("/api/auth/register/student", json={
        "first_name": "New",
        "last_name": "Student",
        "email": email,
        "password": password,
    })
    assert reg_res.status_code == 200, reg_res.text
    data = reg_res.json()
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Verify Profile has no assumed career or default Stanford University
    prof_res = client.get("/api/profile", headers=headers)
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof.get("target_career_id") is None
    assert prof.get("college") is None or prof.get("college") == ""

    # 3. Verify Dashboard endpoint returns 0 readiness and unselected career state
    dash_res = client.get("/api/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["student"]["target_career_id"] is None
    assert dash["readiness"]["career_readiness_score"] == 0
    assert dash["metrics"]["courses_progress"] == "0 / 0"
    assert dash["metrics"]["projects_verified"] == "0 / 0"
    assert dash["metrics"]["credentials_count"] == 0
    assert dash["resume_status"] == "Not uploaded"

    # 4. Verify Skill Gap returns 0 readiness and empty gaps
    gap_res = client.get("/api/skill-gap", headers=headers)
    assert gap_res.status_code == 200
    gap = gap_res.json()
    assert gap["career_id"] is None
    assert gap["current_readiness"] == 0
    assert len(gap["gaps"]) == 0

    # 5. Verify Career Readiness returns 0
    readiness_res = client.get("/api/career-readiness", headers=headers)
    assert readiness_res.status_code == 200
    readiness = readiness_res.json()
    assert readiness["overall_readiness"] == 0
    assert readiness["skill_match_percentage"] == 0

    # 6. Verify Roadmap returns 0 progress and empty milestones
    roadmap_res = client.get("/api/roadmap", headers=headers)
    assert roadmap_res.status_code == 200
    roadmap = roadmap_res.json()
    assert roadmap["career_id"] is None
    assert roadmap["current_progress_percentage"] == 0
    assert len(roadmap["milestones"]) == 0

    # 7. Now student explicitly chooses a target career: C002 (Machine Learning Engineer)
    set_career_res = client.post("/api/career/select", json={"career_id": "C002"}, headers=headers)
    assert set_career_res.status_code == 200

    # Verify profile now reflects C002
    prof_after = client.get("/api/profile", headers=headers).json()
    assert prof_after["target_career_id"] == "C002"

    # Verify gap analysis now computes against C002
    gap_after = client.get("/api/skill-gap", headers=headers).json()
    assert gap_after["career_id"] == "C002"
    assert len(gap_after["gaps"]) > 0


def test_mentor_approval_and_admin_rejection_lifecycle():
    """Verify mentor registration, 403 access gating, admin rejection with reason, and re-approval."""
    uid = uuid.uuid4().hex[:6]
    mentor_email = f"pending.mentor.{uid}@pathforge.ai"
    password = "Password123!"

    # 1. Register new mentor
    reg_res = client.post("/api/auth/register/mentor", json={
        "name": f"Dr. Candidate {uid}",
        "email": mentor_email,
        "password": password,
        "confirm_password": password,
        "title": "Principal ML Researcher",
        "experience_years": 9,
        "expertise_areas": ["Machine Learning", "Deep Learning"],
        "company": "DeepMind Partner Lab",
        "verification_notes": "IEEE Senior Fellow, 9 years production AI experience.",
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    mentor_id = reg_data["mentor_id"]
    mentor_token = reg_data["access_token"]
    mentor_headers = {"Authorization": f"Bearer {mentor_token}"}
    assert reg_data["verification_status"] == "Pending Review"

    # 2. Pending mentor attempts to access mentor dashboard -> Must be 403 Forbidden
    dash_block = client.get("/api/mentor/dashboard", headers=mentor_headers)
    assert dash_block.status_code == 403
    assert "pending or rejected" in dash_block.json()["detail"].lower()

    # 3. Admin logs in
    admin_login = client.post("/api/auth/login", json={
        "email": "organizer@gmail.com",
        "password": "admin@123",
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 4. Admin checks stats -> pending_mentors count is positive
    stats_res = client.get("/api/admin/dashboard/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["pending_mentors"] >= 1

    # 5. Admin rejects mentor with explanatory reason
    rejection_reason = "Submitted documentation requires institution-issued letterhead or primary degree certificate."
    reject_res = client.post(
        f"/api/admin/mentors/{mentor_id}/reject",
        json={"reason": rejection_reason},
        headers=admin_headers
    )
    assert reject_res.status_code == 200
    reject_data = reject_res.json()
    assert reject_data["verification_status"] == "Rejected"
    assert reject_data["rejection_reason"] == rejection_reason

    # 6. Rejected mentor attempts to access dashboard -> Must still be 403 Forbidden
    dash_block_after_reject = client.get("/api/mentor/dashboard", headers=mentor_headers)
    assert dash_block_after_reject.status_code == 403

    # 7. Rejected mentor reads their profile -> sees status 'Rejected' and the rejection reason
    mentor_prof = client.get("/api/mentor/profile", headers=mentor_headers)
    assert mentor_prof.status_code == 200
    assert mentor_prof.json()["verification_status"] == "Rejected"
    assert mentor_prof.json()["rejection_reason"] == rejection_reason

    # 8. Admin re-approves mentor
    approve_res = client.post(
        f"/api/admin/mentors/{mentor_id}/approve",
        headers=admin_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["verification_status"] == "Approved"

    # 9. Now approved mentor can access mentor dashboard -> 200 OK
    dash_ok = client.get("/api/mentor/dashboard", headers=mentor_headers)
    assert dash_ok.status_code == 200
