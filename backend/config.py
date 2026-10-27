import os
from pathlib import Path

# Load .env if dotenv is installed
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()
except ImportError:
    pass

class Settings:
    PROJECT_NAME: str = "PathForge AI API"
    PROJECT_DESCRIPTION: str = "AI-Based Personalized Learning Roadmap and Career Skill Intelligence System"
    VERSION: str = "1.0.0"

    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pathforge_ai_super_secret_jwt_key_2026_change_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

    # CORS & Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Storage & directories
    BASE_DIR: Path = Path(__file__).resolve().parent
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    DATASET_DIR: Path = Path(os.getenv("DATASET_DIR", str(BASE_DIR.parent / "datasets"))).resolve()

    # Database: Use absolute path for sqlite default to prevent directory mismatch
    _default_db = f"sqlite:///{(BASE_DIR / 'data' / 'pathforge.db').as_posix()}"
    DATABASE_URL: str = os.getenv("DATABASE_URL", _default_db)
    if DATABASE_URL == "sqlite:///./data/pathforge.db":
        DATABASE_URL = _default_db

    # Optional AI integration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip("\"'")

    # Multi-source Evidence Weights (transparent & configurable)
    EVIDENCE_WEIGHTS = {
        "self_declared": 0.10,
        "resume": 0.15,
        "assessment": 0.35,
        "project": 0.20,
        "certificate": 0.10,
        "mentor": 0.10,
    }

    # Career Readiness Pillars (transparent formula)
    # 50% Skill Match, 30% Mastery, 20% Evidence
    READINESS_PILLARS = {
        "skill_match": 0.50,
        "mastery": 0.30,
        "evidence": 0.20,
    }

    # Email & SMTP Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@pathforge.ai")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    OTP_EXPIRY_MINUTES: int = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))
    OTP_RESEND_COOLDOWN_SECONDS: int = int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "60"))

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
