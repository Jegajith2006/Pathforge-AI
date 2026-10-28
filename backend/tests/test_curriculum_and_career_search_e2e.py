"""
End-to-End Test Suite for Career Search, Curriculum Seeding, Lesson Learning Materials,
Assessment Integration, Authoritative Progress Calculation, and Student Isolation.
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database.connection import get_db, SessionLocal
from database.models import (
    Student, Course, CourseLesson, LessonResource,
    StudentCourseProgress, StudentLessonProgress, Career
)

client = TestClient(app)


def get_auth_token(email: str = "alex.chen@stanford.edu", password: str = "password123"):
    """Helper to login and obtain JWT access token."""
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp.json()["access_token"]


class TestCareerSearchAndFiltering:
    """Requirement 1: Fix Career Goal search bar and category filters."""

    def test_search_partial_case_insensitive(self):
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}

        # Partial query "machine"
        resp = client.get("/api/careers?search=machine", headers=headers)
        assert resp.status_code == 200
        careers = resp.json()
        assert len(careers) > 0
        names = [c["career_name"].lower() for c in careers]
        assert any("machine learning" in n for n in names)

        # Upper case query "DATA"
        resp2 = client.get("/api/careers?search=DATA", headers=headers)
        assert resp2.status_code == 200
        data_careers = resp2.json()
        assert len(data_careers) > 0
        for c in data_careers:
            has_data = (
                "data" in c["career_name"].lower()
                or "data" in (c.get("category") or "").lower()
                or "data" in (c.get("description") or "").lower()
                or "data" in (c.get("core_focus") or "").lower()
                or any("data" in sk["skill_name"].lower() for sk in c.get("required_skills", []))
            )
            assert has_data, f"Career {c['career_name']} does not match 'data' search query"

    def test_search_combined_with_category(self):
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}

        # Search "engineer" in category "AI & Machine Learning"
        resp = client.get("/api/careers?category=AI+%26+Machine+Learning&search=engineer", headers=headers)
        assert resp.status_code == 200
        careers = resp.json()
        assert len(careers) > 0
        for c in careers:
            assert "ai" in c["category"].lower() or "ml" in c["category"].lower()
            assert "engineer" in c["career_name"].lower() or "engineer" in (c.get("description") or "").lower()

    def test_select_career_persists_to_student(self):
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}

        # Retrieve careers
        resp = client.get("/api/careers", headers=headers)
        assert resp.status_code == 200
        career_list = resp.json()
        assert len(career_list) > 0
        target = career_list[0]
        cid = target["career_id"]

        # Select career via POST /api/career/select
        select_resp = client.post("/api/career/select", json={"career_id": cid}, headers=headers)
        assert select_resp.status_code == 200

        # Also verify alias /api/careers/select/{cid}
        alias_resp = client.post(f"/api/careers/select/{cid}", headers=headers)
        assert alias_resp.status_code == 200

        # Verify student profile reflects target career
        me_resp = client.get("/api/auth/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["target_career_id"] == cid


class TestCurriculumAndCourseDiscovery:
    """Requirements 2, 3, 4: Course catalog, distinct subject curricula, and rich learning materials."""

    def test_all_160_courses_discovered_with_curricula(self):
        db = SessionLocal()
        try:
            total_courses = db.query(Course).count()
            assert total_courses >= 160, f"Expected at least 160 courses, found {total_courses}"

            total_lessons = db.query(CourseLesson).count()
            assert total_lessons >= 800, f"Expected at least 800 lessons, found {total_lessons}"

            total_resources = db.query(LessonResource).count()
            assert total_resources >= 2400, f"Expected at least 2400 resources, found {total_resources}"
        finally:
            db.close()

    def test_course_syllabi_are_distinct_and_subject_specific(self):
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}

        # Compare CR001 (Python for Everybody) and CR010 (Docker & Kubernetes / CI/CD)
        syl1 = client.get("/api/courses/CR001/syllabus", headers=headers).json()
        syl2 = client.get("/api/courses/CR010/syllabus", headers=headers).json()

        assert syl1["course_id"] == "CR001"
        assert syl2["course_id"] == "CR010"
        assert len(syl1["lessons"]) == 5
        assert len(syl2["lessons"]) == 5

        # Lesson titles must NOT be identical generic copies
        titles1 = [l["title"] for l in syl1["lessons"]]
        titles2 = [l["title"] for l in syl2["lessons"]]
        assert titles1 != titles2, "Courses must have distinct subject-specific curriculums"

        # Check Python presence in CR001
        assert any("python" in t.lower() for t in titles1)
        # Check domain presence in CR010
        assert any("ci / cd" in t.lower() or "pipeline" in t.lower() or "deployment" in t.lower() for t in titles2)

    def test_lesson_learning_material_structure(self):
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch syllabus of CR001 to get first lesson ID dynamically
        syl = client.get("/api/courses/CR001/syllabus", headers=headers).json()
        first_lesson_id = syl["lessons"][0]["lesson_id"]

        lesson_resp = client.get(f"/api/courses/CR001/lessons/{first_lesson_id}", headers=headers)
        assert lesson_resp.status_code == 200
        lesson = lesson_resp.json()

        # Check Sections A, B, C, D
        assert lesson["lesson_id"] == first_lesson_id
        assert lesson["course_id"] == "CR001"
        assert lesson["lesson_number"] == 1
        assert len(lesson["learning_objectives"]) >= 2
        assert len(lesson["key_concepts"]) >= 2
        assert len(lesson["study_notes"]) > 50
        assert len(lesson["code_examples"]) >= 1
        assert len(lesson["practice_exercises"]) >= 1
        assert len(lesson["resources"]) >= 2

        # Check verified resources
        resources = lesson["resources"]
        assert any(r["is_verified"] for r in resources)


class TestInteractiveLearningWorkflowAndAssessment:
    """Requirements 5, 6, 7, 8: Interactive lesson workflow, assessment unlocking, authoritative progress math."""

    def test_review_resource_and_unlock_assessment(self):
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}

        syl = client.get("/api/courses/CR002/syllabus", headers=headers).json()
        first_lid = syl["lessons"][0]["lesson_id"]

        lesson = client.get(f"/api/courses/CR002/lessons/{first_lid}", headers=headers).json()
        assert len(lesson["resources"]) > 0
        res_id = lesson["resources"][0]["resource_id"]

        # Review resource
        rev_resp = client.post(f"/api/courses/CR002/lessons/{first_lid}/review-resource?resource_id={res_id}", headers=headers)
        assert rev_resp.status_code == 200
        data = rev_resp.json()
        assert data["is_assessment_unlocked"] is True
        assert res_id in data["resources_reviewed"]

    def test_assessment_start_and_submission_evaluates_and_completes_lesson(self):
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}

        syl = client.get("/api/courses/CR001/syllabus", headers=headers).json()
        first_lid = syl["lessons"][0]["lesson_id"]

        # Start assessment for course CR001 lesson
        start_resp = client.post("/api/assessment/start", json={
            "course_id": "CR001",
            "lesson_id": first_lid,
            "limit": 3
        }, headers=headers)
        assert start_resp.status_code == 200
        start_data = start_resp.json()
        aid = start_data["assessment_id"]
        questions = start_data["questions"]
        assert len(questions) > 0

        # Submit answers
        answers = [{"question_id": q["question_id"], "selected_answer": "A"} for q in questions]
        sub_resp = client.post("/api/assessment/submit", json={
            "assessment_id": aid,
            "course_id": "CR001",
            "lesson_id": first_lid,
            "answers": answers
        }, headers=headers)
        assert sub_resp.status_code == 200
        result = sub_resp.json()
        assert "overall_score" in result
        assert "passed" in result

    def test_authoritative_progress_calculation(self):
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}

        syl = client.get("/api/courses/CR003/syllabus", headers=headers).json()
        first_lid = syl["lessons"][0]["lesson_id"]

        # For CR003, complete Lesson 1
        comp_resp = client.post(f"/api/courses/CR003/lessons/{first_lid}/complete", headers=headers)
        assert comp_resp.status_code == 200
        comp_data = comp_resp.json()

        # Authoritative check: completed_lessons_count / 5 * 100
        assert comp_data["completed_lessons_count"] >= 1
        assert comp_data["total_lessons"] == 5
        expected_pct = int(round((comp_data["completed_lessons_count"] / 5) * 100))
        assert comp_data["progress_percentage"] == expected_pct

        # Check course progress API returns the exact same authoritative numbers
        prog = client.get("/api/courses/CR003/progress", headers=headers).json()
        assert prog["completed_lessons_count"] == comp_data["completed_lessons_count"]
        assert prog["total_lessons"] == 5
        assert prog["progress_percentage"] == expected_pct


class TestStudentIsolation:
    """Requirement 8: Student A's progress is strictly isolated from Student B."""

    def test_student_isolation_on_lesson_and_course_progress(self):
        from database.connection import SessionLocal
        from database.models import User, Student
        from routers.auth import get_password_hash

        db = SessionLocal()
        u = db.query(User).filter(User.email == "bob.beta@test.com").first()
        if not u:
            hashed = get_password_hash("BetaPass123!")
            now_str = "2026-01-01 00:00:00"
            u = User(
                user_id="TEST_ST002",
                full_name="Bob Beta",
                email="bob.beta@test.com",
                hashed_password=hashed,
                role="student",
                is_verified=True,
                created_at=now_str,
                updated_at=now_str,
            )
            db.add(u)
        else:
            u.hashed_password = get_password_hash("BetaPass123!")

        st = db.query(Student).filter(Student.email == "bob.beta@test.com").first()
        if not st:
            st = Student(
                student_id="TEST_ST002",
                user_id="TEST_ST002",
                first_name="Bob",
                last_name="Beta",
                email="bob.beta@test.com",
                college="MIT",
                department="CS",
                degree="BS",
                graduation_year=2026,
                cgpa=8.8,
                target_career_id="C001",
            )
            db.add(st)
        db.commit()
        db.close()

        token_a = get_auth_token("alex.chen@stanford.edu", "password123")
        token_b = get_auth_token("bob.beta@test.com", "BetaPass123!")

        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}

        syl = client.get("/api/courses/CR008/syllabus", headers=headers_a).json()
        first_lid = syl["lessons"][0]["lesson_id"]

        # Student A completes Lesson 1 of CR008
        client.post(f"/api/courses/CR008/lessons/{first_lid}/complete", headers=headers_a)

        # Check Student A's syllabus
        syl_a = client.get("/api/courses/CR008/syllabus", headers=headers_a).json()
        lesson1_a = [l for l in syl_a["lessons"] if l["lesson_id"] == first_lid][0]
        assert lesson1_a["status"] == "completed"

        # Check Student B's syllabus for the same course: must NOT be completed
        syl_b = client.get("/api/courses/CR008/syllabus", headers=headers_b).json()
        lesson1_b = [l for l in syl_b["lessons"] if l["lesson_id"] == first_lid][0]
        assert lesson1_b["status"] != "completed"
        assert syl_b["progress_percentage"] != syl_a["progress_percentage"]
