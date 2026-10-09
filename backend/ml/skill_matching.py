"""
PathForge AI - Skill Matching and Evidence Calibration Engine
Implements deterministic mastery calculations, dynamic evidence renormalization,
skill gap analysis, priority ranking, and semantic skill detection with BGE embeddings.
"""

import sys
from pathlib import Path
import re
from typing import List, Set, Dict, Tuple, Any, Union, Optional
import numpy as np

# Ensure backend directory is in sys.path when executed directly as a script
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from ml.model_config import (
    BEGINNER_MAX,
    DEVELOPING_MAX,
    PROFICIENT_MAX,
    ADVANCED_MIN,
    WEIGHT_SELF_DECLARED,
    WEIGHT_RESUME,
    WEIGHT_ASSESSMENT,
    WEIGHT_PROJECT,
    WEIGHT_CERTIFICATE,
    WEIGHT_MENTOR,
    EVIDENCE_WEIGHTS,
    WEIGHT_PRIORITY_GAP,
    WEIGHT_PRIORITY_IMPORTANCE,
    WEIGHT_PRIORITY_CAREER_WEIGHT,
    required_level_to_numeric,
)


def tokenize(text: str) -> Set[str]:
    """Tokenize and normalize text into clean lowercase alphanumeric terms."""
    if not text:
        return set()
    cleaned = re.sub(r"[^a-zA-Z0-9\s\+\#\.]", " ", text.lower())
    tokens = {t.strip() for t in cleaned.split() if len(t.strip()) > 1}
    return tokens


def jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
    """Compute standard Jaccard token similarity."""
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return float(intersection) / union if union > 0 else 0.0


def classify_skill_level(score: Union[int, float]) -> str:
    """
    Classify numeric score (0-100) into calibrated skill levels using centralized thresholds:
      - 0: Missing
      - 1-39: Beginner
      - 40-69: Developing
      - 70-84: Proficient
      - 85-100: Advanced
    """
    s = int(round(score))
    if s <= 0:
        return "Missing"
    elif s <= BEGINNER_MAX:
        return "Beginner"
    elif s <= DEVELOPING_MAX:
        return "Developing"
    elif s <= PROFICIENT_MAX:
        return "Proficient"
    else:
        return "Advanced"


def calculate_final_mastery(
    self_declared_score: int = 0,
    resume_score: int = 0,
    assessment_score: int = 0,
    project_score: int = 0,
    certificate_score: int = 0,
    mentor_score: int = 0,
) -> Dict[str, Any]:
    """
    Multi-Source Demonstrated Evidence Calibration Formula.

    Formula:
      final_mastery = sum(score_i * weight_i) / sum(weight_i for active sources)

    Rules:
      1. Self-declaration cannot exceed 10% weight.
      2. If certain evidence sources are missing, do NOT treat as zero.
         Dynamic renormalization divides by the sum of available weights.
      3. Clamps final score between 0 and 100.
    """
    scores = {
        "self_declared": max(0, min(100, int(self_declared_score or 0))),
        "resume": max(0, min(100, int(resume_score or 0))),
        "assessment": max(0, min(100, int(assessment_score or 0))),
        "project": max(0, min(100, int(project_score or 0))),
        "certificate": max(0, min(100, int(certificate_score or 0))),
        "mentor": max(0, min(100, int(mentor_score or 0))),
    }

    active_weights: Dict[str, float] = {}
    weighted_sum = 0.0

    for source, score in scores.items():
        if score > 0:
            w = EVIDENCE_WEIGHTS.get(source, 0.10)
            active_weights[source] = w
            weighted_sum += score * w

    if not active_weights:
        return {
            "final_mastery": 0,
            "mastery_level": "Missing",
            "evidence_count": 0,
            "active_weights": {},
            "raw_scores": scores,
        }

    total_weight = sum(active_weights.values())
    final_mastery = int(round(weighted_sum / total_weight))
    final_mastery = max(0, min(100, final_mastery))
    level = classify_skill_level(final_mastery)

    return {
        "final_mastery": final_mastery,
        "mastery_level": level,
        "evidence_count": len(active_weights),
        "active_weights": {k: round(v / total_weight, 4) for k, v in active_weights.items()},
        "raw_scores": scores,
    }


def calculate_skill_gap(
    required_level: Union[int, float, str],
    current_mastery: Union[int, float],
) -> int:
    """
    Calculate deterministic skill gap:
      gap = required_level - current_mastery
    Clamped strictly between 0 and 100.
    """
    req_num = required_level_to_numeric(required_level)
    curr_num = max(0, min(100, int(round(current_mastery or 0))))
    gap = req_num - curr_num
    return max(0, min(100, gap))


def calculate_skill_match(
    current_mastery: Union[int, float],
    required_level: Union[int, float, str],
) -> float:
    """
    Calculate single skill fulfillment ratio (0.0 to 1.0):
      match_ratio = min(current_mastery / required_level, 1.0)
    """
    req_num = max(1, required_level_to_numeric(required_level))
    curr_num = max(0, min(100, float(current_mastery or 0)))
    return min(curr_num / req_num, 1.0)


def calculate_priority(
    gap: int,
    importance: int = 3,
    career_weight: float = 0.05,
    is_core_skill: bool = False,
) -> Dict[str, Any]:
    """
    Calculate deterministic priority score using gap, career importance, and skill weight:
      priority_score = normalized_gap * 0.60 + importance_score * 0.25 + career_weight_norm * 0.15
    """
    normalized_gap = max(0.0, min(1.0, gap / 100.0))
    importance_score = max(0.0, min(1.0, importance / 5.0))
    career_weight_norm = max(0.0, min(1.0, career_weight * 5.0))

    score = (
        normalized_gap * WEIGHT_PRIORITY_GAP
        + importance_score * WEIGHT_PRIORITY_IMPORTANCE
        + career_weight_norm * WEIGHT_PRIORITY_CAREER_WEIGHT
    )

    if is_core_skill and gap >= 40:
        score = min(1.0, score + 0.10)

    score = round(score, 4)

    if gap == 0:
        priority_label = "Low"
    elif score >= 0.60 or (is_core_skill and gap >= 45):
        priority_label = "High"
    elif score >= 0.35:
        priority_label = "Medium"
    else:
        priority_label = "Low"

    return {
        "priority": priority_label,
        "priority_score": score,
    }


def calculate_overall_skill_match(skills_data: List[Dict[str, Any]]) -> float:
    """
    Calculate overall career weighted skill match percentage:
      weighted_match = sum(min(current_mastery / required_level, 1.0) * skill_weight) / sum(skill_weight)
    Returns percentage [0.0, 100.0].
    """
    if not skills_data:
        return 0.0

    total_weight = 0.0
    weighted_sum = 0.0

    for s in skills_data:
        req = required_level_to_numeric(s.get("required_level", 70))
        curr = max(0, min(100, float(s.get("current_mastery", 0))))
        w = float(s.get("weight", 1.0))
        if w <= 0:
            w = 1.0

        ratio = min(curr / max(req, 1), 1.0)
        weighted_sum += ratio * w
        total_weight += w

    if total_weight <= 0:
        return 0.0

    match_pct = (weighted_sum / total_weight) * 100.0
    return round(float(np.clip(match_pct, 0.0, 100.0)), 2)


def extract_matched_skills(text: str, candidate_skills: List[Dict[str, str]]) -> List[Dict]:
    """
    Fast regex token search of text for candidate skill names and acronyms.
    Returns matched skills with confidence.
    """
    if not text:
        return []

    lowered_text = " " + text.lower() + " "
    matched = []

    for item in candidate_skills:
        s_name = item["skill_name"].lower()
        escaped = re.escape(s_name)
        pattern = rf"(?:\b|_){escaped}(?:\b|_)"

        if re.search(pattern, lowered_text):
            matched.append({
                "skill_id": item["skill_id"],
                "skill_name": item["skill_name"],
                "category": item.get("category", "General"),
                "confidence": 0.95,
                "detected": True,
            })
        else:
            tokens = s_name.split()
            if len(tokens) > 1 and all(re.search(rf"\b{re.escape(t)}\b", lowered_text) for t in tokens):
                matched.append({
                    "skill_id": item["skill_id"],
                    "skill_name": item["skill_name"],
                    "category": item.get("category", "General"),
                    "confidence": 0.85,
                    "detected": True,
                })

    return matched


def semantic_skill_detection(
    resume_text: str,
    candidate_skills: List[Dict[str, Any]],
    threshold: float = 0.60,
) -> List[Dict[str, Any]]:
    """
    Hybrid Skill Detection:
    Combines exact/regex token matching with Hugging Face BAAI/bge-small-en-v1.5
    dense semantic embeddings to detect skills mentioned or contextualized in text.
    """
    if not resume_text:
        return []

    from ml.embedding_service import generate_embedding, generate_embeddings, cosine_similarity

    # 1. First run fast regex match
    regex_matches = {m["skill_id"]: m for m in extract_matched_skills(resume_text, candidate_skills)}

    # 2. Extract semantic descriptions/names for candidate skills not caught by regex
    uncaught = [s for s in candidate_skills if s["skill_id"] not in regex_matches]
    if not uncaught:
        return list(regex_matches.values())

    # Build resume chunk representations (first 500 words or key sections)
    resume_snippet = " ".join(resume_text.split()[:350])
    resume_emb = generate_embedding(resume_snippet)

    # Encode candidate skill queries
    skill_texts = [
        f"{s['skill_name']}: {s.get('description', '')[:100]}"
        for s in uncaught
    ]
    skill_embs = generate_embeddings(skill_texts)

    results = list(regex_matches.values())
    for s, emb in zip(uncaught, skill_embs):
        sim = cosine_similarity(resume_emb, emb)
        if sim >= threshold:
            results.append({
                "skill_id": s["skill_id"],
                "skill_name": s["skill_name"],
                "category": s.get("category", "General"),
                "confidence": round(float(sim), 3),
                "detected": True,
                "detection_mode": "semantic_bge",
            })

    return results
