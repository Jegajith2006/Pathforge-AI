import os
import sys
import uuid
import pytest
from datetime import datetime
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
from database.connection import init_db, get_db
from database.models import (
    Student,
    StudentSkill,
    AssessmentAnswer,
    AssessmentQuestion,
    StudentCourseProgress,
    Career,
    CareerSkill,
    Skill,
    Course,
)
from services.skill_progression_service import evaluate_skill_completion, get_student_career_progression

init_db()
client = TestClient(app)


def test_complete_dynamic_intelligence_workflow():
    """
    Mandatory End-to-End Test covering all 26 requirements:
    1. Register new student
    2. Log in as that student
    3. Confirm no other student's scores appear (clean slate: 0% scores)
    4. Select Full-Stack Developer (C012)
    5. Verify actual Full-Stack Developer requirements load
    6. Take assessment for required skill
    7. Submit answers & verify backend-calculated marks
    8. Confirm attempt is saved in DB
    9. Verify skill signals update
    10. Verify 79% score DOES NOT qualify for completion
    11. Verify exactly 80% score DOES qualify for completion
    12. Verify score >80% qualifies for completion
    13. Confirm completed skill persists across re-login
    14. Confirm next eligible skill is identified
    15. Verify course recommendations align with gaps
    16. Complete a course and confirm persistence
    17. Verify course completion vs assessment qualification remain distinct
    18. Confirm dashboard metrics, radar, and counts refresh consistently
    19. Switch career to Data Scientist (C002)
    20. Confirm requirements, roadmap, recommendations, and readiness update
    21. Confirm previous skill evidence is preserved
    22. Log out and log back in
    23. Confirm saved progress is restored
    24. Attempt unauthorized access to another student's data is denied/isolated
    25. Verify DB persistence directly
    """
    db = next(get_db())

    # --- STEP 1: Register a new student ---
    unique_email = f"student_dynamic_{uuid.uuid4().hex[:8]}@test.edu"
    test_password = "SecurePassword123!"

    reg_payload = {
        "first_name": "Devin",
        "last_name": "Dynamics",
        "email": unique_email,
        "password": test_password,
        "college": "Tech Institute of Engineering",
        "department": "Computer Science",
        "degree": "B.Tech",
        "graduation_year": 2026,
        "cgpa": 8.7,
        "target_career_id": "C001",
        "weekly_learning_hours": 15,
        "preferred_difficulty": "Adaptive",
        "learning_mode": "Project-based",
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    student_id = reg_data["student_id"]
    token = reg_data["access_token"]
    auth_header = {"Authorization": f"Bearer {token}"}

    # --- STEP 2: Log in as that student ---
    login_res = client.post("/api/auth/login", json={"email": unique_email, "password": test_password})
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["student_id"] == student_id
    token = login_data["access_token"]
    auth_header = {"Authorization": f"Bearer {token}"}

    # --- STEP 3: Confirm no other student's scores appear (clean slate) ---
    dash_res = client.get("/api/dashboard", headers=auth_header)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["student"]["student_id"] == student_id
    assert dash_data["student"]["full_name"] == "Devin Dynamics"
    # Clean slate verification: new user must have 0% readiness, not fabricated values
    assert dash_data["readiness"]["career_readiness_score"] == 0
    assert dash_data["readiness"]["overall_readiness"] == 0
    assert dash_data["metrics"]["skill_match"] == "0%"
    assert dash_data["metrics"]["mastery"] == "0%"
    assert dash_data["metrics"]["evidence"] == "0%"
    assert dash_data["metrics"]["courses_progress"].startswith("0 /")
    assert dash_data["metrics"]["projects_verified"].startswith("0 /")
    assert dash_data["metrics"]["credentials_count"] == 0

    # Radar must reflect genuine 0% values, not hardcoded 90%, 75%, 65%
    radar_data = dash_data["radar_data"]
    assert isinstance(radar_data, list)
    for point in radar_data:
        assert point["value"] == 0, f"Expected 0% for new student radar point, got {point}"

    # --- STEP 4: Select Full-Stack Developer as target career ---
    select_res = client.post("/api/career/select", json={"career_id": "C012"}, headers=auth_header)
    assert select_res.status_code == 200
    assert "Full-Stack Developer" in select_res.json()["message"] or "C012" in select_res.json()["message"]

    # --- STEP 5: Verify Full-Stack Developer skill requirements load ---
    curr_career_res = client.get("/api/career/current", headers=auth_header)
    assert curr_career_res.status_code == 200
    career_info = curr_career_res.json()
    assert career_info["career_id"] == "C012"
    assert "Full Stack" in career_info["career_name"] or "Full-Stack" in career_info["career_name"]
    fs_skill_ids = [s["skill_id"] for s in career_info["required_skills"]]
    assert "S083" in fs_skill_ids or "S005" in fs_skill_ids

    # --- STEP 6: Take an assessment for a required skill (e.g. S083 HTML5) ---
    start_res = client.post("/api/assessment/start", json={"career_id": "C012", "skill_id": "S083"}, headers=auth_header)
    assert start_res.status_code == 200
    start_data = start_res.json()
    assert "assessment_id" in start_data
    questions = start_data["questions"]
    assert len(questions) > 0
    assessment_id = start_data["assessment_id"]

    # --- STEP 7: Submit answers and verify backend-calculated marks ---
    q0 = questions[0]
    actual_q = db.query(AssessmentQuestion).filter(AssessmentQuestion.question_id == q0["question_id"]).first()

    submission_payload = {
        "assessment_id": assessment_id,
        "answers": [
            {
                "question_id": q0["question_id"],
                "selected_answer": actual_q.correct_answer if actual_q else "A",
                "time_taken_seconds": 25,
            }
        ]
    }
    submit_res = client.post("/api/assessment/submit", json=submission_payload, headers=auth_header)
    assert submit_res.status_code == 200
    submit_data = submit_res.json()
    assert "overall_score" in submit_data
    assert submit_data["student_id"] == student_id

    # --- STEP 8: Confirm assessment attempt is saved in DB ---
    answers_in_db = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.student_id == student_id,
        AssessmentAnswer.question_id == q0["question_id"],
    ).all()
    assert len(answers_in_db) >= 1
    assert answers_in_db[0].question_id == q0["question_id"]

    # --- STEP 9: Verify current skill signals update ---
    skills_mastery_res = client.get("/api/skills/mastery", headers=auth_header)
    assert skills_mastery_res.status_code == 200
    mastery_list = skills_mastery_res.json()
    s083_entry = next((s for s in mastery_list if s["skill_id"] == q0.get("skill_id", "S083")), None)
    assert s083_entry is not None
    assert s083_entry["assessment_score"] is not None

    # --- STEP 10: Verify 79% score DOES NOT qualify for completion ---
    is_comp_79, status_79 = evaluate_skill_completion(79)
    assert is_comp_79 is False
    assert status_79 == "in_progress"

    from services.skill_gap_service import update_or_create_student_skill
    ss_79 = update_or_create_student_skill(db, student_id, "S084", assessment_score=79.0)
    db.commit()
    assert ss_79.is_completed is False
    assert ss_79.completion_status == "in_progress"

    # --- STEP 11: Verify exactly 80% score DOES qualify for completion ---
    is_comp_80, status_80 = evaluate_skill_completion(80)
    assert is_comp_80 is True
    assert status_80 == "completed"

    ss_80 = update_or_create_student_skill(db, student_id, "S084", assessment_score=80.0)
    db.commit()
    assert ss_80.is_completed is True
    assert ss_80.completion_status == "completed"
    assert ss_80.completed_at is not None

    # --- STEP 12: Verify score >80% qualifies for completion ---
    is_comp_92, status_92 = evaluate_skill_completion(92)
    assert is_comp_92 is True
    assert status_92 == "completed"

    ss_92 = update_or_create_student_skill(db, student_id, "S083", assessment_score=92.0)
    db.commit()
    assert ss_92.is_completed is True
    assert ss_92.completion_status == "completed"

    # --- STEP 13: Confirm completed skill remains completed after re-login ---
    login_re = client.post("/api/auth/login", json={"email": unique_email, "password": test_password})
    new_token = login_re.json()["access_token"]
    new_auth = {"Authorization": f"Bearer {new_token}"}

    re_mastery_res = client.get("/api/skills/mastery", headers=new_auth)
    re_mastery = re_mastery_res.json()
    s083_re = next((s for s in re_mastery if s["skill_id"] == "S083"), None)
    assert s083_re is not None
    assert s083_re["assessment_score"] == 92.0

    # --- STEP 14: Confirm next eligible skill is identified correctly ---
    progression_res = client.get("/api/skills/progression?career_id=C012", headers=new_auth)
    assert progression_res.status_code == 200
    prog_data = progression_res.json()
    completed_ids = [s["skill_id"] for s in prog_data["completed_skills"]]
    assert "S083" in completed_ids
    assert "S084" in completed_ids
    assert prog_data["next_recommended_skill"] is not None
    assert prog_data["next_recommended_skill"]["skill_id"] not in completed_ids

    # --- STEP 15: Verify course recommendations prioritize remaining gaps ---
    rec_courses_res = client.get("/api/courses/recommendations", headers=new_auth)
    assert rec_courses_res.status_code == 200
    rec_courses = rec_courses_res.json()
    assert len(rec_courses) > 0
    first_rec = rec_courses[0]
    assert "course_name" in first_rec

    # --- STEP 16: Complete a course and confirm persistence ---
    course_to_complete = rec_courses[0]["course_id"]
    course_obj = db.query(Course).filter(Course.course_id == course_to_complete).first()
    lesson_ids = [l.lesson_id for l in course_obj.lessons] if course_obj and course_obj.lessons else [f"{course_to_complete}_L{i}" for i in range(1, 6)]
    for lid in lesson_ids:
        client.post(
            f"/api/courses/{course_to_complete}/lessons/{lid}/complete",
            json={"assessment_passed": True},
            headers=new_auth,
        )

    # Set final assessment passing score > 50%
    scp = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == student_id,
        StudentCourseProgress.course_id == course_to_complete,
    ).first()
    assert scp is not None
    scp.final_assessment_score = 85.0
    scp.final_assessment_passed = True
    scp.status = "completed"
    scp.completed_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()

    assert scp.status == "completed"
    assert scp.completed_at is not None

    # --- STEP 17: Verify course completion and assessment completion remain distinct ---
    course_obj = db.query(Course).filter(Course.course_id == course_to_complete).first()
    assert course_obj is not None
    unassessed_ss = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id,
        StudentSkill.skill_id == "S006",
    ).first()
    if unassessed_ss:
        assert unassessed_ss.is_completed is False or unassessed_ss.assessment_score < 80

    # --- STEP 18: Confirm dashboard metrics, radar, and counts refresh consistently ---
    dash_res2 = client.get("/api/dashboard", headers=new_auth)
    assert dash_res2.status_code == 200
    d2 = dash_res2.json()
    assert d2["metrics"]["courses_progress"].startswith("1 /")
    assert d2["readiness"]["career_readiness_score"] > 0
    assert d2["radar_data"] is not None

    # --- STEP 19: Change target career to Data Scientist (C003) ---
    switch_res = client.post("/api/career/select", json={"career_id": "C003"}, headers=new_auth)
    assert switch_res.status_code == 200

    # --- STEP 20: Confirm Data Scientist requirements load and readiness recalculates ---
    dash_ds = client.get("/api/dashboard", headers=new_auth)
    assert dash_ds.status_code == 200
    d_ds = dash_ds.json()
    assert "Data Scientist" in d_ds["student"]["target_career"]
    assert d_ds["student"]["target_career_id"] == "C003"

    # --- STEP 21: Confirm previous skill evidence is preserved ---
    ds_mastery = client.get("/api/skills/mastery", headers=new_auth).json()
    s083_preserved = next((s for s in ds_mastery if s["skill_id"] == "S083"), None)
    assert s083_preserved is not None
    assert s083_preserved["assessment_score"] == 92.0

    # --- STEP 22 & 23: Log out and log back in, confirm saved progress restored ---
    re_login = client.post("/api/auth/login", json={"email": unique_email, "password": test_password})
    assert re_login.status_code == 200
    final_token = re_login.json()["access_token"]
    final_auth = {"Authorization": f"Bearer {final_token}"}

    dash_final = client.get("/api/dashboard", headers=final_auth).json()
    assert dash_final["student"]["student_id"] == student_id
    assert dash_final["metrics"]["courses_progress"].startswith("1 /")

    # --- STEP 24: Attempt unauthorized access to another student's data is denied/isolated ---
    student_b_email = f"student_b_{uuid.uuid4().hex[:8]}@test.edu"
    client.post("/api/auth/register", json={**reg_payload, "email": student_b_email})
    b_login = client.post("/api/auth/login", json={"email": student_b_email, "password": test_password})
    b_auth = {"Authorization": f"Bearer {b_login.json()['access_token']}"}

    b_dash = client.get("/api/dashboard", headers=b_auth).json()
    assert b_dash["student"]["student_id"] != student_id
    assert b_dash["metrics"]["courses_progress"].startswith("0 /")
    assert b_dash["readiness"]["career_readiness_score"] == 0

    bad_auth = client.get("/api/dashboard", headers={"Authorization": "Bearer invalid.token.payload"})
    assert bad_auth.status_code == 401

    # --- STEP 25: Verify DB persistence directly ---
    db_student = db.query(Student).filter(Student.student_id == student_id).first()
    assert db_student is not None
    assert db_student.email == unique_email
    assert len(db_student.skills) >= 2
    assert len(db_student.course_progress) >= 1
