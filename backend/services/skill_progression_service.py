"""
PathForge AI - Dynamic Skill Progression and Completion Engine
Implements the 80% Assessment-Qualified Skill Completion Threshold,
DAG Prerequisite Progression Tracking, and Evidence-Driven Skill Signals.
"""

from typing import List, Dict, Any, Optional, Set, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from database.models import (
    Student,
    Career,
    Skill,
    CareerSkill,
    SkillPrerequisite,
    StudentSkill,
    StudentCourseProgress,
    StudentProjectProgress,
    AssessmentAnswer,
)
from services.roadmap_service import build_prerequisite_graph, topological_sort_with_cycle_detection

SKILL_COMPLETION_THRESHOLD = 80


def evaluate_skill_completion(assessment_score: int) -> Tuple[bool, str]:
    """
    Primary Progression Rule:
    - When a student achieves at least 80% in the assessment for a particular skill,
      that skill becomes completed for the selected learning track.
    - Exactly 80% qualifies.
    - Below 80% does not qualify.
    - 0% or unassessed is not started.
    """
    if assessment_score >= SKILL_COMPLETION_THRESHOLD:
        return True, "completed"
    elif assessment_score > 0:
        return False, "in_progress"
    return False, "not_started"


def get_student_career_progression(
    db: Session,
    student_id: str,
    career_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Evaluates learning track progression for the student's selected career.
    Identifies:
      1. Completed skills (assessment score >= 80%)
      2. In-progress skills (0 < assessment score < 80% or course enrolled)
      3. Eligible skills (prerequisites satisfied, not yet started)
      4. Locked skills (missing prerequisites)
      5. Current skill and next recommended skill with explainability rationale
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise ValueError(f"Student '{student_id}' not found.")

    target_cid = career_id or student.target_career_id
    career = db.query(Career).filter(Career.career_id == target_cid).first()
    if not career:
        career = db.query(Career).first()
        target_cid = career.career_id if career else "C001"

    career_skills = (
        db.query(CareerSkill)
        .filter(CareerSkill.career_id == target_cid)
        .order_by(CareerSkill.is_core_skill.desc(), CareerSkill.importance.desc())
        .all()
    )

    # Student existing skills map
    student_skills_map = {
        ss.skill_id: ss
        for ss in db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
    }

    # Prerequisite dependency graphs
    prereq_to_dependents, dependent_to_prereqs = build_prerequisite_graph(db)

    # Topological sort of career skills
    all_skill_ids = [cs.skill_id for cs in career_skills]
    sorted_skill_ids = topological_sort_with_cycle_detection(all_skill_ids, prereq_to_dependents)

    # Skill objects map
    skills_map = {
        s.skill_id: s
        for s in db.query(Skill).filter(Skill.skill_id.in_(all_skill_ids)).all()
    }
    career_skills_map = {cs.skill_id: cs for cs in career_skills}

    completed_skills = []
    in_progress_skills = []
    eligible_skills = []
    locked_skills = []
    all_progression_items = []

    completed_ids: Set[str] = set()

    # Pass 1: Identify all skills meeting the 80% completion rule
    for sid in sorted_skill_ids:
        ss = student_skills_map.get(sid)
        assm_score = ss.assessment_score if ss else 0
        is_comp = bool(ss.is_completed) if (ss and ss.is_completed is not None) else (assm_score >= SKILL_COMPLETION_THRESHOLD)
        if is_comp:
            completed_ids.add(sid)

    # Pass 2: Classify skills and check prerequisites
    for sid in sorted_skill_ids:
        cs = career_skills_map.get(sid)
        skill_obj = skills_map.get(sid)
        ss = student_skills_map.get(sid)

        skill_name = skill_obj.skill_name if skill_obj else sid
        category = skill_obj.category if skill_obj else "Core"
        importance = cs.importance if cs else 3
        is_core = cs.is_core_skill if cs else False
        required_level = cs.required_level if cs else "Intermediate"

        assm_score = ss.assessment_score if ss else 0
        final_mastery = ss.final_mastery if ss else 0
        mastery_level = ss.mastery_level if ss else "Missing"
        evidence_count = ss.evidence_count if ss else 0

        # Prerequisites for this skill
        prereq_ids = dependent_to_prereqs.get(sid, [])
        unmet_prereqs = []
        met_prereqs = []

        for pid in prereq_ids:
            p_skill = db.query(Skill).filter(Skill.skill_id == pid).first()
            p_name = p_skill.skill_name if p_skill else pid
            if pid in completed_ids:
                met_prereqs.append(p_name)
            else:
                unmet_prereqs.append(p_name)

        has_prereqs = len(prereq_ids) > 0
        all_prereqs_met = len(unmet_prereqs) == 0

        # Determine status
        if sid in completed_ids:
            status = "completed"
            status_label = "Completed (Assessment Qualified)"
            action_text = f"Skill completed with {assm_score}% assessment score. Mastery verified."
        elif not all_prereqs_met:
            status = "locked"
            status_label = "Locked (Prerequisites Required)"
            action_text = f"Complete prerequisite(s) first: {', '.join(unmet_prereqs)}."
        elif assm_score > 0:
            status = "in_progress"
            status_label = "In Progress"
            action_text = f"Current score: {assm_score}%. Achieve >= 80% to qualify for completion."
        else:
            status = "eligible"
            status_label = "Eligible to Learn"
            action_text = "Prerequisites satisfied. Ready to start diagnostic assessment or course."

        item = {
            "skill_id": sid,
            "skill_name": skill_name,
            "category": category,
            "importance": importance,
            "is_core_skill": is_core,
            "required_level": required_level,
            "assessment_score": assm_score,
            "final_mastery": final_mastery,
            "mastery_level": mastery_level,
            "evidence_count": evidence_count,
            "is_completed": (sid in completed_ids),
            "status": status,
            "status_label": status_label,
            "next_action": action_text,
            "prerequisites": [skills_map.get(pid, pid).skill_name if pid in skills_map else pid for pid in prereq_ids],
            "unmet_prerequisites": unmet_prereqs,
            "met_prerequisites": met_prereqs,
        }

        all_progression_items.append(item)

        if status == "completed":
            completed_skills.append(item)
        elif status == "in_progress":
            in_progress_skills.append(item)
        elif status == "eligible":
            eligible_skills.append(item)
        elif status == "locked":
            locked_skills.append(item)

    # Determine Current Skill and Next Recommended Skill
    current_skill = None
    next_skill = None
    selection_reason = ""

    if in_progress_skills:
        current_skill = in_progress_skills[0]
        selection_reason = (
            f"{current_skill['skill_name']} is currently in progress at {current_skill['assessment_score']}%. "
            f"Achieve the 80% assessment threshold to complete this milestone."
        )
        if len(in_progress_skills) > 1:
            next_skill = in_progress_skills[1]
        elif eligible_skills:
            next_skill = eligible_skills[0]
    elif eligible_skills:
        current_skill = eligible_skills[0]
        met_str = f" after completing {', '.join(current_skill['met_prerequisites'])}" if current_skill['met_prerequisites'] else ""
        selection_reason = (
            f"{current_skill['skill_name']} is the next eligible foundational skill{met_str} "
            f"in the {career.career_name} track."
        )
        if len(eligible_skills) > 1:
            next_skill = eligible_skills[1]
    elif locked_skills:
        current_skill = locked_skills[0]
        selection_reason = (
            f"{current_skill['skill_name']} is locked. Complete prerequisites: {', '.join(current_skill['unmet_prerequisites'])}."
        )
    else:
        selection_reason = f"All required competencies for {career.career_name} completed at >=80% threshold!"

    total_req = max(len(career_skills), 1)
    comp_count = len(completed_skills)
    progression_pct = int(round((comp_count / total_req) * 100))

    return {
        "target_career_id": target_cid,
        "target_career_name": career.career_name,
        "completion_threshold": SKILL_COMPLETION_THRESHOLD,
        "total_required_skills": total_req,
        "completed_skills_count": comp_count,
        "in_progress_skills_count": len(in_progress_skills),
        "eligible_skills_count": len(eligible_skills),
        "locked_skills_count": len(locked_skills),
        "progression_percentage": progression_pct,
        "current_skill": current_skill,
        "next_eligible_skill": next_skill or current_skill,
        "next_recommended_skill": next_skill or current_skill,
        "selection_reason": selection_reason,
        "completed_skills": completed_skills,
        "in_progress_skills": in_progress_skills,
        "eligible_skills": eligible_skills,
        "locked_skills": locked_skills,
        "all_skills": all_progression_items,
    }
