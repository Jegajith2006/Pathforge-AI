import os
import sys
import argparse
from pathlib import Path
import pandas as pd
import bcrypt

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
root_dir = backend_dir.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Enable UTF-8 encoding on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from config import settings
from database.connection import Base, engine, SessionLocal, init_db
from database.models import (
    Student,
    Career,
    Skill,
    CareerSkill,
    SkillPrerequisite,
    Course,
    CourseSkill,
    Project,
    ProjectSkill,
    AssessmentQuestion,
    AssessmentAnswer,
    StudentSkill,
    ResumeAnalysis,
    Company,
    CompanySkill,
    CompanyJob,
    Mentor,
    MentorFeedback,
    LearningActivity,
    Certificate,
    JobApplication,
    Feedback,
    Notification,
)


def find_dataset_file(filename_candidates):
    """Locate CSV dataset file among candidate filenames in potential directories."""
    search_dirs = [
        settings.DATASET_DIR,
        settings.BASE_DIR.parent / "datasets",
        settings.BASE_DIR / "datasets",
        Path.cwd() / "datasets",
        Path.cwd().parent / "datasets",
    ]
    for d in search_dirs:
        if not d.exists():
            continue
        for fname in filename_candidates:
            target = d / fname
            if target.exists():
                return target
    raise FileNotFoundError(f"Could not locate dataset among {filename_candidates} in {search_dirs}")


def clean_str(val):
    """Safely convert value to string or None, stripping whitespace."""
    if val is None or pd.isna(val):
        return None
    s = str(val).strip()
    return s if s and s.lower() != "nan" else None


def clean_int(val, default=0):
    """Safely convert value to integer."""
    if val is None or pd.isna(val):
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def clean_float(val, default=0.0):
    """Safely convert value to float."""
    if val is None or pd.isna(val):
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def clean_bool(val, default=False):
    """Safely convert value to boolean."""
    if val is None or pd.isna(val):
        return default
    if isinstance(val, bool):
        return val
    s = str(val).strip().lower()
    return s in ["true", "1", "t", "yes", "y"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def reset_database():
    """Drop and recreate all tables."""
    print("Resetting database (dropping existing tables)...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database tables recreated successfully.")


def seed_database(reset: bool = False):
    print("=" * 60)
    print("PathForge AI Database Seeder")
    print("=" * 60)
    print(f"Database:\n{settings.DATABASE_URL}\n")

    if reset:
        reset_database()
    else:
        init_db()

    session = SessionLocal()
    default_hashed_pwd = hash_password("password123")

    total_tables = 0
    total_records = 0

    try:
        print("Loading datasets...\n")

        # -------------------------------------------------------------
        # 1. Careers (Parent)
        # -------------------------------------------------------------
        path = find_dataset_file(["01_careers.csv", "careers.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Career.career_id).all())
        records = []
        for _, row in df.iterrows():
            cid = str(row["career_id"]).strip()
            if cid not in existing_ids:
                records.append(
                    Career(
                        career_id=cid,
                        career_name=clean_str(row["career_name"]),
                        category=clean_str(row["category"]),
                        description=clean_str(row["description"]),
                        difficulty=clean_str(row["difficulty"]),
                        estimated_preparation_months=clean_int(row["estimated_preparation_months"], 6),
                        core_focus=clean_str(row["core_focus"]),
                        typical_entry_level=clean_str(row["typical_entry_level"]),
                    )
                )
                existing_ids.add(cid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 01_careers.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # Cache valid career IDs for foreign key validation
        valid_career_ids = set(r[0] for r in session.query(Career.career_id).all())

        # -------------------------------------------------------------
        # 2. Skills (Parent)
        # -------------------------------------------------------------
        path = find_dataset_file(["02_skills.csv", "skills.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Skill.skill_id).all())
        records = []
        for _, row in df.iterrows():
            sid = str(row["skill_id"]).strip()
            if sid not in existing_ids:
                records.append(
                    Skill(
                        skill_id=sid,
                        skill_name=clean_str(row["skill_name"]),
                        category=clean_str(row["category"]),
                        subcategory=clean_str(row["subcategory"]),
                        description=clean_str(row["description"]),
                        beginner_definition=clean_str(row["beginner_definition"]),
                        intermediate_definition=clean_str(row["intermediate_definition"]),
                        advanced_definition=clean_str(row["advanced_definition"]),
                    )
                )
                existing_ids.add(sid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 02_skills.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # Cache valid skill IDs for foreign key validation
        valid_skill_ids = set(r[0] for r in session.query(Skill.skill_id).all())

        # -------------------------------------------------------------
        # 3. Career Skills (FK: careers, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["03_career_skills.csv", "career_skills.csv"])
        df = pd.read_csv(path)
        existing_keys = set((r[0], r[1]) for r in session.query(CareerSkill.career_id, CareerSkill.skill_id).all())
        records = []
        for _, row in df.iterrows():
            cid = str(row["career_id"]).strip()
            sid = str(row["skill_id"]).strip()
            if cid in valid_career_ids and sid in valid_skill_ids:
                if (cid, sid) not in existing_keys:
                    records.append(
                        CareerSkill(
                            career_id=cid,
                            skill_id=sid,
                            required_level=clean_str(row["required_level"]),
                            importance=clean_int(row["importance"], 3),
                            weight=clean_float(row["weight"], 0.05),
                            is_core_skill=clean_bool(row["is_core_skill"]),
                        )
                    )
                    existing_keys.add((cid, sid))
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 03_career_skills.csv\n  Imported: {len(records)} records (Total: {len(existing_keys)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 4. Skill Prerequisites (FK: skills, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["04_skill_prerequisites.csv", "skill_prerequisites.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(SkillPrerequisite.prerequisite_id).all())
        records = []
        for _, row in df.iterrows():
            pid = str(row["prerequisite_id"]).strip()
            psid = str(row["prerequisite_skill_id"]).strip()
            dsid = str(row["dependent_skill_id"]).strip()
            if pid not in existing_ids and psid in valid_skill_ids and dsid in valid_skill_ids:
                records.append(
                    SkillPrerequisite(
                        prerequisite_id=pid,
                        prerequisite_skill_id=psid,
                        dependent_skill_id=dsid,
                        relationship_type=clean_str(row.get("relationship", "Prerequisite")),
                        priority=clean_str(row.get("priority", "Critical")),
                    )
                )
                existing_ids.add(pid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 04_skill_prerequisites.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 5. Courses (Parent)
        # -------------------------------------------------------------
        path = find_dataset_file(["05_courses.csv", "courses.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Course.course_id).all())
        records = []
        for _, row in df.iterrows():
            crid = str(row["course_id"]).strip()
            if crid not in existing_ids:
                records.append(
                    Course(
                        course_id=crid,
                        course_name=clean_str(row["course_name"]),
                        provider=clean_str(row["provider"]),
                        description=clean_str(row["description"]),
                        category=clean_str(row["category"]),
                        difficulty=clean_str(row["difficulty"]),
                        duration_hours=clean_int(row["duration_hours"], 20),
                        format=clean_str(row["format"]),
                        rating=clean_float(row["rating"], 4.5),
                        url=clean_str(row["url"]),
                        language=clean_str(row.get("language", "English")),
                    )
                )
                existing_ids.add(crid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 05_courses.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        valid_course_ids = set(r[0] for r in session.query(Course.course_id).all())

        # -------------------------------------------------------------
        # 6. Course Skills (FK: courses, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["06_course_skills.csv", "course_skills.csv"])
        df = pd.read_csv(path)
        existing_keys = set((r[0], r[1]) for r in session.query(CourseSkill.course_id, CourseSkill.skill_id).all())
        records = []
        for _, row in df.iterrows():
            crid = str(row["course_id"]).strip()
            sid = str(row["skill_id"]).strip()
            if crid in valid_course_ids and sid in valid_skill_ids:
                if (crid, sid) not in existing_keys:
                    records.append(
                        CourseSkill(
                            course_id=crid,
                            skill_id=sid,
                            coverage_level=clean_str(row["coverage_level"]),
                            importance=clean_int(row["importance"], 3),
                        )
                    )
                    existing_keys.add((crid, sid))
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 06_course_skills.csv\n  Imported: {len(records)} records (Total: {len(existing_keys)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 7. Projects (FK: careers)
        # -------------------------------------------------------------
        path = find_dataset_file(["07_projects.csv", "projects.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Project.project_id).all())
        records = []
        for _, row in df.iterrows():
            pid = str(row["project_id"]).strip()
            cid = str(row["career_id"]).strip()
            if pid not in existing_ids and cid in valid_career_ids:
                records.append(
                    Project(
                        project_id=pid,
                        project_name=clean_str(row["project_name"]),
                        description=clean_str(row["description"]),
                        category=clean_str(row["category"]),
                        difficulty=clean_str(row["difficulty"]),
                        estimated_duration_weeks=clean_int(row["estimated_duration_weeks"], 3),
                        career_id=cid,
                        learning_outcomes=clean_str(row["learning_outcomes"]),
                    )
                )
                existing_ids.add(pid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 07_projects.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        valid_project_ids = set(r[0] for r in session.query(Project.project_id).all())

        # -------------------------------------------------------------
        # 8. Project Skills (FK: projects, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["08_project_skills.csv", "project_skills.csv"])
        df = pd.read_csv(path)
        existing_keys = set((r[0], r[1]) for r in session.query(ProjectSkill.project_id, ProjectSkill.skill_id).all())
        records = []
        for _, row in df.iterrows():
            pid = str(row["project_id"]).strip()
            sid = str(row["skill_id"]).strip()
            if pid in valid_project_ids and sid in valid_skill_ids:
                if (pid, sid) not in existing_keys:
                    records.append(
                        ProjectSkill(
                            project_id=pid,
                            skill_id=sid,
                            required_level=clean_str(row["required_level"]),
                            importance=clean_int(row["importance"], 3),
                        )
                    )
                    existing_keys.add((pid, sid))
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 08_project_skills.csv\n  Imported: {len(records)} records (Total: {len(existing_keys)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 9. Assessment Questions (FK: careers, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["09_assessment_questions.csv", "assessment_questions.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(AssessmentQuestion.question_id).all())
        records = []
        for _, row in df.iterrows():
            qid = str(row["question_id"]).strip()
            cid = str(row["career_id"]).strip()
            sid = str(row["skill_id"]).strip()
            if qid not in existing_ids and cid in valid_career_ids and sid in valid_skill_ids:
                records.append(
                    AssessmentQuestion(
                        question_id=qid,
                        career_id=cid,
                        skill_id=sid,
                        difficulty=clean_str(row["difficulty"]),
                        question_type=clean_str(row["question_type"]),
                        question=clean_str(row["question"]),
                        option_a=clean_str(row["option_a"]),
                        option_b=clean_str(row["option_b"]),
                        option_c=clean_str(row["option_c"]),
                        option_d=clean_str(row["option_d"]),
                        correct_answer=clean_str(row["correct_answer"]),
                        explanation=clean_str(row["explanation"]),
                        weight=clean_float(row.get("weight", 1.0), 1.0),
                    )
                )
                existing_ids.add(qid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 09_assessment_questions.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        valid_question_ids = set(r[0] for r in session.query(AssessmentQuestion.question_id).all())

        # -------------------------------------------------------------
        # 10. Companies (Parent)
        # -------------------------------------------------------------
        path = find_dataset_file(["14_companies.csv", "companies.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Company.company_id).all())
        records = []
        for _, row in df.iterrows():
            comp_id = str(row["company_id"]).strip()
            if comp_id not in existing_ids:
                records.append(
                    Company(
                        company_id=comp_id,
                        company_name=clean_str(row["company_name"]),
                        industry=clean_str(row["industry"]),
                        company_size=clean_str(row["company_size"]),
                        location=clean_str(row["location"]),
                        description=clean_str(row["description"]),
                        career_categories=clean_str(row["career_categories"]),
                    )
                )
                existing_ids.add(comp_id)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 14_companies.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        valid_company_ids = set(r[0] for r in session.query(Company.company_id).all())

        # -------------------------------------------------------------
        # 11. Company Skills (FK: companies, careers, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["15_company_skills.csv", "company_skills.csv"])
        df = pd.read_csv(path)
        existing_keys = set(
            (r[0], r[1], r[2])
            for r in session.query(CompanySkill.company_id, CompanySkill.career_id, CompanySkill.skill_id).all()
        )
        records = []
        for _, row in df.iterrows():
            comp_id = str(row["company_id"]).strip()
            cid = str(row["career_id"]).strip()
            sid = str(row["skill_id"]).strip()
            if comp_id in valid_company_ids and cid in valid_career_ids and sid in valid_skill_ids:
                if (comp_id, cid, sid) not in existing_keys:
                    records.append(
                        CompanySkill(
                            company_id=comp_id,
                            career_id=cid,
                            skill_id=sid,
                            required_level=clean_str(row["required_level"]),
                            importance=clean_int(row["importance"], 3),
                        )
                    )
                    existing_keys.add((comp_id, cid, sid))
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 15_company_skills.csv\n  Imported: {len(records)} records (Total: {len(existing_keys)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 12. Company Jobs (FK: companies, careers)
        # -------------------------------------------------------------
        path = find_dataset_file(["16_company_jobs.csv", "company_jobs.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(CompanyJob.job_id).all())
        records = []
        for _, row in df.iterrows():
            jid = str(row["job_id"]).strip()
            comp_id = str(row["company_id"]).strip()
            cid = str(row["career_id"]).strip()
            if jid not in existing_ids and comp_id in valid_company_ids and cid in valid_career_ids:
                records.append(
                    CompanyJob(
                        job_id=jid,
                        company_id=comp_id,
                        career_id=cid,
                        job_title=clean_str(row["job_title"]),
                        location=clean_str(row["location"]),
                        experience_required=clean_str(row["experience_required"]),
                        employment_type=clean_str(row.get("employment_type", "Full-Time")),
                        description=clean_str(row["description"]),
                        required_skills=clean_str(row["required_skills"]),
                        preferred_skills=clean_str(row.get("preferred_skills")),
                    )
                )
                existing_ids.add(jid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 16_company_jobs.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        valid_job_ids = set(r[0] for r in session.query(CompanyJob.job_id).all())

        # -------------------------------------------------------------
        # 13. Mentor Profiles (Parent)
        # -------------------------------------------------------------
        path = find_dataset_file(["17_mentor_profiles.csv", "mentor_profiles.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Mentor.mentor_id).all())
        records = []
        for _, row in df.iterrows():
            mid = str(row["mentor_id"]).strip()
            if mid not in existing_ids:
                records.append(
                    Mentor(
                        mentor_id=mid,
                        name=clean_str(row["name"]),
                        expertise=clean_str(row["expertise"]),
                        experience_years=clean_int(row["experience_years"], 5),
                        skills=clean_str(row["skills"]),
                        bio=clean_str(row["bio"]),
                        availability=clean_str(row.get("availability", "Available")),
                        rating=clean_float(row.get("rating", 4.8), 4.8),
                    )
                )
                existing_ids.add(mid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 17_mentor_profiles.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        valid_mentor_ids = set(r[0] for r in session.query(Mentor.mentor_id).all())

        # -------------------------------------------------------------
        # 14. Student Profiles (FK: careers)
        # -------------------------------------------------------------
        path = find_dataset_file(["11_student_profiles.csv", "student_profiles.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Student.student_id).all())
        records = []
        for _, row in df.iterrows():
            sid = str(row["student_id"]).strip()
            cid = str(row["target_career_id"]).strip()
            if sid not in existing_ids and cid in valid_career_ids:
                records.append(
                    Student(
                        student_id=sid,
                        first_name=clean_str(row["first_name"]),
                        last_name=clean_str(row["last_name"]),
                        email=clean_str(row["email"]),
                        hashed_password=default_hashed_pwd,
                        college=clean_str(row["college"]),
                        department=clean_str(row["department"]),
                        degree=clean_str(row["degree"]),
                        graduation_year=clean_int(row["graduation_year"], 2026),
                        cgpa=clean_float(row["cgpa"], 8.0),
                        target_career_id=cid,
                        weekly_learning_hours=clean_int(row.get("weekly_learning_hours", 12), 12),
                        preferred_difficulty=clean_str(row.get("preferred_difficulty", "Adaptive")),
                        learning_mode=clean_str(row.get("learning_mode", "Project-based")),
                    )
                )
                existing_ids.add(sid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 11_student_profiles.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        valid_student_ids = set(r[0] for r in session.query(Student.student_id).all())

        # -------------------------------------------------------------
        # 15. Student Skills (FK: students, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["12_student_skills.csv", "student_skills.csv"])
        df = pd.read_csv(path)
        existing_keys = set((r[0], r[1]) for r in session.query(StudentSkill.student_id, StudentSkill.skill_id).all())
        records = []
        for _, row in df.iterrows():
            stid = str(row["student_id"]).strip()
            skid = str(row["skill_id"]).strip()
            if stid in valid_student_ids and skid in valid_skill_ids:
                if (stid, skid) not in existing_keys:
                    records.append(
                        StudentSkill(
                            student_id=stid,
                            skill_id=skid,
                            self_declared_score=clean_int(row.get("self_declared_score", 0)),
                            resume_score=clean_int(row.get("resume_score", 0)),
                            assessment_score=clean_int(row.get("assessment_score", 0)),
                            project_score=clean_int(row.get("project_score", 0)),
                            certificate_score=clean_int(row.get("certificate_score", 0)),
                            mentor_score=clean_int(row.get("mentor_score", 0)),
                            final_mastery=clean_int(row.get("final_mastery", 0)),
                            mastery_level=clean_str(row.get("mastery_level", "Developing")),
                            evidence_count=clean_int(row.get("evidence_count", 0)),
                            last_updated=clean_str(row.get("last_updated", "2026-09-28")),
                        )
                    )
                    existing_keys.add((stid, skid))
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 12_student_skills.csv\n  Imported: {len(records)} records (Total: {len(existing_keys)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 16. Assessment Answers (FK: students, questions)
        # -------------------------------------------------------------
        path = find_dataset_file(["10_assessment_answers.csv", "assessment_answers.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(AssessmentAnswer.attempt_id).all())
        records = []
        for _, row in df.iterrows():
            aid = str(row["attempt_id"]).strip()
            stid = str(row["student_id"]).strip()
            qid = str(row["question_id"]).strip()
            if aid not in existing_ids and stid in valid_student_ids and qid in valid_question_ids:
                records.append(
                    AssessmentAnswer(
                        attempt_id=aid,
                        student_id=stid,
                        question_id=qid,
                        selected_answer=clean_str(row["selected_answer"]),
                        correct=clean_bool(row["correct"]),
                        time_taken_seconds=clean_int(row["time_taken_seconds"], 25),
                        attempt_date=clean_str(row["attempt_date"]),
                    )
                )
                existing_ids.add(aid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 10_assessment_answers.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 17. Resume Analysis (FK: students, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["13_resume_analysis.csv", "resume_analysis.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(ResumeAnalysis.resume_id).all())
        records = []
        for _, row in df.iterrows():
            rid = str(row["resume_id"]).strip()
            stid = str(row["student_id"]).strip()
            skid = str(row["skill_id"]).strip()
            if rid not in existing_ids and stid in valid_student_ids and skid in valid_skill_ids:
                records.append(
                    ResumeAnalysis(
                        resume_id=rid,
                        student_id=stid,
                        skill_id=skid,
                        detected=clean_bool(row["detected"], True),
                        confidence=clean_float(row["confidence"], 1.0),
                        evidence_type=clean_str(row.get("evidence_type", "Skill Section")),
                        project_evidence=clean_bool(row.get("project_evidence", False)),
                        experience_evidence=clean_bool(row.get("experience_evidence", False)),
                        certificate_evidence=clean_bool(row.get("certificate_evidence", False)),
                    )
                )
                existing_ids.add(rid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 13_resume_analysis.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 18. Mentor Feedback (FK: mentors, students, projects, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["18_mentor_feedback.csv", "mentor_feedback.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(MentorFeedback.feedback_id).all())
        records = []
        for _, row in df.iterrows():
            fbid = str(row["feedback_id"]).strip()
            mid = str(row["mentor_id"]).strip()
            stid = str(row["student_id"]).strip()
            pid = str(row["project_id"]).strip()
            skid = str(row["skill_id"]).strip()
            if fbid not in existing_ids and mid in valid_mentor_ids and stid in valid_student_ids and pid in valid_project_ids and skid in valid_skill_ids:
                records.append(
                    MentorFeedback(
                        feedback_id=fbid,
                        mentor_id=mid,
                        student_id=stid,
                        project_id=pid,
                        skill_id=skid,
                        rating=clean_int(row["rating"], 4),
                        strengths=clean_str(row["strengths"]),
                        improvement_areas=clean_str(row["improvement_areas"]),
                        comments=clean_str(row["comments"]),
                        recommended_action=clean_str(row["recommended_action"]),
                        feedback_date=clean_str(row["feedback_date"]),
                    )
                )
                existing_ids.add(fbid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 18_mentor_feedback.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 19. Learning Activity (FK: students)
        # -------------------------------------------------------------
        path = find_dataset_file(["19_learning_activity.csv", "learning_activity.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(LearningActivity.activity_id).all())
        records = []
        for _, row in df.iterrows():
            actid = str(row["activity_id"]).strip()
            stid = str(row["student_id"]).strip()
            if actid not in existing_ids and stid in valid_student_ids:
                records.append(
                    LearningActivity(
                        activity_id=actid,
                        student_id=stid,
                        activity_date=clean_str(row["activity_date"]),
                        activity_type=clean_str(row["activity_type"]),
                        activity_name=clean_str(row["activity_name"]),
                        duration_minutes=clean_int(row["duration_minutes"], 30),
                        activity_count=clean_int(row.get("activity_count", 1), 1),
                    )
                )
                existing_ids.add(actid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 19_learning_activity.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 20. Certificates (FK: students, skills)
        # -------------------------------------------------------------
        path = find_dataset_file(["20_certificates.csv", "certificates.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Certificate.certificate_id).all())
        records = []
        for _, row in df.iterrows():
            cid = str(row["certificate_id"]).strip()
            stid = str(row["student_id"]).strip()
            skid = str(row["skill_id"]).strip()
            if cid not in existing_ids and stid in valid_student_ids and skid in valid_skill_ids:
                records.append(
                    Certificate(
                        certificate_id=cid,
                        student_id=stid,
                        provider=clean_str(row["provider"]),
                        course_name=clean_str(row["course_name"]),
                        skill_id=skid,
                        issue_date=clean_str(row["issue_date"]),
                        verification_status=clean_str(row.get("verification_status", "Verified")),
                        certificate_url=clean_str(row["certificate_url"]),
                    )
                )
                existing_ids.add(cid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 20_certificates.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 21. Job Applications (FK: students, jobs)
        # -------------------------------------------------------------
        path = find_dataset_file(["21_job_applications.csv", "job_applications.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(JobApplication.application_id).all())
        records = []
        for _, row in df.iterrows():
            appid = str(row["application_id"]).strip()
            stid = str(row["student_id"]).strip()
            jid = str(row["job_id"]).strip()
            if appid not in existing_ids and stid in valid_student_ids and jid in valid_job_ids:
                records.append(
                    JobApplication(
                        application_id=appid,
                        student_id=stid,
                        job_id=jid,
                        resume_match=clean_int(row["resume_match"], 70),
                        skill_match=clean_int(row["skill_match"], 70),
                        project_match=clean_int(row["project_match"], 70),
                        application_readiness=clean_int(row["application_readiness"], 70),
                        status=clean_str(row.get("status", "Prepared")),
                        application_date=clean_str(row["application_date"]),
                    )
                )
                existing_ids.add(appid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 21_job_applications.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 22. Feedback (FK: students)
        # -------------------------------------------------------------
        path = find_dataset_file(["22_feedback.csv", "feedback.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Feedback.feedback_id).all())
        records = []
        for _, row in df.iterrows():
            fbid = str(row["feedback_id"]).strip()
            stid = str(row["student_id"]).strip()
            if fbid not in existing_ids and stid in valid_student_ids:
                records.append(
                    Feedback(
                        feedback_id=fbid,
                        student_id=stid,
                        category=clean_str(row["category"]),
                        rating=clean_int(row["rating"], 5),
                        comment=clean_str(row["comment"]),
                        sentiment=clean_str(row.get("sentiment", "Positive")),
                        issue_type=clean_str(row.get("issue_type", "None")),
                        created_at=clean_str(row["created_at"]),
                    )
                )
                existing_ids.add(fbid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 22_feedback.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})")
        total_tables += 1
        total_records += len(records)

        # -------------------------------------------------------------
        # 23. Notifications (FK: students)
        # -------------------------------------------------------------
        path = find_dataset_file(["23_notifications.csv", "notifications.csv"])
        df = pd.read_csv(path)
        existing_ids = set(r[0] for r in session.query(Notification.notification_id).all())
        records = []
        for _, row in df.iterrows():
            nid = str(row["notification_id"]).strip()
            stid = str(row["student_id"]).strip()
            if nid not in existing_ids and stid in valid_student_ids:
                records.append(
                    Notification(
                        notification_id=nid,
                        student_id=stid,
                        type=clean_str(row["type"]),
                        title=clean_str(row["title"]),
                        message=clean_str(row["message"]),
                        is_read=clean_bool(row.get("is_read", False)),
                        created_at=clean_str(row["created_at"]),
                    )
                )
                existing_ids.add(nid)
        if records:
            session.bulk_save_objects(records)
            session.commit()
        print(f"✓ 23_notifications.csv\n  Imported: {len(records)} records (Total: {len(existing_ids)})\n")
        total_tables += 1
        total_records += len(records)

        print("=" * 60)
        print("DATABASE SEEDING COMPLETED")
        print("=" * 60)
        print(f"Total tables processed: {total_tables}")
        print(f"Total new records imported: {total_records}")
        print("=" * 60)

    except Exception as e:
        session.rollback()
        print(f"\n[ERROR during database seeding]: {e}")
        raise e
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser(description="PathForge AI Database Seeder")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset and recreate database tables before importing datasets",
    )
    args = parser.parse_args()
    seed_database(reset=args.reset)


if __name__ == "__main__":
    main()
