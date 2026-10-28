import sys
import json
from pathlib import Path
from datetime import datetime, timedelta

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.connection import SessionLocal
from database.models import Mentor, Student, Skill, MentorAssessment, MentorAssessmentSubmission

def seed_demo_assessments():
    session = SessionLocal()
    try:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        deadline_str = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")

        skills = session.query(Skill).all()
        skill_ml = session.query(Skill).filter(Skill.skill_name.ilike("%Machine Learning%")).first() or (skills[0] if skills else None)
        skill_py = session.query(Skill).filter(Skill.skill_name.ilike("%Python%")).first() or (skills[1] if len(skills) > 1 else skills[0])

        student = session.query(Student).filter(Student.student_id == "U001").first()

        for mid in ["M001", "M999"]:
            mentor = session.query(Mentor).filter(Mentor.mentor_id == mid).first()
            if not mentor:
                continue

            # Assessment 1: Evaluated
            ass1_id = f"MASS-{mid}-001"
            ass1 = session.query(MentorAssessment).filter(MentorAssessment.assessment_id == ass1_id).first()
            if not ass1 and skill_ml:
                ass1 = MentorAssessment(
                    assessment_id=ass1_id,
                    mentor_id=mid,
                    student_id="U001",
                    skill_id=skill_ml.skill_id,
                    title="Machine Learning Pipeline & Model Evaluation Audit",
                    description="Build an end-to-end ML training and evaluation pipeline with cross-validation and hyperparameter tuning.",
                    instructions="1. Load dataset with pandas\n2. Perform feature preprocessing\n3. Train baseline and tuned ensemble models\n4. Report AUC-ROC, precision-recall curve, and confusion matrix.",
                    criteria_json=json.dumps([
                        {"criterion": "Data Preprocessing & Feature Engineering", "weight": 30, "description": "Handling missing values and proper normalization."},
                        {"criterion": "Model Architecture & Cross-Validation", "weight": 40, "description": "Proper K-Fold CV without data leakage."},
                        {"criterion": "Evaluation Rigor & Error Analysis", "weight": 30, "description": "Interpretation of metrics and boundary cases."}
                    ]),
                    deadline=deadline_str,
                    max_score=100,
                    status="active",
                    created_at=now_str,
                )
                session.add(ass1)
                session.flush()

                # Submission 1: Evaluated
                sub1_id = f"MSUB-{mid}-001"
                sub1 = MentorAssessmentSubmission(
                    submission_id=sub1_id,
                    assessment_id=ass1_id,
                    student_id="U001",
                    submission_text="Completed full ML pipeline using scikit-learn and XGBoost. Implemented 5-fold stratified CV and logged ROC-AUC metrics.",
                    attachment_url="https://github.com/pathforge-student/ml-pipeline-audit",
                    answers_json=json.dumps({"pipeline_repo": "https://github.com/pathforge-student/ml-pipeline-audit"}),
                    status="evaluated",
                    score=92.0,
                    feedback="Outstanding work! The pipeline cleanly prevents data leakage, and the error analysis shows genuine analytical depth.",
                    rubric_scores_json=json.dumps({
                        "Data Preprocessing & Feature Engineering": 28,
                        "Model Architecture & Cross-Validation": 38,
                        "Evaluation Rigor & Error Analysis": 26
                    }),
                    is_released=True,
                    submitted_at=(datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"),
                    evaluated_at=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
                )
                session.add(sub1)

            # Assessment 2: Pending Evaluation (Ready for Mentor to Grade)
            ass2_id = f"MASS-{mid}-002"
            ass2 = session.query(MentorAssessment).filter(MentorAssessment.assessment_id == ass2_id).first()
            if not ass2 and skill_py:
                ass2 = MentorAssessment(
                    assessment_id=ass2_id,
                    mentor_id=mid,
                    student_id="U001",
                    skill_id=skill_py.skill_id,
                    title="Production Backend API Design & Concurrency Benchmark",
                    description="Design a scalable REST/gRPC service with asynchronous task processing and connection pooling.",
                    instructions="1. Implement FastAPI endpoints with Pydantic validation\n2. Add background tasks using Celery or Redis queue\n3. Benchmark throughput under 500 concurrent connections.",
                    criteria_json=json.dumps([
                        {"criterion": "API Design & Schema Robustness", "weight": 35, "description": "RESTful conventions and strict input validation."},
                        {"criterion": "Concurrency & Asynchronous Architecture", "weight": 35, "description": "Non-blocking I/O and connection management."},
                        {"criterion": "Benchmarking & Load Testing Documentation", "weight": 30, "description": "Locust or k6 test reports."}
                    ]),
                    deadline=deadline_str,
                    max_score=100,
                    status="active",
                    created_at=now_str,
                )
                session.add(ass2)
                session.flush()

                # Submission 2: Submitted (Needs Evaluation)
                sub2_id = f"MSUB-{mid}-002"
                sub2 = MentorAssessmentSubmission(
                    submission_id=sub2_id,
                    assessment_id=ass2_id,
                    student_id="U001",
                    submission_text="Implemented the async FastAPI service with Redis queue. Attached Locust benchmark results showing 1,200 req/sec at p95 42ms.",
                    attachment_url="https://github.com/pathforge-student/api-concurrency-benchmark",
                    answers_json=json.dumps({"benchmark_report": "https://github.com/pathforge-student/api-concurrency-benchmark"}),
                    status="submitted",
                    score=None,
                    feedback=None,
                    rubric_scores_json="{}",
                    is_released=True,
                    submitted_at=(datetime.now() - timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S"),
                    evaluated_at=None,
                )
                session.add(sub2)

        session.commit()
        print("Demo assessments and submissions seeded successfully for M001 and M999!")
    finally:
        session.close()

if __name__ == "__main__":
    seed_demo_assessments()

