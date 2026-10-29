import os
import sys
import csv
import tempfile
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.dataset_sync_service import (
    sanitize_csv_formula_injection,
    sanitize_student_dict,
    sanitize_mentor_dict,
    sync_student_to_dataset,
    sync_mentor_to_dataset,
    STUDENT_CSV_COLUMNS,
    MENTOR_CSV_COLUMNS,
)
from database.seed import reset_database


def test_01_formula_injection_defense():
    """Verify dangerous formula prefixes are safely neutralized with a leading single quote."""
    dangerous_inputs = [
        ("=cmd|' /C calc'!A0", "'=cmd|' /C calc'!A0"),
        ("+123456789", "'+123456789"),
        ("-SUM(A1:A10)", "'-SUM(A1:A10)"),
        ("@HYPERLINK('http://malicious.com')", "'@HYPERLINK('http://malicious.com')"),
        ("\tTabbedAttack", "'\tTabbedAttack"),
        ("\rReturnAttack", "'\rReturnAttack"),
        ("  =IndentedFormula", "'  =IndentedFormula"),
        ("Normal Name", "Normal Name"),
        ("name@example.com", "name@example.com"),
        ("'+AlreadyEscaped", "'+AlreadyEscaped"),
        (12345, 12345),
        (8.5, 8.5),
        (True, True),
        (None, ""),
    ]

    for raw, expected in dangerous_inputs:
        sanitized = sanitize_csv_formula_injection(raw)
        assert sanitized == expected, f"Failed for input {raw!r}: got {sanitized!r}, expected {expected!r}"


def test_02_student_sanitization_excludes_secrets():
    """Verify sanitize_student_dict strictly ignores passwords, hashes, and tokens."""
    payload = {
        "student_id": "U9999",
        "first_name": "Test",
        "last_name": "User",
        "email": "test.user@example.com",
        "password": "PlaintextPassword123!",
        "hashed_password": "$2b$12$somehashedpasswordstringgoeshere",
        "access_token": "secret_jwt_token",
        "otp": "123456",
        "refresh_token": "refresh_xyz",
    }
    sanitized = sanitize_student_dict(payload)
    for col in ["password", "hashed_password", "access_token", "otp", "refresh_token"]:
        assert col not in sanitized
    assert sanitized["student_id"] == "U9999"
    assert sanitized["email"] == "test.user@example.com"


def test_03_mentor_sanitization_excludes_secrets():
    """Verify sanitize_mentor_dict strictly ignores passwords, hashes, and tokens."""
    payload = {
        "mentor_id": "M9999",
        "name": "Dr. Mentor",
        "email": "mentor.test@example.com",
        "password": "MentorPassword123!",
        "hashed_password": "$2b$12$somehashedpasswordstringgoeshere",
        "token": "secret_token",
    }
    sanitized = sanitize_mentor_dict(payload)
    for col in ["password", "hashed_password", "token"]:
        assert col not in sanitized
    assert sanitized["mentor_id"] == "M9999"
    assert sanitized["email"] == "mentor.test@example.com"


def test_04_idempotent_student_sync_and_deduplication(monkeypatch, tmp_path):
    """Verify sync_student_to_dataset is strictly idempotent and deduplicates matching rows."""
    fake_csv = tmp_path / "students.csv"
    # Seed with existing duplicates
    with open(fake_csv, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=STUDENT_CSV_COLUMNS)
        writer.writeheader()
        writer.writerow({"student_id": "U1057", "first_name": "FirstCopy", "email": "unique@example.com"})
        writer.writerow({"student_id": "U1057", "first_name": "SecondDuplicate", "email": "unique@example.com"})
        writer.writerow({"student_id": "U001", "first_name": "Alex", "email": "alex.chen@example.com"})

    monkeypatch.setattr(
        "services.dataset_sync_service.get_student_dataset_paths",
        lambda: [fake_csv],
    )

    student_update = {
        "student_id": "U1057",
        "first_name": "=InjectedName",
        "last_name": "Verified",
        "email": "unique@example.com",
        "college": "+MaliciousCollege",
        "target_career_id": "C001",
    }

    # First sync
    res1 = sync_student_to_dataset(student_update)
    assert res1["success"] is True

    # Read back rows
    with open(fake_csv, mode="r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    # Should have deduplicated U1057 down to 1 row, plus Alex Chen = 2 rows total
    assert len(rows) == 2
    u1057_rows = [r for r in rows if r["student_id"] == "U1057"]
    assert len(u1057_rows) == 1
    # Check formula injection was sanitized
    assert u1057_rows[0]["first_name"] == "'=InjectedName"
    assert u1057_rows[0]["college"] == "'+MaliciousCollege"

    # Second sync (idempotency check)
    res2 = sync_student_to_dataset(student_update)
    assert res2["success"] is True

    with open(fake_csv, mode="r", encoding="utf-8") as f:
        rows_after = list(csv.DictReader(f))
    assert len(rows_after) == 2


def test_05_idempotent_mentor_sync_and_deduplication(monkeypatch, tmp_path):
    """Verify sync_mentor_to_dataset is strictly idempotent and deduplicates matching rows."""
    fake_csv = tmp_path / "mentors.csv"
    with open(fake_csv, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=MENTOR_CSV_COLUMNS)
        writer.writeheader()
        writer.writerow({"mentor_id": "M880", "name": "Copy1", "email": "m880@example.com"})
        writer.writerow({"mentor_id": "M880", "name": "Copy2", "email": "m880@example.com"})
        writer.writerow({"mentor_id": "M001", "name": "Dr. Arun Kumar", "email": "arun.kumar@pathforge.ai"})

    monkeypatch.setattr(
        "services.dataset_sync_service.get_mentor_dataset_paths",
        lambda: [fake_csv],
    )

    mentor_update = {
        "mentor_id": "M880",
        "name": "@InjectedMentor",
        "email": "m880@example.com",
        "title": "Principal Architect",
    }

    res1 = sync_mentor_to_dataset(mentor_update)
    assert res1["success"] is True

    with open(fake_csv, mode="r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    assert len(rows) == 2
    m880_rows = [r for r in rows if r["mentor_id"] == "M880"]
    assert len(m880_rows) == 1
    assert m880_rows[0]["name"] == "'@InjectedMentor"

    res2 = sync_mentor_to_dataset(mentor_update)
    assert res2["success"] is True
    with open(fake_csv, mode="r", encoding="utf-8") as f:
        rows_after = list(csv.DictReader(f))
    assert len(rows_after) == 2


def test_06_database_reset_safeguard():
    """Verify reset_database blocks execution unless ALLOW_DATABASE_RESET=1 is explicitly set."""
    if "ALLOW_DATABASE_RESET" in os.environ:
        del os.environ["ALLOW_DATABASE_RESET"]

    with pytest.raises(RuntimeError, match="CRITICAL SAFEGUARD: Database reset is blocked"):
        reset_database()
