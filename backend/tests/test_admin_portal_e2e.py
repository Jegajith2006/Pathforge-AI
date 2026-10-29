import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend directory is in python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database.connection import SessionLocal
from database.models import User, Student, Mentor
from routers.auth import create_access_token

client = TestClient(app)


@pytest.fixture(scope="module")
def admin_token():
    """Generates an authenticated JWT token for the administrator."""
    return create_access_token({
        "sub": "ADMIN001",
        "user_id": "ADMIN001",
        "email": "organizer@gmail.com",
        "role": "admin",
    })


@pytest.fixture(scope="module")
def student_token():
    """Generates a student token for isolation testing."""
    return create_access_token({
        "sub": "U001",
        "user_id": "U001",
        "email": "alex.chen@stanford.edu",
        "role": "student",
    })


@pytest.fixture(scope="module")
def mentor_token():
    """Generates a mentor token for isolation testing."""
    return create_access_token({
        "sub": "M001",
        "user_id": "M001",
        "email": "arun.kumar@pathforge.ai",
        "role": "mentor",
    })


# =========================================================================
# 1. AUTHENTICATION & LOGIN
# =========================================================================

def test_admin_login_with_organizer_credentials():
    """Verifies that organizer@gmail.com with admin@123 succeeds and receives admin role."""
    response = client.post(
        "/api/auth/login",
        json={"email": "organizer@gmail.com", "password": "admin@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    assert data["email"] == "organizer@gmail.com"


def test_admin_login_with_default_admin_credentials():
    """Verifies that admin@pathforge.ai with password123 succeeds and receives admin role."""
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@pathforge.ai", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"


def test_admin_login_with_invalid_password_fails():
    """Verifies that incorrect passwords are rejected with 401."""
    response = client.post(
        "/api/auth/login",
        json={"email": "organizer@gmail.com", "password": "wrong_password_999"},
    )
    assert response.status_code == 401


# =========================================================================
# 2. ROLE ISOLATION & ACCESS CONTROL
# =========================================================================

def test_student_cannot_access_admin_portal(student_token):
    """Students attempting to access admin endpoints must receive 403 Forbidden."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/admin/dashboard-stats", headers=headers)
    assert response.status_code == 403

    response = client.get("/api/admin/students", headers=headers)
    assert response.status_code == 403


def test_mentor_cannot_access_admin_portal(mentor_token):
    """Mentors attempting to access admin endpoints must receive 403 Forbidden."""
    headers = {"Authorization": f"Bearer {mentor_token}"}
    response = client.get("/api/admin/dashboard-stats", headers=headers)
    assert response.status_code == 403

    response = client.get("/api/admin/mentors", headers=headers)
    assert response.status_code == 403


def test_unauthenticated_request_rejected():
    """Unauthenticated requests must receive 401."""
    response = client.get("/api/admin/dashboard-stats")
    assert response.status_code == 401


# =========================================================================
# 3. ADMIN DASHBOARD STATS
# =========================================================================

def test_admin_dashboard_stats(admin_token):
    """Verifies live summary stats from database."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/dashboard-stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_students" in data
    assert "total_mentors" in data
    assert "total_feedback" in data
    assert "average_rating" in data
    assert data["total_students"] > 0
    assert data["total_mentors"] > 0
    assert data["total_feedback"] > 0


# =========================================================================
# 4. STUDENTS MANAGEMENT
# =========================================================================

def test_admin_get_students_pagination_and_search(admin_token):
    """Verifies pagination and search across registered students."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch page 1
    response = client.get("/api/admin/students?page=1&limit=5", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) <= 5
    assert data["page"] == 1
    assert data["total"] > 0
    assert data["total_pages"] >= 1

    # Verify student item fields matching UI
    first = data["items"][0]
    assert "student_id" in first
    assert "name" in first
    assert "email" in first
    assert "course_career" in first
    assert "status" in first
    assert "phone" in first

    # Search for Alex Chen
    search_res = client.get("/api/admin/students?search=Alex", headers=headers)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert any(s["student_id"] == "U001" for s in search_data["items"])


def test_admin_get_student_detail_drawer(admin_token):
    """Verifies detailed payload for student slide-over drawer."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/students/U001", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert "profile" in data
    profile = data["profile"]
    assert profile["student_id"] == "U001"
    assert "Alex Chen" in profile["name"]
    assert profile["phone"] == "+1 555 123 4567"
    assert profile["college"] == "Stanford University"
    assert "courses" in data
    assert "assessments" in data
    assert "skills" in data


# =========================================================================
# 5. MENTORS MANAGEMENT
# =========================================================================

def test_admin_get_mentors_pagination_and_search(admin_token):
    """Verifies pagination and search across registered mentors."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.get("/api/admin/mentors?page=1&limit=5", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) <= 5

    first = data["items"][0]
    assert "mentor_id" in first
    assert "name" in first
    assert "email" in first
    assert "expertise" in first
    assert "experience" in first
    assert "status" in first
    assert "phone" in first

    # Search for Arun
    search_res = client.get("/api/admin/mentors?search=Arun", headers=headers)
    assert search_res.status_code == 200
    assert any(m["mentor_id"] == "M001" for m in search_res.json()["items"])


def test_admin_get_mentor_detail_drawer(admin_token):
    """Verifies detailed payload for mentor slide-over drawer."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/admin/mentors/M001", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert "profile" in data
    profile = data["profile"]
    assert profile["mentor_id"] == "M001"
    assert "Arun Kumar" in profile["name"]
    assert profile["phone"] == "+1 555 123 4567"
    assert "mentees" in data
    assert "sessions" in data
    assert "feedbacks" in data


# =========================================================================
# 6. SAFE REMOVAL & PROTECTED ACCOUNTS SAFEGUARD
# =========================================================================

def test_protected_student_cannot_be_deleted(admin_token):
    """Attempting to remove demo student U001 (Alex Chen) must be blocked with 400 Bad Request."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.delete("/api/admin/students/U001", headers=headers)
    assert response.status_code == 400
    assert "Protected baseline account" in response.json()["detail"]


def test_protected_mentor_cannot_be_deleted(admin_token):
    """Attempting to remove demo mentor M001 (Dr. Arun Kumar) must be blocked with 400 Bad Request."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.delete("/api/admin/mentors/M001", headers=headers)
    assert response.status_code == 400
    assert "Protected baseline mentor" in response.json()["detail"]


def test_soft_deactivation_and_reactivation_workflow(admin_token):
    """Verifies safe soft-deactivation and reactivation of non-protected accounts."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    db = SessionLocal()

    # Find a non-protected student ID (e.g. > U100)
    test_student = db.query(Student).filter(~Student.student_id.in_(["U001", "U002", "U1053", "U1056"])).first()
    db.close()

    if test_student:
        sid = test_student.student_id

        # Deactivate
        del_res = client.delete(f"/api/admin/students/{sid}", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["account_status"] == "deactivated"

        # Reactivate
        react_res = client.post(f"/api/admin/students/{sid}/reactivate", headers=headers)
        assert react_res.status_code == 200
        assert react_res.json()["account_status"] == "active"

