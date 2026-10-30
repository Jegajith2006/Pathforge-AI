import os
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from database.connection import init_db
from services.email_service import email_service

client = TestClient(app)


def register_and_login_student(name="Test Student", email_prefix="student.p11"):
    parts = name.split()
    first_name = parts[0] if parts else "Test"
    last_name = " ".join(parts[1:]) if len(parts) > 1 else "Student"
    email = f"{email_prefix}.{uuid.uuid4().hex[:6]}@pathforge.ai"
    reg_res = client.post("/api/auth/register", json={
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "password": "Password123!",
    })
    assert reg_res.status_code == 200, reg_res.text
    data = reg_res.json()
    token = data["access_token"]
    student_id = data["user_id"]
    return {
        "token": token,
        "student_id": student_id,
        "email": email,
        "headers": {"Authorization": f"Bearer {token}"},
    }


def register_and_login_mentor(name="Test Mentor", email_prefix="mentor.p11"):
    email = f"{email_prefix}.{uuid.uuid4().hex[:6]}@pathforge.ai"
    reg_res = client.post("/api/auth/register/mentor", json={
        "name": name,
        "email": email,
        "password": "Password123!",
        "title": "Staff AI Engineer",
        "experience_years": 8,
        "expertise_areas": ["Machine Learning", "Cloud Computing"],
        "company": "DeepFlow AI Labs",
        "linkedin_url": "https://linkedin.com/in/test-mentor",
        "bio": "Specialized in deep neural network scaling and distributed training systems.",
    })
    assert reg_res.status_code == 200, reg_res.text
    data = reg_res.json()
    if data.get("status") == "pending_verification":
        otp = email_service.get_latest_otp_for_email(email)
        v_res = client.post("/api/auth/verify-email", json={
            "challenge_id": data["challenge_id"],
            "otp": otp,
        })
        assert v_res.status_code == 200, v_res.text
        data = v_res.json()

    token = data["access_token"]
    mentor_id = data["user_id"]
    return {
        "token": token,
        "mentor_id": mentor_id,
        "email": email,
        "headers": {"Authorization": f"Bearer {token}"},
    }


def test_01_auth_roles_and_access_control():
    """Verify role-based access control and unauthorized API rejection."""
    student = register_and_login_student(name="Alice Student")
    mentor = register_and_login_mentor(name="Bob Mentor")

    # 1. Unauthenticated requests to protected endpoints fail
    assert client.get("/api/mentor/profile").status_code == 401
    assert client.get("/api/mentor/students").status_code == 401
    assert client.get("/api/student/sessions", headers={"Authorization": "Bearer invalid.token.value"}).status_code == 401

    # 2. Student cannot access mentor-only endpoints
    res_s_mentor_prof = client.get("/api/mentor/profile", headers=student["headers"])
    assert res_s_mentor_prof.status_code in (401, 403), "Student must not access mentor profile"

    res_s_mentor_students = client.get("/api/mentor/students", headers=student["headers"])
    assert res_s_mentor_students.status_code in (401, 403), "Student must not access mentor students"

    # 3. Mentor cannot access student-only endpoints
    res_m_student_sess = client.get("/api/student/sessions", headers=mentor["headers"])
    assert res_m_student_sess.status_code in (401, 403), "Mentor must not access student sessions"

    res_m_student_guidance = client.get("/api/student/career-guidance", headers=mentor["headers"])
    assert res_m_student_guidance.status_code in (401, 403), "Mentor must not access student career guidance"


def test_02_mentor_profile_and_expertise():
    """Verify mentor profile updates, expertise management, and availability."""
    mentor = register_and_login_mentor(name="Dr. Elena Rostova")

    # 1. Update profile
    up_res = client.put("/api/mentor/profile", headers=mentor["headers"], json={
        "headline": "Lead Research Scientist @ AI Frontiers",
        "education": "M.S. in Robotics, Carnegie Mellon University",
        "certifications": "TensorFlow Developer Certificate, GCP Professional Cloud Architect",
        "languages": "English, Russian",
        "career_specializations": "Machine Learning, Computer Vision",
        "github_url": "https://github.com/elena-rostova",
        "portfolio_url": "https://elenarostova.dev",
        "experience_years": 9,
    })
    assert up_res.status_code == 200, up_res.text

    # Read back profile
    p_res = client.get("/api/mentor/profile", headers=mentor["headers"])
    assert p_res.status_code == 200
    p_data = p_res.json()
    assert p_data["headline"] == "Lead Research Scientist @ AI Frontiers"
    assert p_data["education"] == "M.S. in Robotics, Carnegie Mellon University"

    # 2. Manage Expertise
    sk_add = client.post("/api/mentor/skills", headers=mentor["headers"], json={
        "skill_name": "PyTorch",
        "category": "Machine Learning",
        "proficiency": "expert",
        "years_experience": 7,
        "is_primary": True,
        "willing_to_mentor": True,
    })
    assert sk_add.status_code == 200, sk_add.text
    sk_id = sk_add.json()["data"]["skill_id"]

    # Duplicate skill prevention
    sk_dup = client.post("/api/mentor/skills", headers=mentor["headers"], json={
        "skill_name": "PyTorch",
        "category": "Machine Learning",
    })
    assert sk_dup.status_code == 400, "Duplicate skill must be rejected"

    # List mentor skills
    sk_list = client.get("/api/mentor/skills", headers=mentor["headers"])
    assert sk_list.status_code == 200
    assert any(s["skill_name"] == "PyTorch" for s in sk_list.json())

    # 3. Configure Availability
    avail_res = client.put("/api/mentor/availability", headers=mentor["headers"], json={
        "available_days": ["Monday", "Wednesday", "Friday"],
        "start_time": "14:00",
        "end_time": "18:00",
        "session_duration": 45,
        "timezone": "UTC",
        "unavailable_dates": ["2026-12-25", "2027-01-01"],
    })
    assert avail_res.status_code == 200, avail_res.text
    avail_data = client.get("/api/mentor/availability", headers=mentor["headers"]).json()
    assert "Monday" in avail_data["available_days"]
    assert avail_data["session_duration"] == 45


def test_03_student_discovery_and_connection_lifecycle():
    """Verify end-to-end mentor discovery, request, acceptance, and assignment visibility."""
    mentor = register_and_login_mentor(name="Prof. David Kim")
    student = register_and_login_student(name="Marcus Chen")

    # Add distinct skill to mentor
    client.post("/api/mentor/skills", headers=mentor["headers"], json={
        "skill_name": "Distributed Systems",
        "category": "Cloud Computing",
        "proficiency": "advanced",
        "years_experience": 8,
        "willing_to_mentor": True,
    })

    # 1. Student searches for mentor
    search_res = client.get(f"/api/mentors?query=David", headers=student["headers"])
    assert search_res.status_code == 200
    matched = search_res.json()
    assert any(m["mentor_id"] == mentor["mentor_id"] for m in matched)

    # 2. Student views full public profile
    prof_res = client.get(f"/api/mentors/{mentor['mentor_id']}", headers=student["headers"])
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["name"] == "Prof. David Kim"

    # 3. Student sends mentorship request
    req_res = client.post("/api/student/mentorship-requests", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "career_goal": "Distributed Cloud Architect",
        "topic": "Guidance on consensus protocols and Paxos/Raft systems",
        "message": "I would love your guidance on high-throughput distributed systems.",
    })
    assert req_res.status_code == 200, req_res.text
    req_id = req_res.json()["request_id"]

    # Prevent duplicate request
    dup_res = client.post("/api/student/mentorship-requests", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "topic": "Duplicate request",
    })
    assert dup_res.status_code == 400, "Duplicate active request must be rejected"

    # 4. Mentor views incoming requests
    m_reqs = client.get("/api/mentor/requests", headers=mentor["headers"])
    assert m_reqs.status_code == 200
    m_req_list = m_reqs.json()
    assert any(r["request_id"] == req_id for r in m_req_list)

    # 5. Mentor accepts request
    acc_res = client.post(f"/api/mentor/requests/{req_id}/accept", headers=mentor["headers"])
    assert acc_res.status_code == 200, acc_res.text

    # 6. Verify relationship appears in both portals
    # In Mentor Portal
    m_students = client.get("/api/mentor/students", headers=mentor["headers"])
    assert m_students.status_code == 200
    assert any(s["student_id"] == student["student_id"] for s in m_students.json())

    # In Student Portal
    s_mentors = client.get("/api/student/my-mentors", headers=student["headers"])
    assert s_mentors.status_code == 200
    assert any(m["mentor_id"] == mentor["mentor_id"] for m in s_mentors.json())


def test_04_session_lifecycle_and_conflict_handling():
    """Verify session scheduling, conflict detection, rescheduling, cancellation, and history preservation."""
    mentor = register_and_login_mentor(name="Dr. Alan Turing")
    student = register_and_login_student(name="Ada Lovelace")

    # Connect them
    req_res = client.post("/api/student/mentorship-requests", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "topic": "Algorithmic Foundations",
    })
    req_id = req_res.json()["request_id"]
    client.post(f"/api/mentor/requests/{req_id}/accept", headers=mentor["headers"])

    # Target future date (e.g. 14 days ahead)
    future_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")

    # 1. Student schedules session
    sess_res = client.post("/api/student/sessions", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "topic": "Deep Dive: Turing Completeness & Complexity",
        "session_date": future_date,
        "start_time": "14:00",
        "end_time": "15:00",
        "platform": "Google Meet",
        "notes": "Review complexity classes P vs NP",
    })
    assert sess_res.status_code == 200, sess_res.text
    sess_id = sess_res.json()["data"]["session_id"]

    # 2. Scheduling conflicting session at exact same time is rejected
    conflict_res = client.post("/api/student/sessions", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "topic": "Conflicting Session",
        "session_date": future_date,
        "start_time": "14:30",
        "end_time": "15:30",
    })
    assert conflict_res.status_code == 400, "Overlapping session must be rejected"

    # 3. Reschedule session
    new_date = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
    resched_res = client.patch(f"/api/student/sessions/{sess_id}/reschedule", headers=student["headers"], json={
        "session_date": new_date,
        "start_time": "15:00",
        "end_time": "16:00",
        "notes": "Adjusted to avoid lecture clash",
    })
    assert resched_res.status_code == 200, resched_res.text

    # 4. View session in both portals
    m_sess = client.get("/api/mentor/sessions", headers=mentor["headers"]).json()
    assert any(s["session_id"] == sess_id for s in m_sess)

    s_sess = client.get("/api/student/sessions", headers=student["headers"]).json()
    assert any(s["session_id"] == sess_id for s in s_sess)

    # 5. Cancel a session and verify it remains in history
    cancel_res = client.patch(f"/api/student/sessions/{sess_id}/cancel", headers=student["headers"], json={
        "reason": "Family emergency, need to cancel",
    })
    assert cancel_res.status_code == 200, cancel_res.text

    s_sess_after = client.get("/api/student/sessions", headers=student["headers"]).json()
    cancelled_found = next((s for s in s_sess_after if s["session_id"] == sess_id), None)
    assert cancelled_found is not None, "Cancelled session must remain in history"
    assert cancelled_found["status"] == "cancelled"


def test_05_messaging_and_notifications_integrity():
    """Verify bidirectional messaging, unread counts, chronological loading, and notification dispatch."""
    mentor = register_and_login_mentor(name="Geoffrey Hinton")
    student = register_and_login_student(name="Yann LeCun")

    # Connect
    req_res = client.post("/api/student/mentorship-requests", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "topic": "Backpropagation research",
    })
    req_id = req_res.json()["request_id"]
    client.post(f"/api/mentor/requests/{req_id}/accept", headers=mentor["headers"])

    # 1. Mentor sends message to student
    send_res = client.post("/api/mentor/messages", headers=mentor["headers"], json={
        "student_id": student["student_id"],
        "content": "Welcome Yann! Excited to work on neural networks with you.",
    })
    assert send_res.status_code == 200, send_res.text

    # 2. Student checks unread messages count
    unread_res = client.get("/api/student/messages/unread-count", headers=student["headers"])
    assert unread_res.status_code == 200
    assert unread_res.json()["unread_count"] >= 1

    # 3. Student views conversation and marks read
    conv_res = client.get(f"/api/student/messages?mentor_id={mentor['mentor_id']}", headers=student["headers"])
    assert conv_res.status_code == 200
    messages = conv_res.json()
    assert len(messages) >= 1
    assert messages[-1]["content"] == "Welcome Yann! Excited to work on neural networks with you."

    mark_res = client.patch(f"/api/student/messages/read-thread?mentor_id={mentor['mentor_id']}", headers=student["headers"])
    assert mark_res.status_code == 200

    unread_res2 = client.get("/api/student/messages/unread-count", headers=student["headers"])
    assert unread_res2.json()["unread_count"] == 0

    # 4. Student replies to mentor
    reply_res = client.post("/api/student/messages", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "content": "Thank you Dr. Hinton! I am reviewing the backprop proofs now.",
    })
    assert reply_res.status_code == 200, reply_res.text

    # 5. Mentor sees reply in thread
    m_conv = client.get(f"/api/mentor/messages?student_id={student['student_id']}", headers=mentor["headers"]).json()
    assert any("backprop proofs" in m["content"] for m in m_conv)

    # 6. Verify cross-user isolation: unrelated student cannot read this conversation
    stranger = register_and_login_student(name="Stranger Student")
    leak_attempt = client.get(f"/api/student/messages?mentor_id={mentor['mentor_id']}", headers=stranger["headers"])
    assert leak_attempt.status_code == 403, "Unrelated student must be forbidden from accessing mentor conversation"
    assert "not assigned to you" in leak_attempt.json()["detail"].lower()


def test_06_student_progress_access_and_isolation():
    """Verify mentor access to assigned student roadmap/progress, and lockout of unassigned mentors."""
    mentor = register_and_login_mentor(name="Dr. Andrew Ng")
    unassigned_mentor = register_and_login_mentor(name="Dr. Unassigned")
    student = register_and_login_student(name="Demis Hassabis")

    # Connect mentor and student
    req_res = client.post("/api/student/mentorship-requests", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "topic": "Reinforcement Learning Mastery",
    })
    client.post(f"/api/mentor/requests/{req_res.json()['request_id']}/accept", headers=mentor["headers"])

    # 1. Assigned mentor accesses student progress
    prog_res = client.get(f"/api/mentor/students/{student['student_id']}/progress", headers=mentor["headers"])
    assert prog_res.status_code == 200, prog_res.text
    prog = prog_res.json()
    assert "overview" in prog
    assert "skill_progress" in prog
    assert "roadmap" in prog

    # 2. Unassigned mentor attempts to access student progress -> 403 Forbidden
    unauth_res = client.get(f"/api/mentor/students/{student['student_id']}/progress", headers=unassigned_mentor["headers"])
    assert unauth_res.status_code == 403, "Unassigned mentor must be forbidden from accessing student progress"


def test_07_assessment_and_project_review_lifecycle():
    """Verify mentor assigns assessment, student submits deliverable, mentor evaluates with rubric scoring."""
    mentor = register_and_login_mentor(name="Dr. Fei-Fei Li")
    student = register_and_login_student(name="Andrej Karpathy")

    # Connect
    req_res = client.post("/api/student/mentorship-requests", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "topic": "Computer Vision Architectures",
    })
    client.post(f"/api/mentor/requests/{req_res.json()['request_id']}/accept", headers=mentor["headers"])

    # Fetch available skill from backend
    skills_res = client.get("/api/skills")
    assert skills_res.status_code == 200
    skills_list = skills_res.json()
    skill_id = skills_list[0]["skill_id"] if skills_list else "SK001"

    # 1. Mentor assigns assessment
    due_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    create_res = client.post("/api/mentor/assessments", headers=mentor["headers"], json={
        "student_id": student["student_id"],
        "skill_id": skill_id,
        "title": "Convolutional Neural Network Benchmark",
        "description": "Implement ResNet-18 from scratch in PyTorch and report ImageNet accuracy.",
        "deadline": due_date,
        "max_score": 100,
        "criteria": [
            {"criterion": "Architecture Correctness", "max_points": 40},
            {"criterion": "Data Augmentation", "max_points": 30},
            {"criterion": "Training Convergence", "max_points": 30},
        ],
    })
    assert create_res.status_code == 200, create_res.text
    assessment_id = create_res.json()["data"]["assessment_id"]

    # 2. Student views assigned assessment
    s_assess = client.get("/api/student/mentor-assessments", headers=student["headers"]).json()
    assert any(a["assessment_id"] == assessment_id for a in s_assess)

    # 3. Student submits deliverable
    sub_res = client.post(f"/api/student/mentor-assessments/{assessment_id}/submit", headers=student["headers"], json={
        "submission_text": "Implemented Residual blocks with Skip connections and BatchNorm. Achieved 94.2% top-1 accuracy.",
        "attachment_url": "https://github.com/karpathy/resnet-scratch",
    })
    assert sub_res.status_code == 200, sub_res.text

    # Retrieve submission ID from mentor view
    submissions = client.get(f"/api/mentor/assessments/{assessment_id}/submissions", headers=mentor["headers"]).json()
    assert len(submissions) >= 1
    sub_id = submissions[0]["submission_id"]

    # 4. Mentor evaluates submission
    eval_res = client.post(f"/api/mentor/assessments/submissions/{sub_id}/evaluate", headers=mentor["headers"], json={
        "score": 96.0,
        "feedback": "Outstanding implementation of residual bottlenecks and learning rate warmup.",
        "rubric_scores": {
            "Architecture Correctness": 39,
            "Data Augmentation": 28,
            "Training Convergence": 29,
        },
    })
    assert eval_res.status_code == 200, eval_res.text

    # 5. Student views evaluated assessment with score and feedback
    s_evaluated = client.get(f"/api/student/mentor-assessments/{assessment_id}", headers=student["headers"]).json()
    assert s_evaluated["my_submission"] is not None
    assert s_evaluated["my_submission"]["score"] == 96.0
    assert "residual bottlenecks" in s_evaluated["my_submission"]["feedback"]
    assert s_evaluated["my_submission"]["rubric_scores"]["Architecture Correctness"] == 39


def test_08_career_guidance_and_private_notes_protection():
    """Verify mentor guidance notes, recommended items, and strict isolation of private notes from student."""
    mentor = register_and_login_mentor(name="Dr. Yannic Kilcher")
    student = register_and_login_student(name="Chris Olah")

    # Connect
    req_res = client.post("/api/student/mentorship-requests", headers=student["headers"], json={
        "mentor_id": mentor["mentor_id"],
        "topic": "Interpretability Research",
    })
    client.post(f"/api/mentor/requests/{req_res.json()['request_id']}/accept", headers=mentor["headers"])

    # 1. Mentor records career guidance with private notes
    guidance_res = client.post(f"/api/mentor/career-guidance/{student['student_id']}", headers=mentor["headers"], json={
        "student_id": student["student_id"],
        "notes": "Focus on mechanistic interpretability and circuits in transformer models.",
        "recommended_skills": ["Transformer Circuits", "Linear Probing", "Activation Patching"],
        "recommended_courses": ["CS224N: Natural Language Processing with Deep Learning"],
        "recommended_projects": ["Attention Head Attribution Tool"],
        "preparation_activities": ["Read Anthropic Circuit Papers 1 through 3"],
        "action_items": ["Publish open-source visualization demo", "Write exploratory blog post"],
        "private_notes": "CONFIDENTIAL: Student shows exceptional analytical depth. Consider for lab internship.",
        "follow_up_date": (datetime.now() + timedelta(days=21)).strftime("%Y-%m-%d"),
    })
    assert guidance_res.status_code == 200, guidance_res.text

    # 2. Mentor views guidance (private notes are visible to mentor)
    m_guidance = client.get(f"/api/mentor/career-guidance/{student['student_id']}", headers=mentor["headers"]).json()
    assert "guidance_notes" in m_guidance
    assert len(m_guidance["guidance_notes"]) >= 1
    m_record = m_guidance["guidance_notes"][0]
    assert "CONFIDENTIAL" in (m_record.get("private_notes") or "")

    # 3. Student views career guidance (CONFIDENTIAL notes MUST BE ABSENT OR HIDDEN)
    s_guidance = client.get("/api/student/career-guidance", headers=student["headers"]).json()
    assert len(s_guidance) >= 1
    s_record = s_guidance[0]
    assert "CONFIDENTIAL" not in str(s_record)
    assert "private_notes" not in s_record or s_record["private_notes"] is None
    guidance_id = s_record["id"]

    # 4. Student updates guidance status to 'completed'
    stat_res = client.patch(f"/api/student/career-guidance/{guidance_id}/status", headers=student["headers"], json={
        "status": "completed",
    })
    assert stat_res.status_code == 200, stat_res.text

    # Verify status changed
    s_guidance_after = client.get("/api/student/career-guidance", headers=student["headers"]).json()
    assert s_guidance_after[0]["status"] == "completed"

    # 5. Unauthorized student cannot tamper with guidance status
    imposter = register_and_login_student(name="Imposter Student")
    tamper_res = client.patch(f"/api/student/career-guidance/{guidance_id}/status", headers=imposter["headers"], json={
        "status": "rejected",
    })
    assert tamper_res.status_code in (404, 403), "Tampering with other student guidance must fail"


if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main(["-v", __file__]))
