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
from database.connection import init_db

# Ensure tables exist
init_db()

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "PathForge AI API is running" in data["message"]


def test_get_careers():
    response = client.get("/api/careers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 20
    first = data[0]
    assert "career_id" in first
    assert "career_name" in first
    assert "match_percentage" in first


def test_get_courses():
    response = client.get("/api/courses")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 50
    first = data[0]
    assert "course_id" in first
    assert "course_name" in first
    assert "rating" in first

    # Global catalog view
    all_res = client.get("/api/courses?view_all=true")
    assert all_res.status_code == 200
    assert len(all_res.json()) >= 100


def test_get_projects():
    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 50
    first = data[0]
    assert "project_id" in first
    assert "project_name" in first


def test_auth_register_and_login():
    unique_email = f"test_student_{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {
        "first_name": "Test",
        "last_name": "Student",
        "email": unique_email,
        "password": "strongpassword123",
        "college": "Test University",
        "department": "Computer Science",
        "degree": "B.Tech AI",
        "graduation_year": 2026,
        "cgpa": 8.5,
        "target_career_id": "C001",
        "weekly_learning_hours": 15,
        "preferred_difficulty": "Adaptive",
        "learning_mode": "Project-based",
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]

    # Login with same credentials
    login_res = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "strongpassword123"}
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data

    # Profile access using Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == unique_email


def test_get_profile():
    response = client.get("/api/profile")
    assert response.status_code == 200
    data = response.json()
    assert "student_id" in data
    assert "Alex Chen" in data["full_name"]


def test_get_skill_gap():
    response = client.get("/api/skill-gap")
    assert response.status_code == 200
    data = response.json()
    assert "career_id" in data
    assert "current_readiness" in data
    assert "gaps" in data
    assert len(data["gaps"]) > 0


def test_get_roadmap():
    response = client.get("/api/roadmap")
    assert response.status_code == 200
    data = response.json()
    assert "milestones" in data
    assert len(data["milestones"]) > 0
    first_m = data["milestones"][0]
    assert "milestone_name" in first_m
    assert "status" in first_m


def test_career_readiness():
    response = client.get("/api/career-readiness")
    assert response.status_code == 200
    data = response.json()
    assert "overall_readiness" in data
    assert data["title"] == "PathForge AI Career Readiness Indicator"
    assert "disclaimer" in data


def test_dashboard_endpoint():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "student" in data
    assert "readiness" in data
    assert "radar_data" in data
    assert "metrics" in data
    assert "recommended_courses" in data
    assert "recommended_projects" in data


def test_assessment_flow():
    start_res = client.post("/api/assessment/start")
    assert start_res.status_code == 200
    start_data = start_res.json()
    assert "questions" in start_data
    assert len(start_data["questions"]) > 0

    first_q = start_data["questions"][0]
    submit_payload = {
        "assessment_id": start_data["assessment_id"],
        "answers": [
            {
                "question_id": first_q["question_id"],
                "selected_answer": first_q["options"][0],
                "time_taken_seconds": 20,
            }
        ],
    }
    sub_res = client.post("/api/assessment/submit", json=submit_payload)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert "score_percentage" in sub_data
    assert "reviews" in sub_data


def test_feedback_submission():
    payload = {
        "category": "Recommendations",
        "rating": 5,
        "comment": "Exceptional roadmap breakdown and clear skill calibration!",
        "issue_type": "None",
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    assert "Thank you" in response.json()["message"]


def test_career_by_id_and_skills():
    # Valid career
    res = client.get("/api/careers/C001")
    assert res.status_code == 200
    data = res.json()
    assert data["career_id"] == "C001"
    assert "Machine Learning Engineer" in data["career_name"]

    # Invalid career
    res_404 = client.get("/api/careers/C999")
    assert res_404.status_code == 404

    # Career skills
    res_skills = client.get("/api/careers/C001/skills")
    assert res_skills.status_code == 200
    data_skills = res_skills.json()
    assert data_skills["career_id"] == "C001"
    assert len(data_skills["skills"]) > 0
    first_skill = data_skills["skills"][0]
    assert "skill_id" in first_skill
    assert "skill_name" in first_skill


def test_skills_endpoints():
    # All skills
    res = client.get("/api/skills")
    assert res.status_code == 200
    skills = res.json()
    assert len(skills) >= 150
    assert "skill_id" in skills[0]

    # Single skill
    res_single = client.get("/api/skills/S001")
    assert res_single.status_code == 200
    data = res_single.json()
    assert data["skill_id"] == "S001"

    # Non-existent skill
    res_404 = client.get("/api/skills/S9999")
    assert res_404.status_code == 404


def test_course_skills_endpoint():
    # Single course
    res = client.get("/api/courses/CR001")
    assert res.status_code == 200
    assert res.json()["course_id"] == "CR001"

    # Non-existent course
    res_404 = client.get("/api/courses/CR999")
    assert res_404.status_code == 404

    # Course skills
    res_skills = client.get("/api/courses/CR001/skills")
    assert res_skills.status_code == 200
    data = res_skills.json()
    assert data["course_id"] == "CR001"
    assert len(data["skills"]) > 0


def test_project_skills_endpoint():
    # Single project
    res = client.get("/api/projects/P001")
    assert res.status_code == 200
    assert res.json()["project_id"] == "P001"

    # Non-existent project
    res_404 = client.get("/api/projects/P999")
    assert res_404.status_code == 404

    # Project skills
    res_skills = client.get("/api/projects/P001/skills")
    assert res_skills.status_code == 200
    data = res_skills.json()
    assert data["project_id"] == "P001"
    assert len(data["skills"]) > 0

