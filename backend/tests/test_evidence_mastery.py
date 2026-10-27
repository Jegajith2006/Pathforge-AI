"""
PathForge AI - Comprehensive Multi-Source Evidence Mastery Test Suite
Validates all 8 specific cases, dynamic renormalization, missing mentor exclusion,
and live database persistence across assessment, project, certificate, mentor, and skills endpoints.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from database.connection import init_db, SessionLocal
from database.models import Student, Skill, StudentSkill, Project, Career
from ml.skill_matching import calculate_final_mastery, classify_skill_level
from services.skill_gap_service import calibrate_mastery_score, update_or_create_student_skill

init_db()
client = TestClient(app)


# ---------------------------------------------------------------------------
# UNIT / ALGORITHMIC TESTS (CASES 1 - 5 + 16)
# ---------------------------------------------------------------------------

def test_case_1_only_self_declared():
    """CASE 1: Only self-declared evidence."""
    res = calculate_final_mastery(self_declared_score=85)
    # With only self-declared active, normalized weight is 1.0 (85 * 0.10 / 0.10 = 85)
    assert res["final_mastery"] == 85
    assert res["mastery_level"] == "Advanced"
    assert res["evidence_count"] == 1
    assert "self_declared" in res["active_weights"]
    assert res["active_weights"]["self_declared"] == 1.0


def test_case_2_self_plus_assessment():
    """CASE 2: Self + assessment."""
    # Self: 90 (weight 0.10), Assessment: 60 (weight 0.35)
    # Denominator = 0.45. Weighted sum = 9.0 + 21.0 = 30.0 -> 30.0 / 0.45 = 66.67 -> 67
    res = calculate_final_mastery(self_declared_score=90, assessment_score=60)
    assert res["final_mastery"] == 67
    assert res["mastery_level"] == "Developing"  # 40-69
    assert res["evidence_count"] == 2
    assert "self_declared" in res["active_weights"]
    assert "assessment" in res["active_weights"]


def test_case_3_five_sources_mentor_missing():
    """CASE 3: Self + resume + assessment + project + certificate (Mentor missing)."""
    # Self: 90, Resume: 80, Assessment: 52, Project: 70, Cert: 60, Mentor: 0
    # Active sum = 0.10 + 0.15 + 0.35 + 0.20 + 0.10 = 0.90
    # Weighted sum = 9.0 + 12.0 + 18.2 + 14.0 + 6.0 = 59.2 -> 59.2 / 0.90 = 65.77 -> 66
    res = calculate_final_mastery(
        self_declared_score=90,
        resume_score=80,
        assessment_score=52,
        project_score=70,
        certificate_score=60,
        mentor_score=0,
    )
    assert res["final_mastery"] == 66
    assert res["mastery_level"] == "Developing"
    assert res["evidence_count"] == 5
    assert "mentor" not in res["active_weights"]


def test_case_4_all_six_sources():
    """CASE 4: All six evidence sources present."""
    # Self: 90, Resume: 80, Assessment: 52, Project: 70, Cert: 60, Mentor: 80
    # Denominator = 1.00. Weighted sum = 59.2 + 8.0 = 67.2 -> 67
    res = calculate_final_mastery(
        self_declared_score=90,
        resume_score=80,
        assessment_score=52,
        project_score=70,
        certificate_score=60,
        mentor_score=80,
    )
    assert res["final_mastery"] == 67
    assert res["evidence_count"] == 6
    assert len(res["active_weights"]) == 6


def test_case_5_and_16_mentor_exclusion_denominator():
    """
    CASE 5 & Requirement 16:
    Verify that missing mentor evidence is dynamically excluded from denominator
    rather than penalizing the student as zero.
    """
    res_no_mentor = calculate_final_mastery(
        self_declared_score=90,
        resume_score=80,
        assessment_score=80,
        project_score=80,
        certificate_score=80,
        mentor_score=0,  # Missing
    )
    # If missing mentor were treated as zero with fixed 1.0 denominator:
    # (9 + 12 + 28 + 16 + 8) / 1.00 = 73
    # With dynamic renormalization:
    # 73 / 0.90 = 81.11 -> 81!
    assert res_no_mentor["final_mastery"] == 81
    assert res_no_mentor["mastery_level"] == "Proficient"  # 70-84


def test_case_6_assessment_score_changes():
    """CASE 6: Assessment score changes from 52 to 80 and final mastery must recalculate."""
    before = calculate_final_mastery(
        self_declared_score=90,
        resume_score=80,
        assessment_score=52,
        project_score=70,
        certificate_score=60,
    )
    assert before["final_mastery"] == 66
    assert before["mastery_level"] == "Developing"

    # Assessment increases to 80
    # Weighted sum: 9 + 12 + (80 * 0.35 = 28) + 14 + 6 = 69.0 -> 69.0 / 0.90 = 76.67 -> 77
    after = calculate_final_mastery(
        self_declared_score=90,
        resume_score=80,
        assessment_score=80,
        project_score=70,
        certificate_score=60,
    )
    assert after["final_mastery"] == 77
    assert after["mastery_level"] == "Proficient"
    assert after["final_mastery"] > before["final_mastery"]


def test_case_7_project_evidence_added():
    """CASE 7: Project evidence added and final mastery must recalculate."""
    # Before project: Self: 90, Assessment: 60
    before = calculate_final_mastery(self_declared_score=90, assessment_score=60)
    assert before["final_mastery"] == 67
    assert before["evidence_count"] == 2

    # Add project score 80
    # Active sum = 0.10 + 0.35 + 0.20 = 0.65
    # Weighted sum = 9 + 21 + 16 = 46.0 -> 46.0 / 0.65 = 70.77 -> 71
    after = calculate_final_mastery(
        self_declared_score=90,
        assessment_score=60,
        project_score=80,
    )
    assert after["final_mastery"] == 71
    assert after["mastery_level"] == "Proficient"
    assert after["evidence_count"] == 3
    assert after["final_mastery"] > before["final_mastery"]


def test_case_8_certificate_verified():
    """CASE 8: Certificate verified and final mastery must recalculate."""
    # Initial state: Self 90, Assessment 60, Project 80 -> 71
    before = calculate_final_mastery(
        self_declared_score=90,
        assessment_score=60,
        project_score=80,
    )
    assert before["final_mastery"] == 71

    # Certificate verified with score 80
    # Active sum = 0.65 + 0.10 = 0.75
    # Weighted sum = 46.0 + 8.0 = 54.0 -> 54.0 / 0.75 = 72.0 -> 72
    after = calculate_final_mastery(
        self_declared_score=90,
        assessment_score=60,
        project_score=80,
        certificate_score=80,
    )
    assert after["final_mastery"] == 72
    assert after["evidence_count"] == 4
    assert after["final_mastery"] >= before["final_mastery"]


# ---------------------------------------------------------------------------
# DATABASE INTEGRATION & ENDPOINT PERSISTENCE TESTS
# ---------------------------------------------------------------------------

def test_db_update_or_create_student_skill():
    """Direct database verification of update_or_create_student_skill persistence."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        assert student is not None

        # Use an isolated skill to avoid interference from pre-seeded sample data
        test_skill_id = "SK_TEST_ISOLATED_MASTERY"
        skill = db.query(Skill).filter(Skill.skill_id == test_skill_id).first()
        if not skill:
            skill = Skill(
                skill_id=test_skill_id,
                skill_name="Isolated Test Skill",
                category="Testing",
                subcategory="Quality",
                description="Skill used for isolated mastery unit tests",
                beginner_definition="Beginner test definition",
                intermediate_definition="Intermediate test definition",
                advanced_definition="Advanced test definition",
            )
            db.add(skill)
            db.commit()

        # Clean existing test student skill if any
        db.query(StudentSkill).filter(
            StudentSkill.student_id == student.student_id,
            StudentSkill.skill_id == test_skill_id,
        ).delete()
        db.commit()

        # 1. Self declared update
        ss = update_or_create_student_skill(
            db=db,
            student_id=student.student_id,
            skill_id=test_skill_id,
            self_declared_score=85,
        )
        db.commit()
        db.refresh(ss)

        assert ss.self_declared_score == 85
        assert ss.final_mastery == 85
        assert ss.mastery_level == "Advanced"
        assert ss.evidence_count == 1

        # 2. Add assessment score 60
        ss = update_or_create_student_skill(
            db=db,
            student_id=student.student_id,
            skill_id=skill.skill_id,
            assessment_score=60,
        )
        db.commit()
        db.refresh(ss)

        # 85*0.1 + 60*0.35 = 8.5 + 21 = 29.5 / 0.45 = 65.56 -> 66
        assert ss.assessment_score == 60
        assert ss.final_mastery == 66
        assert ss.mastery_level == "Developing"
        assert ss.evidence_count == 2
    finally:
        db.close()


def test_api_declare_skill():
    """API endpoint test: POST /api/skills/declare and GET /api/skills/mastery."""
    db = SessionLocal()
    skill = db.query(Skill).first()
    db.close()

    res = client.post("/api/skills/declare", json={
        "skill_id": skill.skill_id,
        "self_declared_score": 90,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["skill_id"] == skill.skill_id
    assert data["self_declared_score"] == 90
    assert "final_mastery" in data
    assert "mastery_level" in data

    # Verify reflected in GET /api/skills/mastery
    res_mastery = client.get("/api/skills/mastery")
    assert res_mastery.status_code == 200
    m_list = res_mastery.json()
    matched = [s for s in m_list if s["skill_id"] == skill.skill_id]
    assert len(matched) == 1
    assert matched[0]["self_declared"] == 90
    assert "status" in matched[0]


def test_api_certificate_upload_persists_evidence():
    """API endpoint test: POST /api/certificates/upload updates skill evidence."""
    db = SessionLocal()
    skill = db.query(Skill).first()
    db.close()

    res = client.post("/api/certificates/upload", json={
        "provider": "Coursera",
        "course_name": "Specialization in Modern Engineering",
        "skill_id": skill.skill_id,
        "certificate_url": "https://coursera.org/verify/TEST1234",
    })
    assert res.status_code == 200

    # Query skill mastery to confirm certificate evidence is linked
    res_mastery = client.get(f"/api/skills/{skill.skill_id}/mastery")
    assert res_mastery.status_code == 200
    m_data = res_mastery.json()
    assert m_data["certificate"] is True
    assert m_data["certificate_score"] == 80


def test_api_mentor_feedback_persists_evidence():
    """API endpoint test: POST /api/mentor/feedback updates mentor evidence."""
    db = SessionLocal()
    skill = db.query(Skill).first()
    student = db.query(Student).first()
    project = db.query(Project).first()
    db.close()

    res = client.post("/api/mentor/feedback", json={
        "mentor_id": "M001",
        "project_id": project.project_id if project else "P001",
        "skill_id": skill.skill_id,
        "rating": 4,  # 4/5 -> 80%
        "strengths": "Solid understanding of clean architecture.",
        "improvement_areas": "Add comprehensive automated tests.",
        "comments": "Great progress overall.",
        "recommended_action": "Complete capstone integration.",
    })
    assert res.status_code == 200

    # Verify skill mastery now contains mentor evidence
    res_mastery = client.get(f"/api/skills/{skill.skill_id}/mastery")
    assert res_mastery.status_code == 200
    m_data = res_mastery.json()
    assert m_data["mentor_score"] == 80
    assert m_data["mentor"] == "Verified"


def test_api_project_complete_persists_evidence():
    """API endpoint test: POST /api/projects/{project_id}/complete updates project skills."""
    db = SessionLocal()
    project = db.query(Project).filter(Project.skills.any()).first()
    if not project:
        project = db.query(Project).first()
    proj_id = project.project_id
    related_skills = [ps.skill_id for ps in project.skills] if project.skills else []
    db.close()

    res = client.post(f"/api/projects/{proj_id}/complete")
    assert res.status_code == 200

    # If project had skills, verify at least one has updated project evidence
    if related_skills:
        test_skill_id = related_skills[0]
        res_mastery = client.get(f"/api/skills/{test_skill_id}/mastery")
        assert res_mastery.status_code == 200
        m_data = res_mastery.json()
        assert m_data["project"] is True
        assert m_data["project_score"] > 0
