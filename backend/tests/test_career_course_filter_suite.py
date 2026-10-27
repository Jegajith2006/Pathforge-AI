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
from database.connection import init_db, SessionLocal
from database.models import Student, Career, CareerSkill, CourseSkill, Course, StudentCourseProgress, User

# Ensure tables exist
init_db()
client = TestClient(app)


def create_authenticated_student(first_name="Test", last_name="Student", target_career_id="C001"):
    """Helper to register and return an authenticated student with token & headers."""
    unique_email = f"student_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "email": unique_email,
        "password": password,
        "college": "Stanford University",
        "department": "Computer Science",
        "degree": "B.S. Computer Science",
        "graduation_year": 2026,
        "cgpa": 9.1,
        "target_career_id": target_career_id,
        "weekly_learning_hours": 15,
        "preferred_difficulty": "Adaptive",
        "learning_mode": "Project-based",
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200, f"Registration failed: {res.text}"
    token = res.json()["access_token"]
    student_id = res.json().get("student_id")
    headers = {"Authorization": f"Bearer {token}"}
    return {
        "email": unique_email,
        "password": password,
        "token": token,
        "student_id": student_id,
        "headers": headers,
    }


def get_career_required_skill_ids(career_id: str):
    """Retrieve skill_ids mapped to career."""
    db = SessionLocal()
    try:
        skills = db.query(CareerSkill.skill_id).filter(CareerSkill.career_id == career_id).all()
        return {s[0] for s in skills}
    finally:
        db.close()


def get_course_skill_ids(course_id: str):
    """Retrieve skill_ids covered by course."""
    db = SessionLocal()
    try:
        skills = db.query(CourseSkill.skill_id).filter(CourseSkill.course_id == course_id).all()
        return {s[0] for s in skills}
    finally:
        db.close()


def test_suite_a_machine_learning_engineer():
    """
    Test A:
    1. Log in as a student.
    2. Select Machine Learning Engineer (C001).
    3. Open Courses.
    4. Verify every returned course matches at least one actual skill required by ML Engineer.
    5. Verify unrelated courses are excluded.
    """
    student = create_authenticated_student(first_name="Alice", last_name="ML", target_career_id="C001")
    headers = student["headers"]

    # Select C001
    sel_res = client.post("/api/career/select", json={"career_id": "C001"}, headers=headers)
    assert sel_res.status_code == 200

    # Get active profile and verify
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["target_career_id"] == "C001"
    assert "Machine Learning Engineer" in me_res.json()["target_career_name"]

    # Fetch courses
    courses_res = client.get("/api/courses", headers=headers)
    assert courses_res.status_code == 200
    courses = courses_res.json()
    assert len(courses) > 0, "Expected ML courses to be returned"
    assert len(courses) == 94, f"Expected exactly 94 courses for C001, got {len(courses)}"

    ml_skill_ids = get_career_required_skill_ids("C001")
    assert len(ml_skill_ids) > 0

    course_ids = [c["course_id"] for c in courses]
    # Verify every returned course covers at least one ML skill
    for c in courses:
        c_skills = get_course_skill_ids(c["course_id"])
        intersection = c_skills.intersection(ml_skill_ids)
        assert len(intersection) > 0, f"Course {c['course_id']} does not match any required skill for ML Engineer"
        assert c["career_id"] == "C001"

    # Verify that CR004 and CR005 (Deep Learning / Advanced Deep Learning) are present in ML
    assert "CR004" in course_ids, "CR004 (Deep Learning) must be in ML courses"
    assert "CR005" in course_ids, "CR005 (Advanced Deep Learning) must be in ML courses"

    # Verify headers returned by backend
    assert courses_res.headers.get("X-Active-Career-Id") == "C001"
    assert courses_res.headers.get("X-Career-Course-Count") == "94"


def test_suite_b_full_stack_developer():
    """
    Test B:
    1. Change active career to Full Stack Developer (C012).
    2. Open Courses.
    3. Verify list is refreshed with Full Stack Developer courses.
    4. Verify every returned course matches at least one actual required skill for FSD.
    5. Verify Machine Learning Engineer-specific courses (e.g. CR004, CR005) disappear
       unless they cover a skill required by FSD.
    """
    student = create_authenticated_student(first_name="Bob", last_name="Dev", target_career_id="C001")
    headers = student["headers"]

    # 1. Switch to Full Stack Developer (C012)
    sel_res = client.post("/api/career/select", json={"career_id": "C012"}, headers=headers)
    assert sel_res.status_code == 200
    data = sel_res.json()
    assert "Full Stack Developer" in data["message"]

    # Verify active career in /auth/me
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["target_career_id"] == "C012"
    assert "Full Stack Developer" in me_res.json()["target_career_name"]

    # 2. Fetch courses
    courses_res = client.get("/api/courses", headers=headers)
    assert courses_res.status_code == 200
    courses = courses_res.json()
    assert len(courses) == 55, f"Expected 55 courses for C012, got {len(courses)}"

    fsd_skill_ids = get_career_required_skill_ids("C012")
    course_ids = {c["course_id"] for c in courses}

    # 3. Verify every returned course covers at least one FSD skill
    for c in courses:
        c_skills = get_course_skill_ids(c["course_id"])
        intersection = c_skills.intersection(fsd_skill_ids)
        assert len(intersection) > 0, f"Course {c['course_id']} does not match any required skill for Full Stack Developer"
        assert c["career_id"] == "C012"

    # 4. Verify ML-specific courses (CR004 and CR005) are absent from Full Stack Developer list
    assert "CR004" not in course_ids, "CR004 (Deep Learning) must NOT appear in Full Stack Developer courses"
    assert "CR005" not in course_ids, "CR005 (Advanced Deep Learning) must NOT appear in Full Stack Developer courses"


def test_suite_c_cloud_data_engineer_and_filters():
    """
    Test C:
    1. Select Cloud Data Engineer (C023).
    2. Verify only relevant mapped courses appear (48 courses).
    3. Search within filtered results.
    4. Apply difficulty and priority filters.
    5. Test persistence across logout and login again.
    """
    student = create_authenticated_student(first_name="Charlie", last_name="Cloud", target_career_id="C001")
    headers = student["headers"]

    # 1. Switch to Cloud Data Engineer (C023)
    sel_res = client.post("/api/career/select", json={"career_id": "C023"}, headers=headers)
    assert sel_res.status_code == 200

    # 2. Fetch courses for C023
    courses_res = client.get("/api/courses", headers=headers)
    assert courses_res.status_code == 200
    courses = courses_res.json()
    assert len(courses) == 48, f"Expected 48 courses for C023, got {len(courses)}"

    cde_skill_ids = get_career_required_skill_ids("C023")
    for c in courses:
        c_skills = get_course_skill_ids(c["course_id"])
        assert len(c_skills.intersection(cde_skill_ids)) > 0

    # 3. Search within filtered results (e.g. search="SQL")
    search_res = client.get("/api/courses?search=SQL", headers=headers)
    assert search_res.status_code == 200
    search_courses = search_res.json()
    assert len(search_courses) > 0
    assert len(search_courses) < 48
    for sc in search_courses:
        # Must be in C023 scope
        sc_skills = get_course_skill_ids(sc["course_id"])
        assert len(sc_skills.intersection(cde_skill_ids)) > 0
        text = f"{sc['course_name']} {sc['description']} {sc['provider']} {' '.join(sc.get('matched_skills', []))}".lower()
        assert "sql" in text

    # 4. Apply difficulty filter (e.g. Intermediate)
    diff_res = client.get("/api/courses?difficulty=Intermediate", headers=headers)
    assert diff_res.status_code == 200
    diff_courses = diff_res.json()
    assert len(diff_courses) > 0
    for dc in diff_courses:
        assert dc["difficulty"].lower() == "intermediate"
        dc_skills = get_course_skill_ids(dc["course_id"])
        assert len(dc_skills.intersection(cde_skill_ids)) > 0

    # 5. Apply priority filter (high_priority)
    prio_res = client.get("/api/courses?priority=high_priority", headers=headers)
    assert prio_res.status_code == 200
    prio_courses = prio_res.json()
    for pc in prio_courses:
        assert pc["tag"] in ["Critical Gap", "High Priority Gap"] or (pc.get("match_percentage") or 0) >= 88

    # 6. Simulate Logout & Login again
    login_res = client.post("/api/auth/login", json={"email": student["email"], "password": student["password"]})
    assert login_res.status_code == 200
    new_token = login_res.json()["access_token"]
    new_headers = {"Authorization": f"Bearer {new_token}"}

    # Verify that target career is restored from database as C023
    me_res = client.get("/api/auth/me", headers=new_headers)
    assert me_res.status_code == 200
    assert me_res.json()["target_career_id"] == "C023"
    assert "Cloud Data Engineer" in me_res.json()["target_career_name"]

    # Verify courses returned after new login are still the 48 C023 courses
    post_login_courses = client.get("/api/courses", headers=new_headers).json()
    assert len(post_login_courses) == 48


def test_suite_d_unmapped_career_strict_empty_state():
    """
    Test D:
    1. Test a career with no mapped courses.
    2. Verify backend returns an empty list [].
    3. Verify that it NEVER returns all 160 courses as a fallback.
    """
    student = create_authenticated_student(first_name="Dana", last_name="Empty", target_career_id="C001")
    headers = student["headers"]

    # Create a temporary dummy career with no skills/courses mapped
    db = SessionLocal()
    dummy_cid = f"C_DUMMY_{uuid.uuid4().hex[:6]}"
    try:
        dummy_career = Career(
            career_id=dummy_cid,
            career_name="Quantum Bio-Astrophysicist",
            category="Theoretical",
            description="Theoretical domain with no courses currently mapped.",
            difficulty="Advanced",
            estimated_preparation_months=24,
            core_focus="Quantum Computing",
            typical_entry_level="PhD",
        )
        db.add(dummy_career)
        db.commit()

        # Switch student to this dummy career
        sel_res = client.post("/api/career/select", json={"career_id": dummy_cid}, headers=headers)
        assert sel_res.status_code == 200

        # Query courses for this active career
        courses_res = client.get("/api/courses", headers=headers)
        assert courses_res.status_code == 200
        courses = courses_res.json()

        # CRITICAL ASSERTION: MUST BE EMPTY! NEVER FALL BACK TO 160 COURSES!
        assert courses == [], f"Expected empty list for career with 0 courses, but got {len(courses)} courses!"
        assert courses_res.headers.get("X-Career-Course-Count") == "0"
        assert len(courses) != 160, "FATAL: Code fell back to entire course catalog!"

    finally:
        # Cleanup
        student_obj = db.query(Student).filter(Student.student_id == student["student_id"]).first()
        if student_obj:
            student_obj.target_career_id = "C001"
            db.commit()
        db.query(Career).filter(Career.career_id == dummy_cid).delete()
        db.commit()
        db.close()


def test_suite_e_student_isolation_and_progress_preservation():
    """
    Test E:
    1. Verify Student A's career change does NOT affect Student B's courses.
    2. Verify course progress is preserved across career changes.
    """
    student_a = create_authenticated_student(first_name="Student", last_name="A", target_career_id="C001")
    student_b = create_authenticated_student(first_name="Student", last_name="B", target_career_id="C012")

    # Student A records progress on course CR001
    prog_res = client.put(
        "/api/courses/CR001/progress",
        json={"progress_percentage": 65, "current_lesson_id": "CR001_L3"},
        headers=student_a["headers"]
    )
    assert prog_res.status_code == 200

    # Student A switches to Cloud Data Engineer (C023)
    client.post("/api/career/select", json={"career_id": "C023"}, headers=student_a["headers"])

    # Student B queries courses -> must remain Full Stack Developer (55 courses)
    res_b = client.get("/api/courses", headers=student_b["headers"])
    assert res_b.status_code == 200
    assert len(res_b.json()) == 55
    assert res_b.headers.get("X-Active-Career-Id") == "C012"

    # Student A switches back to C001
    client.post("/api/career/select", json={"career_id": "C001"}, headers=student_a["headers"])
    res_a = client.get("/api/courses", headers=student_a["headers"])
    assert res_a.status_code == 200
    assert len(res_a.json()) == 94

    # Verify Student A's progress on CR001 is preserved!
    cr001_item = next((c for c in res_a.json() if c["course_id"] == "CR001"), None)
    assert cr001_item is not None
    assert cr001_item["progress_percentage"] == 65
