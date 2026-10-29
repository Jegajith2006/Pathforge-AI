"""
PathForge AI - Mentor Portal Database Seeder & Migrator
Ensures schema tables exist, ensures demo mentor Dr. Arun Kumar (M001) is active
with realistic student assignments, sessions, project reviews, messages, and learning resources.
Prevents creation of duplicate/synthetic mentors (such as M999).
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.connection import init_db, SessionLocal, engine
from database.models import (
    User,
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
        # 1. Clean up duplicate/synthetic mentor M999 if present
        m999 = session.query(Mentor).filter(Mentor.mentor_id == "M999").first()
        if m999:
            print("[PathForge AI] Migrating any remaining M999 assets to M001 before cleanup...")
            # Reassign any valid mentee data to M001
            session.query(MentorshipSession).filter(MentorshipSession.mentor_id == "M999", MentorshipSession.student_id.in_(["U001", "U002"])).update({"mentor_id": "M001"}, synchronize_session=False)
            session.query(MentorMessage).filter(MentorMessage.mentor_id == "M999", MentorMessage.student_id.in_(["U001", "U002"])).update({"mentor_id": "M001"}, synchronize_session=False)
            session.query(MentorResource).filter(MentorResource.mentor_id == "M999").update({"mentor_id": "M001"}, synchronize_session=False)
            session.query(MentorFeedback).filter(MentorFeedback.mentor_id == "M999", MentorFeedback.student_id.in_(["U001", "U002"])).update({"mentor_id": "M001"}, synchronize_session=False)
            # Remove remaining M999 orphaned rows
            session.query(MentorshipSession).filter(MentorshipSession.mentor_id == "M999").delete(synchronize_session=False)
            session.query(MentorMessage).filter(MentorMessage.mentor_id == "M999").delete(synchronize_session=False)
            session.query(MentorStudentAssignment).filter(MentorStudentAssignment.mentor_id == "M999").delete(synchronize_session=False)
            session.query(MentorFeedback).filter(MentorFeedback.mentor_id == "M999").delete(synchronize_session=False)
            session.query(Mentor).filter(Mentor.mentor_id == "M999").delete(synchronize_session=False)
            session.query(User).filter(User.user_id == "M999").delete(synchronize_session=False)
            session.commit()

        # 2. Check or create demo mentor Dr. Arun Kumar (M001)
        demo_email = "arun.kumar@pathforge.ai"
        mentor_id = "M001"
        mentor = session.query(Mentor).filter((Mentor.email == demo_email) | (Mentor.mentor_id == mentor_id)).first()

        hashed_pw = get_password_hash("password123")
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if not mentor:
            mentor = Mentor(
                mentor_id=mentor_id,
                name="Dr. Arun Kumar",
                email=demo_email,
                hashed_password=hashed_pw,
                title="Principal Mentor",
                company="PathForge Network",
                linkedin_url="https://linkedin.com/in/dr-arun-kumar",
                expertise="Machine Learning & AI",
                experience_years=8,
                skills="Python, Machine Learning, Deep Learning, MLOps",
                bio="Principal ML Scientist with extensive industry expertise in predictive modeling and MLOps.",
                availability="Available",
                rating=4.8,
                role="mentor",
                status="active",
                created_at=now_str,
                user_id=mentor_id,
            )
            session.add(mentor)
            session.commit()
            session.refresh(mentor)
            print(f"[PathForge AI] Seeded demo mentor: {mentor.name} ({mentor.email}) [ID: {mentor.mentor_id}]")
        else:
            # Ensure attributes and password are set
            mentor.mentor_id = mentor_id
            mentor.name = "Dr. Arun Kumar"
            mentor.email = demo_email
            mentor.hashed_password = hashed_pw
            mentor.role = "mentor"
            mentor.status = "active"
            if not mentor.title:
                mentor.title = "Principal Mentor"
            if not mentor.company:
                mentor.company = "PathForge Network"
            if not mentor.availability:
                mentor.availability = "Available"
            mentor.user_id = mentor_id
            session.commit()

        # Also ensure User entry for M001
        m_user = session.query(User).filter(User.user_id == mentor_id).first()
        if not m_user:
            m_user = User(
                user_id=mentor_id,
                full_name=mentor.name,
                email=demo_email,
                hashed_password=hashed_pw,
                role="mentor",
                is_verified=True,
                account_status="active",
                created_at=now_str,
                updated_at=now_str,
            )
            session.add(m_user)
            session.commit()

        # 3. Fetch approved students from the database to assign (U001, U002)
        target_students = session.query(Student).filter(Student.student_id.in_(["U001", "U002"])).all()
        if not target_students:
            target_students = session.query(Student).limit(2).all()
        if not target_students:
            print("[PathForge AI] Note: No students found in database.")
            return

        today_str = datetime.now().strftime("%Y-%m-%d")

        # Create assignments for M001
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

        # Clean any assignments of M001 to removed student accounts
        session.query(MentorStudentAssignment).filter(
            MentorStudentAssignment.mentor_id == mentor.mentor_id,
            ~MentorStudentAssignment.student_id.in_([s.student_id for s in target_students]),
        ).delete(synchronize_session=False)
        session.commit()

        # 4. Seed Upcoming Sessions for Dr. Arun Kumar (M001)
        existing_sessions = (
            session.query(MentorshipSession)
            .filter(MentorshipSession.mentor_id == mentor.mentor_id)
            .count()
        )
        if existing_sessions == 0 and len(target_students) >= 1:
            s1 = target_students[0]
            s2 = target_students[1] if len(target_students) > 1 else target_students[0]

            d1 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            d2 = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")

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
                    created_at=now_str,
                ),
                MentorshipSession(
                    session_id="SES-WEB02",
                    mentor_id=mentor.mentor_id,
                    student_id=s2.student_id,
                    topic="Project Review - System Architecture",
                    session_date=d2,
                    start_time="02:00 PM",
                    end_time="03:00 PM",
                    platform="Google Meet",
                    meeting_link="https://meet.google.com/pathforge-web",
                    status="upcoming",
                    notes="Architecture evaluation of FastAPI backend and React frontend",
                    created_at=now_str,
                ),
            ])
            session.commit()
            print("[PathForge AI] Seeded mentorship sessions for Dr. Arun Kumar.")

        # 5. Seed Messages for Dr. Arun Kumar (M001)
        existing_msgs = (
            session.query(MentorMessage)
            .filter(MentorMessage.mentor_id == mentor.mentor_id)
            .count()
        )
        if existing_msgs == 0 and len(target_students) >= 1:
            s1 = target_students[0]
            s2 = target_students[1] if len(target_students) > 1 else target_students[0]
            session.add_all([
                MentorMessage(
                    message_id="MSG-001",
                    mentor_id=mentor.mentor_id,
                    student_id=s1.student_id,
                    sender_role="student",
                    sender_id=s1.student_id,
                    content="Thank you for the feedback on my project! I updated the neural network architecture.",
                    is_read=False,
                    created_at=(datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
                ),
                MentorMessage(
                    message_id="MSG-002",
                    mentor_id=mentor.mentor_id,
                    student_id=s2.student_id,
                    sender_role="student",
                    sender_id=s2.student_id,
                    content="Can we schedule a session this week? I have a question about model deployment.",
                    is_read=False,
                    created_at=(datetime.now() - timedelta(hours=5)).strftime("%Y-%m-%d %H:%M:%S"),
                ),
            ])
            session.commit()
            print("[PathForge AI] Seeded initial mentor messages for Dr. Arun Kumar.")

        # 6. Seed Project Submissions and Reviews
        projects = session.query(Project).all()
        skills = session.query(Skill).all()
        if projects and skills:
            p1 = projects[0]
            sk1 = skills[0]

            for st in target_students:
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

            # Ensure feedback entries exist for Dr. Arun Kumar
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
                print(f"[PathForge AI] Seeded completed project reviews for mentor (Total: {session.query(MentorFeedback).filter(MentorFeedback.mentor_id == mentor.mentor_id).count()}).")

        # 7. Seed Resources for Dr. Arun Kumar (M001)
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
                    created_at=now_str,
                ),
                MentorResource(
                    resource_id="RES-002",
                    mentor_id=mentor.mentor_id,
                    title="Full Stack Deep Learning — Production MLOps Best Practices",
                    description="Guidelines for deploying models, experiment tracking with Weights & Biases, and CI/CD.",
                    category="MLOps",
                    url="https://fullstackdeeplearning.com/",
                    tags="MLOps, Deployment, Docker",
                    created_at=now_str,
                ),
                MentorResource(
                    resource_id="RES-003",
                    mentor_id=mentor.mentor_id,
                    title="Designing Data-Intensive Applications (Summary & Reading Guide)",
                    description="Crucial systems architecture handbook for reliable, scalable, and maintainable data systems.",
                    category="System Design",
                    url="https://dataintensive.net/",
                    tags="Architecture, Databases, Distributed Systems",
                    created_at=now_str,
                ),
            ])
            session.commit()
            print("[PathForge AI] Seeded mentor resources for Dr. Arun Kumar.")

        print("[PathForge AI] Mentor portal database seeding successfully completed!")
    finally:
        session.close()


if __name__ == "__main__":
    seed_mentor_portal()
