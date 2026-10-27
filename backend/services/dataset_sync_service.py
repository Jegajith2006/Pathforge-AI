"""
PathForge AI - Dataset Synchronization Service
Ensures bidirectional consistency between the SQLAlchemy database and CSV datasets.
Whenever a new user registers or updates their profile, non-sensitive profile details
are synchronized to both canonical and prefixed student datasets (e.g. student_profiles.csv
and 11_student_profiles.csv).
"""

import os
import csv
import re
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional, Set, Union
from sqlalchemy.orm import Session
from sqlalchemy import func

from config import settings
from database.models import Student, Career

# Mutex for thread-safe file operations
_dataset_lock = threading.Lock()

# Non-sensitive CSV column schema matching datasets/student_profiles.csv exactly
STUDENT_CSV_COLUMNS = [
    "student_id",
    "first_name",
    "last_name",
    "email",
    "college",
    "department",
    "degree",
    "graduation_year",
    "cgpa",
    "target_career_id",
    "weekly_learning_hours",
    "preferred_difficulty",
    "learning_mode",
]


def get_student_dataset_paths() -> List[Path]:
    """
    Locates all candidate student profile CSV files in the workspace.
    Covers both canonical ('student_profiles.csv') and prefixed ('11_student_profiles.csv')
    across configured and fallback paths.
    """
    search_dirs = [
        settings.DATASET_DIR,
        settings.BASE_DIR.parent / "datasets",
        settings.BASE_DIR / "datasets",
        Path.cwd() / "datasets",
        Path.cwd().parent / "datasets",
    ]
    target_names = ["11_student_profiles.csv", "student_profiles.csv"]
    found_paths: List[Path] = []
    seen_canonical = set()

    for d in search_dirs:
        try:
            resolved_dir = Path(d).resolve()
        except Exception:
            continue
        if not resolved_dir.exists() or not resolved_dir.is_dir():
            continue

        for name in target_names:
            file_path = (resolved_dir / name).resolve()
            if file_path.exists() and file_path not in seen_canonical:
                found_paths.append(file_path)
                seen_canonical.add(file_path)

    return found_paths


def get_existing_student_ids(db: Optional[Session] = None) -> Set[str]:
    """
    Gathers all student IDs from both the active database and CSV datasets.
    """
    student_ids: Set[str] = set()

    # 1. From database
    if db is not None:
        try:
            db_ids = db.query(Student.student_id).all()
            for (sid,) in db_ids:
                if sid:
                    student_ids.add(str(sid).strip())
        except Exception:
            pass

    # 2. From CSV files
    for path in get_student_dataset_paths():
        try:
            with open(path, mode="r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sid = row.get("student_id")
                    if sid:
                        student_ids.add(str(sid).strip())
        except Exception:
            continue

    return student_ids


def get_existing_emails(db: Optional[Session] = None) -> Set[str]:
    """
    Gathers all registered student email addresses (lowercase) from DB and CSV.
    """
    emails: Set[str] = set()

    # 1. From database
    if db is not None:
        try:
            db_emails = db.query(Student.email).all()
            for (em,) in db_emails:
                if em:
                    emails.add(str(em).strip().lower())
        except Exception:
            pass

    # 2. From CSV files
    for path in get_student_dataset_paths():
        try:
            with open(path, mode="r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    em = row.get("email")
                    if em:
                        emails.add(str(em).strip().lower())
        except Exception:
            continue

    return emails


def is_email_registered(db: Session, email: str) -> bool:
    """
    Returns True if the email already exists in either the database or CSV dataset.
    """
    if not email:
        return False
    clean_email = email.strip().lower()

    # Check database
    existing_db = db.query(Student).filter(func.lower(Student.email) == clean_email).first()
    if existing_db is not None:
        return True

    # Check datasets
    csv_emails = get_existing_emails(db=None)
    return clean_email in csv_emails


def generate_next_student_id(db: Optional[Session] = None) -> str:
    """
    Generates a unique, collision-proof sequential student ID in the format 'U{number:03d}'.
    Examines all existing IDs in both database and datasets to ensure strict monotonicity.
    """
    existing_ids = get_existing_student_ids(db)
    max_num = 0

    id_pattern = re.compile(r"^U(\d+)$", re.IGNORECASE)
    for sid in existing_ids:
        match = id_pattern.match(sid)
        if match:
            try:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num
            except ValueError:
                continue

    next_num = max_num + 1
    candidate_id = f"U{next_num:03d}"

    # Guard against unexpected collision
    while candidate_id in existing_ids:
        next_num += 1
        candidate_id = f"U{next_num:03d}"

    return candidate_id


def sanitize_profile_dict(data: Union[Student, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extracts and validates non-sensitive student profile attributes matching the CSV schema.
    Strictly excludes passwords, hashed credentials, and sensitive tokens.
    """
    def _get(key, default=""):
        if isinstance(data, dict):
            val = data.get(key, default)
        else:
            val = getattr(data, key, default)
        return val if val is not None else default

    sid = str(_get("student_id", "")).strip()
    first_name = str(_get("first_name", "")).strip()
    last_name = str(_get("last_name", "")).strip()
    email = str(_get("email", "")).strip().lower()
    college = str(_get("college", "Stanford University")).strip()
    department = str(_get("department", "Department of Computer Science")).strip()
    degree = str(_get("degree", "B.Tech AI & Data Science")).strip()

    try:
        graduation_year = int(_get("graduation_year", 2026))
    except (ValueError, TypeError):
        graduation_year = 2026

    try:
        cgpa = round(float(_get("cgpa", 8.5)), 2)
        # Ensure CGPA stays within valid bounds [0.0, 10.0]
        cgpa = max(0.0, min(10.0, cgpa))
    except (ValueError, TypeError):
        cgpa = 8.5

    target_career_id = str(_get("target_career_id", "C001")).strip()

    try:
        weekly_hours = int(_get("weekly_learning_hours", 12))
    except (ValueError, TypeError):
        weekly_hours = 12

    preferred_difficulty = str(_get("preferred_difficulty", "Adaptive")).strip()
    if preferred_difficulty not in {"Beginner", "Intermediate", "Advanced", "Adaptive"}:
        preferred_difficulty = "Adaptive"

    learning_mode = str(_get("learning_mode", "Project-based")).strip()
    if learning_mode not in {"Project-based", "Theory-first", "Self-paced", "Cohort-based"}:
        learning_mode = "Project-based"

    return {
        "student_id": sid,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "college": college,
        "department": department,
        "degree": degree,
        "graduation_year": graduation_year,
        "cgpa": cgpa,
        "target_career_id": target_career_id,
        "weekly_learning_hours": weekly_hours,
        "preferred_difficulty": preferred_difficulty,
        "learning_mode": learning_mode,
    }


def sync_student_to_dataset(student_or_dict: Union[Student, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Synchronizes a student's non-sensitive profile record to all matching CSV dataset files.
    If the student ID exists, updates the record in-place; otherwise, appends it.
    Thread-safe with file-level mutex lock.
    """
    sanitized = sanitize_profile_dict(student_or_dict)
    target_id = sanitized["student_id"]
    target_email = sanitized["email"].lower()

    if not target_id:
        raise ValueError("Cannot synchronize student to dataset without a valid student_id.")

    paths = get_student_dataset_paths()
    if not paths:
        # If no dataset files exist yet, create default in settings.DATASET_DIR
        default_dir = settings.DATASET_DIR
        default_dir.mkdir(parents=True, exist_ok=True)
        default_path = default_dir / "11_student_profiles.csv"
        paths = [default_path]

    synced_files: List[str] = []

    with _dataset_lock:
        for path in paths:
            rows: List[Dict[str, Any]] = []
            header = STUDENT_CSV_COLUMNS
            found_idx = -1

            if path.exists():
                try:
                    with open(path, mode="r", encoding="utf-8-sig", newline="") as infile:
                        reader = csv.DictReader(infile)
                        if reader.fieldnames:
                            header = reader.fieldnames
                        for i, r in enumerate(reader):
                            sid = str(r.get("student_id", "")).strip()
                            sem = str(r.get("email", "")).strip().lower()
                            if sid == target_id or (target_email and sem == target_email):
                                found_idx = i
                            rows.append(r)
                except Exception as read_err:
                    print(f"[DatasetSync] Warning reading {path}: {read_err}")

            # Update or append
            clean_row = {col: sanitized.get(col, "") for col in STUDENT_CSV_COLUMNS}

            if found_idx >= 0:
                rows[found_idx] = clean_row
            else:
                rows.append(clean_row)

            # Write back safely
            try:
                temp_path = path.with_suffix(".tmp")
                with open(temp_path, mode="w", encoding="utf-8", newline="") as outfile:
                    writer = csv.DictWriter(outfile, fieldnames=STUDENT_CSV_COLUMNS, extrasaction="ignore")
                    writer.writeheader()
                    for r in rows:
                        writer.writerow({col: r.get(col, "") for col in STUDENT_CSV_COLUMNS})
                # Atomic replace
                temp_path.replace(path)
                synced_files.append(str(path))
            except Exception as write_err:
                print(f"[DatasetSync] Error writing dataset {path}: {write_err}")
                if temp_path.exists():
                    temp_path.unlink()

    return {
        "success": len(synced_files) > 0,
        "student_id": target_id,
        "email": sanitized["email"],
        "synced_files": synced_files,
    }
