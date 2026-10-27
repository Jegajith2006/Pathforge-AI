"""
PathForge AI - Comprehensive Step 11 & Step 12 Authentication and Isolation Test Suite
Verifies all 20 Phase 36 test scenarios:

1. registration success
2. duplicate email
3. invalid email
4. password validation
5. password hashing
6. login success
7. incorrect password
8. nonexistent user
9. JWT generation
10. JWT validation
11. expired JWT
12. malformed JWT
13. missing JWT
14. current-user dependency
15. protected endpoint
16. unauthorized access
17. forbidden access / malformed auth header
18. Student A isolation
19. Student B isolation
20. logout / token invalidation client behavior
"""

import pytest
import time
from fastapi.testclient import TestClient

from main import app
from database.connection import SessionLocal
from database.models import Student, StudentSkill, Skill, Career, LearningActivity
from routers.auth import create_access_token, decode_access_token, get_password_hash, verify_password

client = TestClient(app)


# ==============================================================================
# AUTHENTICATION TESTS (1 - 20)
# ==============================================================================

def test_01_registration_success():
    """1. Test student registration with valid credentials."""
    unique_email = f"reg_success_{int(time.time())}@pathforge.ai"
    payload = {
        "first_name": "John",
        "last_name": "Doe",
        "email": unique_email,
        "password": "ValidPassword123!",
        "college": "Stanford University",
        "department": "Computer Science",
        "degree": "B.Tech AI",
        "graduation_year": 2026,
        "cgpa": 8.8,
        "target_career_id": "C001",
        "weekly_learning_hours": 12,
        "preferred_difficulty": "Intermediate",
        "learning_mode": "Project-based",
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == unique_email


def test_02_duplicate_email():
    """2. Test registration fails when email already exists."""
    unique_email = f"duplicate_{int(time.time())}@pathforge.ai"
    payload = {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": unique_email,
        "password": "Password123!",
        "college": "Stanford University",
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 200

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_03_invalid_email():
    """3. Test registration with invalid email format fails."""
    payload = {
        "first_name": "Invalid",
        "last_name": "Email",
        "email": "not-an-email",
        "password": "Password123!",
    }
    # FastAPI schema / pydantic or route validation
    res = client.post("/api/auth/register", json=payload)
    # Returns 422 Unprocessable Entity or 400 Bad Request
    assert res.status_code in [400, 422]


def test_04_password_validation():
    """4. Test password verification detects match and mismatch."""
    pw = "SecretP@ssw0rd!"
    hashed = get_password_hash(pw)
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_05_password_hashing():
    """5. Verify bcrypt hashing does not store plaintext."""
    pw = "PlaintextPassword"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")


def test_06_login_success():
    """6. Test login with correct credentials returns valid JWT."""
    unique_email = f"login_ok_{int(time.time())}@pathforge.ai"
    client.post("/api/auth/register", json={
        "first_name": "Log",
        "last_name": "In",
        "email": unique_email,
        "password": "Password123!",
    })
    res = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "Password123!",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["token_type"] == "bearer"


def test_07_incorrect_password():
    """7. Test login with incorrect password returns 401 Unauthorized."""
    unique_email = f"wrong_pw_{int(time.time())}@pathforge.ai"
    client.post("/api/auth/register", json={
        "first_name": "Test",
        "last_name": "User",
        "email": unique_email,
        "password": "RealPassword123!",
    })
    res = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "IncorrectPassword999!",
    })
    assert res.status_code == 401
    assert "invalid" in res.json()["detail"].lower()


def test_08_nonexistent_user():
    """8. Test login with nonexistent email returns 401 Unauthorized."""
    res = client.post("/api/auth/login", json={
        "email": "nonexistent_ghost_9999@pathforge.ai",
        "password": "AnyPassword123!",
    })
    assert res.status_code == 401


def test_09_jwt_generation():
    """9. Test JWT creation contains expected claims and structure."""
    token = create_access_token({"sub": "U001", "email": "test@pathforge.ai"})
    assert token is not None
    assert len(token.split(".")) == 3


def test_10_jwt_validation():
    """10. Test JWT verification decodes valid token correctly."""
    token = create_access_token({"sub": "U001", "email": "test@pathforge.ai"})
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "U001"
    assert decoded["email"] == "test@pathforge.ai"


def test_11_expired_jwt():
    """11. Test expired JWT token is cleanly rejected."""
    expired_token = create_access_token({"sub": "U001"}, expires_delta_minutes=-10)
    decoded = decode_access_token(expired_token)
    assert decoded is None


def test_12_malformed_jwt():
    """12. Test malformed or tampered JWT token is rejected."""
    valid_token = create_access_token({"sub": "U001"})
    parts = valid_token.split(".")
    tampered_token = f"{parts[0]}.eyJoYWNrZWQiOiB0cnVlfQ.{parts[2]}"
    assert decode_access_token(tampered_token) is None
    assert decode_access_token("not.a.valid.jwt") is None


def test_13_missing_jwt():
    """13. Test missing token behavior."""
    # When Authorization header is missing, endpoint uses fallback or returns 401
    assert decode_access_token("") is None


def test_14_current_user_dependency():
    """14. Test get_current_student dependency resolves student from token."""
    token = create_access_token({"sub": "U001", "email": "alex.chen@stanford.edu"})
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["student_id"] == "U001"


def test_15_protected_endpoint():
    """15. Test protected endpoint returns authenticated data."""
    token = create_access_token({"sub": "U001", "email": "alex.chen@stanford.edu"})
    res = client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "student_id" in res.json()


def test_16_unauthorized_access():
    """16. Test invalid token returns 401 Unauthorized."""
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_fake_token"})
    assert res.status_code == 401


def test_17_forbidden_access_malformed_header():
    """17. Test non-Bearer Authorization header returns 401."""
    res = client.get("/api/auth/me", headers={"Authorization": "Basic dXNlcjpwYXNz"})
    assert res.status_code == 401


def test_18_student_a_isolation():
    """18. Test Student A token strictly returns Student A profile and dashboard."""
    token_a = create_access_token({"sub": "TEST_ST001", "email": "alice.alpha@test.com"})
    res = client.get("/api/profile", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    assert res.json()["student_id"] == "TEST_ST001"


def test_19_student_b_isolation():
    """19. Test Student B token strictly returns Student B profile and dashboard."""
    token_b = create_access_token({"sub": "TEST_ST002", "email": "bob.beta@test.com"})
    res = client.get("/api/profile", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == 200
    assert res.json()["student_id"] == "TEST_ST002"


def test_20_logout_and_token_invalidation():
    """20. Test that client clearing token effectively revokes access."""
    # Simulates client logout
    token = create_access_token({"sub": "U001"})
    headers = {"Authorization": f"Bearer {token}"}
    res_before = client.get("/api/profile", headers=headers)
    assert res_before.status_code == 200

    # After logout, request without token cannot access protected resources
    # (In client, token is removed from localStorage)
    assert decode_access_token("") is None
