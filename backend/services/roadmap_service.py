"""
PathForge AI - Personalized Learning Roadmap Generator
Generates adaptive, prerequisite-aware learning roadmaps using DAG topological sorting,
deterministic skill gap analysis, course/project matching, and weekly milestone planning.

CORE PRINCIPLE:
Roadmap generation is deterministic and grounded in multi-source evidence mastery.
Gemini provides explanations on top of the generated DAG sequence; it does NOT invent the sequence.
"""

from typing import List, Dict, Any, Optional, Set, Tuple
from collections import defaultdict, deque
from datetime import datetime
from sqlalchemy.orm import Session

from database.models import (
    Student,
    Career,
    Skill,
    CareerSkill,
    SkillPrerequisite,
    StudentSkill,
    Course,
    CourseSkill,
    Project,
    ProjectSkill,
    StudentRoadmapStep,
    StudentCourseProgress,
    StudentProjectProgress,
)
from services.skill_gap_service import analyze_student_skill_gap, level_to_score


def build_prerequisite_graph(
    db: Session,
) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    """
    Builds the prerequisite adjacency graphs from the skill_prerequisites database table.
    Returns:
      - prereq_to_dependents: {prereq_id: [dependent_ids]} (edges for topological sorting)
      - dependent_to_prereqs: {dependent_id: [prereq_ids]} (prerequisite lookup)
    """
    all_prereqs = db.query(SkillPrerequisite).all()
    prereq_to_dependents = defaultdict(list)
    dependent_to_prereqs = defaultdict(list)

    for p in all_prereqs:
        src = p.prerequisite_skill_id
        dst = p.dependent_skill_id
        prereq_to_dependents[src].append(dst)
        dependent_to_prereqs[dst].append(src)

    return prereq_to_dependents, dependent_to_prereqs


def topological_sort_with_cycle_detection(
    skill_ids: List[str],
    prereq_to_dependents: Dict[str, List[str]],
) -> List[str]:
    """
    Kahn's Algorithm for DAG topological ordering with safe cycle handling.
    Orders prerequisite skills before their dependent skills.
    """
    all_skills_set = set(skill_ids)
    in_degree = defaultdict(int)
    graph = defaultdict(list)

    # Initialize graph and in-degrees for the target skill subset
    for s in all_skills_set:
        in_degree[s] = 0

    for src in all_skills_set:
        for dst in prereq_to_dependents.get(src, []):
            if dst in all_skills_set:
                graph[src].append(dst)
                in_degree[dst] += 1

    # Skills with in_degree == 0 have all prerequisites satisfied
    queue = deque([s for s in skill_ids if in_degree[s] == 0])
    sorted_order = []
    visited = set()

    while queue:
        curr = queue.popleft()
        if curr in visited:
            continue
        visited.add(curr)
        sorted_order.append(curr)

        for neighbor in graph[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] <= 0 and neighbor not in visited:
                queue.append(neighbor)

    # If any skills remain unvisited due to circular dependencies, append them safely
    for s in skill_ids:
        if s not in visited:
            sorted_order.append(s)

    return sorted_order


def find_best_course_for_skill(db: Session, skill_id: str) -> Tuple[Optional[str], str, str]:
    """Finds best matching course from database for a specific skill."""
    cs = (
        db.query(CourseSkill)
        .filter(CourseSkill.skill_id == skill_id)
        .order_by(CourseSkill.importance.desc())
        .first()
    )
    if cs and cs.course:
        return (cs.course.course_id, cs.course.course_name, cs.course.provider)

    # Fallback to course with matching name
    skill_obj = db.query(Skill).filter(Skill.skill_id == skill_id).first()
    s_name = skill_obj.skill_name if skill_obj else "Core Engineering"
    
    course = (
        db.query(Course)
        .filter(Course.course_name.ilike(f"%{s_name}%"))
        .first()
    )
    if course:
        return (course.course_id, course.course_name, course.provider)

    return (None, f"{s_name} Foundations & Best Practices", "Coursera / Stanford Online")


def find_best_project_for_skill(db: Session, skill_id: str) -> Tuple[Optional[str], str]:
    """Finds best matching portfolio project from database for a specific skill."""
    ps = (
        db.query(ProjectSkill)
        .filter(ProjectSkill.skill_id == skill_id)
        .order_by(ProjectSkill.importance.desc())
        .first()
    )
    if ps and ps.project:
        return (ps.project.project_id, ps.project.project_name)

    skill_obj = db.query(Skill).filter(Skill.skill_id == skill_id).first()
    s_name = skill_obj.skill_name if skill_obj else "Engineering"
    
    project = (
        db.query(Project)
        .filter(Project.project_name.ilike(f"%{s_name}%"))
        .first()
    )
    if project:
        return (project.project_id, project.project_name)

    return (None, f"{s_name} Applied Pipeline Project")


def generate_topological_roadmap(
    db: Session,
    student_id: str,
    career_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates an adaptive, personalized learning roadmap for the student:
      1. Evaluates multi-source final mastery for all career required skills.
      2. Analyzes prerequisite dependencies from skill_prerequisites.
      3. Identifies missing prerequisite foundations.
      4. Executes DAG topological sorting to schedule prerequisites first.
      5. Matches optimal courses and portfolio projects.
      6. Builds dynamic weekly learning plan.
      7. Persists roadmap milestones in student_roadmap_steps.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise ValueError(f"Student '{student_id}' not found.")

    target_cid = career_id or student.target_career_id
    gap_data = analyze_student_skill_gap(db, student_id, career_id=target_cid)
    career_name = gap_data["career_name"]

    gaps_map = {g["skill_id"]: g for g in gap_data["gaps"]}
    
    # Prerequisite analysis
    prereq_to_dependents, dependent_to_prereqs = build_prerequisite_graph(db)

    # Identify candidate skills to include in roadmap:
    # 1. All career skills with gap > 0 (or all core career skills)
    # 2. Any unmet prerequisite skills (mastery < 50) needed by career skills
    candidate_skill_ids: Set[str] = set()

    for g_item in gap_data["gaps"]:
        sid = g_item["skill_id"]
        # Include skills that have gaps or need validation
        if g_item["gap"] > 0 or g_item["current_mastery"] < 70:
            candidate_skill_ids.add(sid)
            # Check prerequisites
            for prereq_id in dependent_to_prereqs.get(sid, []):
                prereq_ss = (
                    db.query(StudentSkill)
                    .filter(
                        StudentSkill.student_id == student_id,
                        StudentSkill.skill_id == prereq_id,
                    )
                    .first()
                )
                prereq_mastery = prereq_ss.final_mastery if prereq_ss else 0
                if prereq_mastery < 60:
                    candidate_skill_ids.add(prereq_id)

    # If all skills are met, include the highest weight career skills for continuous mastery
    if not candidate_skill_ids:
        candidate_skill_ids = set([g["skill_id"] for g in gap_data["gaps"][:6]])

    # Execute topological sort on the candidate skills
    sorted_skill_ids = topological_sort_with_cycle_detection(
        skill_ids=list(candidate_skill_ids),
        prereq_to_dependents=prereq_to_dependents,
    )

    # Build detailed roadmap milestones
    milestones: List[Dict[str, Any]] = []
    weekly_plan: List[Dict[str, Any]] = []
    
    current_week = 1
    completed_milestones_count = 0
    in_progress_set = False

    for idx, sid in enumerate(sorted_skill_ids, start=1):
        g_info = gaps_map.get(sid)
        skill_obj = db.query(Skill).filter(Skill.skill_id == sid).first()
        skill_name = skill_obj.skill_name if skill_obj else sid

        if g_info:
            current_mastery = g_info["current_mastery"]
            target_score = g_info["required_score"]
            target_level = g_info["required_level"]
            gap_val = g_info["gap"]
            priority = g_info["priority"]
            readiness_lift = g_info["projected_readiness_lift"]
            category = g_info["category"]
        else:
            # Prerequisite skill outside primary career stack
            ss_prereq = (
                db.query(StudentSkill)
                .filter(StudentSkill.student_id == student_id, StudentSkill.skill_id == sid)
                .first()
            )
            current_mastery = ss_prereq.final_mastery if ss_prereq else 0
            target_score = 70
            target_level = "Intermediate"
            gap_val = max(0, target_score - current_mastery)
            priority = "High Priority" if gap_val > 25 else "Medium Priority"
            readiness_lift = 6
            category = skill_obj.category if skill_obj else "Foundations"

        # Dynamic week calculation based on gap size
        if gap_val >= 40:
            est_weeks = 4
        elif gap_val >= 20:
            est_weeks = 3
        elif gap_val >= 5:
            est_weeks = 2
        else:
            est_weeks = 1

        start_wk = current_week
        end_wk = current_week + est_weeks - 1
        current_week += est_weeks

        # Determine milestone status based on current evidence or completed records
        existing_step = (
            db.query(StudentRoadmapStep)
            .filter(
                StudentRoadmapStep.student_id == student_id,
                (StudentRoadmapStep.skill_id == sid) | (StudentRoadmapStep.step_number == idx),
                StudentRoadmapStep.status == "completed",
            )
            .first()
        )

        if gap_val == 0 or current_mastery >= target_score or existing_step:
            status = "completed"
            progress_pct = 100
            completed_milestones_count += 1
        elif not in_progress_set:
            status = "in_progress"
            progress_pct = max(25, int(round((current_mastery / max(target_score, 1)) * 100)))
            in_progress_set = True
        else:
            status = "pending"
            progress_pct = 0

        # Look up courses and projects
        cid, cname, cprovider = find_best_course_for_skill(db, sid)
        pid, pname = find_best_project_for_skill(db, sid)

        # Check prerequisite names
        prereqs_names = [
            db.query(Skill).filter(Skill.skill_id == pid_item).first().skill_name
            for pid_item in dependent_to_prereqs.get(sid, [])
            if db.query(Skill).filter(Skill.skill_id == pid_item).first()
        ]

        milestone_title = (
            f"{skill_name} Foundations" if gap_val > 30 and idx <= 3
            else f"Production {skill_name} Architecture" if idx > 4
            else f"Applied {skill_name} Mastery"
        )

        milestones.append({
            "step_number": idx,
            "milestone_name": milestone_title,
            "skill_id": sid,
            "skill_name": skill_name,
            "category": category,
            "target_level": target_level,
            "target_score": target_score,
            "current_mastery": current_mastery,
            "gap": gap_val,
            "priority": priority,
            "status": status,
            "estimated_weeks": est_weeks,
            "start_week": start_wk,
            "end_week": end_wk,
            "readiness_lift": readiness_lift,
            "course_id": cid,
            "course_name": cname,
            "course_provider": cprovider,
            "project_id": pid,
            "project_name": pname,
            "has_assessment": True,
            "progress_percentage": progress_pct,
            "prerequisites_satisfied": len(prereqs_names) == 0 or all(
                (db.query(StudentSkill).filter(StudentSkill.student_id == student_id, StudentSkill.skill_id == p_id).first().final_mastery if db.query(StudentSkill).filter(StudentSkill.student_id == student_id, StudentSkill.skill_id == p_id).first() else 0) >= 50
                for p_id in dependent_to_prereqs.get(sid, [])
            ),
            "prerequisites": prereqs_names,
        })

        # Add weekly items
        for wk in range(start_wk, end_wk + 1):
            if wk == start_wk:
                action_type = "Course"
                desc = f"Complete {cname} focusing on core theory and diagnostic checks."
                res_name = f"{cname} ({cprovider})"
            elif wk == end_wk:
                action_type = "Project"
                desc = f"Build and deploy {pname} to deliver verified portfolio evidence."
                res_name = pname
            else:
                action_type = "Practice"
                desc = f"Complete guided code labs and diagnostic quizzes in {skill_name}."
                res_name = f"{skill_name} Coding Assessments"

            weekly_plan.append({
                "week_number": wk,
                "title": f"Week {wk}: {skill_name} {'Implementation' if wk == end_wk else 'Foundations'}",
                "focus_skill": skill_name,
                "action_type": action_type,
                "description": desc,
                "resource_name": res_name,
                "estimated_hours": student.weekly_learning_hours or 12,
                "status": "completed" if status == "completed" else ("in_progress" if status == "in_progress" and wk == start_wk else "pending"),
            })

    # Persist or update in database (StudentRoadmapStep)
    db.query(StudentRoadmapStep).filter(StudentRoadmapStep.student_id == student_id).delete()
    for m in milestones:
        db_step = StudentRoadmapStep(
            student_id=student_id,
            step_number=m["step_number"],
            milestone_name=m["milestone_name"],
            skill_id=m["skill_id"],
            status=m["status"],
            estimated_weeks=m["estimated_weeks"],
            completed_at=datetime.now().strftime("%Y-%m-%d") if m["status"] == "completed" else None,
        )
        db.add(db_step)
    db.commit()

    total_m = max(len(milestones), 1)
    progress_pct = int(round((completed_milestones_count / total_m) * 100))
    next_m = next((m for m in milestones if m["status"] == "in_progress"), milestones[0])

    return {
        "career_id": target_cid,
        "career_name": career_name,
        "current_progress_percentage": progress_pct,
        "completed_milestones": completed_milestones_count,
        "total_milestones": len(milestones),
        "next_best_action": f"Complete {next_m['milestone_name']}",
        "next_milestone_title": next_m["milestone_name"],
        "projected_weeks_to_ready": current_week - 1,
        "milestones": milestones,
        "weekly_plan": weekly_plan,
        "explanation": f"Roadmap for {career_name} topological sequence: prerequisites scheduled first to systematically close critical skill gaps.",
    }


def mark_roadmap_step_complete(db: Session, student_id: str, step_id: int) -> Dict[str, Any]:
    """
    Marks a student roadmap step as completed, records project evidence, and updates step status.
    """
    from services.skill_gap_service import update_or_create_student_skill

    step = (
        db.query(StudentRoadmapStep)
        .filter(
            StudentRoadmapStep.student_id == student_id,
            StudentRoadmapStep.step_number == step_id,
        )
        .first()
    )
    if step:
        step.status = "completed"
        step.completed_at = datetime.now().strftime("%Y-%m-%d")
        if step.skill_id:
            update_or_create_student_skill(
                db=db,
                student_id=student_id,
                skill_id=step.skill_id,
                project_score=85,
            )
        db.commit()
        return {"status": "success", "message": f"Milestone #{step_id} '{step.milestone_name}' marked as completed."}

    # If step does not exist yet, create a completed entry
    new_step = StudentRoadmapStep(
        student_id=student_id,
        step_number=step_id,
        milestone_name=f"Milestone #{step_id}",
        skill_id="SK001",
        status="completed",
        estimated_weeks=2,
        completed_at=datetime.now().strftime("%Y-%m-%d"),
    )
    db.add(new_step)
    db.commit()
    return {"status": "success", "message": f"Milestone #{step_id} marked as completed."}
