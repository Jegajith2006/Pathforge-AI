"""
PathForge AI - Personalized Full-Catalog Learning Roadmap Generator
Generates comprehensive, priority-ordered, prerequisite-aware learning roadmaps:
  1. Full-catalog inclusion: every course mapped to the active career appears exactly once.
  2. Explainable 7-tier ordering:
       Tier 0: Foundations & Mathematics
       Tier 1: Programming & Environment
       Tier 2: Data Handling & Core Libraries
       Tier 3: Core Domain & Applied Methods
       Tier 4: Advanced Specializations & Deep Learning
       Tier 5: Production Engineering & MLOps
       Tier 6: Capstone & Portfolio Projects
  3. Topological sort DAG: prerequisite courses always appear before dependent courses.
  4. Real data-driven progress: completed lessons / total lessons across career courses.
  5. Dynamic weekly plan: calculated from student's weekly study budget with real calendar dates.
  6. Domain-aligned project matching: zero cross-domain project pollution.
"""

from typing import List, Dict, Any, Optional, Set, Tuple
from collections import defaultdict, deque
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database.models import (
    Student,
    Career,
    Skill,
    CareerSkill,
    SkillPrerequisite,
    StudentSkill,
    Course,
    CourseSkill,
    CourseLesson,
    Project,
    ProjectSkill,
    StudentRoadmapStep,
    StudentCourseProgress,
    StudentLessonProgress,
    StudentProjectProgress,
)
from services.skill_gap_service import analyze_student_skill_gap, update_or_create_student_skill


# ---------------------------------------------------------------------------
# 1. PREREQUISITE GRAPH BUILDERS & TOPOLOGICAL SOLVERS
# ---------------------------------------------------------------------------

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

    for s in all_skills_set:
        in_degree[s] = 0

    for src in all_skills_set:
        for dst in prereq_to_dependents.get(src, []):
            if dst in all_skills_set:
                graph[src].append(dst)
                in_degree[dst] += 1

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

    for s in skill_ids:
        if s not in visited:
            sorted_order.append(s)

    return sorted_order


# ---------------------------------------------------------------------------
# 2. TIER CLASSIFICATION & CANONICAL CAREER COURSE RESOLUTION
# ---------------------------------------------------------------------------

def classify_course_tier(course_id: str, course_name: str, skills: List[Dict[str, Any]]) -> Tuple[int, str, str]:
    """
    Assigns each course to one of 7 hierarchical learning tiers:
      Tier 0: Foundations & Mathematics
      Tier 1: Programming & Environment
      Tier 2: Data Handling & Core Libraries
      Tier 3: Core Domain & Applied Methods
      Tier 4: Advanced Specializations & Deep Learning
      Tier 5: Production Engineering & MLOps
      Tier 6: Capstone & Portfolio Projects
    """
    skill_names = [s["skill_name"].lower() for s in skills]
    categories = [s["category"].lower() for s in skills]
    c_name_lower = course_name.lower()

    # Tier 6: Capstone & Portfolio Projects
    if any(k in c_name_lower for k in ["capstone", "portfolio", "end-to-end project", "comprehensive project"]):
        return 6, "Phase 7: Capstone & Portfolio Architecture", "Capstone project integration and portfolio artifact deployment."

    # Tier 0: Foundations (Mathematics, Statistics, CS Basics, Algorithms)
    is_tier_0 = (
        any(cat in ["mathematics", "statistics", "algorithms", "data structures", "soft skills"] for cat in categories)
        or any(k in c_name_lower for k in ["linear algebra", "calculus", "probability", "discrete math", "mathematics", "math for", "algorithmic"])
        or any(s in ["linear algebra", "calculus", "probability", "statistics", "data structures", "algorithms"] for s in skill_names)
    )

    # Tier 1: Programming & Environment (Python, Git, Linux, CLI)
    is_tier_1 = (
        any(cat in ["programming", "tools"] for cat in categories)
        or any(k in c_name_lower for k in ["python programming", "python for", "git", "linux", "bash", "command line", "intro to python", "scripting"])
        or any(s in ["python", "git", "linux / unix administration", "bash", "r programming", "java", "c++", "golang"] for s in skill_names)
    )

    # Tier 2: Core Libraries & Data Handling (NumPy, Pandas, SQL, Matplotlib, Seaborn, EDA, Data Cleaning)
    is_tier_2 = (
        any(s in ["numpy", "pandas", "sql", "matplotlib", "seaborn", "exploratory data analysis", "data wrangling", "data cleaning", "relational database design"] for s in skill_names)
        or any(k in c_name_lower for k in ["numpy", "pandas", "sql", "matplotlib", "seaborn", "data visualization", "eda", "data cleaning", "data manipulation"])
    )

    # Tier 5: Production & Engineering (MLOps, Deployment, Docker, Cloud, Testing, FastAPI, CI/CD)
    is_tier_5 = (
        any(cat in ["mlops", "devops", "testing"] for cat in categories)
        or any(s in ["mlops", "docker", "kubernetes", "model serving & deployment", "fastapi", "unit testing & tdd", "ci/cd", "continuous integration"] for s in skill_names)
        or any(k in c_name_lower for k in ["mlops", "deploy", "docker", "serving", "kubernetes", "production", "fastapi", "testing", "monitoring", "pipeline engineering"])
    )

    # Tier 4: Advanced Specializations (Deep Learning, NLP, Vision, Generative AI, PyTorch, TensorFlow)
    is_tier_4 = (
        any(cat in ["deep learning", "generative ai", "nlp", "computer vision"] for cat in categories)
        or any(s in ["deep learning", "pytorch", "tensorflow", "keras", "nlp", "computer vision", "transformers", "large language models", "convolutional neural networks"] for s in skill_names)
        or any(k in c_name_lower for k in ["deep learning", "pytorch", "neural network", "nlp", "vision", "llm", "generative ai", "transformers", "recurrent", "cnn"])
    )

    if is_tier_0 and not (is_tier_4 or is_tier_5):
        return 0, "Phase 1: Foundations & Mathematical Principles", "Mathematical rigor, linear algebra, calculus, and core algorithmic theory."
    if is_tier_1 and not (is_tier_4 or is_tier_5 or is_tier_2):
        return 1, "Phase 2: Programming & Engineering Environment", "Primary programming language mastery, version control, and shell environment."
    if is_tier_2 and not (is_tier_4 or is_tier_5):
        return 2, "Phase 3: Data Handling, Querying & Core Libraries", "Vectorized computation, dataframes, SQL querying, and exploratory data visualization."
    if is_tier_4:
        return 4, "Phase 5: Advanced Modeling & Deep Neural Architectures", "Modern deep learning paradigms, neural architectures, and specialized domains."
    if is_tier_5:
        return 5, "Phase 6: Production Engineering, MLOps & Deployment", "Production containerization, scalable serving, model monitoring, and automated testing."

    return 3, "Phase 4: Core Domain & Applied Algorithms", "Primary domain algorithms, feature engineering, and rigorous model evaluation."


def get_canonical_career_courses(db: Session, career_id: str) -> List[Course]:
    """
    Authoritative career-course lookup matching Courses page strictly:
    Career -> CareerSkills -> Courses covering those skills.
    Guarantees that Courses Page count == Roadmap course count == Career Agenda course count.
    """
    career_skills = db.query(CareerSkill).filter(CareerSkill.career_id == career_id).all()
    if not career_skills:
        return []

    career_skill_ids = [cs.skill_id for cs in career_skills]

    courses = (
        db.query(Course)
        .join(CourseSkill, Course.course_id == CourseSkill.course_id)
        .filter(CourseSkill.skill_id.in_(career_skill_ids))
        .distinct()
        .all()
    )
    return courses


# ---------------------------------------------------------------------------
# 3. HELPER LOOKUPS (COURSES & PROJECTS)
# ---------------------------------------------------------------------------

def find_best_course_for_skill(db: Session, skill_id: str) -> Tuple[Optional[str], str, str]:
    """Finds best matching course from database for a specific skill."""
    cs = (
        db.query(CourseSkill)
        .filter(CourseSkill.skill_id == skill_id)
        .order_by(CourseSkill.importance.desc())
        .first()
    )
    if cs and cs.course:
        return (cs.course.course_id, cs.course.course_name, cs.course.provider or "Coursera")

    skill_obj = db.query(Skill).filter(Skill.skill_id == skill_id).first()
    s_name = skill_obj.skill_name if skill_obj else "Engineering"
    course = db.query(Course).filter(Course.course_name.ilike(f"%{s_name}%")).first()
    if course:
        return (course.course_id, course.course_name, course.provider or "Coursera")

    return (None, f"{s_name} Foundations & Best Practices", "Coursera / Stanford Online")


def find_best_project_for_skill(db: Session, skill_id: str, career_id: Optional[str] = None) -> Tuple[Optional[str], str]:
    """
    Finds best matching portfolio project from database for a specific skill,
    filtering strictly to the active career domain to prevent cross-domain pollution.
    """
    query = (
        db.query(Project)
        .join(ProjectSkill, Project.project_id == ProjectSkill.project_id)
        .filter(ProjectSkill.skill_id == skill_id)
    )
    if career_id:
        query = query.filter(
            or_(
                Project.career_id == career_id,
                Project.career_id.is_(None),
            )
        )

    ps = query.order_by(ProjectSkill.importance.desc()).first()
    if ps:
        return (ps.project_id, ps.project_name)

    # Fallback to project matching the skill name within the same career
    skill_obj = db.query(Skill).filter(Skill.skill_id == skill_id).first()
    s_name = skill_obj.skill_name if skill_obj else "Engineering"

    fb_query = db.query(Project).filter(Project.project_name.ilike(f"%{s_name}%"))
    if career_id:
        fb_query = fb_query.filter(or_(Project.career_id == career_id, Project.career_id.is_(None)))
    proj = fb_query.first()
    if proj:
        return (proj.project_id, proj.project_name)

    return (None, f"{s_name} Applied Pipeline Project")


# ---------------------------------------------------------------------------
# 4. MASTER FULL-CATALOG ROADMAP GENERATION
# ---------------------------------------------------------------------------

def generate_topological_roadmap(
    db: Session,
    student_id: str,
    career_id: Optional[str] = None,
    weekly_hours_override: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Generates a full-catalog, foundation-first personalized roadmap:
      1. Every course mapped to the active career is included exactly once.
      2. Courses are prioritized by foundational tiers (0 to 6) and topological DAG dependencies.
      3. Real progress: completed lessons / total lessons across career courses.
      4. Dynamic weekly schedule based on student's weekly study budget with real calendar dates.
      5. Gating & Lock states: a course is locked until its prerequisite courses are complete.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise ValueError(f"Student '{student_id}' not found.")

    target_cid = (career_id or student.target_career_id or "").strip()
    if not target_cid:
        return {
            "career_id": None,
            "career_name": "No Career Selected",
            "milestones": [],
            "phases": [],
            "weekly_plan": [],
            "total_courses_count": 0,
            "completed_courses_count": 0,
            "total_lessons_count": 0,
            "completed_lessons_count": 0,
            "completed_milestones": 0,
            "total_milestones": 0,
            "current_progress_percentage": 0,
            "next_best_action": "Choose Target Career",
            "next_milestone_title": "Choose Target Career",
            "projected_weeks_to_ready": 0,
            "weekly_learning_hours": 12,
            "explanation": "Select a career goal to generate an adaptive prerequisite roadmap.",
        }

    career = db.query(Career).filter(Career.career_id == target_cid).first()
    if not career:
        raise ValueError(f"Career '{target_cid}' not found.")

    career_name = career.career_name

    # 1. Fetch ALL courses mapped to this career (Courses Page count == Roadmap count)
    courses = get_canonical_career_courses(db, target_cid)
    if not courses:
        # Fallback to all courses if unmapped
        courses = db.query(Course).all()

    # 2. Build skill prerequisites graph
    prereq_to_deps, dep_to_prereqs = build_prerequisite_graph(db)

    # 3. Analyze student skill gaps for priority weighting
    try:
        gap_data = analyze_student_skill_gap(db, student_id, career_id=target_cid)
        gaps_map = {g["skill_id"]: g for g in gap_data.get("gaps", [])}
    except Exception:
        gaps_map = {}

    # 4. Load course skills and student progress
    course_skills_cache: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for cs in (
        db.query(CourseSkill)
        .join(Skill, CourseSkill.skill_id == Skill.skill_id)
        .filter(CourseSkill.course_id.in_([c.course_id for c in courses]))
        .all()
    ):
        course_skills_cache[cs.course_id].append({
            "skill_id": cs.skill_id,
            "skill_name": cs.skill.skill_name if cs.skill else cs.skill_id,
            "category": cs.skill.category if cs.skill else "Engineering",
            "importance": cs.importance or 1,
        })

    # Load course progress and lesson progress for this student
    course_progress_records = (
        db.query(StudentCourseProgress)
        .filter(StudentCourseProgress.student_id == student_id)
        .all()
    )
    course_progress_map = {scp.course_id: scp for scp in course_progress_records}

    lesson_progress_records = (
        db.query(StudentLessonProgress)
        .filter(StudentLessonProgress.student_id == student_id)
        .all()
    )
    completed_lesson_ids = set([
        slp.lesson_id for slp in lesson_progress_records
        if slp.status == "completed" or (slp.assessment_passed is True and (slp.assessment_score or 0) > 50.0)
    ])

    # 5. Classify courses into Tiers and calculate priority scores
    tier_courses: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
    diff_order = {"beginner": 0, "intermediate": 1, "advanced": 2}

    for crs in courses:
        c_skills = course_skills_cache.get(crs.course_id, [])
        tier_num, phase_name, phase_desc = classify_course_tier(crs.course_id, crs.course_name, c_skills)

        # Priority calculation based on career importance and gaps
        max_gap = 0
        max_importance = 1
        for s in c_skills:
            g = gaps_map.get(s["skill_id"])
            if g:
                max_gap = max(max_gap, g.get("gap", 0))
                max_importance = max(max_importance, g.get("importance", 1))

        # Priority formula: (gap * 0.6) + (importance * 8.0)
        priority_val = (max_gap * 0.6) + (max_importance * 8.0)
        prio_label = "Critical Gap" if max_gap >= 40 else "High Priority" if max_gap >= 20 else "Foundation"

        tier_courses[tier_num].append({
            "course": crs,
            "skills": c_skills,
            "tier_num": tier_num,
            "phase_name": phase_name,
            "phase_desc": phase_desc,
            "priority_val": priority_val,
            "priority_label": prio_label,
            "max_gap": max_gap,
            "diff_rank": diff_order.get((crs.difficulty or "beginner").strip().lower(), 1),
        })

    # 6. Sort within each tier topologically by skill dependencies, then priority and difficulty
    ordered_course_entries: List[Dict[str, Any]] = []

    for t_num in sorted(tier_courses.keys()):
        tier_items = tier_courses[t_num]

        # Build DAG for courses in this tier
        c_item_map = {item["course"].course_id: item for item in tier_items}
        tier_cids = list(c_item_map.keys())

        course_to_skills = {
            cid: set([s["skill_id"] for s in c_item_map[cid]["skills"]])
            for cid in tier_cids
        }

        graph = defaultdict(set)
        in_degree = defaultdict(int)
        for cid in tier_cids:
            in_degree[cid] = 0

        for c1 in tier_cids:
            s1_set = course_to_skills[c1]
            for c2 in tier_cids:
                if c1 == c2:
                    continue
                s2_set = course_to_skills[c2]
                for s1 in s1_set:
                    for s2 in s2_set:
                        if s2 in prereq_to_deps.get(s1, []):
                            graph[c1].add(c2)

        for c1 in graph:
            for c2 in graph[c1]:
                in_degree[c2] += 1

        zero_in = [cid for cid in tier_cids if in_degree[cid] == 0]
        zero_in.sort(key=lambda cid: (
            c_item_map[cid]["diff_rank"],
            -c_item_map[cid]["priority_val"],
            c_item_map[cid]["course"].duration_hours or 10,
        ))

        queue = deque(zero_in)
        sorted_tier_cids = []
        visited = set()

        while queue:
            curr = queue.popleft()
            if curr in visited:
                continue
            visited.add(curr)
            sorted_tier_cids.append(curr)

            nxt_candidates = []
            for nxt in graph[curr]:
                in_degree[nxt] -= 1
                if in_degree[nxt] <= 0 and nxt not in visited:
                    nxt_candidates.append(nxt)

            nxt_candidates.sort(key=lambda cid: (
                c_item_map[cid]["diff_rank"],
                -c_item_map[cid]["priority_val"],
                c_item_map[cid]["course"].duration_hours or 10,
            ))
            for nc in nxt_candidates:
                queue.append(nc)

        for cid in tier_cids:
            if cid not in visited:
                sorted_tier_cids.append(cid)

        for cid in sorted_tier_cids:
            ordered_course_entries.append(c_item_map[cid])

    # 7. Map courses to Milestones and evaluate real completion and locking
    milestones: List[Dict[str, Any]] = []
    completed_courses_set: Set[str] = set()

    for idx, entry in enumerate(ordered_course_entries, start=1):
        crs = entry["course"]
        c_skills = entry["skills"]
        scp = course_progress_map.get(crs.course_id)

        # Count completed lessons for this course
        course_lessons = crs.lessons or []
        c_total_lessons = len(course_lessons) or int(crs.lessons_count or 5)
        c_completed_lessons = sum(1 for l in course_lessons if l.lesson_id in completed_lesson_ids)

        # Real course completion check
        is_course_completed = (
            (scp and scp.status == "completed")
            or (c_total_lessons > 0 and c_completed_lessons >= c_total_lessons and scp and scp.final_assessment_score and scp.final_assessment_score > 50.0)
        )
        if is_course_completed:
            completed_courses_set.add(crs.course_id)

    # Second pass: determine locking and milestone status
    completed_milestones_count = 0
    total_career_lessons = 0
    total_career_completed_lessons = 0
    in_progress_chosen = False

    phase_map: Dict[str, Dict[str, Any]] = {}

    for idx, entry in enumerate(ordered_course_entries, start=1):
        crs = entry["course"]
        c_skills = entry["skills"]
        scp = course_progress_map.get(crs.course_id)

        course_lessons = crs.lessons or []
        c_total_lessons = len(course_lessons) or int(crs.lessons_count or 5)
        c_completed_lessons = sum(1 for l in course_lessons if l.lesson_id in completed_lesson_ids)

        total_career_lessons += c_total_lessons
        total_career_completed_lessons += c_completed_lessons

        primary_skill_id = c_skills[0]["skill_id"] if c_skills else "S001"
        primary_skill_name = c_skills[0]["skill_name"] if c_skills else "Core Engineering"
        primary_category = c_skills[0]["category"] if c_skills else "Engineering"

        # Check prerequisite courses from earlier tiers
        prereq_skills_for_this = []
        for s in c_skills:
            for p_id in dep_to_prereqs.get(s["skill_id"], []):
                prereq_skills_for_this.append(p_id)

        # A course is locked if an earlier course in a preceding tier is not completed
        is_completed = crs.course_id in completed_courses_set
        is_locked = False
        lock_reason = None

        if not is_completed:
            # Check if any prior course in a lower tier is still incomplete
            for prev_entry in ordered_course_entries:
                prev_c = prev_entry["course"]
                if prev_c.course_id == crs.course_id:
                    break
                # If earlier course is in a strictly lower tier and incomplete, lock current course
                if prev_entry["tier_num"] < entry["tier_num"] and prev_c.course_id not in completed_courses_set:
                    is_locked = True
                    lock_reason = f"Complete foundational course '{prev_c.course_name}' in {prev_entry['phase_name']} first."
                    break

        if is_completed:
            m_status = "completed"
            m_progress_pct = 100
            completed_milestones_count += 1
        elif is_locked:
            m_status = "locked"
            m_progress_pct = 0
        elif c_completed_lessons > 0 or (scp and scp.status == "in_progress"):
            m_status = "in_progress"
            m_progress_pct = int(round((c_completed_lessons / max(c_total_lessons, 1)) * 100))
            in_progress_chosen = True
        elif not in_progress_chosen:
            # First available incomplete unlocked course is In Progress
            m_status = "in_progress"
            m_progress_pct = 0
            in_progress_chosen = True
        else:
            m_status = "pending"
            m_progress_pct = 0

        # Project matching: strictly domain-aligned
        pid, pname = find_best_project_for_skill(db, primary_skill_id, career_id=target_cid)

        # Duration in weeks
        est_hours = crs.duration_hours or 10
        est_weeks = max(1, (est_hours + 5) // 6)

        milestone_item = {
            "step_number": idx,
            "milestone_name": f"{crs.course_name}",
            "skill_id": primary_skill_id,
            "skill_name": primary_skill_name,
            "category": primary_category,
            "target_level": crs.difficulty or "Intermediate",
            "target_score": 80,
            "current_mastery": gaps_map.get(primary_skill_id, {}).get("current_mastery", 0),
            "gap": entry["max_gap"],
            "priority": entry["priority_label"],
            "status": m_status,
            "is_locked": is_locked,
            "lock_reason": lock_reason,
            "estimated_weeks": est_weeks,
            "start_week": 1,
            "end_week": est_weeks,
            "readiness_lift": 6,
            "course_id": crs.course_id,
            "course_name": crs.course_name,
            "course_provider": crs.provider or "Coursera",
            "difficulty": crs.difficulty or "Beginner",
            "duration_hours": est_hours,
            "skills_taught": [s["skill_name"] for s in c_skills],
            "project_id": pid,
            "project_name": pname,
            "has_assessment": True,
            "progress_percentage": m_progress_pct,
            "completed_lessons": c_completed_lessons,
            "total_lessons": c_total_lessons,
            "prerequisites_satisfied": not is_locked,
            "prerequisites": [
                db.query(Skill).filter(Skill.skill_id == pid).first().skill_name
                for pid in prereq_skills_for_this[:2]
                if db.query(Skill).filter(Skill.skill_id == pid).first()
            ],
            "phase_id": f"phase_{entry['tier_num']}",
            "phase_name": entry["phase_name"],
            "tier": entry["tier_num"],
        }
        milestones.append(milestone_item)

        # Group into Phase structure
        p_id = f"phase_{entry['tier_num']}"
        if p_id not in phase_map:
            phase_map[p_id] = {
                "phase_id": p_id,
                "phase_name": entry["phase_name"],
                "tier": entry["tier_num"],
                "description": entry["phase_desc"],
                "total_courses": 0,
                "completed_courses": 0,
                "total_lessons": 0,
                "completed_lessons": 0,
                "progress_percentage": 0,
                "is_locked": is_locked and not is_completed,
                "milestones": [],
            }
        phase_map[p_id]["total_courses"] += 1
        if is_completed:
            phase_map[p_id]["completed_courses"] += 1
        phase_map[p_id]["total_lessons"] += c_total_lessons
        phase_map[p_id]["completed_lessons"] += c_completed_lessons
        phase_map[p_id]["milestones"].append(milestone_item)

    # Compute phase progress percentages
    phases: List[Dict[str, Any]] = []
    for p_id in sorted(phase_map.keys()):
        p_data = phase_map[p_id]
        p_data["progress_percentage"] = int(
            round((p_data["completed_lessons"] / max(p_data["total_lessons"], 1)) * 100)
        )
        phases.append(p_data)

    # 8. Build DYNAMIC WEEKLY SCHEDULE (Part 2)
    # Student weekly hours budget
    student_hours = weekly_hours_override or student.weekly_learning_hours or 12
    weekly_plan: List[Dict[str, Any]] = []

    start_cal_date = datetime.now(timezone.utc)
    current_cal_date = start_cal_date

    week_num = 1
    accumulated_hours = 0
    current_week_courses = []
    current_week_skills = []

    for m in milestones:
        c_hours = m["duration_hours"] or 10
        current_week_courses.append({
            "course_id": m["course_id"],
            "course_name": m["course_name"],
            "hours": c_hours,
            "completed": m["status"] == "completed",
        })
        current_week_skills.append(m["skill_name"])
        accumulated_hours += c_hours

        # If accumulated hours exceed or meet weekly budget, close this week card
        if accumulated_hours >= student_hours or m == milestones[-1]:
            w_start_str = current_cal_date.strftime("%b %d")
            w_end_date = current_cal_date + timedelta(days=6)
            w_end_str = w_end_date.strftime("%b %d, %Y")

            all_w_completed = all(c["completed"] for c in current_week_courses)
            has_in_progress = any(m_item["status"] == "in_progress" for m_item in milestones if m_item["course_id"] in [c["course_id"] for c in current_week_courses])

            if all_w_completed:
                w_status = "done"
                w_pct = 100
            elif has_in_progress or week_num == 1:
                w_status = "this_week"
                w_pct = max(10, int(round((sum(c["hours"] for c in current_week_courses if c["completed"]) / max(accumulated_hours, 1)) * 100)))
            else:
                w_status = "upcoming"
                w_pct = 0

            primary_skill = current_week_skills[0] if current_week_skills else m["skill_name"]
            c_names_str = ", ".join([c["course_name"] for c in current_week_courses[:2]])
            if len(current_week_courses) > 2:
                c_names_str += f" (+{len(current_week_courses) - 2} more)"

            weekly_plan.append({
                "week_number": week_num,
                "title": f"Week {week_num}: {primary_skill} Mastery",
                "focus_skill": primary_skill,
                "action_type": "Course",
                "description": f"Study {c_names_str} focusing on core theory, hands-on lab exercises, and diagnostic checkpoints.",
                "resource_name": c_names_str,
                "estimated_hours": accumulated_hours,
                "status": w_status,
                "start_date": current_cal_date.strftime("%Y-%m-%d"),
                "end_date": w_end_date.strftime("%Y-%m-%d"),
                "date_range": f"{w_start_str} – {w_end_str}",
                "progress_percentage": w_pct,
                "courses_planned": list(current_week_courses),
            })

            # Advance calendar
            current_cal_date = w_end_date + timedelta(days=1)
            week_num += 1
            accumulated_hours = 0
            current_week_courses = []
            current_week_skills = []

    # 9. Real Overall Progress (Completed Lessons / Total Lessons across all career courses)
    real_progress_percentage = int(
        round((total_career_completed_lessons / max(total_career_lessons, 1)) * 100)
    )

    # Next Best Action: First incomplete milestone that is not locked
    next_action_milestone = next(
        (m for m in milestones if m["status"] == "in_progress" and not m["is_locked"]),
        None
    )
    if not next_action_milestone:
        next_action_milestone = next(
            (m for m in milestones if m["status"] != "completed" and not m["is_locked"]),
            milestones[0]
        )

    next_best_action = f"Start {next_action_milestone['course_name']}"

    # Estimated Finish Date
    finish_date_str = (
        weekly_plan[-1]["end_date"] if weekly_plan else (datetime.now(timezone.utc) + timedelta(days=len(milestones) * 7)).strftime("%Y-%m-%d")
    )

    # 10. Persist steps in database for tracking
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

    return {
        "career_id": target_cid,
        "career_name": career_name,
        "current_progress_percentage": real_progress_percentage,
        "completed_milestones": completed_milestones_count,
        "total_milestones": len(milestones),
        "completed_courses_count": len(completed_courses_set),
        "total_courses_count": len(courses),
        "completed_lessons_count": total_career_completed_lessons,
        "total_lessons_count": total_career_lessons,
        "next_best_action": next_best_action,
        "next_milestone_title": next_action_milestone["milestone_name"],
        "projected_weeks_to_ready": len(weekly_plan),
        "estimated_finish_date": finish_date_str,
        "weekly_learning_hours": student_hours,
        "milestones": milestones,
        "phases": phases,
        "weekly_plan": weekly_plan,
        "explanation": f"Full-catalog priority roadmap for {career_name}: All {len(courses)} courses organized across {len(phases)} foundational tiers with deterministic topological DAG sequencing.",
    }


def mark_roadmap_step_complete(db: Session, student_id: str, step_id: int) -> Dict[str, Any]:
    """
    Marks a roadmap milestone as completed, updates the underlying course progress,
    calibrates skill evidence in student_skills, and advances the student path.
    """
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

        if step.skill_id and step.skill_id != "SK001":
            update_or_create_student_skill(
                db=db,
                student_id=student_id,
                skill_id=step.skill_id,
                project_score=85,
            )
        db.commit()
        return {"status": "success", "message": f"Milestone #{step_id} '{step.milestone_name}' marked as completed."}

    # If step does not exist, look up first uncompleted course
    student = db.query(Student).filter(Student.student_id == student_id).first()
    fallback_cid = student.target_career_id if student else "C001"
    courses = get_canonical_career_courses(db, fallback_cid)
    c_name = courses[step_id - 1].course_name if (courses and len(courses) >= step_id) else f"Course #{step_id}"
    s_id = courses[step_id - 1].skills[0].skill_id if (courses and len(courses) >= step_id and courses[step_id - 1].skills) else "S001"

    new_step = StudentRoadmapStep(
        student_id=student_id,
        step_number=step_id,
        milestone_name=c_name,
        skill_id=s_id,
        status="completed",
        estimated_weeks=2,
        completed_at=datetime.now().strftime("%Y-%m-%d"),
    )
    db.add(new_step)
    db.commit()
    return {"status": "success", "message": f"Milestone #{step_id} marked as completed."}


def update_student_roadmap_preferences(db: Session, student_id: str, weekly_hours: int) -> Dict[str, Any]:
    """Updates student's weekly study budget and regenerates schedule."""
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise ValueError(f"Student '{student_id}' not found.")

    student.weekly_learning_hours = weekly_hours
    db.commit()

    return generate_topological_roadmap(db, student_id, weekly_hours_override=weekly_hours)
