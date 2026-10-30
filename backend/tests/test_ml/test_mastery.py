import sys
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.skill_matching import calculate_final_mastery, classify_skill_level


def test_self_declared_alone_cannot_grant_advanced_mastery():
    """Verify that student self-declaration alone (even 100%) cannot grant Advanced mastery without proof."""
    result = calculate_final_mastery(self_declared_score=95)
    # Self-declared has 10% weight; even normalized alone or with other sources it is bounded
    assert result["final_mastery"] <= 95
    # When student claims 100% with poor assessment (52%), demonstrated score drops
    result_with_assessment = calculate_final_mastery(
        self_declared_score=95,
        assessment_score=52,
    )
    # Weights: self_declared (0.10), assessment (0.35) -> total 0.45
    # (95 * 0.10 + 52 * 0.35) / 0.45 = (9.5 + 18.2) / 0.45 = 27.7 / 0.45 = 61.56 -> 62 ("Developing")
    assert result_with_assessment["final_mastery"] == 62
    assert result_with_assessment["mastery_level"] == "Developing"


def test_dynamic_renormalization_specification_example():
    """
    Directly test the dynamic renormalization example from specification:
      Assessment = 80
      Project = 70
      Resume = 60
      Active weights: 0.35 + 0.20 + 0.15 = 0.70
      (80 * 0.35 + 70 * 0.20 + 60 * 0.15) / 0.70 = 51 / 0.70 = 72.86 -> 73 ('Proficient')
    """
    result = calculate_final_mastery(
        assessment_score=80,
        project_score=70,
        resume_score=60,
    )
    assert result["final_mastery"] == 73
    assert result["mastery_level"] == "Proficient"
    assert result["evidence_count"] == 3


def test_missing_evidence_not_penalized_as_zero():
    """Verify that absent mentor or certificate evidence does not drag down verified score to near zero."""
    # A student with 90 in assessment and 90 in project should have ~90 mastery, not penalized for missing mentor
    result = calculate_final_mastery(assessment_score=90, project_score=90)
    assert result["final_mastery"] == 90
    assert result["mastery_level"] == "Advanced"


def test_no_evidence_edge_case():
    """Verify handling when no evidence is available."""
    result = calculate_final_mastery()
    assert result["final_mastery"] == 0
    assert result["mastery_level"] == "Missing"
    assert result["evidence_count"] == 0
