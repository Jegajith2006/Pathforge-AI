from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, model_validator


class StudentRegisterRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: Optional[str] = None
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = 2026
    cgpa: Optional[float] = None
    target_career_id: Optional[str] = None
    weekly_learning_hours: Optional[int] = 12
    preferred_difficulty: Optional[str] = "Adaptive"
    learning_mode: Optional[str] = "Project-based"
    terms_agreed: bool = True

    @model_validator(mode="before")
    @classmethod
    def handle_name_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            fn = values.get("first_name")
            ln = values.get("last_name")
            nm = values.get("name")
            if nm and (not fn or not ln):
                parts = str(nm).strip().split(maxsplit=1)
                if not fn:
                    values["first_name"] = parts[0] if parts else "Student"
                if not ln:
                    values["last_name"] = parts[1] if len(parts) > 1 else "User"
            elif not fn and not ln:
                values["first_name"] = "Student"
                values["last_name"] = "User"
        return values


class MentorRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    title: str = Field(..., min_length=2)
    experience_years: int = Field(default=5, ge=0)
    expertise_areas: List[str] = Field(default_factory=list)
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    verification_document: Optional[str] = None
    verification_notes: Optional[str] = None
    bio: Optional[str] = None
    terms_agreed: bool = True
    auto_approve: Optional[bool] = False


class VerifyEmailRequest(BaseModel):
    challenge_id: Optional[str] = None
    email: Optional[str] = None
    otp: str = Field(..., min_length=4, max_length=10)


class ResendVerificationRequest(BaseModel):
    challenge_id: Optional[str] = None
    email: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetOtpRequest(BaseModel):
    challenge_id: Optional[str] = None
    email: Optional[str] = None
    otp: str = Field(..., min_length=4, max_length=10)


class ResetPasswordRequest(BaseModel):
    challenge_id: Optional[str] = None
    reset_token: Optional[str] = None
    email: Optional[str] = None
    new_password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None


class ChallengeResponse(BaseModel):
    status: str
    challenge_id: Optional[str] = None
    email: str
    message: str
    expires_in_minutes: int = 10


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    student_id: Optional[str] = None
    mentor_id: Optional[str] = None
    role: str
    email: str
    name: str


class AdminUserSummary(BaseModel):
    user_id: str
    full_name: str
    email: str
    role: str
    is_verified: bool
    account_status: str
    created_at: str
    last_login_at: Optional[str] = None
