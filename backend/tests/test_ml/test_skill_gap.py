import sys
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.skill_matching import calculate_skill_gap, classify_skill_level


def test_explicit_skill_gap_examples_from_specification():
    """
    Directly verify test cases mandated by specification:
      1. Required: 90, Current: 52 -> gap: 38, level: Developing
      2. Required: 75, Current: 20 -> gap: 55, level: Beginner
      3. Required: 90, Current: 85 -> gap: 5, level: Advanced
      4. Required: 80, Current: 45 -> gap: 35, level: Developing
      5. Required: 70, Current: 70 -> gap: 0, level: Proficient
    """
    # Case 1: Machine Learning
    gap_1 = calculate_skill_gap(required_level=90, current_mastery=52)
    level_1 = classify_skill_level(52)
    assert gap_1 == 38
    assert level_1 == "Developing"

    # Case 2: Deep Learning
    gap_2 = calculate_skill_gap(required_level=75, current_mastery=20)
    level_2 = classify_skill_level(20)
    assert gap_2 == 55
    assert level_2 == "Beginner"

    # Case 3: Python
    gap_3 = calculate_skill_gap(required_level=90, current_mastery=85)
    level_3 = classify_skill_level(85)
    assert gap_3 == 5
    assert level_3 == "Advanced"

    # Case 4: Statistics
    gap_4 = calculate_skill_gap(required_level=80, current_mastery=45)
    level_4 = classify_skill_level(45)
    assert gap_4 == 35
    assert level_4 == "Developing"

    # Case 5: SQL
    gap_5 = calculate_skill_gap(required_level=70, current_mastery=70)
    level_5 = classify_skill_level(70)
    assert gap_5 == 0
    assert level_5 == "Proficient"


def test_skill_gap_clamping():
    """Verify gap is clamped between 0 and 100."""
    # When current exceeds required, gap is 0 (not negative)
    assert calculate_skill_gap(required_level=70, current_mastery=95) == 0

    # Extreme bounds
    assert calculate_skill_gap(required_level=100, current_mastery=0) == 100
    assert calculate_skill_gap(required_level=0, current_mastery=100) == 0


def test_skill_gap_with_qualitative_levels():
    """Verify conversion of qualitative level strings ('Advanced', 'Intermediate', 'Beginner')."""
    # 'Advanced' maps to 90
    assert calculate_skill_gap(required_level="Advanced", current_mastery=52) == 38
    # 'Intermediate' maps to 70
    assert calculate_skill_gap(required_level="Intermediate", current_mastery=70) == 0
