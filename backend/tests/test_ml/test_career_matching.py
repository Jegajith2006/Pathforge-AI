import sys
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.career_matching import compute_career_matches


def test_career_matching_combined_relevance():
    """Verify career matching uses BGE embeddings, skill match, and returns required schema with reasons."""
    careers = [
        {
            "career_id": "C001",
            "career_name": "Machine Learning Engineer",
            "category": "AI / Data",
            "description": "Design, build, and deploy production machine learning pipelines and neural models.",
            "core_focus": "Model architecture, deployment, and scalability",
            "required_skills": [
                {"skill_id": "S001", "skill_name": "Python", "required_level": "Advanced", "weight": 0.25},
                {"skill_id": "S002", "skill_name": "PyTorch", "required_level": "Advanced", "weight": 0.25},
                {"skill_id": "S003", "skill_name": "Machine Learning", "required_level": "Advanced", "weight": 0.25},
                {"skill_id": "S004", "skill_name": "Docker", "required_level": "Intermediate", "weight": 0.25},
            ],
        },
        {
            "career_id": "C002",
            "career_name": "Pastry Chef & Bakery Manager",
            "category": "Culinary Arts",
            "description": "Manage bakery operations, craft sourdough bread, and create pastry delicacies.",
            "core_focus": "Baking, culinary presentation, and kitchen inventory",
            "required_skills": [
                {"skill_id": "S050", "skill_name": "Baking", "required_level": "Advanced", "weight": 0.50},
                {"skill_id": "S051", "skill_name": "Pastry Design", "required_level": "Advanced", "weight": 0.50},
            ],
        },
    ]

    student_skills = ["Python", "PyTorch", "Machine Learning"]
    student_bg = "B.Tech Computer Science student specializing in artificial intelligence and deep neural networks."
    mastery_map = {"python": 90, "pytorch": 85, "machine learning": 80, "docker": 0}

    results = compute_career_matches(
        student_skills=student_skills,
        student_background_text=student_bg,
        careers=careers,
        student_mastery_map=mastery_map,
    )

    assert len(results) == 2
    top = results[0]

    # Verify ranking
    assert top["career_id"] == "C001"
    assert top["career_name"] == "Machine Learning Engineer"

    # Verify schema fields
    assert "semantic_score" in top
    assert "skill_match_score" in top
    assert "combined_score" in top
    assert "matching_skills" in top
    assert "missing_skills" in top
    assert "reason" in top

    # Verify score bounds
    assert top["combined_score"] > results[1]["combined_score"]
    assert top["combined_score"] >= 70
    assert results[1]["combined_score"] <= 60

    # Verify matching skills detected
    matching_names = [s["skill_name"] for s in top["matching_skills"]]
    assert "Python" in matching_names
    assert "PyTorch" in matching_names
    assert len(top["missing_skills"]) == 1
    assert top["missing_skills"][0]["skill_name"] == "Docker"
