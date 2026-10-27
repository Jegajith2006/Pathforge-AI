"""
PathForge AI - Career Matching Engine
Combines Hugging Face BAAI/bge-small-en-v1.5 dense neural embeddings,
cosine similarity, and deterministic career required skill match analysis.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np

# Ensure backend directory is in sys.path when executed directly as a script
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from ml.model_config import (
    WEIGHT_SEMANTIC_MATCH,
    WEIGHT_SKILL_MATCH,
    required_level_to_numeric,
)
from ml.embedding_service import (
    generate_embedding,
    generate_embeddings,
    cosine_similarity,
)


def compute_career_matches(
    student_skills: List[str],
    student_background_text: str,
    careers: List[Dict[str, Any]],
    student_mastery_map: Optional[Dict[str, int]] = None,
) -> List[Dict[str, Any]]:
    """
    Computes career match scores using BGE neural embeddings and skill match analysis.

    Parameters:
      student_skills: list of skill names the student has demonstrated (e.g. ['Python', 'SQL'])
      student_background_text: student's education, degree, interests, and profile text
      careers: list of career dicts with keys 'career_id', 'career_name', 'description', 'core_focus', 'required_skills'
      student_mastery_map: optional dict mapping skill_name.lower() -> mastery_score (0-100)

    Formula:
      combined_score = semantic_score * WEIGHT_SEMANTIC_MATCH + skill_match_score * WEIGHT_SKILL_MATCH
    """
    if not careers:
        return []

    mastery_map = student_mastery_map or {s.lower(): 75 for s in student_skills}
    student_skills_lower = {s.lower() for s in student_skills}

    # 1. Build composite student profile text and generate BGE embedding
    skills_summary = ", ".join(student_skills) if student_skills else "General technical skills"
    student_query = f"Aspiring professional with skills: {skills_summary}. Background: {student_background_text}"
    student_vector = generate_embedding(student_query)

    # 2. Prepare career texts for BGE batch embedding
    career_texts = []
    for c in careers:
        req_skills_list = [s.get("skill_name", "") for s in c.get("required_skills", [])]
        req_str = ", ".join(req_skills_list)
        text = f"{c.get('career_name', '')}. {c.get('description', '')}. Focus: {c.get('core_focus', '')}. Required Skills: {req_str}"
        career_texts.append(text)

    career_vectors = generate_embeddings(career_texts)

    matched_careers = []

    for i, c in enumerate(careers):
        career_id = c["career_id"]
        career_name = c["career_name"]

        # 3. Calculate BGE semantic similarity
        career_vector = career_vectors[i]
        raw_sim = cosine_similarity(student_vector, career_vector)
        # Normalize semantic similarity to [0, 100] percentage
        semantic_score = round(float(np.clip(raw_sim * 100.0, 0.0, 100.0)), 2)

        # 4. Calculate skill match score
        req_skills = c.get("required_skills", [])
        total_career_weight = 0.0
        weighted_fulfillment = 0.0
        matching_skills = []
        missing_skills = []

        if req_skills:
            for s in req_skills:
                s_name = s.get("skill_name", "")
                s_lower = s_name.lower()
                req_level_str = s.get("required_level", "Intermediate")
                req_score = required_level_to_numeric(req_level_str)
                w = float(s.get("weight", 1.0))
                if w <= 0:
                    w = 1.0
                total_career_weight += w

                curr_score = mastery_map.get(s_lower, 0)
                if s_lower in student_skills_lower or curr_score > 0:
                    matching_skills.append({
                        "skill_id": s.get("skill_id", ""),
                        "skill_name": s_name,
                        "current_mastery": curr_score,
                        "required_level": req_level_str,
                    })
                    ratio = min(curr_score / max(req_score, 1), 1.0)
                    weighted_fulfillment += ratio * w
                else:
                    missing_skills.append({
                        "skill_id": s.get("skill_id", ""),
                        "skill_name": s_name,
                        "required_level": req_level_str,
                        "is_core_skill": s.get("is_core_skill", False),
                    })

            skill_match_ratio = weighted_fulfillment / max(total_career_weight, 1.0)
            skill_match_score = round(float(np.clip(skill_match_ratio * 100.0, 0.0, 100.0)), 2)
        else:
            skill_match_score = semantic_score

        # 5. Combined relevance formula
        combined = (
            semantic_score * WEIGHT_SEMANTIC_MATCH
            + skill_match_score * WEIGHT_SKILL_MATCH
        )
        combined_score = int(round(np.clip(combined, 10.0, 98.0)))

        # 6. Generate explainability reason
        if len(matching_skills) >= 3:
            reason = (
                f"High match for {career_name}: you have demonstrated competency in "
                f"{len(matching_skills)} required skills including {', '.join([s['skill_name'] for s in matching_skills[:3]])} "
                f"with {int(semantic_score)}% semantic alignment to the role."
            )
        elif matching_skills:
            reason = (
                f"Moderate match: you share foundational skills ({', '.join([s['skill_name'] for s in matching_skills])}), "
                f"but bridging {len(missing_skills)} remaining skills will unlock strong readiness."
            )
        else:
            reason = (
                f"Growth opportunity: your background has {int(semantic_score)}% semantic affinity with {career_name}, "
                f"with {len(missing_skills)} target skills to acquire."
            )

        matched_careers.append({
            "career_id": career_id,
            "career_name": career_name,
            "category": c.get("category", ""),
            "description": c.get("description", ""),
            "difficulty": c.get("difficulty", "Intermediate"),
            "estimated_preparation_months": c.get("estimated_preparation_months", 6),
            "core_focus": c.get("core_focus", ""),
            "typical_entry_level": c.get("typical_entry_level", ""),
            "match_percentage": combined_score,
            "semantic_score": semantic_score,
            "skill_match_score": skill_match_score,
            "combined_score": combined_score,
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "required_skills_count": len(req_skills),
            "matched_skills_count": len(matching_skills),
            "reason": reason,
        })

    # Sort descending by match_percentage
    matched_careers.sort(key=lambda x: x["match_percentage"], reverse=True)
    return matched_careers


if __name__ == "__main__":
    print("===================================================")
    print("PATHFORGE AI - CAREER MATCHING ENGINE")
    print("===================================================\n")

    sample_skills = ["Python", "Machine Learning", "PyTorch", "Git"]
    sample_background = (
        "Computer Science undergraduate student passionate about artificial intelligence, "
        "deep neural networks, and computer vision architectures."
    )

    sample_careers = [
        {
            "career_id": "C001",
            "career_name": "Machine Learning Engineer",
            "category": "Artificial Intelligence",
            "description": "Design and build predictive AI and machine learning production pipelines.",
            "core_focus": "Model training, ML pipelines, PyTorch, Python, Cloud deployment",
            "required_skills": [
                {"skill_name": "Python", "required_level": "Expert"},
                {"skill_name": "Machine Learning", "required_level": "Advanced"},
                {"skill_name": "PyTorch", "required_level": "Advanced"},
                {"skill_name": "Docker", "required_level": "Intermediate"},
                {"skill_name": "MLOps", "required_level": "Intermediate"},
            ],
        },
        {
            "career_id": "C002",
            "career_name": "Frontend Developer",
            "category": "Web Development",
            "description": "Build responsive and interactive user interfaces using modern web frameworks.",
            "core_focus": "React, TypeScript, CSS, state management, web UX",
            "required_skills": [
                {"skill_name": "React", "required_level": "Advanced"},
                {"skill_name": "TypeScript", "required_level": "Intermediate"},
                {"skill_name": "CSS", "required_level": "Intermediate"},
                {"skill_name": "Git", "required_level": "Intermediate"},
            ],
        },
    ]

    print("Student Skills:", ", ".join(sample_skills))
    print(f"Background: {sample_background}\n")

    matches = compute_career_matches(
        student_skills=sample_skills,
        student_background_text=sample_background,
        careers=sample_careers,
    )

    print("Ranked Career Matches:")
    print("---------------------------------------------------")
    for idx, match in enumerate(matches, start=1):
        print(f"#{idx} {match['career_name']} (Match: {match['match_percentage']}%)")
        print(f"   Semantic Score: {match['semantic_score']}% | Skill Score: {match['skill_match_score']}%")
        print(f"   Matching Skills ({len(match['matching_skills'])}): {', '.join([s['skill_name'] for s in match['matching_skills']])}")
        print(f"   Missing Skills ({len(match['missing_skills'])}): {', '.join([s['skill_name'] for s in match['missing_skills']])}")
        print(f"   Reason: {match['reason']}")
        print()
    print("===================================================")
    print("Execution completed successfully.")

