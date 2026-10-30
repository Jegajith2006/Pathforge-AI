import time
"""
PathForge AI - Dataset Synchronization Service
Ensures bidirectional consistency between the SQLAlchemy database and CSV datasets.
Whenever a new student or mentor registers or updates their profile, non-sensitive profile details
are synchronized to datasets/students.csv and datasets/mentors.csv (as well as canonical seed datasets)
using atomic file replacement and thread-safe mutex locks.
Passwords, password hashes, OTPs, and authentication secrets are strictly excluded.
"""

import os
import csv
import re
import threading
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Set, Union
from sqlalchemy.orm import Session
from sqlalchemy import func

from config import settings
from database.models import Student, Mentor

logger = logging.getLogger("pathforge.dataset_sync")

# Mutex for thread-safe file operations
_dataset_lock = threading.Lock()

# Non-sensitive CSV column schema matching datasets/students.csv exactly
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

# Non-sensitive CSV column schema matching datasets/mentors.csv exactly
MENTOR_CSV_COLUMNS = [
    "mentor_id",
    "name",
    "email",
    "title",
    "company",
    "expertise",
    "experience_years",
    "skills",
    "bio",
    "availability",
    "rating",
]

# High-water mark for retired IDs to prevent reuse of test artifacts
RETIRED_STUDENT_ID_HIGH_WATER_MARK = 1056
RETIRED_MENTOR_ID_HIGH_WATER_MARK = 878


def get_student_dataset_paths() -> List[Path]:
    """
    Locates all candidate student profile CSV files in the workspace.
    Covers 'students.csv', '11_student_profiles.csv', and 'student_profiles.csv'.
    """
    search_dirs = [
        settings.DATASET_DIR,
        settings.BASE_DIR.parent / "datasets",
        settings.BASE_DIR / "datasets",
        Path.cwd() / "datasets",
        Path.cwd().parent / "datasets",
    ]
    target_names = ["students.csv", "11_student_profiles.csv", "student_profiles.csv"]
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

    # If students.csv does not exist yet, default it in settings.DATASET_DIR
    if not any(p.name == "students.csv" for p in found_paths):
        default_path = (settings.DATASET_DIR / "students.csv").resolve()
        found_paths.append(default_path)

    return found_paths


def get_mentor_dataset_paths() -> List[Path]:
    """
    Locates all candidate mentor profile CSV files in the workspace.
    Covers 'mentors.csv', '17_mentor_profiles.csv', and 'mentor_profiles.csv'.
    """
    search_dirs = [
        settings.DATASET_DIR,
        settings.BASE_DIR.parent / "datasets",
        settings.BASE_DIR / "datasets",
        Path.cwd() / "datasets",
        Path.cwd().parent / "datasets",
    ]
    target_names = ["mentors.csv", "17_mentor_profiles.csv", "mentor_profiles.csv"]
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

    # If mentors.csv does not exist yet, default it in settings.DATASET_DIR
    if not any(p.name == "mentors.csv" for p in found_paths):
        default_path = (settings.DATASET_DIR / "mentors.csv").resolve()
        found_paths.append(default_path)

    return found_paths


def get_existing_student_ids(db: Optional[Session] = None) -> Set[str]:
    """Gathers all student IDs from both the active database and CSV datasets."""
    student_ids: Set[str] = set()

    # 1. From database
    if db is not None:
        try:
            db_ids = db.query(Student.student_id).all()
            for (sid,) in db_ids:
                if sid:
                    student_ids.add(str(sid).strip())
        except Exception as e:
            logger.warning(f"Error reading student IDs from database: {e}")

    # 2. From CSV files
    for path in get_student_dataset_paths():
        if not path.exists():
            continue
        try:
            with open(path, mode="r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sid = row.get("student_id")
                    if sid:
                        student_ids.add(str(sid).strip())
        except Exception as e:
            logger.warning(f"Error reading student IDs from {path}: {e}")

    return student_ids


def get_existing_mentor_ids(db: Optional[Session] = None) -> Set[str]:
    """Gathers all mentor IDs from both the active database and CSV datasets."""
    mentor_ids: Set[str] = set()

    # 1. From database
    if db is not None:
        try:
            db_ids = db.query(Mentor.mentor_id).all()
            for (mid,) in db_ids:
                if mid:
                    mentor_ids.add(str(mid).strip())
        except Exception as e:
            logger.warning(f"Error reading mentor IDs from database: {e}")

    # 2. From CSV files
    for path in get_mentor_dataset_paths():
        if not path.exists():
            continue
        try:
            with open(path, mode="r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    mid = row.get("mentor_id")
                    if mid:
                        mentor_ids.add(str(mid).strip())
        except Exception as e:
            logger.warning(f"Error reading mentor IDs from {path}: {e}")

    return mentor_ids


def generate_next_student_id(db: Optional[Session] = None) -> str:
    """
    Generates a unique, strictly monotonic student ID in the format 'U{number:03d}'.
    Enforces a high-water mark (>= 1056) to ensure retired test IDs cannot be reused.
    """
    existing_ids = get_existing_student_ids(db)
    max_num = RETIRED_STUDENT_ID_HIGH_WATER_MARK

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

    while candidate_id in existing_ids:
        next_num += 1
        candidate_id = f"U{next_num:03d}"

    return candidate_id


def generate_next_mentor_id(db: Optional[Session] = None) -> str:
    """
    Generates a unique, strictly monotonic mentor ID in the format 'M{number:03d}'.
    Enforces a high-water mark (>= 878) to ensure retired test IDs cannot be reused.
    """
    existing_ids = get_existing_mentor_ids(db)
    max_num = RETIRED_MENTOR_ID_HIGH_WATER_MARK

    id_pattern = re.compile(r"^M(\d+)$", re.IGNORECASE)
    for mid in existing_ids:
        match = id_pattern.match(mid)
        if match:
            try:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num
            except ValueError:
                continue

    next_num = max_num + 1
    candidate_id = f"M{next_num:03d}"

    while candidate_id in existing_ids:
        next_num += 1
        candidate_id = f"M{next_num:03d}"

    return candidate_id


def sanitize_csv_formula_injection(val: Any) -> Any:
    """
    Guards CSV cell values against CSV/formula injection (CWE-1236).
    If a string starts with '=', '+', '-', '@', '\t', or '\r',
    or starts with spaces followed by '=', '+', '-', '@',
    it is prepended with a single quote to force spreadsheet programs
    to treat the cell strictly as literal text rather than an executable formula.
    """
    if val is None:
        return ""
    if isinstance(val, (int, float, bool)):
        return val
    s = str(val)
    if not s:
        return ""
    if s.startswith("'"):
        return s
    if s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + s
    space_stripped = s.lstrip(" ")
    if space_stripped and space_stripped[0] in ("=", "+", "-", "@"):
        return "'" + s
    return s


def sanitize_student_dict(data: Union[Student, Dict[str, Any]]) -> Dict[str, Any]:
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


def sanitize_mentor_dict(data: Union[Mentor, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extracts and validates non-sensitive mentor profile attributes matching the CSV schema.
    Strictly excludes passwords, hashed credentials, and sensitive tokens.
    """
    def _get(key, default=""):
        if isinstance(data, dict):
            val = data.get(key, default)
        else:
            val = getattr(data, key, default)
        return val if val is not None else default

    mid = str(_get("mentor_id", "")).strip()
    name = str(_get("name", "")).strip()
    email = str(_get("email", "")).strip().lower()
    title = str(_get("title", "Principal Mentor")).strip()
    company = str(_get("company", "PathForge Network")).strip()
    expertise = str(_get("expertise", title)).strip()

    try:
        experience_years = int(_get("experience_years", 5))
    except (ValueError, TypeError):
        experience_years = 5

    skills = str(_get("skills", expertise)).strip()
    bio = str(_get("bio", f"{title} with {experience_years} years experience.")).strip()
    availability = str(_get("availability", "Available")).strip()

    try:
        rating = round(float(_get("rating", 5.0)), 2)
    except (ValueError, TypeError):
        rating = 5.0

    return {
        "mentor_id": mid,
        "name": name,
        "email": email,
        "title": title,
        "company": company,
        "expertise": expertise,
        "experience_years": experience_years,
        "skills": skills,
        "bio": bio,
        "availability": availability,
        "rating": rating,
    }


def sync_student_to_dataset(student_or_dict: Union[Student, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Synchronizes a student's non-sensitive profile record to target CSV datasets.
    Thread-safe with file mutex lock and thread-unique atomic temp file replace.
    Strictly excludes plaintext passwords, hashes, and tokens.
    Guarantees idempotency and eliminates duplicate rows for the same ID or email.
    Sanitizes all fields against CSV formula injection.
    """
    sanitized = sanitize_student_dict(student_or_dict)
    target_id = sanitized["student_id"]
    target_email = sanitized["email"].lower()

    if not target_id:
        raise ValueError("Cannot synchronize student to dataset without a valid student_id.")

    paths = get_student_dataset_paths()
    synced_files: List[str] = []

    clean_row = {col: sanitize_csv_formula_injection(sanitized.get(col, "")) for col in STUDENT_CSV_COLUMNS}

    with _dataset_lock:
        for path in paths:
            rows: List[Dict[str, Any]] = []
            found_idx = -1

            if path.exists():
                try:
                    with open(path, mode="r", encoding="utf-8-sig", newline="") as infile:
                        reader = csv.DictReader(infile)
                        for r in reader:
                            sid = str(r.get("student_id", "")).strip()
                            sem = str(r.get("email", "")).strip().lower()
                            if sid == target_id or (target_email and sem == target_email):
                                if found_idx == -1:
                                    found_idx = len(rows)
                                    rows.append(clean_row)
                                else:
                                    # Drop subsequent duplicate rows
                                    continue
                            else:
                                sanitized_existing = {k: sanitize_csv_formula_injection(v) for k, v in r.items()}
                                rows.append(sanitized_existing)
                except Exception as read_err:
                    logger.warning(f"Error reading dataset {path}: {read_err}")

            if found_idx == -1:
                rows.append(clean_row)

            # Atomic write via thread-safe unique temp file
            tid = threading.get_ident()
            temp_path = path.with_name(f"{path.stem}_{os.getpid()}_{tid}_{time.time_ns()}.tmp")
            try:
                path.parent.mkdir(parents=True, exist_ok=True)
                with open(temp_path, mode="w", encoding="utf-8", newline="") as outfile:
                    writer = csv.DictWriter(outfile, fieldnames=STUDENT_CSV_COLUMNS, extrasaction="ignore")
                    writer.writeheader()
                    for r in rows:
                        writer.writerow({col: r.get(col, "") for col in STUDENT_CSV_COLUMNS})
                temp_path.replace(path)
                synced_files.append(str(path))
            except Exception as write_err:
                logger.error(f"Error writing dataset {path}: {write_err}")
            finally:
                if temp_path.exists():
                    try:
                        temp_path.unlink()
                    except Exception as unlink_err:
                        logger.debug(f"Temporary file unlink note for {temp_path}: {unlink_err}")

    return {
        "success": len(synced_files) > 0,
        "student_id": target_id,
        "email": sanitized["email"],
        "synced_files": synced_files,
    }


def sync_mentor_to_dataset(mentor_or_dict: Union[Mentor, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Synchronizes a mentor's non-sensitive profile record to target CSV datasets.
    Thread-safe with file mutex lock and thread-unique atomic temp file replace.
    Strictly excludes plaintext passwords, hashes, and tokens.
    Guarantees idempotency and eliminates duplicate rows for the same ID or email.
    Sanitizes all fields against CSV formula injection.
    """
    sanitized = sanitize_mentor_dict(mentor_or_dict)
    target_id = sanitized["mentor_id"]
    target_email = sanitized["email"].lower()

    if not target_id:
        raise ValueError("Cannot synchronize mentor to dataset without a valid mentor_id.")

    paths = get_mentor_dataset_paths()
    synced_files: List[str] = []

    clean_row = {col: sanitize_csv_formula_injection(sanitized.get(col, "")) for col in MENTOR_CSV_COLUMNS}

    with _dataset_lock:
        for path in paths:
            rows: List[Dict[str, Any]] = []
            found_idx = -1

            if path.exists():
                try:
                    with open(path, mode="r", encoding="utf-8-sig", newline="") as infile:
                        reader = csv.DictReader(infile)
                        for r in reader:
                            mid = str(r.get("mentor_id", "")).strip()
                            mem = str(r.get("email", "")).strip().lower()
                            if mid == target_id or (target_email and mem == target_email):
                                if found_idx == -1:
                                    found_idx = len(rows)
                                    rows.append(clean_row)
                                else:
                                    # Drop subsequent duplicate rows
                                    continue
                            else:
                                sanitized_existing = {k: sanitize_csv_formula_injection(v) for k, v in r.items()}
                                rows.append(sanitized_existing)
                except Exception as read_err:
                    logger.warning(f"Error reading dataset {path}: {read_err}")

            if found_idx == -1:
                rows.append(clean_row)

            # Atomic write via thread-safe unique temp file
            tid = threading.get_ident()
            temp_path = path.with_name(f"{path.stem}_{os.getpid()}_{tid}_{time.time_ns()}.tmp")
            try:
                path.parent.mkdir(parents=True, exist_ok=True)
                with open(temp_path, mode="w", encoding="utf-8", newline="") as outfile:
                    writer = csv.DictWriter(outfile, fieldnames=MENTOR_CSV_COLUMNS, extrasaction="ignore")
                    writer.writeheader()
                    for r in rows:
                        writer.writerow({col: r.get(col, "") for col in MENTOR_CSV_COLUMNS})
                temp_path.replace(path)
                synced_files.append(str(path))
            except Exception as write_err:
                logger.error(f"Error writing dataset {path}: {write_err}")
            finally:
                if temp_path.exists():
                    try:
                        temp_path.unlink()
                    except Exception as unlink_err:
                        logger.debug(f"Temporary file unlink note for {temp_path}: {unlink_err}")

    return {
        "success": len(synced_files) > 0,
        "mentor_id": target_id,
        "email": sanitized["email"],
        "synced_files": synced_files,
    }
