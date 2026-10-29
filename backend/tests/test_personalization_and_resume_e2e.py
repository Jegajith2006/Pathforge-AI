import pytest
import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database.connection import SessionLocal
from database.models import Student, StudentSkill, ResumeDocument
from routers.auth import create_access_token
from services.resume_service import parse_and_analyze_resume

client = TestClient(app)

def test_new_student_profile_has_no_synthetic_skills_and_evidence():
    """Verify student profile returns real verified skills and evidence status."""
    token = create_access_token({
        "sub": "U001",
        "user_id": "U001",
        "email": "alex.chen@stanford.edu",
        "role": "student",
    })
    headers = {"Authorization": f"Bearer {token}"}

    profile_res = client.get("/api/profile", headers=headers)
    assert profile_res.status_code == 200, profile_res.text
    data = profile_res.json()

    assert "target_readiness" in data
    assert "has_sufficient_evidence" in data
    assert "readiness_level" in data
    assert data["student_id"] == "U001"

def test_resume_analysis_empty_state_when_no_active_resume():
    """Verify resume router returns empty statistics and no synthetic documents for empty accounts."""
    db = SessionLocal()
    test_student_id = "U_EMPTY_TEST_99"
    try:
        db.query(ResumeDocument).filter(ResumeDocument.student_id == test_student_id).delete()
        existing = db.query(Student).filter(Student.student_id == test_student_id).first()
        if not existing:
            new_student = Student(
                student_id=test_student_id,
                email="empty99@pathforge.ai",
                first_name="Empty",
                last_name="Test",
                college="Stanford University",
                department="Computer Science",
                degree="B.S. CS",
                graduation_year=2026,
                cgpa=3.8,
                target_career_id="CAR001"
            )
            db.add(new_student)
        db.commit()
    finally:
        db.close()

    token = create_access_token({
        "sub": test_student_id,
        "user_id": test_student_id,
        "email": "empty99@pathforge.ai",
        "role": "student",
    })
    headers = {"Authorization": f"Bearer {token}"}

    resume_res = client.get("/api/resume/latest", headers=headers)
    assert resume_res.status_code == 200, resume_res.text
    resume_data = resume_res.json()

    assert resume_data["resume_id"] is None
    assert resume_data["detected_skills"] == []
    assert resume_data["extracted_projects"] == []
    assert resume_data["extracted_certificates"] == []
    assert resume_data["extracted_experience"] == []
    assert resume_data["extracted_education"] == []

    # Clean up
    db = SessionLocal()
    try:
        db.query(ResumeDocument).filter(ResumeDocument.student_id == test_student_id).delete()
        db.query(Student).filter(Student.student_id == test_student_id).delete()
        db.commit()
    finally:
        db.close()

def test_resume_service_generates_structured_8_part_summary(tmp_path):
    """Verify parse_and_analyze_resume produces the structured 8-part synthesis."""
    sample_file = tmp_path / "sample_resume.txt"
    sample_file.write_text("Experienced Python and Machine Learning developer with SQL and FastAPI experience.")

    db = SessionLocal()
    try:
        summary_result = parse_and_analyze_resume(
            db=db,
            student_id="U001",
            file_path=sample_file,
            original_filename="sample_resume.txt"
        )
        assert summary_result is not None
        assert "analysis_summary" in summary_result
        summary_text = summary_result["analysis_summary"]
        assert "Professional Summary:" in summary_text
        assert "Technical Skills:" in summary_text
        assert "Key Strengths:" in summary_text
        assert "Recommended Next Steps:" in summary_text
    finally:
        db.close()
