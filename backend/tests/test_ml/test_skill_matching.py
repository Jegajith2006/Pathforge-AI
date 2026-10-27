import sys
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.skill_matching import (
    classify_skill_level,
    calculate_skill_match,
    calculate_priority,
    calculate_overall_skill_match,
    extract_matched_skills,
    tokenize,
    jaccard_similarity,
)


def test_classify_skill_level_thresholds():
    """Verify standard configured threshold levels: 0-39 Beginner, 40-69 Developing, 70-84 Proficient, 85-100 Advanced."""
    assert classify_skill_level(0) == "Missing"
    assert classify_skill_level(20) == "Beginner"
    assert classify_skill_level(39) == "Beginner"
    assert classify_skill_level(40) == "Developing"
    assert classify_skill_level(52) == "Developing"
    assert classify_skill_level(69) == "Developing"
    assert classify_skill_level(70) == "Proficient"
    assert classify_skill_level(84) == "Proficient"
    assert classify_skill_level(85) == "Advanced"
    assert classify_skill_level(100) == "Advanced"


def test_calculate_skill_match():
    """Verify single skill fulfillment ratio."""
    assert calculate_skill_match(current_mastery=45, required_level=90) == 0.5
    assert calculate_skill_match(current_mastery=90, required_level=90) == 1.0
    assert calculate_skill_match(current_mastery=100, required_level=80) == 1.0


def test_calculate_priority():
    """Verify deterministic priority scoring using gap, importance, and core skill status."""
    critical_pri = calculate_priority(gap=55, importance=5, career_weight=0.10, is_core_skill=True)
    assert critical_pri["priority"] in ["Critical", "High"]
    assert critical_pri["priority_score"] >= 0.60

    low_pri = calculate_priority(gap=0, importance=2, career_weight=0.02, is_core_skill=False)
    assert low_pri["priority"] == "Low"


def test_calculate_overall_skill_match():
    """Verify weighted overall career skill match percentage."""
    skills = [
        {"current_mastery": 90, "required_level": 90, "weight": 0.5},
        {"current_mastery": 45, "required_level": 90, "weight": 0.5},
    ]
    # (1.0 * 0.5 + 0.5 * 0.5) / 1.0 = 0.75 -> 75%
    overall = calculate_overall_skill_match(skills)
    assert overall == 75.0


def test_token_extraction_and_jaccard():
    """Verify regex token extraction and Jaccard similarity."""
    tokens_a = tokenize("Python Machine Learning PyTorch")
    tokens_b = tokenize("python deep learning pytorch")
    assert "python" in tokens_a
    assert "pytorch" in tokens_a
    sim = jaccard_similarity(tokens_a, tokens_b)
    assert sim > 0.40
