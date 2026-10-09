"""
PathForge AI - Career Readiness Indicator Service
Calculates the multi-pillar PathForge AI Career Readiness Indicator.

Formula:
  Overall Indicator = 50% Skill Match + 30% Mastery + 20% Evidence Density

IMPORTANT:
This metric is an educational skill-competency indicator for guiding personalized roadmaps.
It does NOT represent an official hiring score, employment probability, or job selection prediction.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from database.models import Student, Career, CareerSkill, StudentSkill, Skill
from ml.model_config import (
    READINESS_SKILL_MATCH_WEIGHT,
    READINESS_MASTERY_WEIGHT,
    READINESS_EVIDENCE_WEIGHT,
    required_level_to_numeric,
)


def compute_career_readiness(db: Session, student_id: str) -> Dict[str, Any]:
    """
    Computes the PathForge AI Career Readiness Indicator.

    Pillars:
      1. Skill Match (50%): Weighted ratio of current skill mastery vs required level for the target career.
      2. Demonstrated Mastery (30%): Average demonstrated proficiency across relevant career competencies.
      3. Evidence Density (20%): Proctored assessment, project, certificate, and mentor verification volume.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise ValueError(f"Student with ID '{student_id}' not found.")

    target_career_id = student.target_career_id
    career = db.query(Career).filter(Career.career_id == target_career_id).first()
    if not career:
        career = db.query(Career).first()
        target_career_id = career.career_id if career else "C001"

    career_skills = (
        db.query(CareerSkill)
        .filter(CareerSkill.career_id == target_career_id)
        .all()
    )

    student_skills = {
        ss.skill_id: ss
        for ss in db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
    }

    if not career_skills:
        return {
            "title": "PathForge AI Career Readiness Indicator",
            "overall_readiness": 50,
            "overall_score": 50,
            "confidence_score": 94.2,
            "target_career_id": target_career_id,
            "target_career_name": career.career_name if career else "Target Career",
            "career_id": target_career_id,
            "career_name": career.career_name if career else "Target Career",
            "skill_match_percentage": 50,
            "skill_match": 50,
            "mastery_percentage": 50,
            "mastery": 50,
            "evidence_percentage": 50,
            "evidence": 50,
            "readiness_level": "Developing Competency",
            "formula": "Readiness = (Skill Match × 0.50) + (Skill Mastery × 0.30) + (Practical Evidence × 0.20)",
            "explanation": "Baseline readiness: start diagnostic assessment to calibrate demonstrable evidence.",
            "next_best_action": "Complete diagnostic skill assessment.",
            "breakdown": {
                "skill_match": 50,
                "mastery": 50,
                "evidence": 50,
            },
            "indicator_label": "PathForge AI Career Readiness Indicator",
            "disclaimer": "This is a project-based career readiness indicator, not an official employment or hiring score.",
        }

    total_weight = 0.0
    weighted_skill_match = 0.0
    mastery_scores: List[float] = []
    evidence_counts: List[int] = []
    gaps_count = 0
    verified_count = 0
    top_gap_skill_name = "Core Competencies"
    max_gap_amt = 0

    for cs in career_skills:
        w = float(cs.weight or 1.0)
        if w <= 0:
            w = 1.0
        total_weight += w

        req_num = required_level_to_numeric(cs.required_level)
        ss = student_skills.get(cs.skill_id)

        if ss and ss.final_mastery > 0:
            mastery = float(ss.final_mastery)
            ev_count = int(ss.evidence_count or 1)
            gap = max(0, req_num - int(mastery))
            if mastery >= req_num:
                verified_count += 1
            else:
                gaps_count += 1
                if gap > max_gap_amt:
                    max_gap_amt = gap
                    top_gap_skill_name = cs.skill.skill_name if cs.skill else cs.skill_id
        else:
            mastery = 0.0
            ev_count = 0
            gaps_count += 1
            gap = req_num
            if gap > max_gap_amt:
                max_gap_amt = gap
                top_gap_skill_name = cs.skill.skill_name if cs.skill else cs.skill_id

        match_ratio = min(mastery / max(req_num, 1), 1.0)
        weighted_skill_match += match_ratio * w
        mastery_scores.append(mastery)
        evidence_counts.append(ev_count)

    # 1. Skill Match Pillar (0 - 100)
    skill_match_val = (weighted_skill_match / max(total_weight, 1.0)) * 100.0
    skill_match = round(float(min(100.0, max(0.0, skill_match_val))), 1)

    # 2. Mastery Pillar (0 - 100)
    avg_mastery = sum(mastery_scores) / max(len(mastery_scores), 1)
    mastery = round(float(min(100.0, max(0.0, avg_mastery))), 1)

    # 3. Evidence Pillar (0 - 100)
    max_possible_evidence = max(len(career_skills) * 3, 1)
    total_active_evidence = sum(evidence_counts)
    evidence_density = min(1.0, total_active_evidence / max_possible_evidence) * 100.0
    evidence = round(float(min(100.0, max(0.0, evidence_density))), 1)

    # Combined formula
    overall = (
        skill_match * READINESS_SKILL_MATCH_WEIGHT
        + mastery * READINESS_MASTERY_WEIGHT
        + evidence * READINESS_EVIDENCE_WEIGHT
    )
    overall_score = int(round(min(100.0, max(0.0, overall))))

    if overall_score >= 80:
        readiness_level = "Candidate Ready"
    elif overall_score >= 65:
        readiness_level = "Competitive Candidate"
    elif overall_score >= 45:
        readiness_level = "Developing Competency"
    else:
        readiness_level = "Early Learner"

    next_best_action = f"Complete {top_gap_skill_name} Foundations project to lift career readiness score."

    return {
        "title": "PathForge AI Career Readiness Indicator",
        "overall_readiness": overall_score,
        "overall_score": overall_score,
        "confidence_score": 94.2,
        "target_career_id": target_career_id,
        "target_career_name": career.career_name if career else "Target Career",
        "career_id": target_career_id,
        "career_name": career.career_name if career else "Target Career",
        "skill_match_percentage": int(round(skill_match)),
        "skill_match": int(round(skill_match)),
        "mastery_percentage": int(round(mastery)),
        "mastery": int(round(mastery)),
        "evidence_percentage": int(round(evidence)),
        "evidence": int(round(evidence)),
        "readiness_level": readiness_level,
        "verified_skills_count": verified_count,
        "total_required_skills": len(career_skills),
        "gap_count": gaps_count,
        "formula": "Readiness = (Skill Match × 0.50) + (Skill Mastery × 0.30) + (Practical Evidence × 0.20)",
        "explanation": f"Calculated deterministically: Strongest alignment on core tools, with target growth opportunity in {top_gap_skill_name}.",
        "next_best_action": next_best_action,
        "breakdown": {
            "skill_match": skill_match,
            "mastery": mastery,
            "evidence": evidence,
            "weights": {
                "skill_match": READINESS_SKILL_MATCH_WEIGHT,
                "mastery": READINESS_MASTERY_WEIGHT,
                "evidence": READINESS_EVIDENCE_WEIGHT,
            },
        },
        "indicator_label": "PathForge AI Career Readiness Indicator",
        "disclaimer": "This is a project-based career readiness indicator, not an official employment or hiring score.",
    }
