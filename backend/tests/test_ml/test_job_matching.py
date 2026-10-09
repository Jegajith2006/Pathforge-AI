import sys
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.job_matching import compute_job_matches


def test_job_matching_fields_and_disclaimer():
    """Verify job matching returns required fields, indicator label, and does not claim hiring probability."""
    jobs = [
        {
            "job_id": "JOB001",
            "job_title": "Machine Learning Engineer",
            "company_name": "DeepTech AI Labs",
            "description": "Develop and deploy scalable machine learning models with PyTorch and Python in production.",
            "required_skills": "Python, PyTorch, Machine Learning, Docker",
        },
        {
            "job_id": "JOB002",
            "job_title": "Executive Sous Chef",
            "company_name": "Gourmet Hospitality",
            "description": "Lead kitchen brigade in pastry and fine dining menu execution.",
            "required_skills": "Culinary Management, Pastry, Food Safety",
        },
    ]

    student_skills = ["Python", "PyTorch", "Machine Learning"]
    student_bg = "Computer science graduate with practical experience training neural network models."
    mastery_map = {"python": 85, "pytorch": 80, "machine learning": 75}

    results = compute_job_matches(
        student_skills=student_skills,
        student_background_text=student_bg,
        jobs=jobs,
        student_mastery_map=mastery_map,
    )

    assert len(results) == 2
    top = results[0]

    # Verify ranking
    assert top["job_id"] == "JOB001"
    assert top["job_title"] == "Machine Learning Engineer"

    # Verify required schema fields
    assert "job_id" in top
    assert "job_title" in top
    assert "match_score" in top
    assert "semantic_score" in top
    assert "skill_match_score" in top
    assert "matched_skills" in top
    assert "missing_skills" in top
    assert "reason" in top

    # Verify indicator label is PathForge AI Job Match
    assert top.get("indicator_label") == "PathForge AI Job Match"
    assert "PathForge AI Job Match" in top["reason"]

    # Verify matched and missing skills
    assert "Python" in top["matched_skills"]
    assert "Docker" in top["missing_skills"]
