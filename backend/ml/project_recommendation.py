"""
PathForge AI - Practical Project Recommendation Engine
Ranks hands-on portfolio projects that convert abstract skills into verified evidence,
using Hugging Face BAAI/bge-small-en-v1.5 embeddings and skill gap closure metrics.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np

# Ensure backend directory is in sys.path when executed directly as a script
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from ml.embedding_service import (
    generate_embedding,
    generate_embeddings,
    cosine_similarity,
)


def rank_project_recommendations(
    skill_gaps: List[Dict[str, Any]],
    projects: List[Dict[str, Any]],
    target_career_id: Optional[str] = None,
    top_k: int = 10,
    career_name: str = "Selected Career",
) -> List[Dict[str, Any]]:
    """
    Ranks projects that best close identified skill gaps and offer verifiable evidence.

    Formula:
      relevance_score = BGE semantic relevance (40%) + gap impact (45%) + career focus bonus (15%)
    """
    if not projects:
        return []

    # 1. Index missing skills and their gap magnitudes
    gap_lookup = {
        gap.get("skill_name", "").lower(): {
            "skill_name": gap.get("skill_name", ""),
            "gap": int(gap.get("gap", 0)),
            "priority": gap.get("priority", "Medium"),
        }
        for gap in skill_gaps
        if int(gap.get("gap", 0)) > 0
    }

    # 2. Build target gap query for BGE embeddings
    missing_names = [info["skill_name"] for info in gap_lookup.values()]
    if missing_names:
        target_query = f"Hands-on production projects demonstrating {', '.join(missing_names[:6])} for {career_name}"
    else:
        target_query = f"Capstone portfolio projects demonstrating production engineering in {career_name}"

    query_vector = generate_embedding(target_query)

    # 3. Batch encode projects
    project_texts = []
    for p in projects:
        skills = [s.get("skill_name", "") for s in p.get("skills", [])]
        text = f"{p.get('project_name', '')}. {p.get('description', '')}. Outcomes: {p.get('learning_outcomes', '')}. Skills: {', '.join(skills)}"
        project_texts.append(text)

    project_vectors = generate_embeddings(project_texts)

    scored_projects = []

    for i, p in enumerate(projects):
        project_id = p.get("project_id", "")
        project_name = p.get("project_name", "")
        description = p.get("description", "")
        difficulty = p.get("difficulty", "Intermediate")
        duration_weeks = int(p.get("estimated_duration_weeks", 3))
        learning_outcomes = p.get("learning_outcomes", "Verifiable engineering artifact for resume.")
        p_skills = [s.get("skill_name", "") for s in p.get("skills", [])]

        # Semantic relevance
        raw_sim = float(cosine_similarity(query_vector, project_vectors[i]))
        sem_score = round(max(0.0, min(100.0, raw_sim * 100.0)), 2)

        # Gap overlap
        matched_missing_skills = []
        total_gap_addressed = 0

        for s in p_skills:
            s_lower = s.lower()
            if s_lower in gap_lookup:
                matched_missing_skills.append(gap_lookup[s_lower]["skill_name"])
                total_gap_addressed += gap_lookup[s_lower]["gap"]

        is_target_career = (target_career_id and p.get("career_id") == target_career_id)

        # Blended relevance score
        gap_bonus = min(40.0, len(matched_missing_skills) * 12.0 + (total_gap_addressed * 0.15))
        career_bonus = 15.0 if is_target_career else 5.0

        combined = sem_score * 0.40 + (gap_bonus * 2.2) * 0.45 + career_bonus
        relevance_score = int(round(np.clip(combined, 50.0, 98.0)))

        # Reason formulation
        if matched_missing_skills:
            reason = (
                f"Recommended because this project develops {', '.join(matched_missing_skills[:2])}, "
                f"which {'are' if len(matched_missing_skills) > 1 else 'is'} high-priority missing "
                f"{'skills' if len(matched_missing_skills) > 1 else 'skill'} for your selected career."
            )
        else:
            reason = (
                f"Recommended for comprehensive portfolio development with {int(sem_score)}% semantic "
                f"alignment to {career_name} industry standards."
            )

        p_skills_str = ", ".join(p_skills[:3]) if p_skills else "core domain competencies"
        problem_statement = (
            p.get("problem_statement")
            or f"Problem: Modern engineering organizations require production-grade solutions for {project_name.lower()} to eliminate bottlenecks and support end-users at scale. "
            f"Use Case: Design and deploy a reliable system addressing {description.rstrip('.').lower()}, integrating {p_skills_str} aligned with {career_name} industry workflows. "
            f"Expected Outcome: A tested, documented, and deployable portfolio artifact demonstrating practical competency and measurable engineering performance."
        )

        scored_projects.append({
            "project_id": project_id,
            "project_name": project_name,
            "description": description,
            "difficulty": difficulty,
            "estimated_duration_weeks": duration_weeks,
            "duration_text": f"{duration_weeks} weeks",
            "relevance_score": relevance_score,
            "match_percentage": relevance_score,
            "matched_missing_skills": matched_missing_skills,
            "primary_skills": p_skills if p_skills else [p.get("category", "Software Engineering")],
            "learning_outcomes": learning_outcomes,
            "problem_statement": problem_statement,
            "reason": reason,
            "career_id": p.get("career_id") or target_career_id,
            "career_name": career_name,
            "status": p.get("status", "not_started"),
            "github_url": p.get("github_url"),
            "_sort_score": relevance_score,
        })

    scored_projects.sort(key=lambda x: x["_sort_score"], reverse=True)
    return scored_projects[:top_k]


if __name__ == "__main__":
    import sys
    from pathlib import Path

    current_dir = Path(__file__).resolve().parent
    backend_dir = current_dir.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    print("===================================================")
    print("PATHFORGE AI - PROJECT RECOMMENDATION ENGINE")
    print("===================================================\n")

    sample_gaps = [
        {"skill_name": "Deep Learning", "gap": 55, "priority": "High"},
        {"skill_name": "Computer Vision", "gap": 45, "priority": "High"},
        {"skill_name": "Docker", "gap": 30, "priority": "Medium"},
    ]

    sample_projects = [
        {
            "project_id": "PRJ001",
            "project_name": "Real-Time Object Detection & Tracking Pipeline",
            "description": "Build an end-to-end computer vision pipeline using PyTorch CNNs and YOLO models.",
            "category": "Artificial Intelligence",
            "difficulty": "Intermediate",
            "estimated_duration_weeks": 4,
            "career_id": "C001",
            "learning_outcomes": "Demonstrates Deep Learning and Computer Vision competencies for portfolio.",
            "skills": [{"skill_name": "Deep Learning"}, {"skill_name": "Computer Vision"}],
        },
        {
            "project_id": "PRJ002",
            "project_name": "Microservices Container Deployment",
            "description": "Containerize backend services using Docker and Docker Compose workflows.",
            "category": "Cloud & DevOps",
            "difficulty": "Intermediate",
            "estimated_duration_weeks": 3,
            "career_id": "C001",
            "learning_outcomes": "Demonstrates Docker containerization in production.",
            "skills": [{"skill_name": "Docker"}],
        },
        {
            "project_id": "PRJ003",
            "project_name": "Basic Static Landing Page",
            "description": "HTML and CSS static responsive website.",
            "category": "Web Development",
            "difficulty": "Beginner",
            "estimated_duration_weeks": 1,
            "career_id": "C005",
            "learning_outcomes": "Basic HTML/CSS layouts.",
            "skills": [{"skill_name": "HTML"}, {"skill_name": "CSS"}],
        },
    ]

    print("Target Career: Computer Vision Engineer")
    print(f"Active Gaps: {', '.join([g['skill_name'] + ' (gap: ' + str(g['gap']) + ')' for g in sample_gaps])}\n")

    recommendations = rank_project_recommendations(
        skill_gaps=sample_gaps,
        projects=sample_projects,
        target_career_id="C001",
        top_k=3,
        career_name="Computer Vision Engineer",
    )

    print("Ranked Project Recommendations:")
    print("---------------------------------------------------")
    for idx, rec in enumerate(recommendations, start=1):
        print(f"#{idx} {rec['project_name']} (Relevance Score: {rec['relevance_score']}%)")
        print(f"   Duration: {rec['duration_text']} | Difficulty: {rec['difficulty']}")
        print(f"   Matched Missing Skills: {', '.join(rec['matched_missing_skills']) if rec['matched_missing_skills'] else 'None'}")
        print(f"   Reason: {rec['reason']}")
        print()
    print("===================================================")
    print("Execution completed successfully.")
