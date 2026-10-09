import sys
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.course_recommendation import rank_course_recommendations


def test_course_recommendation_ranking_and_reason():
    """Verify that courses addressing high priority gaps are ranked top with explainability reasons."""
    skill_gaps = [
        {"skill_name": "Deep Learning", "gap": 55, "priority": "High", "importance": 5},
        {"skill_name": "Docker", "gap": 35, "priority": "Medium", "importance": 3},
        {"skill_name": "Python", "gap": 0, "priority": "Low", "importance": 4},
    ]

    courses = [
        {
            "course_id": "CRS001",
            "course_name": "Deep Learning Fundamentals & Neural Networks",
            "provider": "DeepLearning.AI",
            "description": "Comprehensive course covering deep neural networks, backpropagation, and PyTorch models.",
            "skills": [{"skill_name": "Deep Learning"}],
            "rating": 4.9,
            "duration_hours": 30,
        },
        {
            "course_id": "CRS002",
            "course_name": "Beginning Python for Total Beginners",
            "provider": "Coursera",
            "description": "Learn basic Python variables, loops, and conditions.",
            "skills": [{"skill_name": "Python"}],
            "rating": 4.6,
            "duration_hours": 15,
        },
        {
            "course_id": "CRS003",
            "course_name": "Containerization with Docker",
            "provider": "Linux Foundation",
            "description": "Master dockerfiles, containers, and deployment workflows.",
            "skills": [{"skill_name": "Docker"}],
            "rating": 4.7,
            "duration_hours": 20,
        },
    ]

    ranked = rank_course_recommendations(skill_gaps, courses, top_k=3, career_name="AI Engineer")

    assert len(ranked) == 3
    top = ranked[0]

    # Verify top course addresses Deep Learning (the 55-point high gap)
    assert top["course_id"] == "CRS001"
    assert "Deep Learning" in top["missing_skills_addressed"]

    # Verify required schema fields
    assert "course_id" in top
    assert "course_name" in top
    assert "relevance_score" in top
    assert "matched_skills" in top
    assert "missing_skills_addressed" in top
    assert "reason" in top

    # Verify explainability reason mentions Deep Learning and gap
    assert "Deep Learning" in top["reason"]
    assert "gap" in top["reason"].lower()
