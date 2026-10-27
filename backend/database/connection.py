import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

database_url = settings.DATABASE_URL

# SQLite specific config
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    # Ensure data folder exists
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    database_url,
    connect_args=connect_args,
    echo=False,
    future=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI dependency to yield database session and clean up after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables in the database and ensure schema migrations."""
    Base.metadata.create_all(bind=engine)
    
    # Check and add new columns to student_skills if using SQLite
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check existing columns in student_skills
            result = conn.execute(text("PRAGMA table_info(student_skills)"))
            existing_cols = {row[1] for row in result.fetchall()}
            
            if existing_cols:
                if "is_completed" not in existing_cols:
                    conn.execute(text("ALTER TABLE student_skills ADD COLUMN is_completed BOOLEAN DEFAULT 0"))
                if "completion_status" not in existing_cols:
                    conn.execute(text("ALTER TABLE student_skills ADD COLUMN completion_status VARCHAR(50) DEFAULT 'not_started'"))
                if "completed_at" not in existing_cols:
                    conn.execute(text("ALTER TABLE student_skills ADD COLUMN completed_at VARCHAR(50)"))
                if "best_assessment_score" not in existing_cols:
                    conn.execute(text("ALTER TABLE student_skills ADD COLUMN best_assessment_score INTEGER DEFAULT 0"))
                if "latest_assessment_score" not in existing_cols:
                    conn.execute(text("ALTER TABLE student_skills ADD COLUMN latest_assessment_score INTEGER DEFAULT 0"))
                conn.commit()

            # Check existing columns in mentor_profiles
            m_result = conn.execute(text("PRAGMA table_info(mentor_profiles)"))
            m_cols = {row[1] for row in m_result.fetchall()}
            if m_cols:
                if "email" not in m_cols:
                    conn.execute(text("ALTER TABLE mentor_profiles ADD COLUMN email VARCHAR(150)"))
                if "hashed_password" not in m_cols:
                    conn.execute(text("ALTER TABLE mentor_profiles ADD COLUMN hashed_password VARCHAR(255)"))
                if "title" not in m_cols:
                    conn.execute(text("ALTER TABLE mentor_profiles ADD COLUMN title VARCHAR(150) DEFAULT 'Principal Mentor'"))
                if "company" not in m_cols:
                    conn.execute(text("ALTER TABLE mentor_profiles ADD COLUMN company VARCHAR(150) DEFAULT 'PathForge Network'"))
                if "linkedin_url" not in m_cols:
                    conn.execute(text("ALTER TABLE mentor_profiles ADD COLUMN linkedin_url VARCHAR(255)"))
                if "role" not in m_cols:
                    conn.execute(text("ALTER TABLE mentor_profiles ADD COLUMN role VARCHAR(50) DEFAULT 'mentor'"))
                if "status" not in m_cols:
                    conn.execute(text("ALTER TABLE mentor_profiles ADD COLUMN status VARCHAR(50) DEFAULT 'active'"))
                if "created_at" not in m_cols:
                    conn.execute(text("ALTER TABLE mentor_profiles ADD COLUMN created_at VARCHAR(50)"))
                conn.commit()

            # Check existing columns in student_course_progress
            scp_result = conn.execute(text("PRAGMA table_info(student_course_progress)"))
            scp_cols = {row[1] for row in scp_result.fetchall()}
            if scp_cols:
                if "enrollment_status" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN enrollment_status VARCHAR(50) DEFAULT 'enrolled'"))
                if "last_lesson_id" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN last_lesson_id VARCHAR(100)"))
                if "last_lesson_title" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN last_lesson_title VARCHAR(200)"))
                if "last_position_seconds" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN last_position_seconds INTEGER DEFAULT 0"))
                if "total_lessons" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN total_lessons INTEGER DEFAULT 5"))
                if "completed_lessons_count" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN completed_lessons_count INTEGER DEFAULT 0"))
                if "completed_lessons_json" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN completed_lessons_json TEXT DEFAULT '[]'"))
                if "last_accessed_at" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN last_accessed_at VARCHAR(50)"))
                if "final_assessment_score" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN final_assessment_score FLOAT"))
                if "final_assessment_passed" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN final_assessment_passed BOOLEAN DEFAULT 0"))
                if "assessment_attempts_count" not in scp_cols:
                    conn.execute(text("ALTER TABLE student_course_progress ADD COLUMN assessment_attempts_count INTEGER DEFAULT 0"))
                conn.commit()

            # Check user_id in student_profiles
            stu_result = conn.execute(text("PRAGMA table_info(student_profiles)"))
            stu_cols = {row[1] for row in stu_result.fetchall()}
            if stu_cols and "user_id" not in stu_cols:
                conn.execute(text("ALTER TABLE student_profiles ADD COLUMN user_id VARCHAR(50)"))
                conn.commit()

            # Check user_id in mentor_profiles
            if m_cols and "user_id" not in m_cols:
                conn.execute(text("ALTER TABLE mentor_profiles ADD COLUMN user_id VARCHAR(50)"))
                conn.commit()

        # Backfill users table and create admin
        import bcrypt
        from datetime import datetime
        session = SessionLocal()
        try:
            from database.models import User, Student, Mentor
            default_salt = bcrypt.gensalt()
            default_pw_hash = bcrypt.hashpw(b"password123", default_salt).decode("utf-8")
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # 1. Backfill Students into users
            for s in session.query(Student).all():
                clean_email = s.email.strip().lower()
                existing_user = session.query(User).filter(User.email == clean_email).first()
                pw_hash = s.hashed_password if s.hashed_password else default_pw_hash
                full_name = f"{s.first_name} {s.last_name}".strip()
                if not existing_user:
                    new_user = User(
                        user_id=s.student_id,
                        full_name=full_name,
                        email=clean_email,
                        hashed_password=pw_hash,
                        role="student",
                        is_verified=True,
                        account_status="active",
                        created_at=now_str,
                        updated_at=now_str,
                    )
                    session.add(new_user)
                    s.user_id = s.student_id
                else:
                    if not s.user_id:
                        s.user_id = existing_user.user_id

            # 2. Backfill Mentors into users
            for m in session.query(Mentor).all():
                if not m.email:
                    continue
                clean_email = m.email.strip().lower()
                existing_user = session.query(User).filter(User.email == clean_email).first()
                pw_hash = m.hashed_password if m.hashed_password else default_pw_hash
                if not existing_user:
                    new_user = User(
                        user_id=m.mentor_id,
                        full_name=m.name,
                        email=clean_email,
                        hashed_password=pw_hash,
                        role="mentor",
                        is_verified=True,
                        account_status="active",
                        created_at=now_str,
                        updated_at=now_str,
                    )
                    session.add(new_user)
                    m.user_id = m.mentor_id
                else:
                    if not m.user_id:
                        m.user_id = existing_user.user_id

            # 3. Create Admin account if missing
            admin_user = session.query(User).filter(User.email == "admin@pathforge.ai").first()
            if not admin_user:
                admin_user = User(
                    user_id="ADMIN001",
                    full_name="PathForge Administrator",
                    email="admin@pathforge.ai",
                    hashed_password=default_pw_hash,
                    role="admin",
                    is_verified=True,
                    account_status="active",
                    created_at=now_str,
                    updated_at=now_str,
                )
                session.add(admin_user)

            session.commit()
        except Exception as sync_err:
            session.rollback()
            print(f"[init_db] User backfill notice: {sync_err}")
        finally:
            session.close()

    except Exception as e:
        print(f"[init_db] Column migration check notice: {e}")
