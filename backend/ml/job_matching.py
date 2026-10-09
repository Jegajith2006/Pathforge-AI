"""
PathForge AI - Job Matching Engine
Computes 'PathForge AI Job Match' scores using Hugging Face BAAI/bge-small-en-v1.5
dense embeddings, required job skill evaluation, and demonstrated student competencies.

DISCLAIMER:
This calculation represents a skill-alignment heuristic ('PathForge AI Job Match').
It does NOT represent a probability of being hired or any employment prediction.
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


def compute_job_matches(
    student_skills: List[str],
    student_background_text: str,
    jobs: List[Dict[str, Any]],
    student_mastery_map: Optional[Dict[str, int]] = None,
    top_k: int = 20,
) -> List[Dict[str, Any]]:
    """
    Computes PathForge AI Job Match scores for candidate jobs.

    Parameters:
      student_skills: list of skill names student has demonstrated (e.g. ['Python', 'SQL'])
      student_background_text: student's education, projects, and summary text
      jobs: list of job dicts containing 'job_id', 'job_title', 'company_name', 'description', 'required_skills'
      student_mastery_map: optional dict mapping skill_name.lower() -> mastery_score (0-100)

    Returns:
      Ranked list of job matches with semantic alignment, skill overlap, and reasons.
    """
    if not jobs:
        return []

    mastery_map = student_mastery_map or {s.lower(): 75 for s in student_skills}
    student_skills_lower = {s.lower() for s in student_skills}

    # 1. Generate student embedding with BGE
    skills_text = ", ".join(student_skills) if student_skills else "General technical software engineering"
    student_query = f"Candidate profile with skills: {skills_text}. Experience and background: {student_background_text}"
    student_vector = generate_embedding(student_query)

    # 2. Batch encode jobs with BGE
    job_texts = []
    for j in jobs:
        req_str = j.get("required_skills", "")
        if isinstance(req_str, list):
            req_str = ", ".join(req_str)
        text = f"{j.get('job_title', '')} at {j.get('company_name', '')}. {j.get('description', '')}. Required Skills: {req_str}"
        job_texts.append(text)

    job_vectors = generate_embeddings(job_texts)

    scored_jobs = []

    for i, j in enumerate(jobs):
        job_id = j.get("job_id", "")
        job_title = j.get("job_title", "")
        company_name = j.get("company_name", "Technology Enterprise")

        # Parse required skills
        raw_req = j.get("required_skills", "")
        if isinstance(raw_req, str):
            req_skill_names = [s.strip() for s in raw_req.split(",") if s.strip()]
        elif isinstance(raw_req, list):
            req_skill_names = [str(s).strip() for s in raw_req if str(s).strip()]
        else:
            req_skill_names = []

        # 3. Calculate BGE semantic similarity
        raw_sim = float(cosine_similarity(student_vector, job_vectors[i]))
        semantic_score = round(max(0.0, min(100.0, raw_sim * 100.0)), 2)

        # 4. Calculate skill overlap
        matched_skills = []
        missing_skills = []

        if req_skill_names:
            for s in req_skill_names:
                s_lower = s.lower()
                m_score = mastery_map.get(s_lower, 0)
                if s_lower in student_skills_lower or m_score >= 40:
                    matched_skills.append({
                        "skill_name": s,
                        "mastery": m_score,
                    })
                else:
                    missing_skills.append(s)

            skill_overlap_ratio = len(matched_skills) / max(len(req_skill_names), 1)
            skill_match_score = round(float(np.clip(skill_overlap_ratio * 100.0, 0.0, 100.0)), 2)
        else:
            skill_match_score = semantic_score

        # 5. Combined 'PathForge AI Job Match' score
        # 40% BGE semantic relevance + 60% verifiable skill match
        combined = semantic_score * 0.40 + skill_match_score * 0.60
        match_score = int(round(np.clip(combined, 35.0, 98.0)))

        # 6. Explainability reason
        if len(matched_skills) >= 2:
            matched_names = [s["skill_name"] for s in matched_skills[:3]]
            reason = (
                f"PathForge AI Job Match: Strong alignment on {', '.join(matched_names)} "
                f"with {int(semantic_score)}% semantic match to the position requirements."
            )
        elif matched_skills:
            matched_name = matched_skills[0]["skill_name"]
            reason = (
                f"PathForge AI Job Match: Matches required competency in {matched_name}. "
                f"Bridging {len(missing_skills)} additional skill requirements will raise candidate profile fit."
            )
        else:
            reason = (
                f"PathForge AI Job Match: Foundational semantic match ({int(semantic_score)}%). "
                f"Recommend completing prerequisite roadmap to develop required stack: {', '.join(missing_skills[:3])}."
            )

        scored_jobs.append({
            "job_id": job_id,
            "job_title": job_title,
            "company_name": company_name,
            "location": j.get("location", "Remote / Hybrid"),
            "experience_required": j.get("experience_required", "0-2 Years"),
            "employment_type": j.get("employment_type", "Full-Time"),
            "description": j.get("description", ""),
            "required_skills": req_skill_names,
            "match_score": match_score,
            "match_percentage": f"{match_score}%",
            "semantic_score": semantic_score,
            "skill_match_score": skill_match_score,
            "matched_skills": [s["skill_name"] for s in matched_skills],
            "missing_skills": missing_skills,
            "career_readiness": f"{min(94, match_score - 2)}%",
            "resume_match": f"{min(96, match_score + 1)}%",
            "reason": reason,
            "indicator_label": "PathForge AI Job Match",
        })

    # Sort descending by match score
    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_jobs[:top_k]
