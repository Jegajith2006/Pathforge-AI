import pytest
from fastapi.testclient import TestClient
import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database.connection import SessionLocal
from database.models import Student, User, Career, Project
from routers.auth import create_access_token
from services.recommendation_service import get_personalized_projects

client = TestClient(app)


@pytest.fixture(scope="module")
def student_token():
    return create_access_token({
        "sub": "U001",
        "user_id": "U001",
        "email": "alex.chen@stanford.edu",
        "role": "student",
    })


@pytest.fixture(scope="module")
def student_token_no_goal():
    """Token for student with no career goal configured."""
    return create_access_token({
        "sub": "U002",
        "user_id": "U002",
        "email": "priya@example.com",
        "role": "student",
    })


# =========================================================================
# 1. RECRUIT MATCH REMOVAL VERIFICATION
# =========================================================================

def test_company_intelligence_and_jobs_retained():
    """Verifies that Company Intelligence and Jobs Assistant remain fully functional."""
    response = client.get("/api/companies")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

    response = client.get("/api/jobs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# =========================================================================
# 2. LEARNING ACTIVITY CALENDAR & HEATMAP
# =========================================================================

def test_activity_calendar_full_year(student_token):
    """Verifies that /api/activity/calendar returns year telemetry, streaks, and counts."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/activity/calendar?year=2026", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["student_id"] == "U001"
    assert data["selected_year"] == 2026
    assert data["selected_month"] is None
    assert isinstance(data["available_years"], list)
    assert 2026 in data["available_years"]
    assert "total_activities" in data
    assert "active_days" in data
    assert "current_streak" in data
    assert "longest_streak" in data
    assert isinstance(data["daily_counts"], dict)
    assert isinstance(data["daily_details"], dict)
    assert data["total_activities"] > 0
    assert data["active_days"] > 0
    assert data["longest_streak"] >= data["current_streak"]


def test_activity_calendar_specific_month(student_token):
    """Verifies month filtering and leap-year compatible dates."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/activity/calendar?year=2026&month=10", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["selected_year"] == 2026
    assert data["selected_month"] == 10
    assert data["total_activities"] > 0

    # Ensure all daily_counts dates belong to October 2026
    for d_str in data["daily_counts"].keys():
        assert d_str.startswith("2026-10-")


def test_activity_calendar_user_isolation(student_token):
    """Invalid token or unauthorized mentor role must be rejected."""
    # 1. Invalid token rejected with 401
    response = client.get("/api/activity/calendar?year=2026", headers={"Authorization": "Bearer invalid_malformed_token"})
    assert response.status_code == 401

    # 2. Mentor token forbidden from student activity calendar
    mentor_token = create_access_token({
        "sub": "M001",
        "user_id": "M001",
        "email": "arun.kumar@pathforge.ai",
        "role": "mentor",
    })
    response_mentor = client.get("/api/activity/calendar?year=2026", headers={"Authorization": f"Bearer {mentor_token}"})
    assert response_mentor.status_code == 403


# =========================================================================
# 3. PROJECT RECOMMENDATIONS & PROBLEM STATEMENTS
# =========================================================================

def test_project_recommendations_have_problem_statements(student_token):
    """Verifies that project recommendations include structured problem statements."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/projects/recommendations", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    assert "project_id" in first
    assert "project_name" in first
    assert "description" in first
    assert "difficulty" in first
    assert "duration_text" in first
    assert "match_percentage" in first
    assert "primary_skills" in first

    # Problem statement verification
    assert "problem_statement" in first
    assert first["problem_statement"] is not None
    assert "Problem:" in first["problem_statement"]
    assert "Use Case:" in first["problem_statement"]
    assert "Expected Outcome:" in first["problem_statement"]


def test_project_recommendations_new_user_without_career_goal(student_token_no_goal):
    """Verifies that a student without an active career goal does not receive fabricated recommendations."""
    db = SessionLocal()
    try:
        # 1. Non-existent student returns empty list
        assert get_personalized_projects(db, "NON_EXISTENT_STUDENT") == []

        # 2. Student with empty career goal string returns honest empty list via service and endpoint
        st = db.query(Student).filter(Student.student_id == "U002").first()
        orig = st.target_career_id
        st.target_career_id = ""
        db.commit()
        try:
            assert get_personalized_projects(db, "U002") == []
            
            headers = {"Authorization": f"Bearer {student_token_no_goal}"}
            response = client.get("/api/projects/recommendations", headers=headers)
            assert response.status_code == 200
            assert response.json() == []  # Honest empty state, no hardcoded ML engineer assumptions
        finally:
            st.target_career_id = orig
            db.commit()
    finally:
        db.close()


def test_general_projects_catalog(student_token):
    """Verifies that the general project catalog remains accessible for exploration."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/projects", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5

    # Check that each project in catalog has problem statement
    assert all("problem_statement" in p and p["problem_statement"] is not None for p in data[:5])


# =========================================================================
# 5. SETTINGS, PREFERENCES, AND PASSWORD SECURITY
# =========================================================================

def test_settings_preferences_workflow(student_token):
    """Verifies that learning preferences can be retrieved and updated with persistence."""
    headers = {"Authorization": f"Bearer {student_token}"}
    
    # 1. Get initial preferences
    get_res = client.get("/api/profile/preferences", headers=headers)
    assert get_res.status_code == 200
    pref_data = get_res.json()
    assert "weekly_learning_hours" in pref_data
    assert "preferred_difficulty" in pref_data
    assert "learning_mode" in pref_data

    # 2. Update preferences
    payload = {
        "weekly_learning_hours": 15,
        "preferred_difficulty": "Adaptive",
        "learning_mode": "Hybrid",
    }
    put_res = client.put("/api/profile/preferences", json=payload, headers=headers)
    assert put_res.status_code == 200
    assert "updated" in put_res.json()["message"].lower()

    # 3. Verify persistence
    verify_res = client.get("/api/profile/preferences", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["weekly_learning_hours"] == 15
    assert verify_res.json()["preferred_difficulty"] == "Adaptive"
    assert verify_res.json()["learning_mode"] == "Hybrid"


def test_settings_change_password_validation(student_token):
    """Verifies password change validation: mismatched passwords, short length, and wrong current password."""
    headers = {"Authorization": f"Bearer {student_token}"}

    # 1. Mismatch
    res = client.post("/api/profile/change-password", json={
        "current_password": "password123",
        "new_password": "newpassword123",
        "confirm_password": "differentpassword",
    }, headers=headers)
    assert res.status_code == 400
    assert "not match" in res.json()["detail"].lower()

    # 2. Too short (< 6 chars)
    res = client.post("/api/profile/change-password", json={
        "current_password": "password123",
        "new_password": "123",
        "confirm_password": "123",
    }, headers=headers)
    assert res.status_code == 400
    assert "at least 6 characters" in res.json()["detail"].lower()

    # 3. Incorrect current password
    res = client.post("/api/profile/change-password", json={
        "current_password": "completelywrongpassword",
        "new_password": "newpassword123",
        "confirm_password": "newpassword123",
    }, headers=headers)
    assert res.status_code == 400
    assert "incorrect" in res.json()["detail"].lower()

