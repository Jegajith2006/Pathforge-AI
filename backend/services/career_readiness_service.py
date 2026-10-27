"""
PathForge AI - Career Readiness Indicator Service
Calculates the multi-pillar PathForge AI Career Readiness Indicator and 6-Axis Skill Radar
strictly derived from the authenticated student's empirical database records.

Formula:
  Overall Indicator = (0.50 × Skill Match) + (0.30 × Demonstrated Mastery) + (0.20 × Evidence Density)

IMPORTANT:
This metric is an educational skill-competency indicator for guiding personalized roadmaps.
It does NOT represent an official hiring score, employment probability, or job selection prediction.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from database.models import Student, Career, CareerSkill, StudentSkill, Skill, Certificate, StudentCourseProgress, StudentProjectProgress
from ml.model_config import (
    READINESS_SKILL_MATCH_WEIGHT,
    READINESS_MASTERY_WEIGHT,
    READINESS_EVIDENCE_WEIGHT,
    required_level_to_numeric,
)


def compute_career_skill_radar(db: Session, student_id: str, career_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Constructs the 6-Axis Skill Radar dynamically from the student's actual career-specific competencies.
    Extracts the top 6 core skills mapped to the selected target career and returns the student's actual
    demonstrated mastery percentage (0 if unevaluated/unassessed).
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        return []

    target_cid = career_id or student.target_career_id
    career = db.query(Career).filter(Career.career_id == target_cid).first()
    if not career:
        career = db.query(Career).first()
        target_cid = career.career_id if career else "C001"

    # Select top 6 skills for this career ordered by core status and importance
    top_career_skills = (
        db.query(CareerSkill)
        .filter(CareerSkill.career_id == target_cid)
        .order_by(CareerSkill.is_core_skill.desc(), CareerSkill.importance.desc())
        .limit(6)
        .all()
    )

    student_skills = {
        ss.skill_id: ss
        for ss in db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
    }

    radar_points = []
    for cs in top_career_skills:
        skill_name = cs.skill.skill_name if cs.skill else cs.skill_id
        ss = student_skills.get(cs.skill_id)
        val = int(ss.final_mastery) if (ss and ss.final_mastery is not None) else 0
        is_comp = bool(ss.is_completed) if ss else False

        radar_points.append({
            "label": f"{skill_name} {val}%",
            "dimension": skill_name,
            "skill_id": cs.skill_id,
            "value": val,
            "required_level": cs.required_level,
            "is_completed": is_comp,
            "status": "Completed" if is_comp else ("In Progress" if val > 0 else "Unevaluated"),
        })

    # If career has fewer than 6 skills, backfill from related skills
    if len(radar_points) < 6:
        existing_sids = {p["skill_id"] for p in radar_points}
        other_skills = (
            db.query(Skill)
            .filter(~Skill.skill_id.in_(existing_sids))
            .limit(6 - len(radar_points))
            .all()
        )
        for s in other_skills:
            ss = student_skills.get(s.skill_id)
            val = int(ss.final_mastery) if (ss and ss.final_mastery is not None) else 0
            radar_points.append({
                "label": f"{s.skill_name} {val}%",
                "dimension": s.skill_name,
                "skill_id": s.skill_id,
                "value": val,
                "required_level": "Intermediate",
                "is_completed": bool(ss.is_completed) if ss else False,
                "status": "In Progress" if val > 0 else "Unevaluated",
            })

    return radar_points


def compute_career_readiness(db: Session, student_id: str, career_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes the PathForge AI Career Readiness Indicator dynamically from the student's actual database records.

    Pillars:
      1. Skill Match (50%): Weighted ratio of student's demonstrated mastery vs required level for the target career.
      2. Demonstrated Mastery (30%): Average demonstrated final mastery across relevant career competencies.
      3. Practical Evidence (20%): Proctored assessment, project, certificate, and course evidence density.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise ValueError(f"Student with ID '{student_id}' not found.")

    target_career_id = career_id or student.target_career_id
    career = db.query(Career).filter(Career.career_id == target_career_id).first()
    if not career:
        career = db.query(Career).first()
        target_career_id = career.career_id if career else "C001"

    career_skills = (
        db.query(CareerSkill)
        .filter(CareerSkill.career_id == target_career_id)
        .order_by(CareerSkill.is_core_skill.desc(), CareerSkill.importance.desc())
        .all()
    )

    student_skills = {
        ss.skill_id: ss
        for ss in db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
    }

    if not career_skills:
        return {
            "title": "PathForge AI Career Readiness Indicator",
            "overall_readiness": 0,
            "overall_score": 0,
            "career_readiness_score": 0,
            "confidence_score": 0.0,
            "target_career_id": target_career_id,
            "target_career_name": career.career_name if career else "Target Career",
            "career_id": target_career_id,
            "career_name": career.career_name if career else "Target Career",
            "skill_match_percentage": 0,
            "skill_match": 0,
            "mastery_percentage": 0,
            "mastery": 0,
            "evidence_percentage": 0,
            "evidence": 0,
            "readiness_level": "Awaiting Assessment",
            "readiness_tier": "Awaiting Assessment",
            "verified_skills_count": 0,
            "total_required_skills": 0,
            "gap_count": 0,
            "formula": "Readiness = (Skill Match × 0.50) + (Skill Mastery × 0.30) + (Practical Evidence × 0.20)",
            "explanation": "No career competency requirements configured. Choose an active career track.",
            "next_best_action": "Select a supported career track.",
            "disclaimer": "This is a project-based career readiness indicator, not an official employment or hiring score.",
        }

    total_weight = 0.0
    weighted_skill_match = 0.0
    mastery_scores: List[float] = []
    evidence_counts: List[int] = []
    gaps_count = 0
    verified_count = 0
    completed_skills_count = 0
    top_gap_skill_name = "Core Competencies"
    max_gap_amt = 0

    has_any_evidence = False

    for cs in career_skills:
        w = float(cs.weight or 1.0)
        if w <= 0:
            w = 1.0
        total_weight += w

        req_num = required_level_to_numeric(cs.required_level)
        ss = student_skills.get(cs.skill_id)

        if ss and ss.final_mastery > 0:
            has_any_evidence = True
            mastery = float(ss.final_mastery)
            ev_count = int(ss.evidence_count or 1)
            gap = max(0, req_num - int(mastery))
            if ss.is_completed:
                completed_skills_count += 1
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

    # Combined formula: 50% Match + 30% Mastery + 20% Evidence
    if not has_any_evidence:
        overall_score = 0
        skill_match = 0.0
        mastery = 0.0
        evidence = 0.0
        readiness_level = "Awaiting Assessment"
        readiness_tier = "Awaiting Assessment"
        explanation = f"No verified evidence or assessment results recorded yet for {student.first_name}. Start your diagnostic assessment to calibrate your readiness."
        next_best_action = f"Complete {top_gap_skill_name} diagnostic assessment to establish baseline competency."
        confidence_val = 0.0
    else:
        overall = (
            skill_match * READINESS_SKILL_MATCH_WEIGHT
            + mastery * READINESS_MASTERY_WEIGHT
            + evidence * READINESS_EVIDENCE_WEIGHT
        )
        overall_score = int(round(min(100.0, max(0.0, overall))))

        if overall_score >= 85:
            readiness_level = "Candidate Ready"
            readiness_tier = "Interview Ready"
        elif overall_score >= 65:
            readiness_level = "Competitive Candidate"
            readiness_tier = "Competitive Candidate"
        elif overall_score >= 40:
            readiness_level = "Developing Competency"
            readiness_tier = "Developing Candidate"
        else:
            readiness_level = "Early Learner"
            readiness_tier = "Early Learner"

        explanation = f"Evaluated from {student.student_id}'s verified empirical evidence graph. Foundation in core tools with active growth target in {top_gap_skill_name}."
        next_best_action = f"Complete {top_gap_skill_name} Foundations to bridge active skill gap."
        confidence_val = round(min(98.0, max(15.0, (total_active_evidence / max(len(career_skills), 1)) * 30.0)), 1)

    radar_distribution = compute_career_skill_radar(db, student_id, career_id=target_career_id)

    return {
        "title": "PathForge AI Career Readiness Indicator",
        "overall_readiness": overall_score,
        "overall_score": overall_score,
        "career_readiness_score": overall_score,
        "confidence_score": confidence_val,
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
        "readiness_tier": readiness_tier,
        "verified_skills_count": verified_count,
        "completed_skills_count": completed_skills_count,
        "total_required_skills": len(career_skills),
        "gap_count": gaps_count,
        "formula": "Readiness = (Skill Match × 0.50) + (Skill Mastery × 0.30) + (Practical Evidence × 0.20)",
        "explanation": explanation,
        "next_best_action": next_best_action,
        "radar_distribution": [
            {"dimension": p["dimension"], "score": p["value"]}
            for p in radar_distribution
        ],
        "radar_data": radar_distribution,
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
