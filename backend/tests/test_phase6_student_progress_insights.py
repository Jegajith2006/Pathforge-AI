"""
Phase 6: Student Progress & Mentor Insights Test Suite
Verifies:
1. Authenticated mentor can view assigned students with enriched progress overview fields.
2. Mentor cannot access unassigned student's private progress (403 Forbidden).
3. Detailed progress endpoint provides all 8 core sections (overview, skill_progress,
   roadmap, assessment_performance, project_progress, mentorship_history, insights, visualizations).
4. Roadmap completion percentage is accurately calculated from actual roadmap item statuses.
5. Missing assessment and project data are handled gracefully without errors.
6. Mentor feedback and recommendations submission persists to database, calibrates skill mastery,
   and dispatches student in-app notification.
7. Deterministic mentor insights are generated strictly based on actual data rules.
8. Role-based authorization: unauthenticated requests receive 401, and student accounts cannot access mentor endpoints.
"""

import sys
import uuid
from datetime import datetime, timedelta
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
    MentorshipSession,
    StudentSkill,
    StudentRoadmapStep,
    StudentCourseProgress,
    StudentProjectProgress,
    Project,
    Skill,
    AssessmentAnswer,
    AssessmentQuestion,
    MentorGuidanceNote,
    MentorFeedback,
    Notification,
)
from services.email_service import email_service

client = TestClient(app)


def helper_register_and_login_mentor(name: str, expertise: str = "Machine Learning"):
    unique_email = f"mentor.{uuid.uuid4().hex[:8]}@pathforge.ai"
    reg_payload = {
        "name": name,
        "email": unique_email,
        "password": "Password123!",
        "title": f"Senior {expertise} Lead",
        "experience_years": 7,
        "expertise_areas": [expertise, "Cloud Infrastructure"],
        "company": "DeepMind Partner Labs",
        "linkedin_url": "https://linkedin.com/in/test-mentor-p6",
        "bio": "Guiding next-generation AI and systems engineers.",
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
    return mentor_id, headers, unique_email


def helper_register_and_login_student(name: str, career_id: str = "C01"):
    unique_email = f"student.{uuid.uuid4().hex[:8]}@pathforge.ai"
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
    return student_id, headers, unique_email


def test_01_mentor_students_overview_enriched_fields():
    """Verify GET /api/mentor/students returns enriched progress overview fields from real database records."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Evelyn Reed")
    student_id, student_headers, _ = helper_register_and_login_student("Marcus Vance")

    # Connect them in database
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
        notes="Mentoring in Advanced ML Pipelines",
    ))

    # Add real roadmap steps: 1 completed, 1 in_progress => 50%
    step1 = StudentRoadmapStep(
        student_id=student_id,
        step_number=1,
        milestone_name="Foundations of Machine Learning",
        status="completed",
        estimated_weeks=3,
        completed_at=datetime.now().strftime("%Y-%m-%d"),
    )
    step2 = StudentRoadmapStep(
        student_id=student_id,
        step_number=2,
        milestone_name="Model Deployment and Inference",
        status="in_progress",
        estimated_weeks=4,
    )
    db.add_all([step1, step2])

    # Add real student skills
    db.add(StudentSkill(
        student_id=student_id,
        skill_id="SK01",
        final_mastery=85.0,
        is_completed=True,
    ))
    db.add(StudentSkill(
        student_id=student_id,
        skill_id="SK02",
        final_mastery=35.0,
        is_completed=False,
    ))

    # Add an upcoming session
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    db.add(MentorshipSession(
        session_id=f"SESS-{uuid.uuid4().hex[:6].upper()}",
        mentor_id=mentor_id,
        student_id=student_id,
        topic="Inference Optimization",
        session_date=tomorrow,
        start_time="14:00",
        end_time="15:00",
        status="upcoming",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    ))
    db.commit()
    db.close()

    # Query /api/mentor/students
    res = client.get("/api/mentor/students", headers=mentor_headers)
    assert res.status_code == 200
    students = res.json()
    assert len(students) >= 1
    st = next((s for s in students if s["student_id"] == student_id), None)
    assert st is not None
    assert st["name"] == "Marcus Vance"
    assert "Learning Path" in st["roadmap_name"]
    assert st["roadmap_progress_pct"] == 50  # 1 of 2 steps completed
    assert st["skills_completed"] >= 1  # mastery >= 70 or is_completed
    assert st["upcoming_session"] is not None
    assert "Inference Optimization" in st["upcoming_session"]["topic"]


def test_02_mentor_cannot_access_unassigned_student_progress():
    """Verify that a mentor cannot access detailed progress for a student they are not assigned to (403)."""
    mentor_a_id, mentor_a_headers, _ = helper_register_and_login_mentor("Mentor Alpha")
    mentor_b_id, mentor_b_headers, _ = helper_register_and_login_mentor("Mentor Beta")
    student_id, _, _ = helper_register_and_login_student("Unassigned Student")

    # Assign student strictly to Mentor Alpha
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_a_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))
    db.commit()
    db.close()

    # Mentor Beta attempts to access progress
    res = client.get(f"/api/mentor/students/{student_id}/progress", headers=mentor_b_headers)
    assert res.status_code == 403
    assert "not an active mentee" in res.json()["detail"].lower() or "forbidden" in res.json()["detail"].lower()


def test_03_student_detailed_progress_all_sections():
    """Verify detailed progress returns all 8 required sections with real, uncorrupted database data."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Samantha Carter")
    student_id, _, _ = helper_register_and_login_student("Daniel Jackson")

    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
        notes="Deep space telemetry and linguistics",
    ))

    # Add project progress
    db.add(StudentProjectProgress(
        student_id=student_id,
        project_id="P01",
        progress_percentage=100,
        status="completed",
        github_url="https://github.com/daniel/stargate-router",
        completed_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    ))

    # Add course assessment score
    db.add(StudentCourseProgress(
        student_id=student_id,
        course_id="CRS01",
        progress_percentage=100,
        status="completed",
        final_assessment_score=88.5,
        completed_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    ))

    # Add past mentorship session
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    db.add(MentorshipSession(
        session_id=f"SESS-{uuid.uuid4().hex[:6].upper()}",
        mentor_id=mentor_id,
        student_id=student_id,
        topic="Initial Assessment Review",
        session_date=yesterday,
        start_time="10:00",
        end_time="11:00",
        status="completed",
        notes="Private mentor notes: Daniel is picking up distributed protocols rapidly.",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    ))
    db.commit()
    db.close()

    res = client.get(f"/api/mentor/students/{student_id}/progress", headers=mentor_headers)
    assert res.status_code == 200
    data = res.json()

    # Verify all 8 core sections exist
    assert "overview" in data
    assert "skill_progress" in data
    assert "roadmap" in data
    assert "assessment_performance" in data
    assert "project_progress" in data
    assert "mentorship_history" in data
    assert "insights" in data
    assert "visualizations" in data

    # Verify overview details
    assert data["overview"]["name"] == "Daniel Jackson"
    assert data["overview"]["student_id"] == student_id

    # Verify assessments
    assessments = data["assessment_performance"]["course_assessments"]
    assert len(assessments) >= 1
    assert assessments[0]["score"] == 88.5

    # Verify projects
    projects = data["project_progress"]["projects"]
    assert len(projects) >= 1
    assert projects[0]["project_id"] == "P01"
    assert projects[0]["status"] == "completed"

    # Verify mentorship history includes private notes for the assigned mentor
    sessions = data["mentorship_history"]["sessions"]
    assert len(sessions) >= 1
    assert "picking up distributed protocols" in sessions[0]["notes"]


def test_04_roadmap_completion_calculation_and_empty_states():
    """Verify roadmap completion percentage is calculated accurately from task items, and empty datasets don't crash."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Professor Charles Xavier")
    student_id, _, _ = helper_register_and_login_student("Scott Summers")

    # Assign student with NO assessments and NO projects
    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))

    # Roadmap steps: 2 completed, 1 in_progress => 67%
    s1 = StudentRoadmapStep(
        student_id=student_id,
        step_number=1,
        milestone_name="Optic Safety Calibration",
        status="completed",
        estimated_weeks=2,
    )
    s2 = StudentRoadmapStep(
        student_id=student_id,
        step_number=2,
        milestone_name="Field Leadership Basics",
        status="completed",
        estimated_weeks=3,
    )
    s3 = StudentRoadmapStep(
        student_id=student_id,
        step_number=3,
        milestone_name="Emergency Response Protocols",
        status="in_progress",
        estimated_weeks=3,
    )
    db.add_all([s1, s2, s3])
    db.commit()
    db.close()

    res = client.get(f"/api/mentor/students/{student_id}/progress", headers=mentor_headers)
    assert res.status_code == 200
    data = res.json()

    # Roadmap accuracy: 2/3 = 67%
    assert data["roadmap"]["completed_steps"] == 2
    assert data["roadmap"]["total_steps"] == 3
    assert data["roadmap"]["completion_pct"] == 67

    # Empty assessments and projects must not crash
    assert data["assessment_performance"]["course_assessments"] == []
    assert data["assessment_performance"]["total_questions_attempted"] == 0
    assert data["assessment_performance"]["avg_assessment_score"] is None
    assert data["project_progress"]["projects"] == []
    assert data["project_progress"]["total_projects"] == 0


def test_05_mentor_deterministic_insights_rules():
    """Verify mentor insights trigger deterministically from low scores, unverified skills, and pending projects."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Dr. Bruce Banner")
    student_id, _, _ = helper_register_and_login_student("Amadeus Cho")

    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))

    # Low assessment skill (<60)
    db.add(StudentSkill(
        student_id=student_id,
        skill_id="SK_GAMMA",
        assessment_score=45,
        final_mastery=45.0,
        is_completed=False,
    ))

    # Project awaiting review (completed or github_url present without mentor feedback)
    db.add(StudentProjectProgress(
        student_id=student_id,
        project_id="P01",
        progress_percentage=100,
        status="completed",
        github_url="https://github.com/amadeus/gamma-containment",
        completed_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    ))

    # Active milestone
    db.add(StudentRoadmapStep(
        student_id=student_id,
        step_number=1,
        milestone_name="Field Containment Protocols",
        status="in_progress",
        estimated_weeks=2,
    ))

    db.commit()
    db.close()

    res = client.get(f"/api/mentor/students/{student_id}/progress", headers=mentor_headers)
    assert res.status_code == 200
    insights = res.json()["insights"]

    # Check for low assessment insight
    low_assessment_insight = next((i for i in insights if i["category"] == "assessment" and i["severity"] == "warning"), None)
    assert low_assessment_insight is not None
    assert "45" in low_assessment_insight["observation"] or "45" in low_assessment_insight["metric"]

    # Check for project review insight
    project_insight = next((i for i in insights if i["category"] == "project_review"), None)
    assert project_insight is not None
    assert "review" in project_insight["title"].lower() or "awaiting" in project_insight["title"].lower()

    # Check for active milestone insight
    milestone_insight = next((i for i in insights if i["category"] == "milestone"), None)
    assert milestone_insight is not None
    assert "Field Containment Protocols" in milestone_insight["title"] or "Step 1" in milestone_insight["metric"]


def test_06_mentor_feedback_and_recommendations_submission():
    """Verify mentor submits progress feedback, which records note, feedback, recalibrates skill, and notifies student."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Master Yoda")
    student_id, student_headers, _ = helper_register_and_login_student("Luke Skywalker")

    db = SessionLocal()
    db.add(MentorStudentAssignment(
        mentor_id=mentor_id,
        student_id=student_id,
        assigned_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status="active",
    ))
    # Seed a student skill
    db.add(StudentSkill(
        student_id=student_id,
        skill_id="SK01",
        final_mastery=50.0,
    ))
    db.commit()
    db.close()

    feedback_payload = {
        "strengths": "Strong connection to the Force and swift intuition.",
        "improvement_areas": "Patience during deep focus exercises.",
        "recommended_action": "Complete Dagobah swamp levitation trials.",
        "comments": "Much promise you show, but focus you must.",
        "skill_id": "SK01",
        "rating": 5,
    }

    res = client.post(
        f"/api/mentor/students/{student_id}/progress-feedback",
        json=feedback_payload,
        headers=mentor_headers,
    )
    assert res.status_code == 200
    res_data = res.json()
    assert "success" in res_data["message"].lower()

    # Verify in DB: MentorGuidanceNote created
    db = SessionLocal()
    note = db.query(MentorGuidanceNote).filter(
        MentorGuidanceNote.mentor_id == mentor_id,
        MentorGuidanceNote.student_id == student_id,
    ).first()
    assert note is not None
    assert "Dagobah" in note.action_items or "Dagobah" in note.notes
    assert "patience" in note.notes.lower()

    # Verify MentorFeedback created
    feedback = db.query(MentorFeedback).filter(
        MentorFeedback.mentor_id == mentor_id,
        MentorFeedback.student_id == student_id,
    ).first()
    assert feedback is not None
    assert feedback.rating == 5

    # Verify student skill mastery calibrated
    skill = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id,
        StudentSkill.skill_id == "SK01",
    ).first()
    assert skill is not None
    assert skill.mentor_score == 100  # 5/5 -> 100%

    # Verify student notification received
    notif = db.query(Notification).filter(
        Notification.student_id == student_id,
        Notification.type == "feedback_submitted",
    ).first()
    assert notif is not None
    assert "Master Yoda" in notif.message or "feedback" in notif.title.lower()
    db.close()


def test_07_authorization_and_authentication_lockouts():
    """Verify 401 for unauthenticated requests and 403 for student tokens attempting mentor progress access."""
    mentor_id, mentor_headers, _ = helper_register_and_login_mentor("Professor McGonagall")
    student_id, student_headers, _ = helper_register_and_login_student("Hermione Granger")

    # 1. Unauthenticated request -> 401
    unauth_res = client.get(f"/api/mentor/students/{student_id}/progress")
    assert unauth_res.status_code == 401

    # 2. Student attempts to access mentor progress endpoint -> 403
    student_access_res = client.get(f"/api/mentor/students/{student_id}/progress", headers=student_headers)
    assert student_access_res.status_code == 403
    assert "mentor" in student_access_res.json()["detail"].lower()

    # 3. Student attempts to submit mentor feedback -> 403
    student_post_res = client.post(
        f"/api/mentor/students/{student_id}/progress-feedback",
        json={"strengths": "Bright"},
        headers=student_headers,
    )
    assert student_post_res.status_code == 403
