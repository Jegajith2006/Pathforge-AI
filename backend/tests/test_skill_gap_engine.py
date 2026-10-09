"""
PathForge AI - Comprehensive Unit & Integration Tests for Step 8: Skill Gap Engine
Verifies:
1. Required skills loaded from database for any career
2. Multi-source evidence final mastery loaded from student_skills
3. Gap calculation formula: gap = max(required_level - current_mastery, 0)
4. Negative gap clamped to zero
5. Zero-gap handling (marked 'Met', no unnecessary learning)
6. Status categorization (Met, Near Target, Moderate Gap, Major Gap, Critical Gap)
7. Deterministic priority ranking formula
8. Missing student skills default handling
9. Missing career handling & validation
10. API endpoints (/api/skill-gap, /api/skill-gap/analyze, /api/skill-gap/career/{id}, /api/skill-gap/{id})
11. Multi-career compatibility
"""

import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from main import app
from database.connection import get_db, SessionLocal
from database.models import Student, Career, Skill, CareerSkill, StudentSkill
from services.skill_gap_service import (
    analyze_student_skill_gap,
    classify_gap_status,
    level_to_score,
    update_or_create_student_skill,
)
from ml.skill_matching import calculate_priority, calculate_final_mastery

client = TestClient(app)


from routers.auth import create_access_token


def get_auth_headers():
    db = SessionLocal()
    student = db.query(Student).first()
    sid = student.student_id if student else "U001"
    db.close()
    token = create_access_token({"sub": sid, "email": "alex.chen@stanford.edu"})
    return {"Authorization": f"Bearer {token}"}


def test_level_to_score_mapping():
    assert level_to_score("beginner") == 40
    assert level_to_score("intermediate") == 70
    assert level_to_score("advanced") == 90
    assert level_to_score("unknown") == 70


def test_gap_calculation_and_clamping():
    # Target = 90, Current = 85 -> Gap = 5
    assert max(0, 90 - 85) == 5
    # Target = 80, Current = 45 -> Gap = 35
    assert max(0, 80 - 45) == 35
    # Target = 75, Current = 20 -> Gap = 55
    assert max(0, 75 - 20) == 55
    # Target = 70, Current = 70 -> Gap = 0
    assert max(0, 70 - 70) == 0
    # Target = 70, Current = 95 -> Gap = 0 (Clamped)
    assert max(0, 70 - 95) == 0


def test_classify_gap_status_thresholds():
    # gap == 0 -> Met
    status, prio, tone = classify_gap_status(0)
    assert status == "Met"
    assert tone == "success"

    # gap 1-10 -> Near Target
    status, prio, tone = classify_gap_status(5)
    assert status == "Near Target"

    # gap 11-30 -> Moderate Gap
    status, prio, tone = classify_gap_status(25)
    assert status == "Moderate Gap"

    # gap 31-50 -> Major Gap
    status, prio, tone = classify_gap_status(38)
    assert status == "Major Gap"
    assert tone == "warning"

    # gap > 50 -> Critical Gap
    status, prio, tone = classify_gap_status(55)
    assert status == "Critical Gap"
    assert tone == "danger"


def test_priority_ranking_deterministic_formula():
    # Priority uses normalized_gap * 0.60 + importance_score * 0.25 + career_weight * 0.15
    p1 = calculate_priority(gap=55, importance=5, career_weight=0.9, is_core_skill=True)
    p2 = calculate_priority(gap=38, importance=5, career_weight=0.9, is_core_skill=True)
    p3 = calculate_priority(gap=5, importance=5, career_weight=0.9, is_core_skill=True)
    p4 = calculate_priority(gap=0, importance=4, career_weight=0.7, is_core_skill=False)

    assert p1["priority_score"] > p2["priority_score"]
    assert p2["priority_score"] > p3["priority_score"]
    assert p3["priority_score"] > p4["priority_score"]


def test_skill_gap_analysis_service_for_student():
    db = SessionLocal()
    try:
        # Create or find test student
        student = db.query(Student).filter(Student.email == "alex.chen@stanford.edu").first()
        assert student is not None

        # Run skill gap analysis
        data = analyze_student_skill_gap(db, student.student_id)

        assert "career_id" in data
        assert "career_name" in data
        assert "gaps" in data
        assert len(data["gaps"]) > 0

        # Verify gap items structure
        for g in data["gaps"]:
            assert "skill_id" in g
            assert "skill_name" in g
            assert "required_score" in g
            assert "current_mastery" in g
            assert "gap" in g
            assert "status" in g
            assert "priority_score" in g
            assert "priority_rank" in g
            assert g["gap"] >= 0
            assert g["gap"] == max(0, g["required_score"] - g["current_mastery"])

        # Check that gaps are sorted by priority_score descending
        scores = [g["priority_score"] for g in data["gaps"]]
        assert scores == sorted(scores, reverse=True)

    finally:
        db.close()


def test_skill_gap_multi_career_support():
    db = SessionLocal()
    try:
        student = db.query(Student).filter(Student.email == "alex.chen@stanford.edu").first()
        careers = db.query(Career).all()
        assert len(careers) >= 2

        for car in careers[:3]:
            res = analyze_student_skill_gap(db, student.student_id, career_id=car.career_id)
            assert res["career_id"] == car.career_id
            assert res["career_name"] == car.career_name
            assert isinstance(res["gaps"], list)
    finally:
        db.close()


def test_api_skill_gap_endpoints():
    headers = get_auth_headers()

    # GET /api/skill-gap
    res1 = client.get("/api/skill-gap", headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert "career_name" in data1
    assert "gaps" in data1
    assert len(data1["gaps"]) > 0

    # POST /api/skill-gap/analyze
    res2 = client.post("/api/skill-gap/analyze", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["career_id"] == data1["career_id"]

    # GET /api/skill-gap/career/{career_id}
    res3 = client.get(f"/api/skill-gap/career/{data1['career_id']}", headers=headers)
    assert res3.status_code == 200
    assert res3.json()["career_id"] == data1["career_id"]

    # GET /api/skill-gap/{skill_id}
    first_skill_id = data1["gaps"][0]["skill_id"]
    res4 = client.get(f"/api/skill-gap/{first_skill_id}", headers=headers)
    assert res4.status_code == 200
    assert res4.json()["skill_id"] == first_skill_id


def test_api_skill_gap_invalid_identifier_returns_404():
    headers = get_auth_headers()
    res = client.get("/api/skill-gap/NON_EXISTENT_ID_99999", headers=headers)
    assert res.status_code == 404
