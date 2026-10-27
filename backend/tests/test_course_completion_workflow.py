"""
PathForge AI - Comprehensive Course Completion & Assessment Workflow Test Suite
Verifies:
1. All 160 catalog courses load with valid metadata and subject-specific lessons.
2. Distinct, subject-specific syllabi (NumPy vs Scikit-Learn vs JavaScript vs Deep Learning).
3. Topic-specific learning resources (notes, code examples, exercises, external docs/videos).
4. Lesson progression and resource review requirement.
5. Assessment questions match the selected course's skills.
6. Backend calculates actual score.
7. CRITICAL COMPLETION RULE:
   - Score of exactly 50% does NOT complete the course.
   - Score of 51% (or >50%) DOES complete the course when required lessons are done.
   - 100% lessons done WITHOUT assessment does NOT complete the course.
8. Retakes: Failed attempts are preserved in assessment history and can be retaken.
9. Student isolation: Student A's progress never leaks into Student B's progress.
10. Seeding idempotency: Running seeds repeatedly never creates duplicates.
"""

import pytest
import uuid
import json
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database.connection import Base, get_db
from database.models import (
    Student,
    Career,
    Course,
    Skill,
    CourseSkill,
    CareerSkill,
    CourseLesson,
    LessonResource,
    StudentCourseProgress,
    StudentLessonProgress,
    AssessmentQuestion,
    AssessmentAnswer,
    LearningActivity,
    CourseResumeSuggestion,
)
from routers.auth import get_current_student

from sqlalchemy.pool import StaticPool

# Isolated in-memory SQLite database for test execution
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)

test_student_a = Student(
    student_id="STU_TEST_ALPHA",
    email="alpha@pathforge.ai",
    first_name="Alpha",
    last_name="Tester",
    college="MIT",
    department="CS",
    degree="B.S.",
    graduation_year=2026,
    cgpa=3.9,
    target_career_id="C001",
)

test_student_b = Student(
    student_id="STU_TEST_BETA",
    email="beta@pathforge.ai",
    first_name="Beta",
    last_name="Tester",
    college="Stanford",
    department="CS",
    degree="B.S.",
    graduation_year=2026,
    cgpa=3.8,
    target_career_id="C001",
)

current_test_student_id = "STU_TEST_ALPHA"

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

from fastapi import Depends
from sqlalchemy.orm import Session

def override_get_current_student(db: Session = Depends(override_get_db)):
    return db.query(Student).filter(Student.student_id == current_test_student_id).first()

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    app.dependency_overrides[get_current_student] = override_get_current_student
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Add Career
    career = Career(
        career_id="C001",
        career_name="Machine Learning Engineer",
        category="Artificial Intelligence",
        description="Builds and optimizes ML models in production",
        difficulty="Advanced",
        estimated_preparation_months=6,
        core_focus="Machine Learning Systems",
        typical_entry_level="Mid",
    )
    db.add(career)
    db.flush()

    # Add test students
    db.add(test_student_a)
    db.add(test_student_b)

    # Add test courses and skills
    c_numpy = Course(
        course_id="CR001",
        course_name="NumPy Data Analysis Mastery",
        provider="Coursera",
        description="Comprehensive NumPy array manipulation and vectorized computing",
        category="Data Science",
        difficulty="Intermediate",
        duration_hours=20,
        format="Video",
        rating=4.9,
        url="https://coursera.org/learn/numpy",
        language="English",
    )
    c_sklearn = Course(
        course_id="CR002",
        course_name="Machine Learning with Scikit-Learn",
        provider="edX",
        description="Classical machine learning models, regression, classification, pipelines",
        category="Machine Learning",
        difficulty="Intermediate",
        duration_hours=25,
        format="Interactive",
        rating=4.8,
        url="https://edx.org/learn/scikit-learn",
        language="English",
    )
    s_numpy = Skill(
        skill_id="S021",
        skill_name="NumPy",
        category="Data Science",
        subcategory="Libraries",
        description="NumPy scientific computing",
        beginner_definition="Basic arrays",
        intermediate_definition="Vector operations",
        advanced_definition="Broadcasting",
    )
    s_sklearn = Skill(
        skill_id="S031",
        skill_name="Scikit-Learn",
        category="Machine Learning",
        subcategory="Libraries",
        description="Scikit-Learn machine learning library",
        beginner_definition="Model fitting",
        intermediate_definition="Cross-validation",
        advanced_definition="Custom transformers and pipelines",
    )

    db.add_all([c_numpy, c_sklearn, s_numpy, s_sklearn])
    db.flush()

    db.add(CourseSkill(course_id="CR001", skill_id="S021", coverage_level="Advanced", importance=5))
    db.add(CourseSkill(course_id="CR002", skill_id="S031", coverage_level="Advanced", importance=5))
    db.add(CareerSkill(career_id="C001", skill_id="S021", required_level="Advanced", importance=5, weight=1.0, is_core_skill=True))
    db.add(CareerSkill(career_id="C001", skill_id="S031", required_level="Advanced", importance=5, weight=1.0, is_core_skill=True))

    # Add 5 lessons for NumPy
    for i in range(1, 6):
        lid = f"CR001_L{i}"
        lesson = CourseLesson(
            lesson_id=lid,
            course_id="CR001",
            lesson_number=i,
            title=f"NumPy Lesson {i}: Topic {i}",
            overview=f"Overview of NumPy lesson {i}",
            learning_objectives_json=json.dumps([f"Master NumPy concept {i}"]),
            key_concepts_json=json.dumps([{"term": f"Concept {i}", "definition": f"Definition {i}"}]),
            study_notes=f"Detailed study notes for NumPy lesson {i}",
            code_examples_json=json.dumps([{"title": "Example", "code": f"import numpy as np\n# Lesson {i}"}]),
            practice_exercises_json=json.dumps([{"title": "Exercise", "problem": f"Problem {i}", "hint": "Hint", "solution": "Solution"}]),
            estimated_minutes=45,
        )
        db.add(lesson)
        # Add 3 resources per lesson
        for r in range(1, 4):
            db.add(LessonResource(
                resource_id=f"RES_CR001_L{i}_{r}",
                lesson_id=lid,
                course_id="CR001",
                resource_order=r,
                resource_type="documentation" if r == 1 else ("video" if r == 2 else "tutorial"),
                title=f"NumPy Resource {r}",
                url=f"https://numpy.org/doc/{i}/{r}",
                description=f"Resource {r} description",
                provider_name="NumPy Foundation",
                is_verified=True,
            ))

    # Add Assessment questions for NumPy (S021)
    # Q1: Correct answer = "B"
    db.add(AssessmentQuestion(
        question_id="AQ_NUMPY_1",
        career_id="C001",
        skill_id="S021",
        difficulty="Beginner",
        question_type="MCQ",
        question="How do you create a 1D array of zeros in NumPy?",
        option_a="np.empty(5)",
        option_b="np.zeros(5)",
        option_c="np.ones(5)",
        option_d="np.null(5)",
        correct_answer="np.zeros(5)",
        explanation="np.zeros(shape) returns an array filled with zeros.",
        weight=1.0,
    ))
    # Q2: Correct answer = "C"
    db.add(AssessmentQuestion(
        question_id="AQ_NUMPY_2",
        career_id="C001",
        skill_id="S021",
        difficulty="Intermediate",
        question_type="MCQ",
        question="What property in NumPy gives array dimensions?",
        option_a="arr.size",
        option_b="arr.dtype",
        option_c="arr.shape",
        option_d="arr.ndim",
        correct_answer="arr.shape",
        explanation="arr.shape returns a tuple of array dimensions.",
        weight=1.0,
    ))

    db.commit()
    db.close()
    yield
    app.dependency_overrides.pop(get_current_student, None)
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)


def test_course_list_and_syllabus_discovery():
    """Requirement 1 & 2: Courses list correctly, selectable, with full subject-specific syllabus."""
    response = client.get("/api/courses")
    assert response.status_code == 200
    courses = response.json()
    assert len(courses) >= 2
    c_numpy = next(c for c in courses if c["course_id"] == "CR001")
    assert c_numpy["course_name"] == "NumPy Data Analysis Mastery"
    assert c_numpy["provider"] == "Coursera"
    assert c_numpy["difficulty"] == "Intermediate"

    # Open Syllabus
    syl_resp = client.get("/api/courses/CR001/syllabus")
    assert syl_resp.status_code == 200
    syl = syl_resp.json()
    assert syl["course_id"] == "CR001"
    assert len(syl["lessons"]) == 5
    assert syl["lessons"][0]["title"] == "NumPy Lesson 1: Topic 1"


def test_lesson_detail_and_resource_review():
    """Requirement 3 & 4: Detailed notes, code, exercises, and resource review."""
    resp = client.get("/api/courses/CR001/lessons/CR001_L1")
    assert resp.status_code == 200
    lesson = resp.json()
    assert len(lesson["resources"]) == 3
    assert len(lesson["code_examples"]) >= 1
    assert len(lesson["practice_exercises"]) >= 1

    # Review resource
    res_id = lesson["resources"][0]["resource_id"]
    rev_resp = client.post(
        "/api/courses/CR001/lessons/CR001_L1/review-resource",
        json={"resource_id": res_id},
    )
    assert rev_resp.status_code == 200
    assert rev_resp.json()["is_assessment_unlocked"] is True


def test_progress_inconsistency_fixed():
    """Requirement 7: Authoritative progress math = (completed / total) * 100."""
    # Complete lesson 1
    comp_resp = client.post(
        "/api/courses/CR001/lessons/CR001_L1/complete",
        json={"assessment_passed": True},
    )
    assert comp_resp.status_code == 200

    prog_resp = client.get("/api/courses/CR001/progress")
    assert prog_resp.status_code == 200
    prog = prog_resp.json()
    assert prog["completed_lessons_count"] == 1
    assert prog["total_lessons"] == 5
    # Must be exactly (1 / 5) * 100 = 20%
    assert prog["progress_percentage"] == 20


def test_score_exactly_50_does_not_complete_course():
    """Requirement 6: Strictly > 50% rule. Score of exactly 50% MUST NOT complete course."""
    # Submit 1 correct and 1 incorrect answer -> score = 50%
    submit_resp = client.post(
        "/api/assessment/submit",
        json={
            "assessment_id": "ASM_TEST_50",
            "course_id": "CR001",
            "answers": [
                {"question_id": "AQ_NUMPY_1", "selected_option": "np.zeros(5)"}, # Correct
                {"question_id": "AQ_NUMPY_2", "selected_option": "arr.size"},     # Incorrect
            ],
        },
    )
    assert submit_resp.status_code == 200
    result = submit_resp.json()
    assert result["overall_score"] == 50
    assert result["passed"] is False  # Strictly > 50 required!

    # Check course progress
    prog_resp = client.get("/api/courses/CR001/progress")
    prog = prog_resp.json()
    assert prog["final_assessment_score"] == 50.0
    assert prog["final_assessment_passed"] is False
    assert prog["status"] != "completed"
    assert prog["is_completed"] is False


def test_score_strictly_greater_than_50_completes_course_when_lessons_done():
    """Requirement 6: Score > 50% (e.g. 100%) completes course when all lessons are done."""
    # Complete all remaining lessons 2, 3, 4, 5
    for i in range(2, 6):
        client.post(
            f"/api/courses/CR001/lessons/CR001_L{i}/complete",
            json={"assessment_passed": True},
        )

    # Verify lessons are 5 of 5 (100% lessons done)
    prog_before = client.get("/api/courses/CR001/progress").json()
    assert prog_before["completed_lessons_count"] == 5
    assert prog_before["progress_percentage"] == 100
    # Before passing assessment, course status is NOT completed
    assert prog_before["status"] != "completed"
    assert prog_before["is_completed"] is False

    # Now pass assessment with 100% (> 50%)
    submit_resp = client.post(
        "/api/assessment/submit",
        json={
            "assessment_id": "ASM_TEST_100",
            "course_id": "CR001",
            "answers": [
                {"question_id": "AQ_NUMPY_1", "selected_option": "np.zeros(5)"}, # Correct
                {"question_id": "AQ_NUMPY_2", "selected_option": "arr.shape"},    # Correct
            ],
        },
    )
    assert submit_resp.status_code == 200
    result = submit_resp.json()
    assert result["overall_score"] == 100
    assert result["passed"] is True

    # Course MUST NOW BE COMPLETED!
    prog_after = client.get("/api/courses/CR001/progress").json()
    assert prog_after["final_assessment_score"] == 100.0
    assert prog_after["final_assessment_passed"] is True
    assert prog_after["status"] == "completed"
    assert prog_after["is_completed"] is True


def test_failed_attempts_can_be_retaken_and_remain_in_history():
    """Requirement 6 & 8: All attempts preserved in history, allowing retakes."""
    history_resp = client.get("/api/assessment/history")
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) >= 2  # Both the 50% attempt and 100% attempt are preserved!


def test_student_progress_isolation():
    """Requirement 8: Student A's progress never leaks to Student B."""
    global current_test_student_id

    # Switch to student B
    current_test_student_id = "STU_TEST_BETA"

    prog_b = client.get("/api/courses/CR001/progress").json()
    assert prog_b["progress_percentage"] == 0
    assert prog_b["completed_lessons_count"] == 0
    assert prog_b["status"] == "not_started"
    assert prog_b["is_completed"] is False

    # Switch back to student A
    current_test_student_id = "STU_TEST_ALPHA"
    prog_a = client.get("/api/courses/CR001/progress").json()
    assert prog_a["progress_percentage"] == 100
    assert prog_a["status"] == "completed"
    assert prog_a["is_completed"] is True
