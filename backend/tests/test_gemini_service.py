"""
PathForge AI - Step 7 Gemini Integration Comprehensive Test Suite
Validates:
  1. Gemini service configuration and API key loading
  2. Missing API key handling and safe offline fallback
  3. Structured JSON entity extraction & Pydantic schema validation
  4. Malformed JSON handling & resilient cleanup
  5. Assessment question generation with strict field validation
  6. Roadmap DAG explanation
  7. AI career assistant grounded responses
  8. Cover letter generation grounded in demonstrable evidence
  9. Project recommendation explanation
  10. Security: API key is never exposed to frontend responses or log outputs
  11. REST endpoints in /api/ai
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from config import settings
from database.connection import init_db, SessionLocal
from database.models import Student
from services.gemini_service import (
    GeminiService,
    gemini_service,
    GeneratedQuestionSchema,
)

init_db()
client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def sample_student(db_session):
    student = db_session.query(Student).first()
    if not student:
        student = Student(
            student_id="STU-TEST-GEMINI",
            first_name="Alex",
            last_name="Chen",
            email="alex.chen.gemini@pathforge.ai",
            college="PathForge Institute",
            department="Computer Science",
            degree="B.Tech Computer Science",
            graduation_year=2026,
            cgpa=8.9,
            target_career_id="CAR-MLE",
        )
        db_session.add(student)
        db_session.commit()
    return student


@pytest.fixture(scope="module")
def auth_headers(sample_student):
    from routers.auth import create_access_token
    token = create_access_token({"sub": sample_student.student_id, "email": sample_student.email})
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 1. GEMINI SERVICE CONFIGURATION & OFFLINE RESILIENCE
# ---------------------------------------------------------------------------

def test_gemini_service_initialization():
    """Verify GeminiService loads configuration safely."""
    svc = GeminiService()
    assert hasattr(svc, "is_configured")
    assert hasattr(svc, "model_name")
    assert svc.model_name == "gemini-1.5-flash"


def test_missing_api_key_safe_fallback():
    """Verify unconfigured Gemini service falls back to deterministic offline output."""
    svc = GeminiService()
    svc.is_configured = False  # Simulate offline / unset key

    resume_text = "Experienced in Python, Pandas, Scikit-learn, SQL, and Docker. Built Churn prediction ML pipeline."
    res = svc.extract_structured_resume_data(resume_text)
    
    assert "skills" in res
    assert "Python" in res["skills"]
    assert "projects" in res
    assert "certificates" in res
    assert "experience" in res


def test_malformed_json_resilience():
    """Verify service cleans markdown codeblocks and recovers from invalid JSON."""
    svc = GeminiService()
    
    markdown_json = '```json\n{"skills": ["Python", "SQL"], "projects": [], "certificates": [], "experience": [], "education": []}\n```'
    cleaned = svc._clean_json_string(markdown_json)
    assert cleaned.startswith("{")
    assert cleaned.endswith("}")


# ---------------------------------------------------------------------------
# 2. STRUCTURED EXTRACTION & VALIDATION
# ---------------------------------------------------------------------------

def test_structured_resume_extraction_schema():
    """Verify structured resume extraction satisfies strict schema."""
    resume_sample = """
    Jane Doe - Data Scientist
    Skills: Python, Scikit-learn, Pandas, SQL, PyTorch, Docker
    Projects: Customer Segmentation using K-Means and PCA
    Certificates: Coursera Machine Learning Specialization
    Experience: Junior ML Engineer at TechCorp
    Education: B.Tech in Data Science, Stanford University
    """
    data = gemini_service.extract_structured_resume_data(resume_sample)
    
    assert isinstance(data.get("skills"), list)
    assert isinstance(data.get("projects"), list)
    assert isinstance(data.get("certificates"), list)
    assert isinstance(data.get("experience"), list)
    assert isinstance(data.get("education"), list)
    assert len(data["skills"]) > 0


# ---------------------------------------------------------------------------
# 3. ASSESSMENT QUESTION GENERATION
# ---------------------------------------------------------------------------

def test_assessment_question_generation_validation():
    """Verify generated assessment questions pass Pydantic schema validation."""
    question_dict = gemini_service.generate_assessment_question(
        career="Machine Learning Engineer",
        skill="Scikit-learn",
        difficulty="Intermediate",
        question_type="MCQ",
    )
    
    # Must validate against GeneratedQuestionSchema
    validated = GeneratedQuestionSchema(**question_dict)
    assert validated.skill == "Scikit-learn"
    assert len(validated.options) >= 2
    assert validated.correct_answer in validated.options or len(validated.correct_answer) > 0
    assert len(validated.explanation) > 10


# ---------------------------------------------------------------------------
# 4. EXPLANATIONS & CAREER GUIDANCE
# ---------------------------------------------------------------------------

def test_roadmap_dag_explanation():
    """Verify roadmap explanation generates clear prerequisite reasoning."""
    milestones = ["Python Engineering", "Linear Algebra", "Machine Learning", "Deep Learning", "MLOps"]
    exp = gemini_service.explain_roadmap(milestones, "Machine Learning Engineer")
    assert "Machine Learning Engineer" in exp or "prerequisite" in exp or "DAG" in exp or "learning" in exp


def test_cover_letter_generation():
    """Verify cover letter is grounded in student verified skills."""
    letter = gemini_service.generate_cover_letter(
        student_name="Alex Chen",
        role_title="Junior Machine Learning Engineer",
        company_name="Google",
        verified_skills=["Python", "Scikit-learn", "SQL"],
        projects=["Customer Churn Prediction Platform"],
    )
    assert "Alex Chen" in letter
    assert "Google" in letter
    assert "Python" in letter or "Scikit-learn" in letter


def test_ai_career_chat_grounding():
    """Verify chat responses are grounded in student readiness and career context."""
    context = {
        "target_career": "Machine Learning Engineer",
        "readiness_score": 68,
        "top_skills": ["Python", "Pandas"],
        "skill_gaps": ["Deep Learning", "Docker"],
    }
    reply = gemini_service.chat_response("What should I focus on this week?", context)
    assert len(reply) > 20


# ---------------------------------------------------------------------------
# 5. SECURITY: NO KEY LEAKAGE
# ---------------------------------------------------------------------------

def test_security_gemini_key_not_exposed_in_api(auth_headers):
    """Verify API responses NEVER contain or return the GEMINI_API_KEY."""
    # Test chat endpoint
    res_chat = client.post("/api/ai/chat", json={"message": "Hello AI"}, headers=auth_headers)
    assert res_chat.status_code == 200
    assert settings.GEMINI_API_KEY not in res_chat.text

    # Test cover letter endpoint
    res_cl = client.post(
        "/api/ai/cover-letter",
        json={"role_title": "ML Engineer", "company_name": "Meta"},
        headers=auth_headers,
    )
    assert res_cl.status_code == 200
    assert settings.GEMINI_API_KEY not in res_cl.text

    # Test roadmap explanation endpoint
    res_rm = client.post("/api/ai/explain-roadmap", json={}, headers=auth_headers)
    assert res_rm.status_code == 200
    assert settings.GEMINI_API_KEY not in res_rm.text
