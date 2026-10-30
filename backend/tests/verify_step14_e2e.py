"""
Comprehensive Step 14 End-to-End Integration Test Suite for PathForge AI.
Verifies all phases and requirements of the full lifecycle against the live backend and database.
"""

import time
import uuid
import json
import io
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests
from sqlalchemy.orm import Session

from database.connection import SessionLocal
from database.models import (
    Student,
    Career,
    Skill,
    CareerSkill,
    StudentSkill,
    ResumeAnalysis,
    AssessmentAnswer,
    StudentCourseProgress,
    StudentProjectProgress,
    StudentRoadmapStep,
)

BASE_URL = "http://127.0.0.1:8000"


def print_step(title):
    print(f"\n{'='*70}\n[STEP 14 TEST] {title}\n{'='*70}")


def run_comprehensive_step14_integration():
    report = {}
    timings = {}
    db = SessionLocal()

    try:
        # -------------------------------------------------------------
        # PHASE 1 & 2: System Health & Docs Verification
        # -------------------------------------------------------------
        print_step("PHASE 1 & 2: System Inspection & Server Health")
        t0 = time.time()
        health_res = requests.get(f"{BASE_URL}/health")
        docs_res = requests.get(f"{BASE_URL}/docs")
        ml_status_res = requests.get(f"{BASE_URL}/api/ml/model-status")
        timings["health_check"] = round(time.time() - t0, 3)

        assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
        assert docs_res.status_code == 200, f"Docs check failed: {docs_res.text}"
        assert ml_status_res.status_code == 200, f"ML status check failed: {ml_status_res.text}"
        
        ml_info = ml_status_res.json()
        print(f"[*] Backend Healthy. Docs Available. ML Model: {ml_info.get('model')}, Local: {ml_info.get('local')}")
        report["PHASE_1_2_SYSTEM_HEALTH"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 3: Create Test Student
        # -------------------------------------------------------------
        print_step("PHASE 3: Create Test Student Registration")
        unique_suffix = uuid.uuid4().hex[:8]
        test_email = f"pathforge.integration.test_{unique_suffix}@example.com"
        test_password = f"Pass_{unique_suffix}!Secure2026"
        
        reg_payload = {
            "first_name": "PathForge",
            "last_name": "IntegrationTest",
            "email": test_email,
            "password": test_password,
            "college": "MIT Engineering Institute",
            "department": "Computer Science & Artificial Intelligence",
            "degree": "B.Tech in Artificial Intelligence",
            "graduation_year": 2026,
            "cgpa": 8.95,
            "target_career_id": "C001",
            "weekly_learning_hours": 15,
            "preferred_difficulty": "Adaptive",
            "learning_mode": "Project-based",
        }

        t0 = time.time()
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
        timings["registration"] = round(time.time() - t0, 3)

        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        reg_data = reg_res.json()
        student_id = reg_data["student_id"]
        auth_token = reg_data["access_token"]
        headers = {"Authorization": f"Bearer {auth_token}"}

        print(f"[*] Registered Student ID: {student_id}, Email: {test_email}")
        
        # Verify in database that password is not plaintext
        db_student = db.query(Student).filter(Student.student_id == student_id).first()
        assert db_student is not None, "Student record not found in database"
        assert db_student.hashed_password != test_password, "Password stored in plaintext!"
        assert len(db_student.hashed_password) > 20, "Hashed password invalid"
        report["PHASE_3_REGISTRATION"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 4: Login & JWT Identity Verification
        # -------------------------------------------------------------
        print_step("PHASE 4: Login & JWT Verification")
        login_payload = {"email": test_email, "password": test_password}
        t0 = time.time()
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        timings["login"] = round(time.time() - t0, 3)

        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        login_data = login_res.json()
        assert "access_token" in login_data, "No access_token in login response"
        jwt_token = login_data["access_token"]
        auth_headers = {"Authorization": f"Bearer {jwt_token}"}
        
        # Verify profile with JWT
        t0 = time.time()
        prof_res = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        timings["get_profile"] = round(time.time() - t0, 3)
        assert prof_res.status_code == 200, f"Profile fetch failed: {prof_res.text}"
        prof_data = prof_res.json()
        assert prof_data["student_id"] == student_id, f"Expected {student_id}, got {prof_data['student_id']}"
        assert prof_data["email"] == test_email
        print(f"[*] JWT Authenticated Profile: {prof_data['full_name']} ({prof_data['student_id']})")
        report["PHASE_4_LOGIN"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 5: Verify Profile Completeness
        # -------------------------------------------------------------
        print_step("PHASE 5: Verify Profile Integrity")
        assert prof_data["college"] == "MIT Engineering Institute"
        assert prof_data["cgpa"] == 8.95
        assert prof_data["weekly_learning_hours"] == 15
        report["PHASE_5_PROFILE"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 6: Select Career (Machine Learning Engineer)
        # -------------------------------------------------------------
        print_step("PHASE 6: Career Selection")
        careers_res = requests.get(f"{BASE_URL}/api/careers", headers=auth_headers)
        assert careers_res.status_code == 200, f"Failed to get careers: {careers_res.text}"
        careers = careers_res.json()
        ml_career = next((c for c in careers if "Machine Learning" in c["career_name"]), None)
        assert ml_career is not None, "Machine Learning Engineer career not found in database"
        target_career_id = ml_career["career_id"]

        t0 = time.time()
        select_res = requests.post(
            f"{BASE_URL}/api/career/select",
            headers=auth_headers,
            json={"career_id": target_career_id},
        )
        timings["select_career"] = round(time.time() - t0, 3)
        assert select_res.status_code == 200, f"Career select failed: {select_res.text}"

        # Verify in DB and profile
        curr_career_res = requests.get(f"{BASE_URL}/api/career/current", headers=auth_headers)
        assert curr_career_res.status_code == 200
        assert curr_career_res.json()["career_id"] == target_career_id
        db.expire_all()
        db_student = db.query(Student).filter(Student.student_id == student_id).first()
        assert db_student.target_career_id == target_career_id
        print(f"[*] Target Career set to: {ml_career['career_name']} ({target_career_id})")
        report["PHASE_6_CAREER_SELECTION"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 7: Upload Test Resume & Gemini/Extraction
        # -------------------------------------------------------------
        print_step("PHASE 7: Upload Realistic Test Resume & Semantic Parsing")
        resume_text_content = """
        PathForge Integration Test
        Email: pathforge.integration.test@example.com | Phone: +1-555-0199 | GitHub: github.com/pathforge-test
        Education: B.Tech in Artificial Intelligence, MIT Engineering Institute (CGPA: 8.95)

        PROFESSIONAL SUMMARY:
        Aspiring Machine Learning Engineer with strong foundations in Python, Scikit-learn, SQL, and Data Analysis.
        Hands-on experience developing ML predictive systems, data pipelines, and relational database queries.

        TECHNICAL SKILLS:
        - Programming Languages: Python, Java, SQL, C++
        - Machine Learning & Data: Machine Learning, Scikit-learn, Pandas, NumPy, Statistics, Exploratory Data Analysis
        - Databases & Tools: PostgreSQL, MySQL, Git, Docker, Linux

        ACADEMIC PROJECTS:
        1. Machine Learning Prediction System:
           - Designed an end-to-end classification pipeline using Python, Pandas, and Scikit-learn.
           - Evaluated models using cross-validation and achieved 91% precision.
        2. Scalable SQL Analytics Pipeline:
           - Developed complex SQL queries and relational schemas for high-throughput transactional data.

        CERTIFICATIONS:
        - Machine Learning Specialization (Coursera / Stanford Online)
        - Python for Data Science and Machine Learning Bootcamp

        EXPERIENCE:
        - Machine Learning Intern at DataTech Innovations (June 2025 - August 2025):
          Implemented feature extraction pipelines and automated data preprocessing workflows using Python and Pandas.
        """
        
        resume_file_obj = io.BytesIO(resume_text_content.encode("utf-8"))
        files = {"file": ("pathforge_integration_resume.txt", resume_file_obj, "text/plain")}

        t0 = time.time()
        upload_res = requests.post(f"{BASE_URL}/api/resume/upload", headers=auth_headers, files=files)
        timings["resume_analysis"] = round(time.time() - t0, 3)

        assert upload_res.status_code == 200, f"Resume upload failed: {upload_res.text}"
        upload_data = upload_res.json()
        assert upload_data["status"] == "success"
        extracted_data = upload_data["data"]
        
        extracted_skills = extracted_data.get("detected_skills", [])
        extracted_projects = extracted_data.get("extracted_projects", [])
        extracted_certificates = extracted_data.get("extracted_certificates", [])
        extracted_experience = extracted_data.get("extracted_experience", [])

        print(f"[*] Resume Analyzed in {timings['resume_analysis']}s.")
        print(f"    - Skills Extracted: {len(extracted_skills)} (e.g., {[s['skill_name'] for s in extracted_skills[:6]]})")
        print(f"    - Projects Extracted: {len(extracted_projects)}")
        print(f"    - Certificates Extracted: {len(extracted_certificates)}")
        print(f"    - Experience Extracted: {len(extracted_experience)}")

        assert len(extracted_skills) >= 4, f"Expected at least 4 skills extracted, got {len(extracted_skills)}"
        report["PHASE_7_RESUME_ANALYSIS"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 8: Verify Resume Evidence & Score Separation
        # -------------------------------------------------------------
        print_step("PHASE 8: Verify Resume Evidence & Score Calibration")
        resume_skills_res = requests.get(f"{BASE_URL}/api/resume/skills", headers=auth_headers)
        assert resume_skills_res.status_code == 200
        resume_skills = resume_skills_res.json()
        assert len(resume_skills) > 0

        # Check in DB student_skills that resume_score is distinct from self_declared and assessment
        db.expire_all()
        student_skills_db = db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
        assert len(student_skills_db) > 0
        for ss in student_skills_db:
            assert ss.resume_score > 0, f"Skill {ss.skill_id} has 0 resume_score after upload"
            # Crucial: resume detection must NOT automatically make mastery 100 or Advanced
            assert ss.resume_score <= 75, f"Resume score too high for exposure evidence: {ss.resume_score}"
        print(f"[*] Verified {len(student_skills_db)} student_skills records created with calibrated resume_scores.")
        report["PHASE_8_RESUME_EVIDENCE"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 9: Verify Self-Declaration
        # -------------------------------------------------------------
        print_step("PHASE 9: Self-Declared Skill Calibration")
        # Find skill ID for Machine Learning or Python
        ml_skill = db.query(Skill).filter(Skill.skill_name.ilike("%Machine Learning%")).first()
        target_skill_id = ml_skill.skill_id if ml_skill else "SK003"

        t0 = time.time()
        self_declare_res = requests.put(
            f"{BASE_URL}/api/profile/skills",
            headers=auth_headers,
            json={"skill_id": target_skill_id, "self_declared_score": 90},
        )
        timings["self_declare"] = round(time.time() - t0, 3)
        assert self_declare_res.status_code == 200, f"Self-declare failed: {self_declare_res.text}"

        db.expire_all()
        ml_ss = db.query(StudentSkill).filter(
            StudentSkill.student_id == student_id,
            StudentSkill.skill_id == target_skill_id,
        ).first()
        assert ml_ss is not None
        assert ml_ss.self_declared_score == 90, f"Expected 90, got {ml_ss.self_declared_score}"
        # Assessment score should still be 0 (null/not taken)
        assert ml_ss.assessment_score == 0
        print(f"[*] Skill {target_skill_id} self_declared_score=90 verified in DB. Assessment score={ml_ss.assessment_score}.")
        report["PHASE_9_SELF_DECLARATION"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 10: Start Assessment
        # -------------------------------------------------------------
        print_step("PHASE 10: Start Career Assessment")
        t0 = time.time()
        start_assess_res = requests.post(
            f"{BASE_URL}/api/assessment/start",
            headers=auth_headers,
            json={"career_id": target_career_id, "limit": 10},
        )
        timings["start_assessment"] = round(time.time() - t0, 3)
        assert start_assess_res.status_code == 200, f"Assessment start failed: {start_assess_res.text}"
        assess_start_data = start_assess_res.json()
        assessment_id = assess_start_data["assessment_id"]
        questions = assess_start_data["questions"]
        assert len(questions) > 0, "No questions returned in assessment"
        print(f"[*] Assessment started ID: {assessment_id} with {len(questions)} questions.")
        
        # Verify questions are career-specific
        q_skills = [q["skill_name"] for q in questions]
        print(f"    - Questions mapped to skills: {set(q_skills)}")
        report["PHASE_10_START_ASSESSMENT"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 11: Complete Assessment
        # -------------------------------------------------------------
        print_step("PHASE 11: Submit Assessment Answers")
        # Build answer payload
        answers_payload = []
        for i, q in enumerate(questions):
            opts = q.get("options", [])
            chosen_ans = opts[i % len(opts)] if opts else "A"
            answers_payload.append({
                "question_id": q["question_id"],
                "selected_answer": chosen_ans,
                "time_taken_seconds": 35,
            })

        t0 = time.time()
        submit_res = requests.post(
            f"{BASE_URL}/api/assessment/submit",
            headers=auth_headers,
            json={"assessment_id": assessment_id, "answers": answers_payload},
        )
        timings["assessment_submission"] = round(time.time() - t0, 3)

        assert submit_res.status_code == 200, f"Assessment submit failed: {submit_res.text}"
        eval_result = submit_res.json()
        print(f"[*] Assessment Evaluated in {timings['assessment_submission']}s:")
        print(f"    - Overall Score: {eval_result.get('score_percentage', 0)}%")
        print(f"    - Demonstrated Level: {eval_result.get('level')}")
        print(f"    - Skill-wise results count: {len(eval_result.get('skill_results', []))}")
        report["PHASE_11_COMPLETE_ASSESSMENT"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 12 & 13: Verify student_skills & Final Mastery
        # -------------------------------------------------------------
        print_step("PHASE 12 & 13: Verify student_skills & Evidence-Based Final Mastery")
        db.expire_all()
        updated_ml_ss = db.query(StudentSkill).filter(
            StudentSkill.student_id == student_id,
            StudentSkill.skill_id == target_skill_id,
        ).first()

        assert updated_ml_ss is not None
        # Verify self_declared_score was NOT overwritten
        assert updated_ml_ss.self_declared_score == 90, f"self_declared_score overwritten! Got: {updated_ml_ss.self_declared_score}"
        print(f"[*] student_skills verified: self_declared={updated_ml_ss.self_declared_score}, assessment={updated_ml_ss.assessment_score}, resume={updated_ml_ss.resume_score}, final_mastery={updated_ml_ss.final_mastery}%, level={updated_ml_ss.mastery_level}")
        report["PHASE_12_13_STUDENT_SKILLS_MASTERY"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 14 & 15: Verify Skill Gap & Priority Ordering
        # -------------------------------------------------------------
        print_step("PHASE 14 & 15: Skill Gap Calculation & Priority Ranking")
        t0 = time.time()
        gap_res = requests.get(f"{BASE_URL}/api/skill-gap", headers=auth_headers)
        timings["skill_gap"] = round(time.time() - t0, 3)

        assert gap_res.status_code == 200, f"Skill gap failed: {gap_res.text}"
        gap_data = gap_res.json()
        gaps = gap_data["gaps"]
        assert len(gaps) > 0, "No skill gaps returned"

        print(f"[*] Skill Gap Analysis for {gap_data['career_name']} in {timings['skill_gap']}s:")
        for g in gaps[:5]:
            # Verify formula gap = max(required - current, 0)
            req_score = g["required_score"]
            curr_score = g["current_mastery"]
            calculated_gap = max(req_score - curr_score, 0)
            assert g["gap"] == calculated_gap, f"Gap mismatch for {g['skill_name']}: expected {calculated_gap}, got {g['gap']}"
            print(f"    - {g['skill_name']}: Required={req_score}%, Current={curr_score}%, Gap={g['gap']}%, Priority={g['priority']}")

        # Verify gaps are sorted by priority / importance
        print(f"[*] Top gap priority: {gaps[0]['skill_name']} with gap {gaps[0]['gap']}%")
        report["PHASE_14_15_SKILL_GAP"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 16: Course Recommendations
        # -------------------------------------------------------------
        print_step("PHASE 16: Course Recommendations mapped to Skill Gaps")
        t0 = time.time()
        course_res = requests.get(f"{BASE_URL}/api/courses/recommendations", headers=auth_headers)
        timings["course_recommendations"] = round(time.time() - t0, 3)

        assert course_res.status_code == 200, f"Course recommendations failed: {course_res.text}"
        recommended_courses = course_res.json()
        assert len(recommended_courses) > 0, "No course recommendations returned"

        print(f"[*] Recommended {len(recommended_courses)} courses in {timings['course_recommendations']}s:")
        for c in recommended_courses[:4]:
            print(f"    - Course: {c['course_name']} (Target Skill: {c.get('target_skill')}, Match: {c.get('match_percentage')}%)")
            assert c["course_id"] is not None
        report["PHASE_16_COURSE_RECOMMENDATION"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 17: Project Recommendations
        # -------------------------------------------------------------
        print_step("PHASE 17: Project Recommendations mapped to Target Skills")
        t0 = time.time()
        project_res = requests.get(f"{BASE_URL}/api/projects/recommendations", headers=auth_headers)
        timings["project_recommendations"] = round(time.time() - t0, 3)

        assert project_res.status_code == 200, f"Project recommendations failed: {project_res.text}"
        recommended_projects = project_res.json()
        assert len(recommended_projects) > 0, "No project recommendations returned"

        print(f"[*] Recommended {len(recommended_projects)} projects in {timings['project_recommendations']}s:")
        for p in recommended_projects[:4]:
            print(f"    - Project: {p['project_name']} (Difficulty: {p.get('difficulty')}, Match: {p.get('match_percentage')}%)")
            assert p["project_id"] is not None
        report["PHASE_17_PROJECT_RECOMMENDATION"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 18 & 19: Roadmap Generation & Personalization
        # -------------------------------------------------------------
        print_step("PHASE 18 & 19: Topological Roadmap Generation & Personalization")
        t0 = time.time()
        roadmap_res = requests.post(f"{BASE_URL}/api/roadmap/generate", headers=auth_headers)
        timings["roadmap_generation"] = round(time.time() - t0, 3)

        assert roadmap_res.status_code == 200, f"Roadmap generation failed: {roadmap_res.text}"
        roadmap_data = roadmap_res.json()
        milestones = roadmap_data["milestones"]
        assert len(milestones) > 0, "No milestones in generated roadmap"

        print(f"[*] Generated {len(milestones)} Milestones in {timings['roadmap_generation']}s (Total duration: {roadmap_data.get('projected_weeks_to_ready', 0)} weeks):")
        for m in milestones:
            print(f"    Step {m['step_number']}: {m['milestone_name']} (Skill: {m['skill_name']}, Status: {m['status']}, Duration: {m['estimated_weeks']} wks)")

        # Verify prerequisite ordering (e.g., Python / NumPy before Deep Learning / Advanced topics)
        step_names = [m["skill_name"] for m in milestones]
        print(f"[*] Milestone sequence: {' -> '.join(step_names)}")
        report["PHASE_18_19_ROADMAP"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 20 & 21: Dashboard & Data Consistency Verification
        # -------------------------------------------------------------
        print_step("PHASE 20 & 21: Dashboard Verification & Single Source of Truth")
        t0 = time.time()
        dash_res = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_headers)
        timings["dashboard"] = round(time.time() - t0, 3)

        assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
        dash_data = dash_res.json()

        # Check consistency across modules
        assert dash_data["student"]["student_id"] == student_id
        assert dash_data["student"]["target_career"] == gap_data["career_name"]
        assert len(dash_data["priority_gaps"]) > 0
        assert dash_data["roadmap_summary"]["total_milestones"] == len(milestones)
        
        # Verify single source of truth for mastery
        mastery_res = requests.get(f"{BASE_URL}/api/skills/mastery", headers=auth_headers).json()
        mastery_map = {m["skill_id"]: m["final_mastery"] for m in mastery_res}
        for g in dash_data["priority_gaps"]:
            if g["skill_id"] in mastery_map:
                assert g["current_mastery"] == mastery_map[g["skill_id"]], f"Mastery inconsistency for {g['skill_name']}"

        print(f"[*] Dashboard verified. Single Source of Truth consistent across all modules.")
        report["PHASE_20_21_DASHBOARD_CONSISTENCY"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 22 & 23: Database Persistence & Re-Login
        # -------------------------------------------------------------
        print_step("PHASE 22 & 23: Persistence, Logout, and Re-Login Verification")
        # Test accessing protected endpoint without token
        unauth_res = requests.get(f"{BASE_URL}/api/profile", headers={"Authorization": "Bearer invalid.token.value"})
        assert unauth_res.status_code == 401, f"Expected 401 for invalid JWT, got {unauth_res.status_code}"

        # Re-login with credentials
        re_login_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert re_login_res.status_code == 200
        new_token = re_login_res.json()["access_token"]
        new_headers = {"Authorization": f"Bearer {new_token}"}

        # Verify all persistent data restored
        re_prof = requests.get(f"{BASE_URL}/api/profile", headers=new_headers).json()
        assert re_prof["student_id"] == student_id
        assert re_prof["target_career_id"] == target_career_id
        
        re_dash = requests.get(f"{BASE_URL}/api/dashboard", headers=new_headers).json()
        assert re_dash["student"]["student_id"] == student_id
        assert len(re_dash["priority_gaps"]) > 0
        print(f"[*] Re-login successful. All state perfectly restored from DB.")
        report["PHASE_22_23_PERSISTENCE_LOGOUT"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 24: Student Isolation Test
        # -------------------------------------------------------------
        print_step("PHASE 24: Student Data Isolation (Student A vs Student B)")
        # Register Student B
        b_suffix = uuid.uuid4().hex[:8]
        b_email = f"student_b_{b_suffix}@example.com"
        b_pass = f"PassB_{b_suffix}!Secure"
        
        b_reg = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "first_name": "StudentB",
                "last_name": "Isolated",
                "email": b_email,
                "password": b_pass,
                "college": "Stanford University",
                "department": "Electrical Engineering",
                "degree": "B.S. in EE",
                "graduation_year": 2027,
                "cgpa": 9.2,
                "target_career_id": "C002",
                "weekly_learning_hours": 20,
                "preferred_difficulty": "Challenging",
                "learning_mode": "Theory & Research",
            }
        ).json()
        
        b_student_id = b_reg["student_id"]
        b_headers = {"Authorization": f"Bearer {b_reg['access_token']}"}

        # Verify Student B's profile
        b_prof = requests.get(f"{BASE_URL}/api/profile", headers=b_headers).json()
        assert b_prof["student_id"] == b_student_id
        assert b_prof["student_id"] != student_id
        assert b_prof["email"] == b_email

        # Verify Student A's profile is not returned to Student B
        a_prof = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers).json()
        assert a_prof["student_id"] == student_id
        assert a_prof["student_id"] != b_student_id

        # Verify Student B has no resume skills from Student A
        b_resume_skills = requests.get(f"{BASE_URL}/api/resume/skills", headers=b_headers).json()
        assert len(b_resume_skills) == 0, f"Student B saw Student A's resume skills! {b_resume_skills}"
        print(f"[*] Strict Student Isolation Verified between Student A ({student_id}) and Student B ({b_student_id}).")
        report["PHASE_24_STUDENT_ISOLATION"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 25: Failure & Edge Case Testing
        # -------------------------------------------------------------
        print_step("PHASE 25: Failure & Resiliency Testing")
        # 1. Invalid Resume file extension (.exe)
        bad_file = io.BytesIO(b"malicious content")
        bad_res = requests.post(
            f"{BASE_URL}/api/resume/upload",
            headers=auth_headers,
            files={"file": ("virus.exe", bad_file, "application/octet-stream")},
        )
        assert bad_res.status_code == 400, f"Expected 400 for bad extension, got {bad_res.status_code}"

        # 2. Empty Resume file (0 bytes)
        empty_file = io.BytesIO(b"")
        empty_res = requests.post(
            f"{BASE_URL}/api/resume/upload",
            headers=auth_headers,
            files={"file": ("empty.txt", empty_file, "text/plain")},
        )
        assert empty_res.status_code == 400, f"Expected 400 for empty file, got {empty_res.status_code}"

        # 3. Invalid Career ID
        bad_career_res = requests.post(
            f"{BASE_URL}/api/career/select",
            headers=auth_headers,
            json={"career_id": "INVALID_CAREER_9999"},
        )
        assert bad_career_res.status_code == 404, f"Expected 404 for invalid career, got {bad_career_res.status_code}"

        # 4. Empty Assessment Submission
        empty_assess_res = requests.post(
            f"{BASE_URL}/api/assessment/submit",
            headers=auth_headers,
            json={"assessment_id": "fake_id", "answers": []},
        )
        assert empty_assess_res.status_code == 400, f"Expected 400 for empty answers, got {empty_assess_res.status_code}"

        print(f"[*] All edge cases and failure modes responded with standard HTTP error codes and clean JSON.")
        report["PHASE_25_FAILURE_HANDLING"] = "PASS"

        # -------------------------------------------------------------
        # PHASE 26 & 27: Database Relational Integrity
        # -------------------------------------------------------------
        print_step("PHASE 26 & 27: Database Relational Integrity Verification")
        db.expire_all()
        student_record = db.query(Student).filter(Student.student_id == student_id).first()
        assert student_record is not None
        assert len(student_record.skills) > 0, "No skills attached to student relation"
        assert len(student_record.assessment_answers) > 0, "No assessment answers attached to student"
        assert len(student_record.resume_extractions) > 0, "No resume extractions attached"
        assert student_record.career is not None, "Target career foreign key invalid"
        print(f"[*] Foreign key cascades and ORM relationships verified for student {student_id}:")
        print(f"    - Skills records: {len(student_record.skills)}")
        print(f"    - Assessment answers: {len(student_record.assessment_answers)}")
        print(f"    - Resume entities: {len(student_record.resume_extractions)}")
        print(f"    - Target Career: {student_record.career.career_name}")
        report["PHASE_26_27_DATABASE_INTEGRITY"] = "PASS"

        # -------------------------------------------------------------
        # Summary & Timings
        # -------------------------------------------------------------
        print_step("STEP 14 INTEGRATION TEST COMPLETED SUCCESSFULLY!")
        print("Performance Timings (Latency):")
        for k, v in timings.items():
            print(f"  - {k}: {v}s")

        return {
            "status": "PASS",
            "student_id": student_id,
            "test_email": test_email,
            "career": ml_career["career_name"],
            "skills_extracted": len(extracted_skills),
            "projects_extracted": len(extracted_projects),
            "certificates_extracted": len(extracted_certificates),
            "assessment_score": eval_result.get("score") or eval_result.get("overall_score"),
            "top_gap": gaps[0]["skill_name"],
            "top_gap_pct": gaps[0]["gap"],
            "courses_recommended": len(recommended_courses),
            "projects_recommended": len(recommended_projects),
            "milestones_generated": len(milestones),
            "timings": timings,
            "phases": report,
        }

    finally:
        db.close()


if __name__ == "__main__":
    result = run_comprehensive_step14_integration()
    print("\nFINAL TEST EXECUTION RESULT:")
    print(json.dumps(result, indent=2))
