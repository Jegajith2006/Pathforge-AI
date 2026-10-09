"""
PathForge AI Model & Intelligence Layer Configuration
Centralized thresholds, weights, and model definitions for deterministic scoring,
evidence calibration, and neural embedding calculations.
"""

from pathlib import Path

# Project-relative model paths (No hardcoded absolute user directories)
BASE_ML_DIR: Path = Path(__file__).resolve().parent
LOCAL_MODEL_DIR: Path = BASE_ML_DIR / "models" / "bge-small-en-v1.5"

# Primary Hugging Face model identifier
HF_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"


def is_model_local() -> bool:
    """Returns True if local model files exist and are ready for offline loading."""
    config_file = LOCAL_MODEL_DIR / "config.json"
    modules_file = LOCAL_MODEL_DIR / "modules.json"
    return LOCAL_MODEL_DIR.exists() and config_file.exists() and modules_file.exists()


def get_model_path() -> str:
    """
    Returns project-relative local model directory if available,
    otherwise falls back to Hugging Face model repository identifier.
    """
    if is_model_local():
        return str(LOCAL_MODEL_DIR)
    return HF_MODEL_NAME


# Runtime embedding model path/name (loads from backend/ml/models/bge-small-en-v1.5/ when downloaded)
EMBEDDING_MODEL: str = get_model_path()
EMBEDDING_DIMENSION: int = 384

# Similarity thresholds
SIMILARITY_THRESHOLD: float = 0.65
RESUME_SIMILARITY_THRESHOLD: float = 0.60
JOB_MATCH_SIMILARITY_THRESHOLD: float = 0.60

# Skill Level Thresholds (Configurable)
# 0-39: Beginner, 40-69: Developing, 70-84: Proficient, 85-100: Advanced
BEGINNER_MAX: int = 39
DEVELOPING_MAX: int = 69
PROFICIENT_MAX: int = 84
ADVANCED_MIN: int = 85

# Multi-Source Demonstrated Evidence Weights (Sum to 1.00)
WEIGHT_SELF_DECLARED: float = 0.10
WEIGHT_RESUME: float = 0.15
WEIGHT_ASSESSMENT: float = 0.35
WEIGHT_PROJECT: float = 0.20
WEIGHT_CERTIFICATE: float = 0.10
WEIGHT_MENTOR: float = 0.10

EVIDENCE_WEIGHTS = {
    "self_declared": WEIGHT_SELF_DECLARED,
    "resume": WEIGHT_RESUME,
    "assessment": WEIGHT_ASSESSMENT,
    "project": WEIGHT_PROJECT,
    "certificate": WEIGHT_CERTIFICATE,
    "mentor": WEIGHT_MENTOR,
}

# Combined Career Matching Weights (Sum to 1.00)
WEIGHT_SEMANTIC_MATCH: float = 0.40
WEIGHT_SKILL_MATCH: float = 0.60

# Priority Calculation Weights (Sum to 1.00)
WEIGHT_PRIORITY_GAP: float = 0.60
WEIGHT_PRIORITY_IMPORTANCE: float = 0.25
WEIGHT_PRIORITY_CAREER_WEIGHT: float = 0.15

# Career Readiness Indicator Pillars (Sum to 1.00)
READINESS_SKILL_MATCH_WEIGHT: float = 0.50
READINESS_MASTERY_WEIGHT: float = 0.30
READINESS_EVIDENCE_WEIGHT: float = 0.20

# Standard qualitative target scores for required levels
LEVEL_TARGET_SCORES = {
    "beginner": 35,
    "developing": 55,
    "intermediate": 70,
    "proficient": 80,
    "advanced": 90,
}


def required_level_to_numeric(level: any) -> int:
    """Convert qualitative level string or numeric value to target score 0-100."""
    if isinstance(level, (int, float)):
        return max(0, min(100, int(level)))
    s = str(level).strip().lower()
    return LEVEL_TARGET_SCORES.get(s, 70)
