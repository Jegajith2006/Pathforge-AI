"""
PathForge AI - Master Full-Stack Modernization E2E Test Suite
Covers all 8 key scenarios:
1. New user registration & clean onboarding state (isolation, no fabricated data)
2. Roadmap generation, weekly schedule calculation & study budget preferences
3. Course syllabus, topic resources & review gating
4. Dynamic lesson assessment engine & strict >50% pass threshold
5. Course completion & automated verified certificate issuance
6. Recommended projects specification & progress advancement
7. Real learning activity telemetry, streak calculation & 18-week heatmap
8. Deprecated jobs route isolation & company intelligence parity
"""

import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from main import app
from database.connection import SessionLocal
from database.models import (
    Student, User, Career, Course, StudentCourseProgress,
    StudentLessonProgress, LearningActivity, Certificate,
    AssessmentQuestion, AssessmentAnswer
)
from routers.auth import create_access_token

client = TestClient(app)


@pytest.fixture(scope="module")
def fresh_test_student():
    """Create a temporary fresh student for end-to-end verification without polluting baseline data."""
    db = SessionLocal()
    st_id = f"U_TEST_{uuid.uuid4().hex[:6].upper()}"
    email = f"student_{uuid.uuid4().hex[:6]}@pathforge.test"
    try:
        user = User(
            user_id=st_id,
            email=email,
            full_name="Alex Testington",
            hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", # dummy
            role="student",
            is_verified=True,
            account_status="active",
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
        db.add(user)

        student = Student(
            student_id=st_id,
            user_id=st_id,
            email=email,
            first_name="Alex",
            last_name="Testington",
            college="Stanford University",
            department="Computer Science",
            degree="B.S. CS",
            graduation_year=2026,
            cgpa=3.85,
            target_career_id="C001",
            weekly_learning_hours=10,
        )
        db.add(student)
        db.commit()

        token = create_access_token(data={"sub": st_id, "role": "student"})
        yield {"student_id": st_id, "email": email, "token": token}
    finally:
        # Clean up temporary test student and dependent rows
        db.query(StudentLessonProgress).filter(StudentLessonProgress.student_id == st_id).delete()
        db.query(StudentCourseProgress).filter(StudentCourseProgress.student_id == st_id).delete()
        db.query(LearningActivity).filter(LearningActivity.student_id == st_id).delete()
        db.query(Certificate).filter(Certificate.student_id == st_id).delete()
        db.query(Student).filter(Student.student_id == st_id).delete()
        db.query(User).filter(User.user_id == st_id).delete()
        db.commit()
        db.close()


def test_scenario_1_new_user_clean_onboarding_and_isolation(fresh_test_student):
    """Scenario 1: Fresh user has 0 certificates and 0 fake activity events."""
    token = fresh_test_student["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Certificates must be empty for fresh user
    cert_res = client.get("/api/certificates", headers=headers)
    assert cert_res.status_code == 200
    assert cert_res.json() == [], "Fresh user should have 0 certificates (no fabricated records)!"

    # Activity stats must reflect 0 completed courses and 0 fake sessions
    stats_res = client.get("/api/activity/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["learning_sessions"] == 0
    assert stats["completed_courses"] == 0
    assert stats["active_streak_days"] == 0


def test_scenario_2_roadmap_generation_and_preferences(fresh_test_student):
    """Scenario 2: Roadmap calculates DAG phases, weekly plan, and responds to budget adjustments."""
    token = fresh_test_student["token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/roadmap", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "phases" in data
    assert len(data["phases"]) >= 4, "Should classify courses into distinct curricular tiers"
    assert "weekly_plan" in data

    # Update study budget
    pref_res = client.put("/api/roadmap/preferences", json={"weekly_learning_hours": 15}, headers=headers)
    assert pref_res.status_code == 200
    assert pref_res.json()["weekly_learning_hours"] == 15


def test_scenario_3_course_syllabus_and_resource_review(fresh_test_student):
    """Scenario 3: Course syllabus exposes structured resources and enforces review requirement."""
    token = fresh_test_student["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch syllabus for CR001
    res = client.get("/api/courses/CR001/syllabus", headers=headers)
    assert res.status_code == 200
    syl = res.json()
    assert len(syl["lessons"]) == 5
    lesson_1_id = syl["lessons"][0]["lesson_id"]

    # Fetch detailed lesson resources
    detail_res = client.get(f"/api/courses/CR001/lessons/{lesson_1_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["resources"]) >= 2

    # Review first resource
    res_id = detail["resources"][0]["resource_id"]
    rev_res = client.post(
        f"/api/courses/CR001/lessons/{lesson_1_id}/review-resource",
        json={"resource_id": res_id},
        headers=headers
    )
    assert rev_res.status_code == 200
    assert "reviewed" in rev_res.json()["message"].lower()


def test_scenario_4_dynamic_lesson_assessment_scoring(fresh_test_student):
    """Scenario 4: Assessment engine generates dynamic questions and enforces strict >50% rule."""
    token = fresh_test_student["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure all resources for CR001_L1 are marked reviewed first
    detail = client.get("/api/courses/CR001/lessons/CR001_L1", headers=headers).json()
    for r in detail["resources"]:
        client.post(
            "/api/courses/CR001/lessons/CR001_L1/review-resource",
            json={"resource_id": r["resource_id"]},
            headers=headers
        )

    # Start assessment for CR001_L1
    start_res = client.post(
        "/api/assessment/start",
        json={"course_id": "CR001", "lesson_id": "CR001_L1", "assessment_type": "diagnostic"},
        headers=headers
    )
    assert start_res.status_code == 200
    assm_data = start_res.json()
    assert len(assm_data["questions"]) >= 3
    q_ids = [q["question_id"] for q in assm_data["questions"]]

    # Submit 0 correct answers -> 0% score -> Fail
    sub_fail = client.post(
        "/api/assessment/submit",
        json={
            "assessment_id": assm_data["assessment_id"],
            "answers": [{"question_id": qid, "selected_answer": "Z"} for qid in q_ids]
        },
        headers=headers
    )
    assert sub_fail.status_code == 200
    assert sub_fail.json()["passed"] is False
    assert sub_fail.json()["score_percentage"] == 0


def test_scenario_5_course_completion_and_certificate_issuance(fresh_test_student):
    """Scenario 5: Completing a course automatically generates a verified Certificate."""
    token = fresh_test_student["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Complete CR001
    comp_res = client.post("/api/courses/CR001/complete", headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["is_completed"] is True

    # Check that a verified certificate now exists
    certs = client.get("/api/certificates", headers=headers).json()
    assert len(certs) >= 1
    cr001_cert = next((c for c in certs if "Python" in c["course_name"] or c["course_name"] == "Python Fundamentals for Data Science"), None)
    assert cr001_cert is not None
    assert cr001_cert["verification_status"] == "Verified"
    assert "certificate_id" in cr001_cert


def test_scenario_6_recommended_projects_advancement(fresh_test_student):
    """Scenario 6: Project recommendations load and can be started."""
    token = fresh_test_student["token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/projects/recommendations", headers=headers)
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) > 0
    p1 = projects[0]

    # Start project
    start_res = client.post(f"/api/projects/{p1['project_id']}/start", headers=headers)
    assert start_res.status_code == 200


def test_scenario_7_learning_activity_telemetry(fresh_test_student):
    """Scenario 7: Learning activity telemetry records events and computes real 18-week heatmap."""
    token = fresh_test_student["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Log an activity
    log_res = client.post(
        "/api/activity",
        json={
            "activity_type": "Coding Problem",
            "activity_name": "Solved Matrix Multiplication Kata",
            "duration_minutes": 45,
            "activity_count": 1,
        },
        headers=headers
    )
    assert log_res.status_code == 200

    # Heatmap has 126 cells
    hm_res = client.get("/api/activity/heatmap", headers=headers)
    assert hm_res.status_code == 200
    hm = hm_res.json()
    assert len(hm["cells"]) == 126
    assert sum(hm["cells"]) > 0, "Logged activity should reflect non-zero intensity in heatmap"

    # Stats reflect the session
    stats = client.get("/api/activity/stats", headers=headers).json()
    assert stats["learning_sessions"] >= 1


def test_scenario_8_company_intelligence_and_jobs_compatibility(fresh_test_student):
    """Scenario 8: Company intelligence and job-matching endpoints remain functional."""
    token = fresh_test_student["token"]
    headers = {"Authorization": f"Bearer {token}"}

    comp_res = client.get("/api/companies", headers=headers)
    assert comp_res.status_code == 200
    assert len(comp_res.json()) > 0

    jobs_res = client.get("/api/jobs/recommendations", headers=headers)
    assert jobs_res.status_code == 200
    assert isinstance(jobs_res.json(), list)
