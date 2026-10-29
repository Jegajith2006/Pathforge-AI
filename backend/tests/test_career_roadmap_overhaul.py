"""
PathForge AI - Comprehensive Verification Suite for Career Roadmap,
Dynamic Syllabus Assessments, and Progress Tracker Overhaul.
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from database.connection import SessionLocal
from database.models import Student, Career, Course, CourseLesson, AssessmentQuestion
from services.roadmap_service import get_canonical_career_courses, classify_course_tier

client = TestClient(app)


def get_auth_token():
    from routers.auth import create_access_token
    return create_access_token(data={"sub": "U001", "role": "student"})


def test_canonical_career_course_parity_all_25_careers():
    """Verify that every career has non-empty mapped courses, 0 duplicates, and valid 7-tier assignments."""
    db = SessionLocal()
    try:
        careers = db.query(Career).all()
        assert len(careers) == 25, f"Expected 25 careers, found {len(careers)}"

        for c in careers:
            courses = get_canonical_career_courses(db, c.career_id)
            assert len(courses) > 0, f"Career {c.career_id} ({c.career_name}) has 0 mapped courses!"
            c_ids = [course.course_id for course in courses]
            assert len(c_ids) == len(set(c_ids)), f"Duplicate courses found in career {c.career_id}!"

            # Tier classification check
            for course in courses:
                c_skills = [{"skill_id": cs.skill_id, "skill_name": cs.skill.skill_name, "category": cs.skill.category if cs.skill else "General"} for cs in course.skills if cs.skill]
                tier, phase_name, _ = classify_course_tier(course.course_id, course.course_name, c_skills)
                assert 0 <= tier <= 6, f"Invalid tier {tier} for course {course.course_id}"
    finally:
        db.close()


def test_career_agenda_and_progress_endpoints():
    """Verify GET /api/careers/{career_id}/agenda and GET /api/careers/{career_id}/progress."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Test C001 (Machine Learning Engineer)
    agenda_res = client.get("/api/careers/C001/agenda", headers=headers)
    assert agenda_res.status_code == 200, f"Agenda failed: {agenda_res.text}"
    agenda = agenda_res.json()

    assert agenda["career_id"] == "C001"
    assert agenda["career_name"] == "Machine Learning Engineer"
    assert agenda["total_courses_count"] == 94
    assert agenda["total_lessons_count"] == 94 * 5
    assert len(agenda["phases"]) >= 4
    assert len(agenda["recommended_projects"]) > 0
    assert len(agenda["target_companies"]) > 0
    assert "progress" in agenda
    assert agenda["progress"]["total_courses_count"] == 94

    # Test progress endpoint directly
    prog_res = client.get("/api/careers/C001/progress", headers=headers)
    assert prog_res.status_code == 200
    prog = prog_res.json()
    assert prog["career_id"] == "C001"
    assert prog["total_courses_count"] == 94
    assert 0.0 <= prog["progress_percentage"] <= 100.0


def test_roadmap_schedule_endpoint():
    """Verify GET /api/roadmap/schedule returns dated cards and weekly plan."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    sched_res = client.get("/api/roadmap/schedule", headers=headers)
    assert sched_res.status_code == 200, f"Schedule failed: {sched_res.text}"
    sched = sched_res.json()

    assert "weekly_plan" in sched
    assert "weekly_learning_hours" in sched
    assert "estimated_finish_date" in sched
    assert len(sched["weekly_plan"]) > 0

    first_week = sched["weekly_plan"][0]
    assert "week_number" in first_week
    assert "start_date" in first_week
    assert "end_date" in first_week
    assert "status" in first_week
    assert first_week["status"] in ["done", "this_week", "upcoming", "overdue"]


def test_lesson_question_bank_and_topic_isolation():
    """Verify lesson questions: count, 25% balance, and hard topic isolation."""
    db = SessionLocal()
    try:
        total_lesson_qs = db.query(AssessmentQuestion).filter(AssessmentQuestion.lesson_id.isnot(None)).count()
        assert total_lesson_qs == 9600, f"Expected 9600 lesson questions (800*12), found {total_lesson_qs}"

        # Uniform distribution check
        for letter in ["A", "B", "C", "D"]:
            cnt = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.lesson_id.isnot(None),
                AssessmentQuestion.correct_answer == letter
            ).count()
            assert cnt == 2400, f"Option {letter} count was {cnt}, expected exactly 2400 (25.0%)"

        # Topic isolation check: CR001_L1
        l1_qs = db.query(AssessmentQuestion).filter(AssessmentQuestion.lesson_id == "CR001_L1").all()
        assert len(l1_qs) == 12
        for q in l1_qs:
            assert q.lesson_id == "CR001_L1"
            assert q.course_id == "CR001"
            assert q.topic_tag is not None
            assert len(q.topic_tag) > 0
    finally:
        db.close()


def test_diagnostic_assessment_topic_isolation_e2e():
    """Start assessment for a specific lesson and verify 100% of questions belong strictly to that lesson."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure resource is reviewed for CR001_L1 first
    syl = client.get("/api/courses/CR001/syllabus", headers=headers).json()
    first_lid = syl["lessons"][0]["lesson_id"]
    lesson = client.get(f"/api/courses/CR001/lessons/{first_lid}", headers=headers).json()
    if lesson.get("resources"):
        res_id = lesson["resources"][0]["resource_id"]
        client.post(f"/api/courses/CR001/lessons/{first_lid}/review-resource?resource_id={res_id}", headers=headers)

    start_res = client.post("/api/assessment/start", json={
        "course_id": "CR001",
        "lesson_id": first_lid,
        "limit": 5,
    }, headers=headers)
    assert start_res.status_code == 200
    data = start_res.json()
    assert len(data["questions"]) == 5

    for q in data["questions"]:
        assert q["lesson_id"] == first_lid, f"Topic isolation breached! Expected {first_lid}, got {q.get('lesson_id')}"
        assert q["course_id"] == "CR001"
        assert "concept_label" in q
        assert q["concept_label"].startswith("Concept:") or q["concept_label"].startswith("Implementation:") or q["concept_label"].startswith("Verification:") or q["concept_label"].startswith("Pattern:") or q["concept_label"].startswith("Architecture:") or q["concept_label"].startswith("Quality:") or q["concept_label"].startswith("Optimization:") or q["concept_label"].startswith("Troubleshooting:") or q["concept_label"].startswith("Resilience:") or q["concept_label"].startswith("Production Deployment:")
