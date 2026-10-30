"""
PathForge AI - Skill Gap Analysis and Multi-Source Evidence Engine
Computes deterministic skill gaps between student demonstrated competencies
and career requirements, ranks gaps by career impact, and calculates career readiness.

CORE ARCHITECTURAL PRINCIPLE:
Uses student_skills.final_mastery (the multi-source evidence calibrated score).
Never uses self_declared_score or raw similarity alone.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from database.models import (
    Student,
    Career,
    Skill,
    CareerSkill,
    StudentSkill,
)
from config import settings
from ml.skill_matching import calculate_final_mastery, calculate_priority


def calibrate_mastery_score(
    self_declared: int = 0,
    resume: int = 0,
    assessment: int = 0,
    project: int = 0,
    certificate: int = 0,
    mentor: int = 0,
) -> Dict[str, Any]:
    """
    Transparent Multi-Source Mastery Calibration Formula.
    Connects directly to the central PathForge AI intelligence engine (ml.skill_matching.calculate_final_mastery).
    """
    return calculate_final_mastery(
        self_declared_score=self_declared,
        resume_score=resume,
        assessment_score=assessment,
        project_score=project,
        certificate_score=certificate,
        mentor_score=mentor,
    )


def update_or_create_student_skill(
    db: Session,
    student_id: str,
    skill_id: str,
    self_declared_score: Optional[int] = None,
    resume_score: Optional[int] = None,
    assessment_score: Optional[int] = None,
    project_score: Optional[int] = None,
    certificate_score: Optional[int] = None,
    mentor_score: Optional[int] = None,
) -> StudentSkill:
    """
    Updates or creates a student skill record and recalculates final_mastery,
    mastery_level, evidence_count, and 80% assessment-qualified completion status.
    """
    now_str = datetime.now().strftime("%Y-%m-%d")
    ss = (
        db.query(StudentSkill)
        .filter(
            StudentSkill.student_id == student_id,
            StudentSkill.skill_id == skill_id,
        )
        .first()
    )

    if not ss:
        is_comp = False
        comp_stat = "not_started"
        if assessment_score is not None:
            if assessment_score >= 80:
                is_comp = True
                comp_stat = "completed"
            elif assessment_score > 0:
                comp_stat = "in_progress"

        ss = StudentSkill(
            student_id=student_id,
            skill_id=skill_id,
            self_declared_score=self_declared_score or 0,
            resume_score=resume_score or 0,
            assessment_score=assessment_score or 0,
            latest_assessment_score=assessment_score or 0,
            best_assessment_score=assessment_score or 0,
            is_completed=is_comp,
            completion_status=comp_stat,
            completed_at=now_str if is_comp else None,
            project_score=project_score or 0,
            certificate_score=certificate_score or 0,
            mentor_score=mentor_score or 0,
            last_updated=now_str,
        )
        db.add(ss)
    else:
        if self_declared_score is not None:
            ss.self_declared_score = self_declared_score
        if resume_score is not None:
            ss.resume_score = resume_score
        if assessment_score is not None:
            ss.assessment_score = assessment_score
            ss.latest_assessment_score = assessment_score
            curr_best = ss.best_assessment_score or 0
            if assessment_score > curr_best:
                ss.best_assessment_score = assessment_score
            
            # Primary 80% Skill Completion Threshold Rule:
            # When student scores >= 80%, the skill qualifies as completed.
            if assessment_score >= 80:
                ss.is_completed = True
                ss.completion_status = "completed"
                if not ss.completed_at:
                    ss.completed_at = now_str
            else:
                ss.is_completed = False
                ss.completion_status = "in_progress"

        if project_score is not None:
            ss.project_score = project_score
        if certificate_score is not None:
            ss.certificate_score = certificate_score
        if mentor_score is not None:
            ss.mentor_score = mentor_score
        ss.last_updated = now_str

    calibrated = calculate_final_mastery(
        self_declared_score=ss.self_declared_score or 0,
        resume_score=ss.resume_score or 0,
        assessment_score=ss.assessment_score or 0,
        project_score=ss.project_score or 0,
        certificate_score=ss.certificate_score or 0,
        mentor_score=ss.mentor_score or 0,
    )
    ss.final_mastery = calibrated["final_mastery"]
    ss.mastery_level = calibrated["mastery_level"]
    ss.evidence_count = calibrated["evidence_count"]

    return ss


def level_to_score(level_str: str) -> int:
    """Convert qualitative level strings to target scores out of 100."""
    mapping = {
        "beginner": 40,
        "intermediate": 70,
        "advanced": 90,
    }
    return mapping.get(str(level_str).lower(), 70)


def classify_gap_status(gap: int) -> tuple[str, str, str]:
    """
    Classifies gap into meaningful status, priority label, and visual tone.
    Returns: (status, priority_label, tone)
    """
    if gap == 0:
        return ("Met", "Met", "success")
    elif gap <= 10:
        return ("Near Target", "Near Target", "purple")
    elif gap <= 30:
        return ("Moderate Gap", "Medium Priority", "purple")
    elif gap <= 50:
        return ("Major Gap", "High Priority", "warning")
    else:
        return ("Critical Gap", "Critical Gap", "danger")


def analyze_student_skill_gap(
    db: Session,
    student_id: str,
    career_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyzes student competency against their chosen target career.
    Calculates exact skill gaps, deterministic priority rankings, projected readiness lifts,
    and multi-pillar career readiness synthesis metrics.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise ValueError(f"Student '{student_id}' not found.")

    target_cid = career_id or student.target_career_id
    if not target_cid:
        return {
            "career_id": None,
            "career_name": "No Career Selected",
            "total_required_skills": 0,
            "mastered_skills_count": 0,
            "developing_skills_count": 0,
            "missing_skills_count": 0,
            "high_impact_count": 0,
            "overall_skill_gap": 0,
            "current_readiness": 0,
            "skill_match_pct": 0,
            "avg_mastery_pct": 0,
            "evidence_pct": 0,
            "projected_lift_6_weeks": 0,
            "gaps": [],
        }

    career = db.query(Career).filter(Career.career_id == target_cid).first()
    if not career:
        raise ValueError(f"Career '{target_cid}' not found.")

    # Get career required skills
    career_skills = db.query(CareerSkill).filter(CareerSkill.career_id == career.career_id).all()

    # Get student existing demonstrated skills
    student_skills_map = {
        ss.skill_id: ss
        for ss in db.query(StudentSkill).filter(StudentSkill.student_id == student.student_id).all()
    }

    gaps = []
    mastered_count = 0
    developing_count = 0
    missing_count = 0
    high_impact_count = 0
    total_gap_sum = 0
    weighted_mastery_sum = 0.0
    total_career_weight = 0.0
    verified_evidence_count = 0

    for cs in career_skills:
        skill = cs.skill
        ss = student_skills_map.get(cs.skill_id)

        target_score = level_to_score(cs.required_level)
        # CRITICAL: Always use final_mastery
        current_mastery = ss.final_mastery if ss else 0
        
        # Formula: gap = max(required_level - current_mastery, 0)
        gap_val = max(0, target_score - current_mastery)
        total_gap_sum += gap_val

        status_str, priority_label, tone_str = classify_gap_status(gap_val)

        if gap_val >= 31:
            high_impact_count += 1
        if gap_val == 0:
            mastered_count += 1
        elif current_mastery > 0:
            developing_count += 1
        else:
            missing_count += 1

        # Priority calculation using deterministic formula:
        # priority_score = normalized_gap * 0.60 + importance_score * 0.25 + career_weight_norm * 0.15
        prio_result = calculate_priority(
            gap=gap_val,
            importance=cs.importance,
            career_weight=cs.weight,
            is_core_skill=cs.is_core_skill,
        )

        # Evidence status
        if not ss or ss.final_mastery == 0:
            evidence_status = "No verified evidence yet"
        elif ss.final_mastery < 50:
            evidence_status = "Basic tutorial / Self declared"
        elif ss.evidence_count >= 2:
            evidence_status = "Assessment + Project evidence"
            verified_evidence_count += 1
        else:
            evidence_status = "Single source verified"

        if gap_val == 0:
            readiness_lift = 0
        else:
            w_norm = cs.weight if cs.weight > 0 else 1.0
            lift_raw = (gap_val / 100.0) * w_norm * 12.0 + 1.0
            readiness_lift = max(1, min(100, int(round(lift_raw))))
        weighted_mastery_sum += (current_mastery * cs.weight)
        total_career_weight += cs.weight

        is_comp = bool(ss.is_completed) if (ss and ss.is_completed is not None) else (current_mastery >= target_score)
        comp_status = ss.completion_status if (ss and ss.completion_status) else ("completed" if is_comp else ("in_progress" if current_mastery > 0 else "not_started"))
        assm_score = ss.assessment_score if (ss and ss.assessment_score is not None) else 0

        gaps.append({
            "skill_id": cs.skill_id,
            "skill_name": skill.skill_name if skill else cs.skill_id,
            "category": skill.category if skill else "Core",
            "required_level": cs.required_level,
            "required_score": target_score,
            "current_mastery": current_mastery,
            "assessment_score": assm_score,
            "is_completed": is_comp,
            "completion_status": comp_status,
            "gap": gap_val,
            "status": status_str,
            "priority": priority_label,
            "priority_score": prio_result["priority_score"],
            "priority_rank": 0,  # Will be populated after sorting
            "tone": tone_str,
            "importance": cs.importance,
            "weight": cs.weight,
            "is_core_skill": cs.is_core_skill,
            "evidence_status": evidence_status,
            "projected_readiness_lift": readiness_lift,
        })

    # Sort gaps deterministically by priority_score descending, then gap descending
    gaps.sort(key=lambda x: (x["priority_score"], x["gap"]), reverse=True)

    # Assign numerical priority ranks
    for rank_idx, g_item in enumerate(gaps, start=1):
        g_item["priority_rank"] = rank_idx

    # Compute overall readiness indicators using centralized service
    from services.career_readiness_service import compute_career_readiness as central_readiness
    readiness_obj = central_readiness(db, student_id, career_id=target_cid)

    return {
        "career_id": career.career_id,
        "career_name": career.career_name,
        "total_required_skills": len(career_skills),
        "mastered_skills_count": mastered_count,
        "developing_skills_count": developing_count,
        "missing_skills_count": missing_count,
        "high_impact_count": high_impact_count,
        "overall_skill_gap": total_gap_sum // len(career_skills) if len(career_skills) > 0 else 0,
        "current_readiness": readiness_obj["overall_readiness"],
        "skill_match_pct": readiness_obj["skill_match_percentage"],
        "avg_mastery_pct": readiness_obj["mastery_percentage"],
        "evidence_pct": readiness_obj["evidence_percentage"],
        "projected_lift_6_weeks": min(35, high_impact_count * 7),
        "gaps": gaps,
    }


def compute_career_readiness(db: Session, student_id: str) -> Dict[str, Any]:
    """
    Computes explainable PathForge AI Career Readiness Indicator via centralized service.
    """
    from services.career_readiness_service import compute_career_readiness as central_readiness
    return central_readiness(db, student_id)

