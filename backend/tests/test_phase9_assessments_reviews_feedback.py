"""
Phase 9 — Skill Assessments, Project Reviews and Mentor Feedback Tests
Verifies complete skill assessment creation, evaluation, rubric project reviews,
authorization enforcement, duplicate submission prevention, evidence calibration,
notification dispatch, and student visibility control.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from database.connection import SessionLocal
from database.models import (
    Student,
    Mentor,
    Skill,
    Project,
    MentorStudentAssignment,
    MentorAssessment,
    MentorAssessmentSubmission,
    MentorFeedback,
    StudentSkill,
    Notification,
)
from services.email_service import email_service

client = TestClient(app)


def helper_register_and_login_mentor(name: str = "Dr. Phase9 Mentor", expertise: str = "Machine Learning"):
    unique_email = f"mentor.p9.{uuid.uuid4().hex[:8]}@pathforge.ai"
    reg_payload = {
        "name": name,
        "email": unique_email,
        "password": "Password123!",
        "title": f"Staff {expertise} Engineer",
        "experience_years": 8,
        "expertise_areas": [expertise, "System Design"],
        "company": "Antigravity AI Systems",
        "linkedin_url": "https://linkedin.com/in/test-mentor-p9",
        "bio": "Mentoring future AI/ML practitioners.",
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
    return {
        "token": token,
        "headers": headers,
        "mentor_id": mentor_id,
        "name": name,
        "email": unique_email,
    }


def helper_register_and_login_student(name: str = "Aria Phase9", career_id: str = "C01"):
    unique_email = f"student.p9.{uuid.uuid4().hex[:8]}@stanford.edu"
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
    return {
        "token": token,
        "headers": headers,
        "student_id": student_id,
        "name": name,
        "email": unique_email,
    }


def helper_assign_student_to_mentor(student_id: str, mentor_id: str):
    db = SessionLocal()
    existing = (
        db.query(MentorStudentAssignment)
        .filter(
            MentorStudentAssignment.student_id == student_id,
            MentorStudentAssignment.mentor_id == mentor_id,
        )
        .first()
    )
    if not existing:
        assignment = MentorStudentAssignment(
            mentor_id=mentor_id,
            student_id=student_id,
            assigned_date="2026-10-28",
            status="active",
        )
        db.add(assignment)
        db.commit()
    db.close()


class TestPhase9SkillAssessmentsAndReviews:
    def setup_method(self):
        self.mentor_data = helper_register_and_login_mentor()
        self.mentor_headers = self.mentor_data["headers"]
        self.mentor_id = self.mentor_data["mentor_id"]

        self.student_data = helper_register_and_login_student("Phase9 Mentee")
        self.student_headers = self.student_data["headers"]
        self.student_id = self.student_data["student_id"]

        self.unassigned_data = helper_register_and_login_student("Unassigned Scholar")
        self.unassigned_headers = self.unassigned_data["headers"]
        self.unassigned_id = self.unassigned_data["student_id"]

        helper_assign_student_to_mentor(self.student_id, self.mentor_id)

    def test_01_create_assessment_success_and_notification(self):
        """Mentor creates assessment for assigned student; notification is sent to student."""
        payload = {
            "skill_id": "S001",
            "title": "Python Data Structures Mastery",
            "description": "Demonstrate practical competency with trees, graphs, and hash algorithms.",
            "instructions": "Implement the solutions in a clean GitHub repo and provide unit tests.",
            "criteria": [
                {"criterion": "Algorithm Correctness", "weight": 40, "description": "Passes all test cases"},
                {"criterion": "Code Quality & Cleanliness", "weight": 30, "description": "Adheres to PEP8"},
                {"criterion": "Time & Space Complexity", "weight": 30, "description": "Meets O(n log n) constraints"},
            ],
            "deadline": "2026-11-15",
            "max_score": 100,
            "student_id": self.student_id,
        }

        res = client.post("/api/mentor/assessments", json=payload, headers=self.mentor_headers)
        assert res.status_code == 200, res.text
        data = res.json()
        assert "created and assigned" in data["message"].lower()
        assessment_id = data["data"]["assessment_id"]
        assert assessment_id.startswith("MASS-")

        # Verify in DB
        db = SessionLocal()
        ass = db.query(MentorAssessment).filter(MentorAssessment.assessment_id == assessment_id).first()
        assert ass is not None
        assert ass.title == "Python Data Structures Mastery"
        assert ass.max_score == 100

        # Verify notification dispatched to student
        notif = (
            db.query(Notification)
            .filter(
                Notification.student_id == self.student_id,
                Notification.type == "assessment_assigned",
            )
            .first()
        )
        assert notif is not None
        assert "Python Data Structures Mastery" in notif.message
        db.close()

    def test_02_create_assessment_unassigned_student_forbidden(self):
        """Mentor cannot create targeted assessment for an unassigned student (403 Forbidden)."""
        payload = {
            "skill_id": "S001",
            "title": "Unauthorized Assessment",
            "description": "Testing unassigned access lockout.",
            "student_id": self.unassigned_id,
        }

        res = client.post("/api/mentor/assessments", json=payload, headers=self.mentor_headers)
        assert res.status_code == 403
        assert "not assigned" in res.json()["detail"].lower()

    def test_03_create_assessment_validation_failures(self):
        """Validation errors on missing title, description, or invalid skill."""
        # Empty title
        res1 = client.post(
            "/api/mentor/assessments",
            json={"skill_id": "S001", "title": "", "description": "Desc"},
            headers=self.mentor_headers,
        )
        assert res1.status_code == 400

        # Non-existent skill
        res2 = client.post(
            "/api/mentor/assessments",
            json={"skill_id": "SK_NON_EXISTENT_9999", "title": "Valid Title", "description": "Desc"},
            headers=self.mentor_headers,
        )
        assert res2.status_code == 404

    def test_04_student_view_assigned_assessments(self):
        """Assigned student sees assessment; unassigned student does not."""
        # Create an assessment
        create_res = client.post(
            "/api/mentor/assessments",
            json={
                "skill_id": "S001",
                "title": "Mentee Exclusive Assessment",
                "description": "Custom evaluation for mentee.",
                "student_id": self.student_id,
            },
            headers=self.mentor_headers,
        )
        assert create_res.status_code == 200

        # Assigned student views
        stu_res = client.get("/api/student/mentor-assessments", headers=self.student_headers)
        assert stu_res.status_code == 200
        items = stu_res.json()
        assert any(a["title"] == "Mentee Exclusive Assessment" for a in items)

        # Unassigned student views -> must NOT see this assessment
        un_res = client.get("/api/student/mentor-assessments", headers=self.unassigned_headers)
        assert un_res.status_code == 200
        un_items = un_res.json()
        assert not any(a["title"] == "Mentee Exclusive Assessment" for a in un_items)

    def test_05_student_submit_assessment_and_prevent_duplicate(self):
        """Student submits answers/repo link, dispatches notification, and cannot submit twice."""
        # Create assessment
        create_res = client.post(
            "/api/mentor/assessments",
            json={
                "skill_id": "S001",
                "title": "Machine Learning Pipeline Submission",
                "description": "Build an end-to-end pipeline.",
                "student_id": self.student_id,
            },
            headers=self.mentor_headers,
        )
        assessment_id = create_res.json()["data"]["assessment_id"]

        # Student submits
        sub_payload = {
            "submission_text": "Completed the scikit-learn pipeline with 10-fold cross validation.",
            "attachment_url": "https://github.com/student/ml-pipeline-demo",
            "answers": [{"question": "Algorithm choice", "answer": "RandomForestClassifier"}],
        }
        sub_res = client.post(
            f"/api/student/mentor-assessments/{assessment_id}/submit",
            json=sub_payload,
            headers=self.student_headers,
        )
        assert sub_res.status_code == 200
        assert sub_res.json()["data"]["status"] == "submitted"

        # Verify notification to mentor
        db = SessionLocal()
        m_notif = (
            db.query(Notification)
            .filter(
                Notification.mentor_id == self.mentor_id,
                Notification.type == "assessment_submitted",
            )
            .first()
        )
        assert m_notif is not None
        db.close()

        # Duplicate submission attempt -> 400 Bad Request
        dup_res = client.post(
            f"/api/student/mentor-assessments/{assessment_id}/submit",
            json=sub_payload,
            headers=self.student_headers,
        )
        assert dup_res.status_code == 400
        assert "already been submitted" in dup_res.json()["detail"].lower()

    def test_06_unassigned_student_cannot_submit(self):
        """Student not assigned to the mentor cannot submit the assessment."""
        create_res = client.post(
            "/api/mentor/assessments",
            json={
                "skill_id": "S001",
                "title": "Mentee Only Test",
                "description": "Forbidden for unassigned student.",
            },
            headers=self.mentor_headers,
        )
        assessment_id = create_res.json()["data"]["assessment_id"]

        sub_res = client.post(
            f"/api/student/mentor-assessments/{assessment_id}/submit",
            json={"submission_text": "Sneaking a submission"},
            headers=self.unassigned_headers,
        )
        assert sub_res.status_code == 403

    def test_07_mentor_evaluate_submission_and_calibrate_skill(self):
        """Mentor evaluates submission with rubric scores and feedback; calibrates StudentSkill."""
        # 1. Create assessment
        create_res = client.post(
            "/api/mentor/assessments",
            json={
                "skill_id": "S001",
                "title": "Data Engineering Assessment",
                "description": "Design an ETL pipeline with Apache Airflow.",
                "max_score": 100,
                "student_id": self.student_id,
            },
            headers=self.mentor_headers,
        )
        assessment_id = create_res.json()["data"]["assessment_id"]

        # 2. Student submits
        sub_res = client.post(
            f"/api/student/mentor-assessments/{assessment_id}/submit",
            json={
                "submission_text": "Airflow DAG implemented with daily schedule and Slack alerts.",
                "attachment_url": "https://github.com/student/etl-airflow",
            },
            headers=self.student_headers,
        )
        submission_id = sub_res.json()["data"]["submission_id"]

        # 3. Mentor evaluates
        eval_payload = {
            "score": 92.0,
            "feedback": "Outstanding pipeline idempotency and well-configured backfilling.",
            "rubric_scores": {
                "Architecture": 95,
                "Error Handling": 90,
                "Code Quality": 92,
            },
            "release": True,
        }
        eval_res = client.post(
            f"/api/mentor/assessments/submissions/{submission_id}/evaluate",
            json=eval_payload,
            headers=self.mentor_headers,
        )
        assert eval_res.status_code == 200
        data = eval_res.json()
        assert data["data"]["calibrated_percentage"] == 92

        # 4. Verify StudentSkill calibrated in DB
        db = SessionLocal()
        ss = (
            db.query(StudentSkill)
            .filter(
                StudentSkill.student_id == self.student_id,
                StudentSkill.skill_id == "S001",
            )
            .first()
        )
        assert ss is not None
        assert ss.mentor_score == 92
        assert ss.assessment_score == 92
        assert ss.final_mastery > 0

        # Verify notification sent to student
        eval_notif = (
            db.query(Notification)
            .filter(
                Notification.student_id == self.student_id,
                Notification.type == "assessment_evaluated",
            )
            .first()
        )
        assert eval_notif is not None
        assert "92" in eval_notif.message
        db.close()

    def test_08_unreleased_score_and_feedback_hidden_from_student(self):
        """Scores and feedback are NOT exposed to the student before their intended release."""
        # 1. Create and submit assessment
        create_res = client.post(
            "/api/mentor/assessments",
            json={
                "skill_id": "S001",
                "title": "Blind Graded Exam",
                "description": "Graded in draft mode first.",
                "student_id": self.student_id,
            },
            headers=self.mentor_headers,
        )
        assessment_id = create_res.json()["data"]["assessment_id"]

        sub_res = client.post(
            f"/api/student/mentor-assessments/{assessment_id}/submit",
            json={"submission_text": "Draft answers for review"},
            headers=self.student_headers,
        )
        submission_id = sub_res.json()["data"]["submission_id"]

        # 2. Mentor evaluates with release=False (draft evaluation)
        eval_res = client.post(
            f"/api/mentor/assessments/submissions/{submission_id}/evaluate",
            json={
                "score": 85.0,
                "feedback": "Preliminary feedback - not yet published.",
                "release": False,
            },
            headers=self.mentor_headers,
        )
        assert eval_res.status_code == 200

        # 3. Student views their assessment -> score and feedback must be None
        stu_res = client.get(f"/api/student/mentor-assessments/{assessment_id}", headers=self.student_headers)
        assert stu_res.status_code == 200
        my_sub = stu_res.json()["my_submission"]
        assert my_sub is not None
        assert my_sub["score"] is None
        assert my_sub["feedback"] is None
        assert my_sub["is_released"] is False

    def test_09_project_reviews_and_mentor_feedback_workflow(self):
        """Mentor evaluates student project deliverable with rubrics, student views reviews."""
        rev_payload = {
            "student_id": self.student_id,
            "project_id": "P001",
            "skill_id": "S001",
            "rating": 5,
            "strengths": "Modular pipeline, robust PyTest coverage, and containerized Dockerfile.",
            "improvement_areas": "Integrate Prometheus metrics exporter.",
            "comments": "Production-ready deliverable matching industry senior standards.",
            "recommended_action": "Approved for learning roadmap milestone completion.",
        }

        # Mentor submits project review
        rev_res = client.post("/api/mentor/project-reviews", json=rev_payload, headers=self.mentor_headers)
        assert rev_res.status_code == 200
        assert "calibrated" in rev_res.json()["message"].lower()

        # Student views via /api/student/project-reviews
        stu_proj_res = client.get("/api/student/project-reviews", headers=self.student_headers)
        assert stu_proj_res.status_code == 200
        reviews = stu_proj_res.json()
        assert len(reviews) > 0
        p_rev = next(r for r in reviews if r["project_id"] == "P001")
        assert p_rev["rating"] == 5
        assert "Modular pipeline" in p_rev["strengths"]

        # Student also views via /api/mentor/feedback
        fb_res = client.get("/api/mentor/feedback", headers=self.student_headers)
        assert fb_res.status_code == 200
        fb_list = fb_res.json()
        assert any(f["rating"] == 5.0 for f in fb_list)

    def test_10_mentor_assessment_history_and_submission_counts(self):
        """Mentor views assessment history with accurate submission and evaluation counts."""
        # Create an assessment
        create_res = client.post(
            "/api/mentor/assessments",
            json={
                "skill_id": "S001",
                "title": "History Tracking Test Assessment",
                "description": "Verifying metrics in mentor assessments list.",
                "student_id": self.student_id,
            },
            headers=self.mentor_headers,
        )
        assessment_id = create_res.json()["data"]["assessment_id"]

        # Mentor checks list
        list_res = client.get("/api/mentor/assessments", headers=self.mentor_headers)
        assert list_res.status_code == 200
        item = next(a for a in list_res.json() if a["assessment_id"] == assessment_id)
        assert item["submissions_count"] == 0
        assert item["evaluated_count"] == 0

        # Student submits
        client.post(
            f"/api/student/mentor-assessments/{assessment_id}/submit",
            json={"submission_text": "History check submission text"},
            headers=self.student_headers,
        )

        # Mentor checks list again
        list_res2 = client.get("/api/mentor/assessments", headers=self.mentor_headers)
        item2 = next(a for a in list_res2.json() if a["assessment_id"] == assessment_id)
        assert item2["submissions_count"] == 1
        assert item2["evaluated_count"] == 0

        # Mentor evaluates
        subs = client.get(f"/api/mentor/assessments/{assessment_id}/submissions", headers=self.mentor_headers).json()
        sub_id = subs[0]["submission_id"]
        client.post(
            f"/api/mentor/assessments/submissions/{sub_id}/evaluate",
            json={"score": 88.0, "feedback": "Great progress"},
            headers=self.mentor_headers,
        )

        # Mentor checks list again
        list_res3 = client.get("/api/mentor/assessments", headers=self.mentor_headers)
        item3 = next(a for a in list_res3.json() if a["assessment_id"] == assessment_id)
        assert item3["submissions_count"] == 1
        assert item3["evaluated_count"] == 1
