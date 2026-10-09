import sys
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.connection import SessionLocal, init_db
from database.models import Student, Career
from services.career_readiness_service import compute_career_readiness


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_career_readiness_indicator_formula_and_disclaimer(db_session):
    """Verify Career Readiness Indicator calculation, three-pillar breakdown, and disclaimer."""
    student = db_session.query(Student).first()
    if not student:
        pytest.skip("No student records in database to test career readiness.")

    result = compute_career_readiness(db_session, student.student_id)

    # Required schema fields from Section 20
    assert "overall_score" in result
    assert "skill_match" in result
    assert "mastery" in result
    assert "evidence" in result
    assert "breakdown" in result

    # Check bounds
    assert 0 <= result["overall_score"] <= 100
    assert 0 <= result["skill_match"] <= 100
    assert 0 <= result["mastery"] <= 100
    assert 0 <= result["evidence"] <= 100

    # Verify formula breakdown
    breakdown = result["breakdown"]
    assert "weights" in breakdown
    weights = breakdown["weights"]
    assert weights["skill_match"] == 0.50
    assert weights["mastery"] == 0.30
    assert weights["evidence"] == 0.20

    # Verify indicator label and disclaimer
    assert result.get("indicator_label") == "PathForge AI Career Readiness Indicator"
    assert "disclaimer" in result
    assert "not" in result["disclaimer"].lower()
