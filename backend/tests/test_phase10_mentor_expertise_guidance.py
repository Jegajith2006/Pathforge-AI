import os
import sys
import uuid
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from database.connection import init_db

client = TestClient(app)

def test_phase10_flow():
    print("--- 1. Testing Health & Public Discovery ---")
    res = client.get("/health")
    assert res.status_code == 200, res.text

    res = client.get("/api/mentors")
    assert res.status_code == 200, res.text
    mentors = res.json()
    assert len(mentors) > 0, "Expected at least 1 mentor in database"
    first_mentor = mentors[0]
    print(f"Found {len(mentors)} mentors. First: {first_mentor['name']} ({first_mentor['mentor_id']})")

    # Filter test: Search
    res = client.get(f"/api/mentors?query={first_mentor['name'].split()[0]}")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # Filter test: Min Experience
    res = client.get("/api/mentors?min_experience=20")
    assert res.status_code == 200

    # Skill categories
    res = client.get("/api/skills/categories")
    assert res.status_code == 200
    cat_data = res.json()
    assert "categories" in cat_data
    assert "catalog_skills" in cat_data
    print(f"Categories: {len(cat_data['categories'])}, Catalog skills: {len(cat_data['catalog_skills'])}")

    print("--- 2. Registering & Authenticating Mentor ---")
    email = f"mentor.p10.{uuid.uuid4().hex[:6]}@pathforge.ai"
    reg_res = client.post("/api/auth/register/mentor", json={
        "name": "Dr. Sarah Connor",
        "email": email,
        "password": "Password123!",
        "title": "Principal AI Systems Architect",
        "experience_years": 10,
        "expertise_areas": ["Machine Learning", "System Design"],
        "company": "Cyberdyne AI Labs",
        "linkedin_url": "https://linkedin.com/in/sarah-connor",
        "bio": "Expert in deep learning, resilient distributed infrastructure, and model deployment.",
    })
    assert reg_res.status_code == 200, reg_res.text
    reg_data = reg_res.json()
    if reg_data.get("status") == "pending_verification":
        from services.email_service import email_service
        otp = email_service.get_latest_otp_for_email(email)
        v_res = client.post("/api/auth/verify-email", json={
            "challenge_id": reg_data["challenge_id"],
            "otp": otp,
        })
        assert v_res.status_code == 200, v_res.text
        reg_data = v_res.json()

    token = reg_data["access_token"]
    mentor_id = reg_data["user_id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Authenticated mentor: {mentor_id}")

    print("--- 3. Testing Mentor Profile Read & Update ---")
    p_res = client.get("/api/mentor/profile", headers=headers)
    assert p_res.status_code == 200, p_res.text
    profile = p_res.json()
    assert profile["mentor_id"] == mentor_id
    assert profile["name"] == "Dr. Sarah Connor"

    # Update profile fields
    up_res = client.put("/api/mentor/profile", headers=headers, json={
        "headline": "Lead AI Architect @ Cyberdyne | PhD Stanford",
        "education": "Ph.D. in Computer Science, Stanford University (2015)",
        "certifications": "AWS Certified Machine Learning - Specialty, GCP Professional ML Engineer",
        "languages": "English, French, German",
        "career_specializations": "Deep Learning, Autonomous Systems, MLOps",
        "github_url": "https://github.com/sarah-connor",
        "portfolio_url": "https://sarahconnor.ai",
        "experience_years": 11,
    })
    assert up_res.status_code == 200, up_res.text

    # Verify updated fields
    p_res2 = client.get("/api/mentor/profile", headers=headers)
    assert p_res2.status_code == 200
    p2 = p_res2.json()
    assert p2["headline"] == "Lead AI Architect @ Cyberdyne | PhD Stanford"
    assert p2["education"] == "Ph.D. in Computer Science, Stanford University (2015)"
    assert p2["certifications"] == "AWS Certified Machine Learning - Specialty, GCP Professional ML Engineer"
    assert p2["languages"] == "English, French, German"
    assert p2["github_url"] == "https://github.com/sarah-connor"
    assert p2["portfolio_url"] == "https://sarahconnor.ai"
    assert p2["experience_years"] == 11
    print("Profile update verified successfully!")

    # Verify invalid URL validation
    inv_url_res = client.put("/api/mentor/profile", headers=headers, json={
        "linkedin_url": "not-a-valid-url",
    })
    assert inv_url_res.status_code == 400, "Expected 400 on invalid URL"
    print("URL validation rejected invalid URL successfully.")

    print("--- 4. Testing Mentor Expertise & Skills ---")
    s_res = client.get("/api/mentor/skills", headers=headers)
    assert s_res.status_code == 200, s_res.text
    skills_initial = s_res.json()
    print(f"Initial mentor skills: {len(skills_initial)}")

    # Add skill
    add_s_res = client.post("/api/mentor/skills", headers=headers, json={
        "skill_name": "Distributed PyTorch Training",
        "category": "machine learning",
        "proficiency_level": "Expert",
        "years_of_experience": 6,
        "is_willing_to_mentor": True,
    })
    assert add_s_res.status_code == 200, add_s_res.text
    skill_entry_id = add_s_res.json()["data"]["skill_id"]

    # Verify duplicate skill check
    dup_res = client.post("/api/mentor/skills", headers=headers, json={
        "skill_name": "Distributed PyTorch Training",
    })
    assert dup_res.status_code == 400, "Expected 400 for duplicate skill"
    print("Duplicate skill prevented successfully.")

    # Update skill
    up_s_res = client.put(f"/api/mentor/skills/{skill_entry_id}", headers=headers, json={
        "proficiency_level": "Master / Expert",
        "years_of_experience": 8,
    })
    assert up_s_res.status_code == 200, up_s_res.text

    # Read skills again
    s_res2 = client.get("/api/mentor/skills", headers=headers)
    assert s_res2.status_code == 200
    my_skill = next((s for s in s_res2.json() if s["id"] == skill_entry_id), None)
    assert my_skill is not None
    assert my_skill["proficiency_level"] == "Master / Expert"
    assert my_skill["years_of_experience"] == 8
    print("Mentor skills management verified successfully!")

    print("--- 5. Testing Mentor Availability ---")
    av_res = client.get("/api/mentor/availability", headers=headers)
    assert av_res.status_code == 200, av_res.text
    av_data = av_res.json()
    print(f"Default availability days: {av_data['available_days']}, times: {av_data['start_time']} - {av_data['end_time']}")

    # Update availability
    up_av_res = client.put("/api/mentor/availability", headers=headers, json={
        "available_days": ["Monday", "Wednesday", "Friday"],
        "start_time": "10:00",
        "end_time": "16:00",
        "session_duration": 45,
        "timezone": "America/New_York",
        "unavailable_dates": ["2026-11-26", "2026-12-25"],
        "notes": "Available for 1:1 architecture and research roadmap consultations.",
    })
    assert up_av_res.status_code == 200, up_av_res.text

    # Read availability back
    av_res2 = client.get("/api/mentor/availability", headers=headers)
    assert av_res2.status_code == 200
    av2 = av_res2.json()
    assert av2["available_days"] == ["Monday", "Wednesday", "Friday"]
    assert av2["start_time"] == "10:00"
    assert av2["end_time"] == "16:00"
    assert av2["session_duration"] == 45
    assert av2["timezone"] == "America/New_York"
    assert "2026-11-26" in av2["unavailable_dates"]
    print("Availability persisted and verified after refresh!")

    # Check available slots for a Wednesday (e.g. 2026-11-04 is a Wednesday)
    slots_res = client.get(f"/api/mentors/{mentor_id}/available-slots?date=2026-11-04")
    assert slots_res.status_code == 200, slots_res.text
    slot_info = slots_res.json()
    assert slot_info["is_working_day"] is True
    assert len(slot_info["slots"]) > 0
    print(f"Generated {len(slot_info['slots'])} slots for Wednesday 2026-11-04. First slot: {slot_info['slots'][0]}")

    # Check unavailable date (2026-11-26)
    unavail_slots = client.get(f"/api/mentors/{mentor_id}/available-slots?date=2026-11-26")
    assert unavail_slots.status_code == 200
    assert unavail_slots.json()["is_working_day"] is False
    print("Unavailable date correctly blocked!")

    # Check non-working day (Tuesday 2026-11-03)
    tue_slots = client.get(f"/api/mentors/{mentor_id}/available-slots?date=2026-11-03")
    assert tue_slots.status_code == 200
    assert tue_slots.json()["is_working_day"] is False
    print("Non-working day correctly blocked!")

    print("--- 6. Registering Student & Mentorship Request Workflow ---")
    s_email = f"student.p10.{uuid.uuid4().hex[:6]}@pathforge.ai"
    s_reg = client.post("/api/auth/register/student", json={
        "email": s_email,
        "password": "Password123!",
        "first_name": "Marcus",
        "last_name": "Wright",
        "career_id": "C01",
    })
    assert s_reg.status_code == 200, s_reg.text
    s_data = s_reg.json()
    if s_data.get("status") == "pending_verification":
        from services.email_service import email_service
        s_otp = email_service.get_latest_otp_for_email(s_email)
        v_res = client.post("/api/auth/verify-email", json={
            "challenge_id": s_data["challenge_id"],
            "otp": s_otp,
        })
        assert v_res.status_code == 200, v_res.text
        s_data = v_res.json()

    s_token = s_data["access_token"]
    student_id = s_data["user_id"]
    s_headers = {"Authorization": f"Bearer {s_token}"}
    print(f"Authenticated student: {student_id}")

    # Student requests mentorship
    req_res = client.post("/api/student/mentorship-requests", headers=s_headers, json={
        "mentor_id": mentor_id,
        "message": "I would love guidance on advancing my Machine Learning career path.",
        "career_goal": "Machine Learning Engineer",
    })
    assert req_res.status_code == 200, req_res.text
    req_id = req_res.json()["request_id"]

    # Prevent duplicate pending request
    dup_req = client.post("/api/student/mentorship-requests", headers=s_headers, json={
        "mentor_id": mentor_id,
        "message": "Duplicate request",
    })
    assert dup_req.status_code == 400
    print("Duplicate mentorship request rejected correctly.")

    # Mentor accepts request
    acc_res = client.post(f"/api/mentor/requests/{req_id}/accept", headers=headers, json={
        "response_note": "Welcome Marcus, excited to guide your ML roadmap!",
    })
    assert acc_res.status_code == 200, acc_res.text
    print("Mentor accepted request and established active mentorship connection.")

    print("--- 7. Testing Career Guidance Workflow ---")
    # Mentor views student career guidance workspace
    cg_res = client.get(f"/api/mentor/career-guidance/{student_id}", headers=headers)
    assert cg_res.status_code == 200, cg_res.text
    cg_data = cg_res.json()
    assert "skill_gaps" in cg_data
    assert cg_data["target_career_name"] is not None
    print(f"Student target career: {cg_data['target_career_name']}, Skill gaps count: {len(cg_data['skill_gaps'])}")

    # Mentor submits guidance with private notes
    save_cg_res = client.post(f"/api/mentor/career-guidance/{student_id}", headers=headers, json={
        "student_id": student_id,
        "notes": "Focus on distributed model training and deep learning optimization. Great fundamental Python skills.",
        "recommended_skills": ["PyTorch", "CUDA Basics", "MLOps Pipelines"],
        "recommended_courses": ["Advanced Deep Learning Specialization", "Distributed Systems in PyTorch"],
        "recommended_projects": ["Build an end-to-end LLM Fine-Tuning Pipeline with LoRA"],
        "preparation_activities": ["Review PyTorch DDP documentation", "Implement gradient checkpointing benchmark"],
        "action_items": ["Complete DDP benchmark script", "Submit project repo for mentor review by next session"],
        "private_notes": "Student is motivated; monitor conceptual understanding of gradient all-reduce latency.",
        "follow_up_date": "2026-11-18",
    })
    assert save_cg_res.status_code == 200, save_cg_res.text
    print("Career guidance saved with recommendations, action items, and private notes.")

    # Student retrieves guidance
    s_cg_res = client.get("/api/student/career-guidance", headers=s_headers)
    assert s_cg_res.status_code == 200, s_cg_res.text
    s_guidance_list = s_cg_res.json()
    assert len(s_guidance_list) >= 1
    sg0 = s_guidance_list[0]
    assert sg0["mentor_id"] == mentor_id
    assert sg0["mentor_name"] == "Dr. Sarah Connor"
    assert "PyTorch" in sg0["recommended_skills"]
    assert "Build an end-to-end LLM Fine-Tuning Pipeline with LoRA" in sg0["recommended_projects"]
    assert len(sg0["action_items"]) == 2
    # Verify that private_notes is NOT exposed to student!
    assert "private_notes" not in sg0, "Security violation: private_notes must not be visible to student!"
    print("Student guidance verified; private mentor notes strictly protected!")

    # Student updates guidance status
    st_up_res = client.patch(f"/api/student/career-guidance/{sg0['id']}/status", headers=s_headers, json={
        "status": "in_progress"
    })
    assert st_up_res.status_code == 200
    print("Student guidance status update verified!")

    print("--- 8. Testing Session Scheduling with Availability Validation ---")
    # Try to schedule on an invalid non-working day (Tuesday 2026-11-03)
    bad_sess = client.post("/api/student/sessions", headers=s_headers, json={
        "mentor_id": mentor_id,
        "topic": "Architecture Review",
        "session_date": "2026-11-03",
        "start_time": "10:00",
        "end_time": "10:45",
    })
    assert bad_sess.status_code == 400
    assert "not available on Tuesday" in bad_sess.json()["detail"]
    print("Session scheduling on non-available day rejected correctly!")

    # Try to schedule outside working hours (08:00)
    bad_hours_sess = client.post("/api/student/sessions", headers=s_headers, json={
        "mentor_id": mentor_id,
        "topic": "Early Morning Session",
        "session_date": "2026-11-04",
        "start_time": "08:00",
        "end_time": "08:45",
    })
    assert bad_hours_sess.status_code == 400
    assert "outside mentor's available window" in bad_hours_sess.json()["detail"]
    print("Session scheduling outside working hours rejected correctly!")

    # Schedule a valid session on Wednesday 2026-11-04 10:00 - 10:45
    good_sess = client.post("/api/student/sessions", headers=s_headers, json={
        "mentor_id": mentor_id,
        "topic": "Distributed Training Deep Dive",
        "session_date": "2026-11-04",
        "start_time": "10:00",
        "end_time": "10:45",
    })
    assert good_sess.status_code == 200, good_sess.text
    print("Valid session scheduled successfully within mentor's availability!")

    # Now verify that available slots on 2026-11-04 shows 10:00 is now booked!
    slots_res_after = client.get(f"/api/mentors/{mentor_id}/available-slots?date=2026-11-04")
    assert slots_res_after.status_code == 200
    slots_after = slots_res_after.json()["slots"]
    slot_10 = next((s for s in slots_after if s["start_time"] == "10:00"), None)
    assert slot_10 is not None
    assert slot_10["is_available"] is False, "Booked slot must show is_available=False!"
    print("Booked slot correctly flagged as unavailable in public slots query!")

    # Try duplicate conflicting session at same time
    dup_sess = client.post("/api/student/sessions", headers=s_headers, json={
        "mentor_id": mentor_id,
        "topic": "Conflicting Session",
        "session_date": "2026-11-04",
        "start_time": "10:00",
        "end_time": "10:45",
    })
    assert dup_sess.status_code == 400
    print("Conflicting session overlap blocked correctly!")

    print("\nALL PHASE 10 BACKEND TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    test_phase10_flow()
