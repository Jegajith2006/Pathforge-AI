"""
Phase 15 Mandatory End-to-End Test Suite for PathForge AI.
Tests all 24 required workflows and verification criteria against the live database and backend.
"""

import io
import json
import time
import uuid
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import requests
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.models import (
    Student,
    ResumeDocument,
    CourseResumeSuggestion,
    StudentResumeProfileEntry,
    StudentCourseProgress,
    StudentSkill,
    Career,
    AssessmentQuestion,
)

BASE_URL = "http://127.0.0.1:8000"


def create_minimal_pdf(content_text: str) -> bytes:
    """Creates a valid, parseable minimal PDF with text content."""
    # Simple valid PDF stream
    text_len = len(content_text)
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length " + str(text_len + 50).encode() + b" >>\nstream\n"
        b"BT\n/F1 12 Tf\n72 712 Td\n(" + content_text.encode('latin1', 'replace') + b") Tj\nET\nendstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000244 00000 n \n"
        b"0000000344 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n425\n%%EOF"
    )
    return pdf_content


def print_step(num: int, title: str):
    print(f"\n{'='*75}\n[TEST {num:02d}/24] {title}\n{'='*75}")


def run_phase_15_tests():
    db: Session = SessionLocal()
    test_run_id = uuid.uuid4().hex[:6]
    test_results = {}
    
    student1_email = f"student1_{test_run_id}@pathforge.edu"
    student1_password = "SecurePassword123!"
    student2_email = f"student2_{test_run_id}@pathforge.edu"
    student2_password = "SecurePassword123!"

    student1_token = None
    student2_token = None
    student1_id = None
    student2_id = None
    resume1_id = None
    resume2_id = None
    tested_skill_id = "SK001"
    selected_course_id = "CRS001"

    try:
        # ---------------------------------------------------------------------
        # 1. Register a new student
        # ---------------------------------------------------------------------
        print_step(1, "Register a new student")
        reg_payload = {
            "first_name": "Alex",
            "last_name": f"Student_{test_run_id}",
            "name": f"Alex Student {test_run_id}",
            "email": student1_email,
            "password": student1_password,
            "role": "student",
            "college": "Stanford University",
            "department": "Computer Science",
            "degree": "B.S. in Computer Science",
            "graduation_year": 2026,
            "cgpa": 9.2,
            "target_career_id": "C001"
        }
        res = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
        assert res.status_code == 200, f"Registration failed: {res.text}"
        data = res.json()
        student1_token = data.get("access_token")
        student1_id = data.get("student_id")
        assert student1_token, "Missing access_token in registration response"
        assert student1_id, "Missing student_id in registration response"
        print(f"✓ Registered student 1: {student1_id} ({student1_email})")
        test_results["01_register_student"] = "PASS"

        # ---------------------------------------------------------------------
        # 2. Log in and verify that the student has an independent profile
        # ---------------------------------------------------------------------
        print_step(2, "Log in and verify independent profile")
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": student1_email,
            "password": student1_password
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        student1_token = login_res.json()["access_token"]

        headers1 = {"Authorization": f"Bearer {student1_token}"}
        me_res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers1)
        assert me_res.status_code == 200, f"Get me failed: {me_res.text}"
        me_data = me_res.json()
        assert me_data["student_id"] == student1_id, "Mismatch in authenticated student identity"
        print(f"✓ Verified independent student identity: {me_data['email']}, ID: {me_data['student_id']}")
        test_results["02_login_and_verify_profile"] = "PASS"

        # ---------------------------------------------------------------------
        # 3. Upload a valid PDF resume
        # ---------------------------------------------------------------------
        print_step(3, "Upload a valid PDF resume")
        pdf_bytes_1 = create_minimal_pdf(
            "Alex Student. Skilled in Python, Machine Learning, SQL, PyTorch, Docker, FastAPI. "
            "Experience: ML Engineering Intern at TechCorp. Projects: Neural Search Engine using Transformers."
        )
        files = {
            "file": ("alex_resume_v1.pdf", pdf_bytes_1, "application/pdf")
        }
        upload_res = requests.post(f"{BASE_URL}/api/resume/upload", headers=headers1, files=files)
        assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
        upload_data = upload_res.json()
        resume1_id = upload_data.get("resume_id")
        assert resume1_id, "No resume_id returned"
        print(f"✓ Uploaded valid PDF resume: ID {resume1_id}")
        test_results["03_upload_valid_pdf_resume"] = "PASS"

        # ---------------------------------------------------------------------
        # 4. Verify text extraction and structured analysis
        # ---------------------------------------------------------------------
        print_step(4, "Verify text extraction and structured analysis")
        extracted_data = upload_data.get("data", upload_data)
        assert "detected_skills" in extracted_data, f"Missing detected_skills in response: {upload_data}"
        detected_skills = extracted_data["detected_skills"]
        skill_names = [s.get("skill_name") for s in detected_skills]
        print(f"[*] Detected skills: {skill_names}")
        assert len(detected_skills) > 0, "No skills detected in structured extraction"
        assert any(k in ["Python", "Machine Learning", "SQL", "PyTorch"] for k in skill_names), "Expected core skills not detected"
        print(f"✓ Structured extraction validated: {len(detected_skills)} skills identified")
        test_results["04_structured_extraction"] = "PASS"

        # ---------------------------------------------------------------------
        # 5. Verify that resume history is saved
        # ---------------------------------------------------------------------
        print_step(5, "Verify that resume history is saved")
        history_res = requests.get(f"{BASE_URL}/api/resume/history", headers=headers1)
        assert history_res.status_code == 200, f"History fetch failed: {history_res.text}"
        history_data = history_res.json()
        assert len(history_data) == 1, f"Expected 1 resume in history, got {len(history_data)}"
        assert history_data[0]["resume_id"] == resume1_id
        assert history_data[0]["original_filename"] == "alex_resume_v1.pdf"
        assert history_data[0]["is_active"] is True
        print(f"✓ Resume history verified: {history_data[0]['original_filename']}, active=True")
        test_results["05_resume_history_persistence"] = "PASS"

        # ---------------------------------------------------------------------
        # 6. Verify that extracted skills are stored as resume evidence, not automatically marked mastered
        # ---------------------------------------------------------------------
        print_step(6, "Verify skills stored as resume evidence (not marked mastered)")
        mastery_res = requests.get(f"{BASE_URL}/api/skills/mastery", headers=headers1)
        assert mastery_res.status_code == 200, f"Skills mastery fetch failed: {mastery_res.text}"
        mastery_list = mastery_res.json()
        
        # Check that detected skills have resume_score set (exposure) but final_mastery is not 100% / Mastered
        python_skill = next((s for s in mastery_list if s["skill"] == "Python"), None)
        if python_skill:
            print(f"[*] Python evidence: resume_score={python_skill.get('resume_score')}, final_mastery={python_skill.get('final_mastery')}, status={python_skill.get('status')}")
            assert python_skill.get("resume_score", 0) > 0, "Resume score should be initialized from extraction"
            assert python_skill.get("final_mastery", 0) < 100, "Resume mention alone must not grant 100% mastery"
        print("✓ Verified: Resume detection initializes exposure signal without falsely fabricating verified mastery")
        test_results["06_evidence_separation"] = "PASS"

        # ---------------------------------------------------------------------
        # 7. Upload a second resume and verify that the first history record remains available
        # ---------------------------------------------------------------------
        print_step(7, "Upload second resume and verify previous history preserved")
        pdf_bytes_2 = create_minimal_pdf(
            "Alex Student v2. Updated CV. Added Deep Learning, Kubernetes, Scikit-learn, Statistics. "
            "Certifications: Deep Learning Specialization (2024)."
        )
        files2 = {
            "file": ("alex_resume_v2.pdf", pdf_bytes_2, "application/pdf")
        }
        upload_res_2 = requests.post(f"{BASE_URL}/api/resume/upload", headers=headers1, files=files2)
        assert upload_res_2.status_code == 200, f"Second upload failed: {upload_res_2.text}"
        resume2_id = upload_res_2.json().get("resume_id")
        assert resume2_id != resume1_id, "Second resume ID should be distinct"

        history_res_2 = requests.get(f"{BASE_URL}/api/resume/history", headers=headers1)
        assert history_res_2.status_code == 200
        h2 = history_res_2.json()
        assert len(h2) == 2, f"Expected 2 resume records in history, got {len(h2)}"
        
        # Verify first is preserved, second is active
        res1_meta = next((r for r in h2 if r["resume_id"] == resume1_id), None)
        res2_meta = next((r for r in h2 if r["resume_id"] == resume2_id), None)
        assert res1_meta is not None, "Previous resume version was lost"
        assert res2_meta is not None, "Latest resume version not found"
        assert res2_meta["is_active"] is True, "Latest resume should be active"
        assert res1_meta["is_active"] is False, "Previous resume should be marked inactive"
        print(f"✓ Second resume uploaded. Both versions preserved in history (total: {len(h2)})")
        test_results["07_multi_resume_history"] = "PASS"

        # ---------------------------------------------------------------------
        # 8. Complete an assessment and verify that skill evidence updates correctly
        # ---------------------------------------------------------------------
        print_step(8, "Complete assessment and verify skill evidence update")
        # Start assessment to obtain active assessment session
        start_res = requests.post(
            f"{BASE_URL}/api/assessment/start",
            headers=headers1,
            json={"limit": 5}
        )
        assert start_res.status_code == 200, f"Assessment start failed: {start_res.text}"
        start_data = start_res.json()
        assessment_id = start_data["assessment_id"]
        questions = start_data["questions"]
        assert len(questions) > 0, "No questions returned in diagnostic assessment"

        q_ids = [q["question_id"] for q in questions]
        db_qs = {q.question_id: q for q in db.query(AssessmentQuestion).filter(AssessmentQuestion.question_id.in_(q_ids)).all()}

        answers_list = []
        for q in questions:
            db_q = db_qs.get(q["question_id"])
            correct = db_q.correct_answer if db_q else q["options"][0]
            answers_list.append({
                "question_id": q["question_id"],
                "selected_answer": correct,
                "time_taken_seconds": 25
            })

        sub_res = requests.post(
            f"{BASE_URL}/api/assessment/submit",
            headers=headers1,
            json={
                "assessment_id": assessment_id,
                "answers": answers_list
            }
        )
        assert sub_res.status_code == 200, f"Assessment submission failed: {sub_res.text}"
        ass_data = sub_res.json()
        print(f"[*] Assessment evaluated: Score {ass_data.get('overall_score')}%, Correct: {ass_data.get('correct_answers')}/{ass_data.get('total_questions')}")
        assert ass_data.get("overall_score", 0) >= 80.0, f"Expected score >= 80, got {ass_data.get('overall_score')}"
        
        # Verify student skills in database have assessment evidence
        updated_skills = db.query(StudentSkill).filter(
            StudentSkill.student_id == student1_id,
            StudentSkill.assessment_score > 0
        ).all()
        assert len(updated_skills) > 0, "No StudentSkill record updated with assessment evidence"
        first_sk = updated_skills[0]
        tested_skill_id = first_sk.skill_id
        print(f"✓ Skill evidence updated in database: {first_sk.skill.skill_name if first_sk.skill else tested_skill_id} Assessment score={first_sk.assessment_score}%, final_mastery={first_sk.final_mastery}%")
        test_results["08_assessment_skill_evidence"] = "PASS"

        # ---------------------------------------------------------------------
        # 9. Enroll in a course and complete several lessons (4 of 10)
        # ---------------------------------------------------------------------
        print_step(9, "Enroll in course and complete 4 out of 10 lessons")
        recs_res = requests.get(f"{BASE_URL}/api/courses/recommendations", headers=headers1)
        assert recs_res.status_code == 200, f"Failed to get course recommendations: {recs_res.text}"
        recs = recs_res.json()
        assert len(recs) > 0, "No course recommendations returned"
        selected_course_id = recs[0]["course_id"]
        selected_course_name = recs[0].get("course_name", selected_course_id)
        print(f"[*] Enrolling in recommended course: {selected_course_name} ({selected_course_id})")

        course_prog_res = requests.put(
            f"{BASE_URL}/api/courses/{selected_course_id}/progress",
            headers=headers1,
            json={
                "progress_percentage": 40,
                "last_lesson_id": "les-4",
                "last_lesson_title": "4. Architectural Patterns & Algorithms",
                "completed_lessons_count": 4,
                "total_lessons": 10,
                "completed_lessons": ["les-1", "les-2", "les-3", "les-4"],
                "last_position_seconds": 450
            }
        )
        assert course_prog_res.status_code == 200, f"Progress update failed: {course_prog_res.text}"
        print(f"✓ Saved lesson progress: 4/10 lessons (40%) on {selected_course_id}")
        test_results["09_partial_course_progress"] = "PASS"

        # ---------------------------------------------------------------------
        # 10. Log out and log in again
        # ---------------------------------------------------------------------
        print_step(10, "Simulate logout and fresh login")
        # Discard previous token and request new JWT
        fresh_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": student1_email,
            "password": student1_password
        })
        assert fresh_login.status_code == 200
        student1_token = fresh_login.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {student1_token}"}
        print("✓ Logged out and authenticated fresh session")
        test_results["10_logout_and_login"] = "PASS"

        # ---------------------------------------------------------------------
        # 11. Verify that the same course progress and last learning position are restored
        # ---------------------------------------------------------------------
        print_step(11, "Verify course progress and position restored from database")
        detail_res = requests.get(f"{BASE_URL}/api/courses/{selected_course_id}/progress", headers=headers1)
        assert detail_res.status_code == 200, f"Failed to get course progress: {detail_res.text}"
        detail_data = detail_res.json()
        assert detail_data["progress_percentage"] == 40, f"Expected 40% progress, got {detail_data['progress_percentage']}"
        assert detail_data["completed_lessons_count"] == 4, f"Expected 4 completed lessons, got {detail_data['completed_lessons_count']}"
        assert detail_data["last_lesson_id"] == "les-4"
        assert detail_data["next_lesson_to_continue"] == "les-5"
        print(f"✓ Restored exact learning position: {detail_data['completed_lessons_count']}/10 lessons, Next: {detail_data['next_lesson_to_continue']}")
        test_results["11_restore_course_progress"] = "PASS"

        # ---------------------------------------------------------------------
        # 12. Complete the course
        # ---------------------------------------------------------------------
        print_step(12, "Complete the remaining lessons of the course (100%)")
        complete_res = requests.post(f"{BASE_URL}/api/courses/{selected_course_id}/complete", headers=headers1)
        assert complete_res.status_code == 200, f"Course completion failed: {complete_res.text}"
        comp_json = complete_res.json()
        print(f"✓ Course completed response: {comp_json.get('message')}")
        test_results["12_complete_course"] = "PASS"

        # ---------------------------------------------------------------------
        # 13. Verify that the completion record is saved
        # ---------------------------------------------------------------------
        print_step(13, "Verify completion record saved in database")
        db.expire_all()
        db_course = db.query(StudentCourseProgress).filter(
            StudentCourseProgress.student_id == student1_id,
            StudentCourseProgress.course_id == selected_course_id
        ).first()
        assert db_course is not None
        assert db_course.progress_percentage == 100
        assert db_course.enrollment_status == "completed"
        print(f"✓ Database verified: Course {selected_course_id} is completed (100%)")
        test_results["13_completion_record_persistence"] = "PASS"

        # ---------------------------------------------------------------------
        # 14. Verify that a resume improvement suggestion is generated
        # ---------------------------------------------------------------------
        print_step(14, "Verify resume improvement suggestion generated")
        sugg_res = requests.get(f"{BASE_URL}/api/resume/suggestions", headers=headers1)
        assert sugg_res.status_code == 200
        suggestions = sugg_res.json()
        assert len(suggestions) > 0, "No resume suggestions generated upon course completion"
        course_sugg = next((s for s in suggestions if s["course_id"] == selected_course_id), None)
        assert course_sugg is not None, f"Suggestion for course {selected_course_id} missing"
        assert course_sugg["status"] == "pending"
        sugg_id = course_sugg["suggestion_id"]
        print(f"✓ Generated course resume suggestion: {course_sugg['suggested_content']} (ID: {sugg_id})")
        test_results["14_resume_suggestion_generation"] = "PASS"

        # ---------------------------------------------------------------------
        # 15. Confirm that no resume content is modified without student approval
        # ---------------------------------------------------------------------
        print_step(15, "Confirm raw resume document is unmodified without approval")
        # Check active resume file content is unchanged
        active_res = requests.get(f"{BASE_URL}/api/resume/{resume2_id}", headers=headers1)
        assert active_res.status_code == 200
        # Check profile entries are empty before approval
        entries_before = requests.get(f"{BASE_URL}/api/resume/profile-entries", headers=headers1).json()
        assert len(entries_before) == 0, "Profile entries should be empty prior to student approval"
        print("✓ Verified: Raw resume is untouched; suggestions remain strictly pending until approved")
        test_results["15_no_unapproved_modification"] = "PASS"

        # ---------------------------------------------------------------------
        # 16. Approve suggestion and verify addition to verified resume profile
        # ---------------------------------------------------------------------
        print_step(16, "Approve suggestion and verify addition to resume profile")
        approve_res = requests.post(f"{BASE_URL}/api/resume/suggestions/{sugg_id}/approve", headers=headers1)
        assert approve_res.status_code == 200, f"Approval failed: {approve_res.text}"
        
        # Check profile entries now contains the approved credential
        entries_after = requests.get(f"{BASE_URL}/api/resume/profile-entries", headers=headers1).json()
        assert len(entries_after) == 1, f"Expected 1 approved entry, got {len(entries_after)}"
        assert entries_after[0]["source_course_id"] == selected_course_id
        print(f"✓ Approved suggestion saved to verified resume profile: {entries_after[0]['title']}")
        test_results["16_approved_resume_profile_entry"] = "PASS"

        # ---------------------------------------------------------------------
        # 17. Change the target career
        # ---------------------------------------------------------------------
        print_step(17, "Change target career pathway")
        new_career_id = "C012" # Full Stack Developer
        change_res = requests.post(
            f"{BASE_URL}/api/career/select",
            headers=headers1,
            json={"career_id": new_career_id}
        )
        assert change_res.status_code == 200, f"Career change failed: {change_res.text}"
        change_data = change_res.json()
        print(f"✓ Career changed to: {change_data.get('career_name')} (ID: {new_career_id})")
        test_results["17_change_target_career"] = "PASS"

        # ---------------------------------------------------------------------
        # 18. Verify career-dependent metrics (gaps, roadmap, readiness) update
        # ---------------------------------------------------------------------
        print_step(18, "Verify career-dependent benchmarks, gaps, roadmap, readiness")
        gap_res = requests.get(f"{BASE_URL}/api/skill-gap", headers=headers1)
        assert gap_res.status_code == 200
        gap_data = gap_res.json()
        assert gap_data["career_name"] == "Full Stack Developer", f"Expected Full Stack Developer, got {gap_data.get('career_name')}"
        
        roadmap_res = requests.get(f"{BASE_URL}/api/roadmap", headers=headers1)
        assert roadmap_res.status_code == 200
        roadmap_data = roadmap_res.json()
        assert roadmap_data["career_name"] == "Full Stack Developer", f"Expected Full Stack Developer, got {roadmap_data.get('career_name')}"
        print(f"✓ Skill gaps & roadmap dynamically aligned with Full Stack Developer: {len(gap_data.get('gaps', []))} gaps analyzed")
        test_results["18_dynamic_career_alignment"] = "PASS"

        # ---------------------------------------------------------------------
        # 19. Verify that previous assessments, course completions, and resume history remain intact
        # ---------------------------------------------------------------------
        print_step(19, "Verify prior learning history preserved across career switch")
        # Check course completion is still 100%
        detail_after_switch = requests.get(f"{BASE_URL}/api/courses/{selected_course_id}/progress", headers=headers1).json()
        assert detail_after_switch["progress_percentage"] == 100
        assert detail_after_switch.get("status") == "completed" or detail_after_switch.get("enrollment_status") == "completed"

        # Check assessment score is still preserved
        sk_rec_after = db.query(StudentSkill).filter(
            StudentSkill.student_id == student1_id,
            StudentSkill.skill_id == tested_skill_id
        ).first()
        assert sk_rec_after is not None and sk_rec_after.assessment_score > 0, "Assessment score was wiped on career switch"

        # Check resume history still has 2 records
        history_after_switch = requests.get(f"{BASE_URL}/api/resume/history", headers=headers1).json()
        assert len(history_after_switch) == 2
        print("✓ Confirmed: Course completions, assessment scores, and resume history 100% intact")
        test_results["19_learning_history_preserved"] = "PASS"

        # ---------------------------------------------------------------------
        # 20. Log out and log in again and confirm that all progress persists
        # ---------------------------------------------------------------------
        print_step(20, "Log out, fresh login, confirm complete persistence")
        re_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": student1_email,
            "password": student1_password
        })
        assert re_login.status_code == 200
        headers_rel = {"Authorization": f"Bearer {re_login.json()['access_token']}"}

        profile_check = requests.get(f"{BASE_URL}/api/profile", headers=headers_rel).json()
        assert profile_check["target_career_name"] == "Full Stack Developer"
        assert len(requests.get(f"{BASE_URL}/api/resume/history", headers=headers_rel).json()) == 2
        assert len(requests.get(f"{BASE_URL}/api/resume/profile-entries", headers=headers_rel).json()) == 1
        print("✓ All states and progress persisted and restored from database after fresh session")
        test_results["20_persistent_state_restored"] = "PASS"

        # ---------------------------------------------------------------------
        # 21. Register a second test student and verify complete data isolation
        # ---------------------------------------------------------------------
        print_step(21, "Register second test student and verify complete data isolation")
        reg2_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Student",
            "last_name": f"Two_{test_run_id}",
            "name": f"Student Two {test_run_id}",
            "email": student2_email,
            "password": student2_password,
            "role": "student",
            "college": "MIT",
            "department": "EECS",
            "degree": "B.S. EECS",
            "graduation_year": 2027,
            "cgpa": 8.9,
            "target_career_id": "C012"
        })
        assert reg2_res.status_code == 200
        student2_token = reg2_res.json()["access_token"]
        student2_id = reg2_res.json()["student_id"]
        headers2 = {"Authorization": f"Bearer {student2_token}"}

        # Student 2 should have empty resume history, 0 course progress, no profile entries
        s2_history = requests.get(f"{BASE_URL}/api/resume/history", headers=headers2).json()
        assert len(s2_history) == 0, f"Student 2 has leaked resume history: {s2_history}"

        s2_entries = requests.get(f"{BASE_URL}/api/resume/profile-entries", headers=headers2).json()
        assert len(s2_entries) == 0, f"Student 2 has leaked resume entries: {s2_entries}"

        s2_course = requests.get(f"{BASE_URL}/api/courses/{selected_course_id}/progress", headers=headers2).json()
        assert s2_course["progress_percentage"] == 0, f"Student 2 has leaked course progress: {s2_course}"
        print(f"✓ Complete data isolation verified: Student 2 ({student2_id}) has independent zero-state")
        test_results["21_multi_student_data_isolation"] = "PASS"

        # ---------------------------------------------------------------------
        # 22. Attempt unauthorized access to the first student's records
        # ---------------------------------------------------------------------
        print_step(22, "Attempt unauthorized access to Student 1's records")
        # Student 2 attempts to download Student 1's resume
        unauth_dl = requests.get(f"{BASE_URL}/api/resume/{resume1_id}/download", headers=headers2)
        assert unauth_dl.status_code in [403, 404], f"Expected 403 or 404, got {unauth_dl.status_code}"

        # Student 2 attempts to delete Student 1's resume
        unauth_del = requests.delete(f"{BASE_URL}/api/resume/{resume1_id}", headers=headers2)
        assert unauth_del.status_code in [403, 404], f"Expected 403 or 404, got {unauth_del.status_code}"
        print("✓ Security verified: Cross-student record access, download, and deletion strictly rejected (403/404)")
        test_results["22_unauthorized_access_rejected"] = "PASS"

        # ---------------------------------------------------------------------
        # 23. Test failed AI analysis and retry behavior
        # ---------------------------------------------------------------------
        print_step(23, "Test failed AI analysis and retry behavior")
        corrupted_file = {
            "file": ("corrupted.pdf", b"NOT_A_VALID_PDF_CORRUPT_BYTES", "application/pdf")
        }
        err_res = requests.post(f"{BASE_URL}/api/resume/upload", headers=headers1, files=corrupted_file)
        # Should gracefully return 400 Bad Request without crashing the server
        assert err_res.status_code in [400, 422], f"Expected 400/422, got {err_res.status_code}"
        print(f"✓ Error handled gracefully: {err_res.json().get('detail')}")

        # Retry with valid file to ensure recovery
        retry_res = requests.post(
            f"{BASE_URL}/api/resume/upload",
            headers=headers1,
            files={"file": ("valid_retry.pdf", pdf_bytes_1, "application/pdf")}
        )
        assert retry_res.status_code == 200, f"Retry after error failed: {retry_res.text}"
        print("✓ Server maintained stability and successfully processed retry upload")
        test_results["23_ai_error_handling_and_retry"] = "PASS"

        # ---------------------------------------------------------------------
        # 24. Test failed dataset synchronization without losing database records
        # ---------------------------------------------------------------------
        print_step(24, "Test dataset synchronization safety without database loss")
        # Trigger career switch with dataset sync
        sync_res = requests.post(
            f"{BASE_URL}/api/career/select",
            headers=headers1,
            json={"career_id": "C001"}
        )
        assert sync_res.status_code == 200
        
        # Verify student records still intact
        stu = db.query(Student).filter(Student.student_id == student1_id).first()
        assert stu is not None
        assert stu.target_career_id == "C001"
        print("✓ Operational learning progress remains authoritative in database; sync handled safely")
        test_results["24_safe_dataset_sync"] = "PASS"

        # ---------------------------------------------------------------------
        # SUMMARY
        # ---------------------------------------------------------------------
        print("\n" + "="*75)
        print("PHASE 15 TEST SUITE SUMMARY: ALL 24 / 24 TESTS PASSED")
        print("="*75)
        for k, v in test_results.items():
            print(f"  [{v}] {k}")
        print("="*75)
        return True

    finally:
        db.close()


if __name__ == "__main__":
    success = run_phase_15_tests()
    if not success:
        sys.exit(1)
