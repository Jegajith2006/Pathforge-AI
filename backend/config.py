import os
from pathlib import Path

_BASE_DIR = Path(__file__).resolve().parent
_ROOT_DIR = _BASE_DIR.parent
_root_env = _ROOT_DIR / ".env"
_backend_env = _BASE_DIR / ".env"
_last_mtime = {}


def _reload_env_if_changed() -> None:
    """Checks if backend/.env or root .env has been created or modified on disk and reloads them."""
    global _last_mtime
    try:
        from dotenv import load_dotenv
        changed = False
        for p in (_root_env, _backend_env):
            if p.is_file():
                current_mtime = p.stat().st_mtime
                if _last_mtime.get(p) != current_mtime:
                    _last_mtime[p] = current_mtime
                    changed = True
            elif p in _last_mtime:
                # File was removed
                del _last_mtime[p]
                changed = True

        if changed:
            if _root_env.is_file():
                load_dotenv(dotenv_path=_root_env, override=False)
            if _backend_env.is_file():
                load_dotenv(dotenv_path=_backend_env, override=True)
    except Exception as exc:
        logging.getLogger("pathforge.config").debug(f"Environment reload check note: {exc}")


# Initial environment load
_reload_env_if_changed()


class Settings:
    PROJECT_NAME: str = "PathForge AI API"
    PROJECT_DESCRIPTION: str = "AI-Based Personalized Learning Roadmap and Career Skill Intelligence System"
    VERSION: str = "1.0.0"

    # Environment & Security
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
    _DEFAULT_SECRET_FALLBACK: str = "pathforge_ai_super_secret_jwt_key_2026_change_in_production"
    SECRET_KEY: str = os.getenv("SECRET_KEY", _DEFAULT_SECRET_FALLBACK)
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

    def validate_security(self) -> None:
        """Validates security configuration without exposing or printing secret values."""
        if self.ENVIRONMENT in ("production", "prod"):
            if not os.getenv("SECRET_KEY") or self.SECRET_KEY == self._DEFAULT_SECRET_FALLBACK:
                raise RuntimeError(
                    "Production startup blocked: An explicit, cryptographically secure SECRET_KEY "
                    "environment variable is required in production. Default fallback secret is prohibited."
                )
            if len(self.SECRET_KEY) < 32:
                raise RuntimeError(
                    "Production startup blocked: SECRET_KEY must be at least 32 characters in length."
                )
        elif self.SECRET_KEY == self._DEFAULT_SECRET_FALLBACK:
            import logging
            logging.getLogger("pathforge.config").warning(
                "Running in development with fallback SECRET_KEY. In production, configure a strong SECRET_KEY."
            )

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

    # Dynamic Email & SMTP Settings with automatic .env reload on modification
    @property
    def SMTP_HOST(self) -> str:
        _reload_env_if_changed()
        return os.getenv("SMTP_HOST", "").strip().strip("\"'")

    @property
    def SMTP_PORT(self) -> int:
        _reload_env_if_changed()
        try:
            val = os.getenv("SMTP_PORT", "587").strip().strip("\"'")
            return int(val) if val else 587
        except (ValueError, TypeError):
            return 587

    @property
    def SMTP_USERNAME(self) -> str:
        _reload_env_if_changed()
        return os.getenv("SMTP_USERNAME", "").strip().strip("\"'")

    @property
    def SMTP_PASSWORD(self) -> str:
        _reload_env_if_changed()
        raw_pw = os.getenv("SMTP_PASSWORD", "").strip().strip("\"'")
        # For Gmail SMTP, if a user pastes a 16-character Google App Password with visual spaces,
        # strip internal spaces so smtplib authenticates cleanly.
        if "gmail" in self.SMTP_HOST.lower():
            no_spaces = raw_pw.replace(" ", "")
            if len(no_spaces) == 16:
                return no_spaces
        return raw_pw

    @property
    def SMTP_FROM_EMAIL(self) -> str:
        _reload_env_if_changed()
        custom = os.getenv("SMTP_FROM_EMAIL", "").strip().strip("\"'")
        return custom or self.SMTP_USERNAME or "noreply@pathforge.ai"

    @property
    def SMTP_USE_TLS(self) -> bool:
        _reload_env_if_changed()
        return os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    @property
    def SMTP_USE_SSL(self) -> bool:
        _reload_env_if_changed()
        return os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes") or self.SMTP_PORT == 465

    @property
    def SMTP_TIMEOUT_SECONDS(self) -> int:
        _reload_env_if_changed()
        try:
            return int(os.getenv("SMTP_TIMEOUT_SECONDS", "10"))
        except (ValueError, TypeError):
            return 10

    @property
    def OTP_EXPIRY_MINUTES(self) -> int:
        _reload_env_if_changed()
        try:
            return int(os.getenv("OTP_EXPIRY_MINUTES", "10"))
        except (ValueError, TypeError):
            return 10

    @property
    def OTP_RESEND_COOLDOWN_SECONDS(self) -> int:
        _reload_env_if_changed()
        try:
            return int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "60"))
        except (ValueError, TypeError):
            return 60

    @property
    def ALLOW_DEV_EMAIL_FALLBACK(self) -> bool:
        _reload_env_if_changed()
        return os.getenv("ALLOW_DEV_EMAIL_FALLBACK", "false").lower() in ("true", "1", "yes")

    def get_missing_smtp_settings(self) -> list:
        """Returns list of required SMTP configuration keys that are missing or empty."""
        _reload_env_if_changed()
        missing = []
        if not self.SMTP_HOST:
            missing.append("SMTP_HOST")
        if not self.SMTP_PORT:
            missing.append("SMTP_PORT")
        if not self.SMTP_USERNAME:
            missing.append("SMTP_USERNAME")
        if not self.SMTP_PASSWORD:
            missing.append("SMTP_PASSWORD")
        return missing

    def reload(self) -> None:
        """Dynamically forces reload of environment variables from backend/.env and root .env."""
        global _last_mtime
        _last_mtime.clear()
        _reload_env_if_changed()


settings = Settings()
settings.validate_security()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
