import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from database.connection import SessionLocal
from database.models import Student, User
from routers.auth import create_access_token

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(scope="module")
def auth_student_headers():
    token = create_access_token(data={"sub": "U001", "role": "student", "email": "alex.chen@example.com"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def auth_mentor_headers():
    token = create_access_token(data={"sub": "M001", "role": "mentor", "email": "arun.kumar@pathforge.ai"})
    return {"Authorization": f"Bearer {token}"}


def test_01_invalid_token_rejected_and_role_isolation(auth_mentor_headers):
    """Verify invalid token returns 401 and mentor role is forbidden on student endpoints."""
    # Invalid token -> 401
    res_bad = client.get("/api/careers", headers={"Authorization": "Bearer malformed_expired_token"})
    assert res_bad.status_code == 401
    assert res_bad.json()["success"] is False
    assert res_bad.json()["error"]["code"] == "UNAUTHORIZED"

    # Mentor role attempting student career-goal update -> 403
    res_forbidden = client.put(
        "/api/student/career-goal",
        json={"career_id": "C001"},
        headers=auth_mentor_headers,
    )
    assert res_forbidden.status_code == 403
    assert res_forbidden.json()["success"] is False
    assert res_forbidden.json()["error"]["code"] == "FORBIDDEN"


def test_02_get_all_careers_and_search(auth_student_headers):
    """Verify /api/careers returns catalog, supports search and category filters."""
    res = client.get("/api/careers", headers=auth_student_headers)
    assert res.status_code == 200
    careers = res.json()
    assert isinstance(careers, list)
    assert len(careers) >= 20

    # Test search
    res_search = client.get("/api/careers?search=machine", headers=auth_student_headers)
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert len(search_data) > 0
    assert any("machine" in c["career_name"].lower() for c in search_data)


def test_03_career_pagination(auth_student_headers):
    """Verify pagination with limit and skip parameters."""
    res_all = client.get("/api/careers", headers=auth_student_headers)
    all_careers = res_all.json()

    res_paged = client.get("/api/careers?limit=5&skip=0", headers=auth_student_headers)
    assert res_paged.status_code == 200
    paged_careers = res_paged.json()
    assert len(paged_careers) == 5
    assert paged_careers[0]["career_id"] == all_careers[0]["career_id"]


def test_04_get_career_by_id(auth_student_headers):
    """Verify retrieving individual career details and skills."""
    res = client.get("/api/careers/C001", headers=auth_student_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["career_id"] == "C001"
    assert "required_skills" in data
    assert len(data["required_skills"]) > 0


def test_05_get_career_not_found(auth_student_headers):
    """Verify 404 error envelope when career does not exist."""
    res = client.get("/api/careers/NON_EXISTENT_CAREER", headers=auth_student_headers)
    assert res.status_code == 404
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


def test_06_get_and_update_career_goal(auth_student_headers):
    """Verify getting current career goal and updating it via PUT /api/student/career-goal."""
    # Current goal
    res_cur = client.get("/api/student/career-goal", headers=auth_student_headers)
    assert res_cur.status_code == 200
    cur_data = res_cur.json()
    assert "career_id" in cur_data

    # Update goal
    res_update = client.put(
        "/api/student/career-goal",
        json={"career_id": "C001"},
        headers=auth_student_headers,
    )
    assert res_update.status_code == 200
    assert "updated" in res_update.json()["message"].lower()

    # Verify invalid career rejected
    res_bad = client.put(
        "/api/student/career-goal",
        json={"career_id": "INVALID_CAREER_999"},
        headers=auth_student_headers,
    )
    assert res_bad.status_code == 404
