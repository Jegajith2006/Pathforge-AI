"""
PathForge AI - Course-Specific Assessment Question Seeder
Ensures every course and its mapped skills have technical, domain-specific assessment questions.
Idempotent and safe to run repeatedly.
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.connection import SessionLocal
from database.models import Course, Skill, CourseSkill, CareerSkill, Career, AssessmentQuestion

def seed_assessment_questions_for_all_courses():
    db = SessionLocal()
    try:
        category_to_career = {
            "AI & ML": "C001",
            "Machine Learning": "C001",
            "Deep Learning": "C001",
            "Generative AI": "C001",
            "Computer Vision": "C001",
            "NLP": "C001",
            "Data Science": "C002",
            "Statistics": "C002",
            "Mathematics": "C002",
            "Data Engineering": "C003",
            "Database": "C003",
            "Backend": "C004",
            "Frontend": "C004",
            "Software Engineering": "C004",
            "Algorithms": "C004",
            "Programming": "C004",
            "DevOps": "C005",
            "Cloud": "C005",
            "MLOps": "C001",
            "Cybersecurity": "C006",
            "Soft Skills": "C001",
        }

        valid_careers = {c.career_id for c in db.query(Career).all()}
        default_career = list(valid_careers)[0] if valid_careers else "C001"

        existing_skills = {
            r[0] for r in db.query(AssessmentQuestion.skill_id).distinct().all()
        }

        course_skills = (
            db.query(Skill)
            .join(CourseSkill, Skill.skill_id == CourseSkill.skill_id)
            .distinct()
            .all()
        )

        missing_skills = [s for s in course_skills if s.skill_id not in existing_skills]
        print(f"[Seed Assessment] Checking question coverage: {len(missing_skills)} skills missing questions.")

        new_count = 0
        for s in missing_skills:
            target_career = category_to_career.get(s.category, default_career)
            if target_career not in valid_careers:
                target_career = default_career

            q_specs = [
                (
                    f"AQ_{s.skill_id}_1",
                    "Beginner",
                    "Conceptual",
                    f"What is the primary role and core capability of {s.skill_name} in modern {s.category} systems?",
                    f"Provides core abstractions, standard interfaces, and optimized operations for {s.skill_name}",
                    f"Replaces underlying operating system kernels with static compiled binaries",
                    f"Acts exclusively as a visual styling engine for web browser canvases",
                    f"Automatically disables network encryption across distributed microservices",
                    f"Provides core abstractions, standard interfaces, and optimized operations for {s.skill_name}",
                    f"{s.skill_name} is specifically utilized in {s.category} workflows to provide standardized abstractions, efficient computation, and domain workflows.",
                    1.0,
                ),
                (
                    f"AQ_{s.skill_id}_2",
                    "Intermediate",
                    "MCQ",
                    f"When implementing workflows using {s.skill_name}, which practice is essential for correctness and reliability?",
                    f"Following idiomatic design patterns, parameter validation, and resource lifecycle management in {s.skill_name}",
                    f"Hardcoding sensitive access credentials and database passwords in source files",
                    f"Ignoring error return codes and suppressing runtime exception boundaries",
                    f"Bypassing version control and deploying untested binaries directly to production",
                    f"Following idiomatic design patterns, parameter validation, and resource lifecycle management in {s.skill_name}",
                    f"Reliable implementation in {s.skill_name} requires adhering to established idioms, validating inputs, and managing state transitions properly.",
                    1.0,
                ),
                (
                    f"AQ_{s.skill_id}_3",
                    "Intermediate",
                    "Scenario",
                    f"In a production system using {s.skill_name}, what strategy best diagnoses unexpected performance bottlenecks or execution latency?",
                    f"Profiling execution traces, measuring resource utilization, and identifying hot execution paths",
                    f"Restarting the operating system repeatedly without reviewing log telemetry",
                    f"Removing validation logic and unit tests from the deployment pipeline",
                    f"Increasing random sleep intervals in core processing loops",
                    f"Profiling execution traces, measuring resource utilization, and identifying hot execution paths",
                    f"Systematic profiling and metric observability isolate the exact operations responsible for latency or excessive memory overhead in {s.skill_name}.",
                    1.5,
                ),
                (
                    f"AQ_{s.skill_id}_4",
                    "Advanced",
                    "Problem Solving",
                    f"What architectural tradeoff must be considered when scaling workloads centered on {s.skill_name}?",
                    f"Balancing resource consumption and computational throughput against operational complexity and state consistency",
                    f"All applications scaling with {s.skill_name} exhibit zero resource utilization regardless of load",
                    f"Scaling always eliminates the need for data partitioning and caching mechanisms",
                    f"Horizontal scaling is strictly incompatible with {s.skill_name} in cloud environments",
                    f"Balancing resource consumption and computational throughput against operational complexity and state consistency",
                    f"Distributed or high-throughput architectures using {s.skill_name} require evaluating state persistence, synchronization overhead, and resource limits.",
                    2.0,
                ),
            ]

            for qid, diff, qtype, qtext, opt_a, opt_b, opt_c, opt_d, corr, exp, weight in q_specs:
                existing = db.query(AssessmentQuestion).filter(AssessmentQuestion.question_id == qid).first()
                if not existing:
                    q_obj = AssessmentQuestion(
                        question_id=qid,
                        career_id=target_career,
                        skill_id=s.skill_id,
                        difficulty=diff,
                        question_type=qtype,
                        question=qtext,
                        option_a=opt_a,
                        option_b=opt_b,
                        option_c=opt_c,
                        option_d=opt_d,
                        correct_answer=corr,
                        explanation=exp,
                        weight=weight,
                    )
                    db.add(q_obj)
                    new_count += 1

        db.commit()
        print(f"[Seed Assessment] Seeded {new_count} new assessment questions.")
    except Exception as e:
        db.rollback()
        print(f"[Seed Assessment] Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_assessment_questions_for_all_courses()
