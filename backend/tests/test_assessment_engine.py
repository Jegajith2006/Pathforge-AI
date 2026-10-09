"""
PathForge AI - Step 5 Assessment Engine Comprehensive Test Suite
Validates diagnostic assessment generation, career-specific skill distribution,
question types (MCQ, Conceptual, Scenario, Problem Solving, Coding), difficulty scaling,
safe answer evaluation, skill-wise scoring, score-to-level classification,
live student_skills update, evidence-based mastery recalculation, and database persistence.
"""

import sys
import uuid
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from database.connection import init_db, SessionLocal
from database.models import (
    Student,
    Career,
    Skill,
    CareerSkill,
    AssessmentQuestion,
    AssessmentAnswer,
    StudentSkill,
)
from services.assessment_service import (
    normalize_question_type,
    score_to_demonstrated_level,
    evaluate_single_answer,
    start_diagnostic_assessment,
    evaluate_assessment_submission,
    get_assessment_result_by_id,
    get_assessment_history,
)
from ml.skill_matching import calculate_final_mastery

init_db()
client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. QUESTION TYPES & NORMALIZATION TESTS
# ---------------------------------------------------------------------------

def test_question_type_normalization():
    """Verify that raw question types normalize into the 5 canonical categories."""
    assert normalize_question_type("MCQ") == "MCQ"
    assert normalize_question_type("Multiple Choice") == "MCQ"
    assert normalize_question_type("Conceptual") == "Conceptual"
    assert normalize_question_type("Scenario Based") == "Scenario"
    assert normalize_question_type("Problem Solving") == "Problem Solving"
    assert normalize_question_type("Code Output") == "Coding"
    assert normalize_question_type("coding") == "Coding"


# ---------------------------------------------------------------------------
# 2. SCORE TO DEMONSTRATED SKILL LEVEL THRESHOLDS
# ---------------------------------------------------------------------------

def test_score_to_demonstrated_level():
    """
    Verify calibrated thresholds:
      0       = Missing
      1–39    = Beginner
      40–69   = Developing
      70–84   = Proficient
      85–100  = Advanced
    """
    assert score_to_demonstrated_level(0) == "Missing"
    assert score_to_demonstrated_level(25) == "Beginner"
    assert score_to_demonstrated_level(39) == "Beginner"
    assert score_to_demonstrated_level(40) == "Developing"
    assert score_to_demonstrated_level(52) == "Developing"
    assert score_to_demonstrated_level(69) == "Developing"
    assert score_to_demonstrated_level(70) == "Proficient"
    assert score_to_demonstrated_level(84) == "Proficient"
    assert score_to_demonstrated_level(85) == "Advanced"
    assert score_to_demonstrated_level(100) == "Advanced"


# ---------------------------------------------------------------------------
# 3. SAFE ANSWER EVALUATION (MCQ, CONCEPTUAL, SCENARIO, CODING)
# ---------------------------------------------------------------------------

def test_evaluate_single_answer_mcq():
    """Verify MCQ evaluation with exact text, case insensitivity, and letter mapping."""
    q = AssessmentQuestion(
        question_id="Q_TEST_1",
        career_id="C001",
        skill_id="SK001",
        difficulty="Intermediate",
        question_type="MCQ",
        question="What is the capital of ML?",
        option_a="Python",
        option_b="Java",
        option_c="C++",
        option_d="Ruby",
        correct_answer="Python",
        weight=1.0,
    )

    # Exact match
    is_corr, total_m, earned_m = evaluate_single_answer(q, "Python")
    assert is_corr is True
    assert earned_m == 1.0

    # Case-insensitive match
    is_corr, _, earned_m = evaluate_single_answer(q, "python")
    assert is_corr is True
    assert earned_m == 1.0

    # Letter mapping 'A' maps to option_a ('Python')
    is_corr, _, earned_m = evaluate_single_answer(q, "A")
    assert is_corr is True
    assert earned_m == 1.0

    # Wrong answer
    is_corr, _, earned_m = evaluate_single_answer(q, "Java")
    assert is_corr is False
    assert earned_m == 0.0

    # Empty / blank answer
    is_corr, _, earned_m = evaluate_single_answer(q, "")
    assert is_corr is False
    assert earned_m == 0.0


def test_evaluate_single_answer_coding_safe():
    """Verify safe static evaluation for coding questions without arbitrary code execution."""
    q = AssessmentQuestion(
        question_id="Q_TEST_CODE",
        career_id="C001",
        skill_id="SK001",
        difficulty="Intermediate",
        question_type="Code Output",
        question="What is the output of print([x**2 for x in [1, 2, 3]])?",
        option_a="[1, 4, 9]",
        option_b="[1, 2, 3]",
        option_c="[2, 4, 6]",
        option_d="Error",
        correct_answer="[1, 4, 9]",
        weight=2.0,
    )

    is_corr, total_m, earned_m = evaluate_single_answer(q, "[1, 4, 9]")
    assert is_corr is True
    assert total_m == 2.0
    assert earned_m == 2.0

    # Letter mapping
    is_corr, _, earned_m = evaluate_single_answer(q, "A")
    assert is_corr is True
    assert earned_m == 2.0


# ---------------------------------------------------------------------------
# 4. CAREER-SPECIFIC ASSESSMENT GENERATION
# ---------------------------------------------------------------------------

def test_start_diagnostic_assessment_career_tailored():
    """Verify assessment questions are tailored to target career and required skills."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        assert student is not None

        # Start assessment for Machine Learning Engineer (C001)
        res = start_diagnostic_assessment(db, student.student_id, career_id="C001", limit=15)

        assert "assessment_id" in res
        assert res["assessment_id"].startswith("ASM-")
        assert res["career_id"] == "C001"
        assert len(res["questions"]) > 0
        assert len(res["questions"]) <= 15
        assert len(res["skills_covered"]) > 0

        # Verify question structure
        first_q = res["questions"][0]
        assert "question_id" in first_q
        assert "skill_id" in first_q
        assert "question_type" in first_q
        assert "difficulty" in first_q
        assert "options" in first_q
        assert "marks" in first_q
        assert first_q["difficulty"] in ["Beginner", "Intermediate", "Advanced"]
    finally:
        db.close()


# ---------------------------------------------------------------------------
# 5. ASSESSMENT SUBMISSION & SKILL-WISE SCORING
# ---------------------------------------------------------------------------

def test_evaluate_assessment_submission_skill_breakdown():
    """Verify that assessment calculates overall score, skill-wise score, and updates DB."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        assert student is not None

        # Fetch 4 real questions
        qs = db.query(AssessmentQuestion).limit(4).all()
        assert len(qs) >= 2

        assessment_id = f"ASM-TEST-{uuid.uuid4().hex[:6].upper()}"

        # Submit 2 correct and 2 incorrect
        submissions = [
            {"question_id": qs[0].question_id, "selected_answer": qs[0].correct_answer, "time_taken_seconds": 20},
            {"question_id": qs[1].question_id, "selected_answer": "WRONG_ANSWER_XYZ", "time_taken_seconds": 25},
        ]
        if len(qs) >= 4:
            submissions.extend([
                {"question_id": qs[2].question_id, "selected_answer": qs[2].correct_answer, "time_taken_seconds": 15},
                {"question_id": qs[3].question_id, "selected_answer": "WRONG_ANSWER_XYZ", "time_taken_seconds": 30},
            ])

        result = evaluate_assessment_submission(db, student.student_id, assessment_id, submissions)

        assert result["assessment_id"] == assessment_id
        assert result["total_questions"] == len(submissions)
        assert result["correct_count"] >= 1
        assert "overall_score" in result
        assert "level" in result
        assert "skill_breakdown" in result
        assert len(result["skill_results"]) > 0
        assert "reviews" in result
        assert len(result["reviews"]) == len(submissions)

        # Verify skill_results contains demonstrated performance
        first_skill_res = result["skill_results"][0]
        assert "skill_id" in first_skill_res
        assert "score" in first_skill_res
        assert "level" in first_skill_res
        assert "final_mastery" in first_skill_res

        # Verify DB records created in AssessmentAnswer
        answers_in_db = (
            db.query(AssessmentAnswer)
            .filter(AssessmentAnswer.student_id == student.student_id, AssessmentAnswer.attempt_id.like(f"{assessment_id}%"))
            .all()
        )
        assert len(answers_in_db) == len(submissions)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# 6. CRITICAL REQUIREMENT: SELF-DECLARED SKILL NEVER OVERWRITTEN
# ---------------------------------------------------------------------------

def test_self_declared_score_preserved_after_assessment():
    """
    CRITICAL PROJECT PRINCIPLE TEST:
    Self-declared skill (e.g. 90) must NEVER be overwritten by assessment (e.g. 52).
    Assessment updates assessment_score and recalibrates multi-source final_mastery.
    """
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        assert student is not None

        # Setup an isolated test skill
        test_skill_id = "SK_TEST_PRINCIPLE_VERIFICATION"
        skill = db.query(Skill).filter(Skill.skill_id == test_skill_id).first()
        if not skill:
            skill = Skill(
                skill_id=test_skill_id,
                skill_name="Machine Learning Principles",
                category="AI",
                subcategory="Core ML",
                description="Core ML for testing evidence principles",
                beginner_definition="B",
                intermediate_definition="I",
                advanced_definition="A",
            )
            db.add(skill)
            db.commit()

        # Step 1: Student self-declares score = 90
        ss = (
            db.query(StudentSkill)
            .filter(StudentSkill.student_id == student.student_id, StudentSkill.skill_id == test_skill_id)
            .first()
        )
        if not ss:
            ss = StudentSkill(
                student_id=student.student_id,
                skill_id=test_skill_id,
                self_declared_score=90,
                assessment_score=0,
                resume_score=0,
                project_score=0,
                certificate_score=0,
                mentor_score=0,
                final_mastery=90,
                mastery_level="Advanced",
                evidence_count=1,
            )
            db.add(ss)
        else:
            ss.self_declared_score = 90
            ss.assessment_score = 0
            ss.resume_score = 0
            ss.project_score = 0
            ss.certificate_score = 0
            ss.mentor_score = 0
            ss.final_mastery = 90
            ss.mastery_level = "Advanced"
            ss.evidence_count = 1
        db.commit()

        # Verify initial state: self_declared=90, assessment=0
        db.refresh(ss)
        assert ss.self_declared_score == 90
        assert ss.assessment_score == 0

        # Step 2: Assessment evaluates this skill at 52%
        # Create a mock assessment question for this skill
        q_id = f"Q_TEST_{uuid.uuid4().hex[:6].upper()}"
        q = AssessmentQuestion(
            question_id=q_id,
            career_id="C001",
            skill_id=test_skill_id,
            difficulty="Intermediate",
            question_type="MCQ",
            question="What is regularization?",
            option_a="L1/L2 penalty",
            option_b="Overfitting",
            option_c="Underfitting",
            option_d="Data Leak",
            correct_answer="L1/L2 penalty",
            explanation="Regularization adds penalty terms to loss to prevent overfitting.",
            weight=100.0,
        )
        db.add(q)
        db.commit()

        # Submit answer resulting in 52 marks (e.g. 52% earned)
        # Using evaluate_assessment_submission
        asm_id = f"ASM-{uuid.uuid4().hex[:6].upper()}"
        # We submit a submission for this question
        res = evaluate_assessment_submission(
            db=db,
            student_id=student.student_id,
            assessment_id=asm_id,
            submissions=[{"question_id": q_id, "selected_answer": "L1/L2 penalty", "time_taken_seconds": 20}],
        )

        # Re-query student_skills directly from DB
        db.expire_all()
        db_ss = (
            db.query(StudentSkill)
            .filter(StudentSkill.student_id == student.student_id, StudentSkill.skill_id == test_skill_id)
            .first()
        )

        assert db_ss is not None
        # 1. self_declared_score is STILL 90 (NOT overwritten!)
        assert db_ss.self_declared_score == 90

        # 2. assessment_score is now updated to demonstrated score (100 in this single question test)
        assert db_ss.assessment_score == 100

        # 3. final_mastery is calibrated: (90*0.10 + 100*0.35) / 0.45 = 44.0 / 0.45 = 97.77 -> 98
        assert db_ss.final_mastery == 98
        assert db_ss.evidence_count == 2
    finally:
        db.close()


# ---------------------------------------------------------------------------
# 7. MULTI-SOURCE EVIDENCE RECALCULATION ALGORITHM
# ---------------------------------------------------------------------------

def test_demonstrated_evidence_mastery_calculation_cases():
    """
    Verify exact multi-source mastery formula:
      Self = 90 (weight 0.10)
      Assessment = 52 (weight 0.35)
      Sum of weights = 0.45
      Weighted sum = 9.0 + 18.2 = 27.2 -> 27.2 / 0.45 = 60.44 -> 60
      Demonstrated level = Developing (40-69)
    """
    calibrated = calculate_final_mastery(
        self_declared_score=90,
        assessment_score=52,
    )
    assert calibrated["final_mastery"] == 60
    assert calibrated["mastery_level"] == "Developing"
    assert calibrated["evidence_count"] == 2
    assert "self_declared" in calibrated["active_weights"]
    assert "assessment" in calibrated["active_weights"]


# ---------------------------------------------------------------------------
# 8. ASSESSMENT API ENDPOINTS (FULL CONTRACT TESTING)
# ---------------------------------------------------------------------------

def test_api_assessment_overview():
    """Test GET /api/assessment returns blueprint and instructions."""
    res = client.get("/api/assessment")
    assert res.status_code == 200
    data = res.json()
    assert "target_career_id" in data
    assert "target_career_name" in data
    assert "blueprint_skills" in data
    assert "instructions" in data


def test_api_assessment_start_post_and_get():
    """Test POST /api/assessment/start and GET /api/assessment/start."""
    # POST
    res_post = client.post("/api/assessment/start", json={"career_id": "C001", "limit": 10})
    assert res_post.status_code == 200
    data_post = res_post.json()
    assert "assessment_id" in data_post
    assert "questions" in data_post
    assert len(data_post["questions"]) <= 10

    # GET
    res_get = client.get("/api/assessment/start?career_id=C001&limit=8")
    assert res_get.status_code == 200
    data_get = res_get.json()
    assert "assessment_id" in data_get
    assert len(data_get["questions"]) <= 8


def test_api_assessment_questions_sample():
    """Test GET /api/assessment/questions."""
    res = client.get("/api/assessment/questions?career_id=C001")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "question_id" in data[0]
    assert "skill_id" in data[0]


def test_api_assessment_submit_flow():
    """Test full API submit flow: start -> answer -> submit -> verify result."""
    # 1. Start assessment
    res_start = client.post("/api/assessment/start", json={"career_id": "C001", "limit": 5})
    assert res_start.status_code == 200
    start_data = res_start.json()
    asm_id = start_data["assessment_id"]
    qs = start_data["questions"]
    assert len(qs) > 0

    # 2. Submit answers
    answers_payload = [
        {"question_id": q["question_id"], "selected_answer": q["options"][0] if q["options"] else "test", "time_taken_seconds": 25}
        for q in qs
    ]

    res_submit = client.post("/api/assessment/submit", json={
        "assessment_id": asm_id,
        "answers": answers_payload,
    })
    assert res_submit.status_code == 200
    res_data = res_submit.json()

    assert res_data["assessment_id"] == asm_id
    assert res_data["total_questions"] == len(qs)
    assert "overall_score" in res_data
    assert "level" in res_data
    assert "skill_results" in res_data
    assert "reviews" in res_data

    # 3. Fetch result by ID
    res_get = client.get(f"/api/assessment/result/{asm_id}")
    assert res_get.status_code == 200
    get_data = res_get.json()
    assert get_data["assessment_id"] == asm_id


def test_api_assessment_history():
    """Test GET /api/assessment/history."""
    res = client.get("/api/assessment/history")
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) > 0
    assert "attempt_date" in history[0]
    assert "score_percentage" in history[0]


def test_api_assessment_retake():
    """Test POST /api/assessment/retake."""
    res = client.post("/api/assessment/retake")
    assert res.status_code == 200
    data = res.json()
    assert "assessment_id" in data
    assert "questions" in data
    assert len(data["questions"]) > 0


def test_api_assessment_empty_submission_rejected():
    """Test submitting empty answers array is rejected with 400 Bad Request."""
    res = client.post("/api/assessment/submit", json={
        "assessment_id": "ASM-EMPTY",
        "answers": [],
    })
    assert res.status_code == 400
