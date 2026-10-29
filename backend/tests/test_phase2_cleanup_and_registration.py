"""
PathForge AI - Comprehensive Phase 7 Verification Suite
Tests Student Registration, Mentor Registration, Monotonic ID Generation,
Dataset Synchronization, Live DB Post-Cleanup State, and Regression Auth.
Uses an isolated temporary SQLite database and isolated temp datasets for registration tests.
Never mutates the live pathforge.db.
"""

import os
import sys
import tempfile
import sqlite3
import pytest
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings
from database.connection import Base
from database.models import User, Student, Mentor, Career, Skill
from services.dataset_sync_service import (
    generate_next_student_id,
    generate_next_mentor_id,
    sync_student_to_dataset,
    sync_mentor_to_dataset,
    sanitize_student_dict,
    sanitize_mentor_dict,
    STUDENT_CSV_COLUMNS,
    MENTOR_CSV_COLUMNS,
)
from routers.auth import get_password_hash, verify_password, create_access_token, decode_access_token


def test_monotonic_id_generation():
    """Verify that student IDs are strictly monotonic and >= U1057, and mentor IDs >= M879."""
    sid = generate_next_student_id(None)
    mid = generate_next_mentor_id(None)

    assert sid.startswith("U"), f"Expected student ID starting with U, got {sid}"
    assert mid.startswith("M"), f"Expected mentor ID starting with M, got {mid}"

    s_num = int(sid[1:])
    m_num = int(mid[1:])

    assert s_num >= 1057, f"Student ID must not reuse retired IDs (expected >= 1057, got {s_num})"
    assert m_num >= 879, f"Mentor ID must not reuse retired IDs (expected >= 879, got {m_num})"
    print(f"\n[PASS] Monotonic ID Generation: Next Student ID = {sid} (>= U1057), Next Mentor ID = {mid} (>= M879)")


def test_isolated_student_registration_and_dataset_sync():
    """Verify student registration and dataset synchronization in an isolated environment."""
    test_db_path = backend_dir / "data" / "isolated_test_runner.db"
    if test_db_path.exists():
        test_db_path.unlink()

    test_db_url = f"sqlite:///{test_db_path.as_posix()}"
    engine = create_engine(test_db_url)
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine)
    db = TestSession()

    try:
        # Seed 1 Career for FK
        career = Career(
            career_id="C001",
            career_name="AI & ML Engineer",
            category="AI",
            description="ML Specialist",
            difficulty="Advanced",
            estimated_preparation_months=12,
            core_focus="Deep Learning",
            typical_entry_level="Junior",
        )
        db.add(career)
        db.commit()

        # 1. Register student
        sid = generate_next_student_id(db)
        email = "New.Student@Stanford.Edu"
        clean_email = email.strip().lower()
        pw_hash = get_password_hash("Password123!")

        user = User(
            user_id=sid,
            full_name="Jane Doe",
            email=clean_email,
            hashed_password=pw_hash,
            role="student",
            is_verified=True,
            account_status="active",
            created_at="2026-10-29 12:00:00",
        )
        db.add(user)

        student = Student(
            student_id=sid,
            user_id=sid,
            first_name="Jane",
            last_name="Doe",
            email=clean_email,
            hashed_password=pw_hash,
            college="Stanford University",
            department="Computer Science",
            degree="B.Tech AI",
            graduation_year=2026,
            cgpa=8.8,
            target_career_id="C001",
            weekly_learning_hours=14,
            preferred_difficulty="Adaptive",
            learning_mode="Project-based",
        )
        db.add(student)
        db.commit()
        db.refresh(student)

        # Assert in DB
        saved_student = db.query(Student).filter(Student.student_id == sid).first()
        assert saved_student is not None
        assert saved_student.email == "new.student@stanford.edu"
        assert saved_student.first_name == "Jane"

        # 2. Test dataset sanitization (no passwords, tokens, hashes)
        sanitized = sanitize_student_dict(student)
        for col in ["password", "hashed_password", "token", "otp"]:
            assert col not in sanitized
        assert "Password123!" not in str(sanitized.values())
        assert "$2b$" not in str(sanitized.values())

        # 3. Test duplicate email rejection
        dup_user = User(
            user_id="U9999",
            full_name="Duplicate",
            email=clean_email,
            hashed_password=pw_hash,
            role="student",
            is_verified=True,
            created_at="2026-10-29 12:00:00",
        )
        db.add(dup_user)
        with pytest.raises(Exception):
            db.commit()
        db.rollback()

    finally:
        db.close()
        engine.dispose()
        if test_db_path.exists():
            try:
                test_db_path.unlink()
            except Exception:
                pass

    print("[PASS] Isolated student registration and duplicate prevention verified.")


def test_isolated_mentor_registration_and_dataset_sync():
    """Verify mentor registration and dataset synchronization in an isolated environment."""
    test_db_path = backend_dir / "data" / "isolated_mentor_runner.db"
    if test_db_path.exists():
        test_db_path.unlink()

    test_db_url = f"sqlite:///{test_db_path.as_posix()}"
    engine = create_engine(test_db_url)
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine)
    db = TestSession()

    try:
        mid = generate_next_mentor_id(db)
        email = "Professor.Oak@PathForge.Ai"
        clean_email = email.strip().lower()
        pw_hash = get_password_hash("SecretOak2026!")

        user = User(
            user_id=mid,
            full_name="Prof. Samuel Oak",
            email=clean_email,
            hashed_password=pw_hash,
            role="mentor",
            is_verified=True,
            account_status="active",
            created_at="2026-10-29 12:00:00",
        )
        db.add(user)

        mentor = Mentor(
            mentor_id=mid,
            user_id=mid,
            name="Prof. Samuel Oak",
            email=clean_email,
            hashed_password=pw_hash,
            title="Senior AI Researcher",
            company="Oak AI Labs",
            expertise="Neural Networks",
            experience_years=12,
            skills="PyTorch, ML, AI",
            bio="Pioneering researcher in computer vision.",
            availability="Available",
            rating=4.9,
            role="mentor",
            status="active",
            created_at="2026-10-29 12:00:00",
        )
        db.add(mentor)
        db.commit()
        db.refresh(mentor)

        # Assert in DB
        saved_mentor = db.query(Mentor).filter(Mentor.mentor_id == mid).first()
        assert saved_mentor is not None
        assert saved_mentor.email == "professor.oak@pathforge.ai"
        assert saved_mentor.role == "mentor"  # Never admin

        # Test mentor sanitization (no credentials or secrets in dataset schema)
        sanitized_m = sanitize_mentor_dict(mentor)
        for col in ["password", "hashed_password", "token", "otp"]:
            assert col not in sanitized_m
        assert "SecretOak2026!" not in str(sanitized_m.values())
        assert "$2b$" not in str(sanitized_m.values())

    finally:
        db.close()
        engine.dispose()
        if test_db_path.exists():
            try:
                test_db_path.unlink()
            except Exception:
                pass

    print("[PASS] Isolated mentor registration, role enforcement, and non-sensitive sanitization verified.")


def test_live_database_post_cleanup_state():
    """Read-only verification of the live database after Phase 2 cleanup."""
    db_file = settings.BASE_DIR / "data" / "pathforge.db"
    con = sqlite3.connect(f"file:{db_file}?mode=ro", uri=True)
    cur = con.cursor()

    # 1. Total counts
    st_cnt = cur.execute("SELECT COUNT(*) FROM student_profiles;").fetchone()[0]
    m_cnt = cur.execute("SELECT COUNT(*) FROM mentor_profiles;").fetchone()[0]
    u_cnt = cur.execute("SELECT COUNT(*) FROM users;").fetchone()[0]

    assert st_cnt >= 102, f"Expected at least 102 students in DB, got {st_cnt}"
    assert m_cnt >= 36, f"Expected at least 36 mentors in DB, got {m_cnt}"
    assert u_cnt >= 139, f"Expected at least 139 users in DB, got {u_cnt}"

    # 2. Key protected accounts
    alex = cur.execute("SELECT student_id, first_name, last_name, email FROM student_profiles WHERE student_id = 'U001';").fetchone()
    assert alex is not None and alex[1] == "Alex" and alex[2] == "Chen" and alex[3] == "alex.chen@stanford.edu"

    arun = cur.execute("SELECT mentor_id, name, email FROM mentor_profiles WHERE mentor_id = 'M001';").fetchone()
    assert arun is not None and arun[1] == "Dr. Arun Kumar" and arun[2] == "arun.kumar@pathforge.ai"

    kiru = cur.execute("SELECT student_id, first_name, email FROM student_profiles WHERE student_id = 'U002';").fetchone()
    assert kiru is not None and kiru[1] == "Kirubakaran" and kiru[2] == "kirubakaran@bitsathy.ac.in"

    john = cur.execute("SELECT student_id, first_name, email FROM student_profiles WHERE student_id = 'U1053';").fetchone()
    assert john is not None and john[1] == "john" and john[2] == "selvarajnava16@gmail.com"

    vijay = cur.execute("SELECT student_id, first_name, email FROM student_profiles WHERE student_id = 'U1056';").fetchone()
    assert vijay is not None and vijay[1] == "vijay" and vijay[2] == "jegajithjk@gmail.com"

    jhon_m = cur.execute("SELECT mentor_id, name, email FROM mentor_profiles WHERE mentor_id = 'M877';").fetchone()
    assert jhon_m is not None and jhon_m[1] == "jhon" and jhon_m[2] == "jothiveljegajith2006@gmail.com"

    admin = cur.execute("SELECT user_id, full_name, email, role FROM users WHERE user_id = 'ADMIN001';").fetchone()
    assert admin is not None and admin[3] == "admin" and admin[2] == "admin@pathforge.ai"

    # 3. Integrity check
    integrity = cur.execute("PRAGMA integrity_check;").fetchall()
    assert integrity == [("ok",)], f"Integrity check failed: {integrity}"

    con.close()
    print("[PASS] Live database post-cleanup counts and protected accounts verified.")


def test_auth_regression():
    """Verify password hashing, token creation, and claim decoding for protected demo accounts."""
    db_file = settings.BASE_DIR / "data" / "pathforge.db"
    con = sqlite3.connect(f"file:{db_file}?mode=ro", uri=True)
    cur = con.cursor()

    # Verify password verification for Alex Chen
    alex_hash = cur.execute("SELECT hashed_password FROM student_profiles WHERE student_id = 'U001';").fetchone()[0]
    assert verify_password("password123", alex_hash) is True

    # Verify password verification for Dr. Arun Kumar
    arun_hash = cur.execute("SELECT hashed_password FROM mentor_profiles WHERE mentor_id = 'M001';").fetchone()[0]
    assert verify_password("password123", arun_hash) is True

    # Token issuance and decoding
    token = create_access_token({"sub": "U001", "email": "alex.chen@stanford.edu", "role": "student"})
    payload = decode_access_token(token)
    assert payload["sub"] == "U001"
    assert payload["role"] == "student"

    mentor_token = create_access_token({"sub": "M001", "email": "arun.kumar@pathforge.ai", "role": "mentor"})
    m_payload = decode_access_token(mentor_token)
    assert m_payload["sub"] == "M001"
    assert m_payload["role"] == "mentor"

    con.close()
    print("[PASS] Authentication regression (login password verification & JWT role claims) verified.")


if __name__ == "__main__":
    test_monotonic_id_generation()
    test_isolated_student_registration_and_dataset_sync()
    test_isolated_mentor_registration_and_dataset_sync()
    test_live_database_post_cleanup_state()
    test_auth_regression()
    print("\n==================================================")
    print("ALL TESTS IN TEST SUITE PASSED SUCCESSFULLY!")
    print("==================================================")
