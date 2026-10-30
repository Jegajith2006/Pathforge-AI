"""
PathForge AI - Course Recommendation Engine
Ranks educational courses by bridging identified skill gaps and computing
semantic relevance using Hugging Face BAAI/bge-small-en-v1.5 embeddings.
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


def rank_course_recommendations(
    skill_gaps: List[Dict[str, Any]],
    courses: List[Dict[str, Any]],
    top_k: int = 12,
    career_name: str = "Selected Career",
) -> List[Dict[str, Any]]:
    """
    Ranks courses using BGE semantic embeddings combined with skill gap closure analysis.

    Flow:
      Student -> Skill gaps -> Missing skills -> Courses teaching those skills
      -> BGE similarity -> Course relevance -> Rank recommendations
    """
    if not courses:
        return []

    # 1. Structure skill gaps and identify high-priority targets
    gap_map: Dict[str, Dict[str, Any]] = {}
    missing_skill_names: List[str] = []

    for g in skill_gaps:
        s_name = g.get("skill_name", "")
        gap_val = int(g.get("gap", 0))
        if gap_val > 0 and s_name:
            gap_map[s_name.lower()] = {
                "skill_name": s_name,
                "gap": gap_val,
                "priority": g.get("priority", "Medium"),
                "importance": g.get("importance", 3),
            }
            missing_skill_names.append(f"{s_name} (gap: {gap_val})")

    # 2. Build student gap query text for BGE semantic embedding
    if missing_skill_names:
        gap_query = f"Curriculum to master high priority skill gaps for {career_name}: {', '.join(missing_skill_names[:8])}"
    else:
        gap_query = f"Advanced mastery and interview preparation courses for {career_name}"

    query_vector = generate_embedding(gap_query)

    # 3. Batch encode courses using title, description, and covered skills
    course_texts = []
    for c in courses:
        covered = [s.get("skill_name", "") for s in c.get("skills", [])]
        text = f"{c.get('course_name', '')} by {c.get('provider', '')}. {c.get('description', '')} Skills: {', '.join(covered)}"
        course_texts.append(text)

    course_vectors = generate_embeddings(course_texts)

    scored_courses = []

    for i, c in enumerate(courses):
        course_id = c.get("course_id", "")
        course_name = c.get("course_name", "")
        provider = c.get("provider", "Coursera")
        rating = float(c.get("rating", 4.7))
        difficulty = c.get("difficulty", "Intermediate")
        duration_hours = int(c.get("duration_hours", 24))
        url = c.get("url", f"https://coursera.org/learn/{course_id}")

        # BGE semantic similarity
        sem_sim = float(cosine_similarity(query_vector, course_vectors[i]))
        sem_score = round(max(0.0, min(100.0, sem_sim * 100.0)), 2)

        # Direct gap matching
        course_skills = c.get("skills", [])
        matched_skills = []
        addressed_gaps = []
        max_gap_addressed = 0
        total_gap_points = 0

        for cs in course_skills:
            cs_name = cs.get("skill_name", "")
            cs_lower = cs_name.lower()
            matched_skills.append(cs_name)

            if cs_lower in gap_map:
                info = gap_map[cs_lower]
                gap_val = info["gap"]
                addressed_gaps.append(info["skill_name"])
                total_gap_points += gap_val
                if gap_val > max_gap_addressed:
                    max_gap_addressed = gap_val

        # Deterministic gap bonus & rating bonus
        gap_bonus = min(35.0, len(addressed_gaps) * 10.0 + (max_gap_addressed * 0.20))
        rating_bonus = (rating - 4.0) * 10.0

        # Blended relevance score
        # 45% semantic relevance + 45% targeted gap coverage + 10% rating bonus
        combined = sem_score * 0.45 + (gap_bonus * 2.2) * 0.45 + rating_bonus
        relevance_score = int(round(np.clip(combined, 50.0, 98.0)))

        # Explainability reason
        if addressed_gaps:
            top_gap = addressed_gaps[0]
            gap_amt = gap_map[top_gap.lower()]["gap"]
            priority = gap_map[top_gap.lower()]["priority"]
            reason = (
                f"Recommended because this course covers {top_gap}, which is currently a "
                f"{priority.lower()}-priority skill gap (gap: {gap_amt}) for your selected career."
            )
            tag = "Critical Gap" if max_gap_addressed >= 45 else "High Priority Gap"
        else:
            reason = (
                f"Recommended for broader domain mastery with {int(sem_score)}% semantic alignment "
                f"to your target role in {career_name}."
            )
            tag = "Curated Preparation"

        primary_skill = matched_skills[0] if matched_skills else c.get("category", "General")
        duration_weeks = max(1, duration_hours // 10)

        scored_courses.append({
            "course_id": course_id,
            "course_name": course_name,
            "provider": provider,
            "rating": rating,
            "difficulty": difficulty,
            "duration_hours": duration_hours,
            "duration_text": f"{duration_weeks} wks",
            "url": url,
            "relevance_score": relevance_score,
            "match_percentage": relevance_score,
            "matched_skills": matched_skills,
            "missing_skills_addressed": addressed_gaps,
            "tag": tag,
            "primary_skill": primary_skill,
            "progress": c.get("progress", 0),
            "reason": reason,
            "explainability": reason,
            "_sort_key": relevance_score,
        })

    # Sort descending by relevance score
    scored_courses.sort(key=lambda x: x["_sort_key"], reverse=True)
    return scored_courses[:top_k]


if __name__ == "__main__":
    print("===================================================")
    print("PATHFORGE AI - COURSE RECOMMENDATION ENGINE")
    print("===================================================\n")

    sample_gaps = [
        {"skill_name": "Deep Learning", "gap": 60, "priority": "High"},
        {"skill_name": "PyTorch", "gap": 50, "priority": "High"},
        {"skill_name": "Docker", "gap": 25, "priority": "Medium"},
    ]

    sample_courses = [
        {
            "course_id": "CRS001",
            "course_name": "Deep Learning Specialization with PyTorch",
            "provider": "DeepLearning.AI",
            "rating": 4.9,
            "difficulty": "Intermediate",
            "duration_hours": 40,
            "url": "https://coursera.org/specializations/deep-learning",
            "category": "Artificial Intelligence",
            "skills": [{"skill_name": "Deep Learning"}, {"skill_name": "PyTorch"}],
        },
        {
            "course_id": "CRS002",
            "course_name": "Docker & Kubernetes for Production Engineering",
            "provider": "Coursera",
            "rating": 4.7,
            "difficulty": "Intermediate",
            "duration_hours": 20,
            "url": "https://coursera.org/learn/docker-kubernetes",
            "category": "Cloud & DevOps",
            "skills": [{"skill_name": "Docker"}],
        },
        {
            "course_id": "CRS003",
            "course_name": "Introduction to Web Development & HTML/CSS",
            "provider": "freeCodeCamp",
            "rating": 4.5,
            "difficulty": "Beginner",
            "duration_hours": 15,
            "url": "https://freecodecamp.org",
            "category": "Web Development",
            "skills": [{"skill_name": "HTML"}, {"skill_name": "CSS"}],
        },
    ]

    print("Target Career: Computer Vision Engineer")
    print(f"Active Gaps: {', '.join([g['skill_name'] + ' (gap: ' + str(g['gap']) + ')' for g in sample_gaps])}\n")

    recs = rank_course_recommendations(
        skill_gaps=sample_gaps,
        courses=sample_courses,
        top_k=3,
        career_name="Computer Vision Engineer",
    )

    print("Ranked Course Recommendations:")
    print("---------------------------------------------------")
    for idx, rec in enumerate(recs, start=1):
        print(f"#{idx} {rec['course_name']} (Relevance: {rec['relevance_score']}%)")
        print(f"   Provider: {rec['provider']} | Rating: {rec['rating']} | Duration: {rec['duration_text']}")
        print(f"   Missing Skills Addressed: {', '.join(rec['missing_skills_addressed']) if rec['missing_skills_addressed'] else 'None'}")
        print(f"   Reason: {rec['reason']}")
        print()
    print("===================================================")
    print("Execution completed successfully.")

