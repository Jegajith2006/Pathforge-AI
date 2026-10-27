"""
PathForge AI - Mentor Portal Database Seeder & Migrator
Ensures schema tables exist, adds missing mentor columns,
and seeds the demo mentor Dr. Alex Chen with realistic students,
sessions, project reviews, messages, and learning resources.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.connection import init_db, SessionLocal, engine
from database.models import (
    Mentor,
    Student,
    Project,
    Skill,
    MentorFeedback,
    MentorStudentAssignment,
    MentorshipSession,
    MentorMessage,
    MentorResource,
    MentorGuidanceNote,
    StudentProjectProgress,
)
from routers.auth import get_password_hash


def seed_mentor_portal():
    print("[PathForge AI] Running database initialization and mentor migration...")
    init_db()

    session = SessionLocal()
    try:
        # Check or create demo mentor Dr. Alex Chen
        demo_email = "alex.mentor@pathforge.ai"
        mentor = session.query(Mentor).filter(Mentor.email == demo_email).first()

        hashed_pw = get_password_hash("password123")

        if not mentor:
            # Check if M999 exists
            mentor_id = "M999"
            existing_m = session.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
            if existing_m:
                mentor_id = "M_ALEX"

            mentor = Mentor(
                mentor_id=mentor_id,
                name="Dr. Alex Chen",
                email=demo_email,
                hashed_password=hashed_pw,
                title="Principal AI Scientist & Mentor",
                company="Stanford AI Lab · PathForge",
                linkedin_url="https://linkedin.com/in/dralexchen-ai",
                expertise="Machine Learning & Generative AI",
                experience_years=10,
                skills="Python, Machine Learning, Deep Learning, MLOps, Generative AI, PyTorch",
                bio="AI Researcher and industry veteran mentoring emerging software engineers, data scientists, and ML specialists.",
                availability="Available",
                rating=4.8,
                role="mentor",
                status="active",
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            )
            session.add(mentor)
            session.commit()
            session.refresh(mentor)
            print(f"[PathForge AI] Seeded demo mentor: {mentor.name} ({mentor.email}) [ID: {mentor.mentor_id}]")
        else:
            # Ensure password is set
            mentor.hashed_password = hashed_pw
            session.commit()

        # Update existing seed mentors so they can also be used if needed
        existing_mentors = session.query(Mentor).all()
        for idx, m in enumerate(existing_mentors):
            if not m.email:
                slug = m.name.lower().replace(" ", ".").replace("dr.", "").replace("prof.", "").strip(".")
                m.email = f"{slug}@pathforge.ai"
            if not m.hashed_password:
                m.hashed_password = hashed_pw
            if not m.title:
                m.title = m.expertise
            if not m.company:
                m.company = "PathForge Network"
            if not m.role:
                m.role = "mentor"
            if not m.status:
                m.status = "active"
        session.commit()

        # Fetch existing students from the database to assign
        all_students = session.query(Student).all()
        if not all_students:
            print("[PathForge AI] Note: No students found in database.")
            return

        # Pick 12 students to assign to Dr. Alex Chen
        target_students = all_students[:12]
        today_str = datetime.now().strftime("%Y-%m-%d")

        # Create assignments
        for st in target_students:
            assignment = (
                session.query(MentorStudentAssignment)
                .filter(
                    MentorStudentAssignment.mentor_id == mentor.mentor_id,
                    MentorStudentAssignment.student_id == st.student_id,
                )
                .first()
            )
            if not assignment:
                session.add(
                    MentorStudentAssignment(
                        mentor_id=mentor.mentor_id,
                        student_id=st.student_id,
                        assigned_date=today_str,
                        status="active",
                        notes=f"Active mentee under {mentor.name}",
                    )
                )
        session.commit()

        # Seed Upcoming Sessions for Dr. Alex Chen
        existing_sessions = (
            session.query(MentorshipSession)
            .filter(MentorshipSession.mentor_id == mentor.mentor_id)
            .count()
        )
        if existing_sessions == 0 and len(target_students) >= 3:
            s1 = target_students[0]
            s2 = target_students[1]
            s3 = target_students[2]

            d1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            d2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
            d3 = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")

            session.add_all([
                MentorshipSession(
                    session_id="SES-ML01",
                    mentor_id=mentor.mentor_id,
                    student_id=s1.student_id,
                    topic="Career Guidance - Machine Learning",
                    session_date=d1,
                    start_time="10:00 AM",
                    end_time="11:00 AM",
                    platform="Google Meet",
                    meeting_link="https://meet.google.com/pathforge-ml",
                    status="upcoming",
                    notes="Review ML portfolio roadmap and cross-validation strategy",
                    created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                MentorshipSession(
                    session_id="SES-WEB02",
                    mentor_id=mentor.mentor_id,
                    student_id=s2.student_id,
                    topic="Project Review - Web Development",
                    session_date=d2,
                    start_time="02:00 PM",
                    end_time="03:00 PM",
                    platform="Google Meet",
                    meeting_link="https://meet.google.com/pathforge-web",
                    status="upcoming",
                    notes="Architecture evaluation of FastAPI backend and React frontend",
                    created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                MentorshipSession(
                    session_id="SES-RES03",
                    mentor_id=mentor.mentor_id,
                    student_id=s3.student_id,
                    topic="Resume Review",
                    session_date=d3,
                    start_time="11:00 AM",
                    end_time="12:00 PM",
                    platform="Google Meet",
                    meeting_link="https://meet.google.com/pathforge-resume",
                    status="upcoming",
                    notes="Align resume skills with industry expectations",
                    created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
            ])
            session.commit()
            print("[PathForge AI] Seeded mentorship sessions.")

        # Seed Messages
        existing_msgs = (
            session.query(MentorMessage)
            .filter(MentorMessage.mentor_id == mentor.mentor_id)
            .count()
        )
        if existing_msgs == 0 and len(target_students) >= 4:
            session.add_all([
                MentorMessage(
                    message_id="MSG-001",
                    mentor_id=mentor.mentor_id,
                    student_id=target_students[0].student_id,
                    sender_role="student",
                    sender_id=target_students[0].student_id,
                    content="Thank you for the feedback on my project! I updated the neural network architecture.",
                    is_read=False,
                    created_at=(datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
                ),
                MentorMessage(
                    message_id="MSG-002",
                    mentor_id=mentor.mentor_id,
                    student_id=target_students[1].student_id,
                    sender_role="student",
                    sender_id=target_students[1].student_id,
                    content="Can we schedule a session this week? I have a question about database indexing.",
                    is_read=False,
                    created_at=(datetime.now() - timedelta(hours=5)).strftime("%Y-%m-%d %H:%M:%S"),
                ),
                MentorMessage(
                    message_id="MSG-003",
                    mentor_id=mentor.mentor_id,
                    student_id=target_students[2].student_id,
                    sender_role="student",
                    sender_id=target_students[2].student_id,
                    content="I have completed the assessment for Data Structures. What should I tackle next?",
                    is_read=False,
                    created_at=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
                ),
                MentorMessage(
                    message_id="MSG-004",
                    mentor_id=mentor.mentor_id,
                    student_id=target_students[3].student_id,
                    sender_role="student",
                    sender_id=target_students[3].student_id,
                    content="Could you review my resume? I added my recent PyTorch project.",
                    is_read=True,
                    created_at=(datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"),
                ),
            ])
            session.commit()
            print("[PathForge AI] Seeded initial mentor messages.")

        # Seed Project Submissions and Reviews if needed
        projects = session.query(Project).all()
        skills = session.query(Skill).all()
        if projects and skills:
            p1 = projects[0]
            sk1 = skills[0]

            for st in target_students[:4]:
                prog = (
                    session.query(StudentProjectProgress)
                    .filter(
                        StudentProjectProgress.student_id == st.student_id,
                        StudentProjectProgress.project_id == p1.project_id,
                    )
                    .first()
                )
                if not prog:
                    session.add(
                        StudentProjectProgress(
                            student_id=st.student_id,
                            project_id=p1.project_id,
                            progress_percentage=100,
                            status="completed",
                            github_url="https://github.com/pathforge-student/project-demo",
                            completed_at=today_str,
                        )
                    )

            # Ensure feedback entries exist for Dr. Alex Chen
            rev_count = (
                session.query(MentorFeedback)
                .filter(MentorFeedback.mentor_id == mentor.mentor_id)
                .count()
            )
            if rev_count < 24:
                needed = 24 - rev_count
                for i in range(needed):
                    st = target_students[i % len(target_students)]
                    proj = projects[i % len(projects)]
                    sk = skills[i % len(skills)]

                    session.add(
                        MentorFeedback(
                            feedback_id=f"REV-{mentor.mentor_id}-{i:03d}",
                            mentor_id=mentor.mentor_id,
                            student_id=st.student_id,
                            project_id=proj.project_id,
                            skill_id=sk.skill_id,
                            rating=5 if (i % 3 != 0) else 4,
                            strengths="Clean modular code, robust error handling, and comprehensive docstrings.",
                            improvement_areas="Add automated integration tests and containerized Docker setup.",
                            comments="Demonstrated solid production competency. Ready for advanced milestones.",
                            recommended_action="Proceed to distributed systems milestone.",
                            feedback_date=today_str,
                        )
                    )
                session.commit()
                print(f"[PathForge AI] Seeded completed project reviews for mentor (Total: 24).")

        # Seed Resources
        existing_res = (
            session.query(MentorResource)
            .filter(MentorResource.mentor_id == mentor.mentor_id)
            .count()
        )
        if existing_res == 0:
            session.add_all([
                MentorResource(
                    resource_id="RES-001",
                    mentor_id=mentor.mentor_id,
                    title="Stanford CS229: Machine Learning Lecture Notes & Handouts",
                    description="Comprehensive foundation on supervised learning, SVMs, and neural network theory.",
                    category="Machine Learning",
                    url="https://cs229.stanford.edu/notes2022fall/",
                    tags="ML, Theory, Foundations",
                    created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                MentorResource(
                    resource_id="RES-002",
                    mentor_id=mentor.mentor_id,
                    title="Full Stack Deep Learning — Production MLOps Best Practices",
                    description="Guidelines for deploying models, experiment tracking with Weights & Biases, and CI/CD.",
                    category="MLOps",
                    url="https://fullstackdeeplearning.com/",
                    tags="MLOps, Deployment, Docker",
                    created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
                MentorResource(
                    resource_id="RES-003",
                    mentor_id=mentor.mentor_id,
                    title="Designing Data-Intensive Applications (Summary & Reading Guide)",
                    description="Crucial systems architecture handbook for reliable, scalable, and maintainable data systems.",
                    category="System Design",
                    url="https://dataintensive.net/",
                    tags="Architecture, Databases, Distributed Systems",
                    created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
            ])
            session.commit()
            print("[PathForge AI] Seeded mentor resources.")

        print("[PathForge AI] Mentor portal database seeding successfully completed!")
    finally:
        session.close()


if __name__ == "__main__":
    seed_mentor_portal()
