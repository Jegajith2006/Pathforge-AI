import sys
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.project_recommendation import rank_project_recommendations


def test_project_recommendation_ranking_and_reason():
    """Verify that portfolio projects developing missing skills are prioritized with explainability reasons."""
    skill_gaps = [
        {"skill_name": "Deep Learning", "gap": 55, "priority": "High"},
        {"skill_name": "Computer Vision", "gap": 45, "priority": "High"},
        {"skill_name": "Python", "gap": 0, "priority": "Low"},
    ]

    projects = [
        {
            "project_id": "PRJ001",
            "project_name": "Image Classification System with ResNet CNNs",
            "description": "Production computer vision system classifying multi-class image datasets using deep neural networks.",
            "difficulty": "Intermediate",
            "estimated_duration_weeks": 4,
            "learning_outcomes": "Demonstrates Deep Learning and Computer Vision competency.",
            "skills": [
                {"skill_name": "Deep Learning"},
                {"skill_name": "Computer Vision"},
            ],
            "career_id": "C001",
        },
        {
            "project_id": "PRJ002",
            "project_name": "Basic Calculator App in Python",
            "description": "Simple desktop arithmetic calculator script.",
            "difficulty": "Beginner",
            "estimated_duration_weeks": 1,
            "learning_outcomes": "Basic Python loops.",
            "skills": [
                {"skill_name": "Python"},
            ],
            "career_id": "C001",
        },
    ]

    ranked = rank_project_recommendations(
        skill_gaps=skill_gaps,
        projects=projects,
        target_career_id="C001",
        top_k=2,
        career_name="AI Vision Engineer",
    )

    assert len(ranked) == 2
    top = ranked[0]

    # Verify top project addresses Deep Learning and Computer Vision
    assert top["project_id"] == "PRJ001"
    assert "Deep Learning" in top["matched_missing_skills"]
    assert "Computer Vision" in top["matched_missing_skills"]

    # Verify required schema fields
    assert "project_id" in top
    assert "project_name" in top
    assert "relevance_score" in top
    assert "matched_missing_skills" in top
    assert "reason" in top

    # Verify reason mentions missing skills developed
    assert "Deep Learning" in top["reason"]
    assert "missing" in top["reason"].lower()
