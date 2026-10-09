import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
root_dir = backend_dir.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from config import settings
from database.connection import engine, SessionLocal
from database.models import (
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
    Student,
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
    StudentCourseProgress,
    StudentProjectProgress,
    StudentRoadmapStep,
)


def check_database():
    print("=" * 60)
    print("PathForge AI Database Inspection")
    print("=" * 60)
    print(f"Target Database : {settings.DATABASE_URL}")

    # Check connection
    try:
        with engine.connect() as conn:
            print("Connection Status: CONNECTED (OK)\n")
    except Exception as e:
        print(f"Connection Status: FAILED ({e})\n")
        return

    session = SessionLocal()

    models = [
        ("Careers", Career),
        ("Skills", Skill),
        ("Career Skills", CareerSkill),
        ("Skill Prerequisites", SkillPrerequisite),
        ("Courses", Course),
        ("Course Skills", CourseSkill),
        ("Projects", Project),
        ("Project Skills", ProjectSkill),
        ("Assessment Questions", AssessmentQuestion),
        ("Assessment Answers", AssessmentAnswer),
        ("Student Profiles", Student),
        ("Student Skills", StudentSkill),
        ("Resume Analysis Records", ResumeAnalysis),
        ("Companies", Company),
        ("Company Skills", CompanySkill),
        ("Company Jobs", CompanyJob),
        ("Mentor Profiles", Mentor),
        ("Mentor Feedback", MentorFeedback),
        ("Learning Activity Records", LearningActivity),
        ("Certificates", Certificate),
        ("Job Applications", JobApplication),
        ("Feedback Entries", Feedback),
        ("Notifications", Notification),
        ("Student Course Progress", StudentCourseProgress),
        ("Student Project Progress", StudentProjectProgress),
        ("Student Roadmap Steps", StudentRoadmapStep),
    ]

    total_records = 0

    print(f"{'Table / Entity':<30} | {'Record Count':<12}")
    print("-" * 46)

    for label, model in models:
        try:
            count = session.query(model).count()
            total_records += count
            print(f"{label:<30} | {count:<12}")
        except Exception as e:
            print(f"{label:<30} | ERROR: {e}")

    session.close()

    print("-" * 46)
    print(f"{'Total Database Records':<30} | {total_records:<12}")
    print("=" * 60)


if __name__ == "__main__":
    check_database()
