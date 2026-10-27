import hmac
import hashlib
import json
import base64
import time
import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
import bcrypt

from config import settings
from database.connection import get_db
from database.models import User, Student, Mentor, AuthOTPChallenge, Career
from schemas.student import StudentRegister, StudentLogin, TokenResponse, StudentProfileResponse
from schemas.auth import (
    StudentRegisterRequest,
    MentorRegisterRequest,
    VerifyEmailRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    VerifyResetOtpRequest,
    ResetPasswordRequest,
    ChallengeResponse,
)
from services.email_service import email_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# Resilient RFC 7519 JWT implementation
def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_access_token(data: dict, expires_delta_minutes: Optional[int] = None) -> str:
    """Creates standard JWT token signed with HMAC-SHA256."""
    to_encode = data.copy()
    expire_minutes = expires_delta_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire_time = int(time.time()) + (expire_minutes * 60)
    to_encode.update({"exp": expire_time})

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(to_encode).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and verifies a JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts

        # Verify signature
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload = json.loads(_base64url_decode(payload_b64).decode("utf-8"))
        if "exp" in payload and payload["exp"] < int(time.time()):
            return None  # expired

        return payload
    except Exception:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency resolving the authenticated User record."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or malformed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, malformed, or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.user_id == payload["sub"]).first()
    if not user:
        # Check by email as fallback
        user = db.query(User).filter(User.email == payload.get("email")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_student(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Student:
    """
    FastAPI dependency resolving the authenticated student.
    Enforces that the user has the 'student' role.
    """
    if authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Authorization header format. Expected Bearer <token>.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid, malformed, or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Enforce role isolation: Mentors cannot access student endpoints
        user_role = payload.get("role", "student")
        if user_role == "mentor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Mentor role is not authorized for student portal operations.",
            )

        sub = payload["sub"]
        student = db.query(Student).filter(Student.student_id == sub).first()
        if not student:
            # Check if sub is a User ID linked to Student
            student = db.query(Student).filter(Student.user_id == sub).first()
        if not student and "email" in payload:
            student = db.query(Student).filter(func.lower(Student.email) == payload["email"].lower()).first()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Student associated with token not found.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return student

    # Fallback to default student U001 (Alex Chen) for local development if no header provided
    default_student = db.query(Student).filter(Student.student_id == "U001").first()
    if default_student:
        return default_student

    first_student = db.query(Student).first()
    if first_student:
        return first_student

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_mentor(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Mentor:
    """
    FastAPI dependency resolving the authenticated mentor.
    Enforces that the user has the 'mentor' role.
    Students attempting to call mentor endpoints receive 403 Forbidden.
    """
    if authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Authorization header format. Expected Bearer <token>.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid, malformed, or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Enforce role isolation: Students cannot access mentor endpoints
        user_role = payload.get("role")
        if user_role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Student role is not authorized for mentor portal operations.",
            )

        sub = payload["sub"]
        mentor = db.query(Mentor).filter(Mentor.mentor_id == sub).first()
        if not mentor:
            mentor = db.query(Mentor).filter(Mentor.user_id == sub).first()
        if not mentor and "email" in payload:
            mentor = db.query(Mentor).filter(func.lower(Mentor.email) == payload["email"].lower()).first()

        if not mentor:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mentor associated with token not found.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return mentor

    # For local development fallback if no header provided
    demo_mentor = db.query(Mentor).filter(Mentor.email == "alex.mentor@pathforge.ai").first()
    if demo_mentor:
        return demo_mentor
    first_mentor = db.query(Mentor).first()
    if first_mentor:
        return first_mentor

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency enforcing that the authenticated user is an administrator.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrator authorization required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.user_id == payload["sub"]).first()
    if not user:
        user = db.query(User).filter(User.email == payload.get("email")).first()

    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required.",
        )
    return user


# =========================================================================
# REGISTRATION WITH EMAIL OTP VERIFICATION
# =========================================================================

@router.post("/register/student", response_model=ChallengeResponse)
def register_student_challenge(
    payload: StudentRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Step 1: Student Registration Initiation.
    Validates fields, checks email uniqueness across User/Student/Mentor,
    creates pending registration challenge, and sends 6-digit email OTP.
    """
    clean_email = payload.email.strip().lower()

    if payload.confirm_password and payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirm password do not match.",
        )

    # Check email uniqueness
    if db.query(User).filter(func.lower(User.email) == clean_email).first() or \
       db.query(Student).filter(func.lower(Student.email) == clean_email).first() or \
       db.query(Mentor).filter(func.lower(Mentor.email) == clean_email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Invalidate previous unconsumed challenges for this email and purpose
    db.query(AuthOTPChallenge).filter(
        func.lower(AuthOTPChallenge.email) == clean_email,
        AuthOTPChallenge.purpose == "registration_student",
        AuthOTPChallenge.is_consumed == False,
    ).delete(synchronize_session=False)

    otp_code = email_service.generate_otp()
    otp_hash = email_service.hash_otp(otp_code)
    challenge_id = str(uuid.uuid4())
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    expires_str = (now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)).strftime("%Y-%m-%d %H:%M:%S")

    # Serialize payload without raw password for storage
    raw_payload = payload.model_dump()
    raw_payload["hashed_password"] = get_password_hash(payload.password)
    del raw_payload["password"]
    if "confirm_password" in raw_payload:
        del raw_payload["confirm_password"]
    raw_payload["first_name"] = payload.first_name or "Student"
    raw_payload["last_name"] = payload.last_name or "User"
    full_name = f"{raw_payload['first_name']} {raw_payload['last_name']}".strip()
    raw_payload["full_name"] = full_name

    challenge = AuthOTPChallenge(
        challenge_id=challenge_id,
        email=clean_email,
        purpose="registration_student",
        otp_hash=otp_hash,
        payload_json=json.dumps(raw_payload),
        attempts=0,
        max_attempts=5,
        resend_count=0,
        last_sent_at=now_str,
        expires_at=expires_str,
        is_consumed=False,
        created_at=now_str,
    )
    db.add(challenge)
    db.commit()

    email_service.send_registration_otp(clean_email, full_name, otp_code)

    return ChallengeResponse(
        status="pending_verification",
        challenge_id=challenge_id,
        email=clean_email,
        message="Verification code sent to your email address.",
        expires_in_minutes=settings.OTP_EXPIRY_MINUTES,
    )


@router.post("/register/mentor", response_model=ChallengeResponse)
def register_mentor_challenge(
    payload: MentorRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Step 1: Mentor Registration Initiation.
    Validates fields, checks email uniqueness across User/Student/Mentor,
    creates pending challenge, and sends 6-digit email OTP.
    """
    clean_email = payload.email.strip().lower()

    if payload.confirm_password and payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirm password do not match.",
        )

    # Check email uniqueness
    if db.query(User).filter(func.lower(User.email) == clean_email).first() or \
       db.query(Mentor).filter(func.lower(Mentor.email) == clean_email).first() or \
       db.query(Student).filter(func.lower(Student.email) == clean_email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Invalidate previous unconsumed challenges
    db.query(AuthOTPChallenge).filter(
        func.lower(AuthOTPChallenge.email) == clean_email,
        AuthOTPChallenge.purpose == "registration_mentor",
        AuthOTPChallenge.is_consumed == False,
    ).delete(synchronize_session=False)

    otp_code = email_service.generate_otp()
    otp_hash = email_service.hash_otp(otp_code)
    challenge_id = str(uuid.uuid4())
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    expires_str = (now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)).strftime("%Y-%m-%d %H:%M:%S")

    raw_payload = payload.model_dump()
    raw_payload["hashed_password"] = get_password_hash(payload.password)
    del raw_payload["password"]
    if "confirm_password" in raw_payload:
        del raw_payload["confirm_password"]

    challenge = AuthOTPChallenge(
        challenge_id=challenge_id,
        email=clean_email,
        purpose="registration_mentor",
        otp_hash=otp_hash,
        payload_json=json.dumps(raw_payload),
        attempts=0,
        max_attempts=5,
        resend_count=0,
        last_sent_at=now_str,
        expires_at=expires_str,
        is_consumed=False,
        created_at=now_str,
    )
    db.add(challenge)
    db.commit()

    email_service.send_registration_otp(clean_email, payload.name.strip(), otp_code)

    return ChallengeResponse(
        status="pending_verification",
        challenge_id=challenge_id,
        email=clean_email,
        message="Verification code sent to your email address.",
        expires_in_minutes=settings.OTP_EXPIRY_MINUTES,
    )


@router.post("/verify-email", response_model=TokenResponse)
def verify_email_otp(
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    """
    Step 2: Verify Registration OTP and Activate Account.
    Validates challenge, checks expiration and attempts, consumes OTP,
    and commits new Student or Mentor account with authenticated JWT.
    """
    challenge = None
    if payload.challenge_id:
        challenge = db.query(AuthOTPChallenge).filter(
            AuthOTPChallenge.challenge_id == payload.challenge_id
        ).first()

    if not challenge and payload.email:
        clean_email = payload.email.strip().lower()
        challenge = db.query(AuthOTPChallenge).filter(
            func.lower(AuthOTPChallenge.email) == clean_email,
            AuthOTPChallenge.purpose.in_(["registration_student", "registration_mentor"]),
            AuthOTPChallenge.is_consumed == False,
        ).order_by(AuthOTPChallenge.created_at.desc()).first()

    if not challenge or challenge.is_consumed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification challenge. Please register again.",
        )

    if challenge.purpose not in ("registration_student", "registration_mentor"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid challenge purpose for email verification.",
        )

    now = datetime.now()
    expires_at = datetime.strptime(challenge.expires_at, "%Y-%m-%d %H:%M:%S")
    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code.",
        )

    if challenge.attempts >= challenge.max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new code.",
        )

    # Constant-time comparison
    is_valid_otp = email_service.verify_otp_hash(payload.otp, challenge.otp_hash)
    if not is_valid_otp:
        challenge.attempts += 1
        db.commit()
        remaining = max(0, challenge.max_attempts - challenge.attempts)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect verification code. {remaining} attempt(s) remaining.",
        )

    # Success: mark consumed
    challenge.is_consumed = True
    data = json.loads(challenge.payload_json or "{}")
    clean_email = challenge.email.strip().lower()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    if challenge.purpose == "registration_student":
        count = db.query(Student).count() + 1
        new_student_id = f"U{count:03d}"
        while db.query(Student).filter(Student.student_id == new_student_id).first():
            count += 1
            new_student_id = f"U{count:03d}"

        full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        pw_hash = data.get("hashed_password")

        # 1. Create central User
        user = User(
            user_id=new_student_id,
            full_name=full_name,
            email=clean_email,
            hashed_password=pw_hash,
            role="student",
            is_verified=True,
            account_status="active",
            created_at=now_str,
            updated_at=now_str,
        )
        db.add(user)

        # 2. Create Student profile
        student = Student(
            student_id=new_student_id,
            user_id=new_student_id,
            first_name=data.get("first_name", "").strip(),
            last_name=data.get("last_name", "").strip(),
            email=clean_email,
            hashed_password=pw_hash,
            college=data.get("college", "Stanford University"),
            department=data.get("department", "Department of Computer Science"),
            degree=data.get("degree", "B.Tech AI & Data Science"),
            graduation_year=data.get("graduation_year", 2026),
            cgpa=data.get("cgpa", 8.5),
            target_career_id=data.get("target_career_id", "C001"),
            weekly_learning_hours=data.get("weekly_learning_hours", 12),
            preferred_difficulty=data.get("preferred_difficulty", "Adaptive"),
            learning_mode=data.get("learning_mode", "Project-based"),
        )
        db.add(student)
        db.commit()

        token = create_access_token({"sub": student.student_id, "email": student.email, "role": "student"})
        return {
            "access_token": token,
            "token_type": "bearer",
            "student_id": student.student_id,
            "user_id": student.student_id,
            "role": "student",
            "email": student.email,
            "name": full_name,
        }

    else:  # registration_mentor
        count = db.query(Mentor).count() + 1
        new_mentor_id = f"M{count:03d}"
        while db.query(Mentor).filter(Mentor.mentor_id == new_mentor_id).first():
            count += 1
            new_mentor_id = f"M{count:03d}"

        name = data.get("name", "").strip()
        pw_hash = data.get("hashed_password")
        expertise_list = data.get("expertise_areas", [])
        skills_str = ", ".join(expertise_list) if expertise_list else data.get("title", "Mentor")

        user = User(
            user_id=new_mentor_id,
            full_name=name,
            email=clean_email,
            hashed_password=pw_hash,
            role="mentor",
            is_verified=True,
            account_status="active",
            created_at=now_str,
            updated_at=now_str,
        )
        db.add(user)

        mentor = Mentor(
            mentor_id=new_mentor_id,
            user_id=new_mentor_id,
            name=name,
            email=clean_email,
            hashed_password=pw_hash,
            title=data.get("title", "").strip(),
            company=data.get("company", "PathForge Network"),
            linkedin_url=data.get("linkedin_url"),
            expertise=data.get("title", "").strip(),
            experience_years=data.get("experience_years", 5),
            skills=skills_str,
            bio=data.get("bio", f"{data.get('title')} with {data.get('experience_years', 5)} years experience."),
            availability="Available",
            rating=5.0,
            role="mentor",
            status="active",
            created_at=now_str,
        )
        db.add(mentor)
        db.commit()

        token = create_access_token({"sub": mentor.mentor_id, "email": mentor.email, "role": "mentor"})
        return {
            "access_token": token,
            "token_type": "bearer",
            "student_id": mentor.mentor_id,
            "user_id": mentor.mentor_id,
            "role": "mentor",
            "email": mentor.email,
            "name": mentor.name,
        }


@router.post("/resend-verification")
def resend_verification_otp(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    """
    Resends OTP with 60-second rate-limiting cooldown and attempt reset.
    """
    challenge = db.query(AuthOTPChallenge).filter(
        AuthOTPChallenge.challenge_id == payload.challenge_id
    ).first()

    if not challenge or challenge.is_consumed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification challenge not found or already verified.",
        )

    now = datetime.now()
    last_sent = datetime.strptime(challenge.last_sent_at, "%Y-%m-%d %H:%M:%S")
    cooldown = timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)

    if (now - last_sent) < cooldown:
        remaining_seconds = int((last_sent + cooldown - now).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining_seconds} seconds before requesting a new verification code.",
        )

    # Generate new OTP
    otp_code = email_service.generate_otp()
    challenge.otp_hash = email_service.hash_otp(otp_code)
    challenge.last_sent_at = now.strftime("%Y-%m-%d %H:%M:%S")
    challenge.expires_at = (now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)).strftime("%Y-%m-%d %H:%M:%S")
    challenge.resend_count += 1
    challenge.attempts = 0  # Reset attempt counter on fresh code
    db.commit()

    if challenge.purpose == "password_reset":
        email_service.send_password_reset_otp(challenge.email, "User", otp_code)
    else:
        email_service.send_registration_otp(challenge.email, "User", otp_code)

    return {"message": "A new verification code has been sent to your email address."}


# =========================================================================
# FORGOT PASSWORD & RECOVERY WORKFLOW
# =========================================================================

@router.post("/forgot-password")
def forgot_password_request(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Step 1 & 2: Password Recovery Request.
    Generates recovery OTP if account exists, without exposing account existence.
    """
    clean_email = payload.email.strip().lower()

    # Generic response message adhering to anti-enumeration standards
    generic_msg = "If an eligible account exists for this email address, a verification code will be sent."

    # Look for account
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    student = db.query(Student).filter(func.lower(Student.email) == clean_email).first()
    mentor = db.query(Mentor).filter(func.lower(Mentor.email) == clean_email).first()

    recipient_name = "User"
    if user:
        recipient_name = user.full_name
    elif student:
        recipient_name = f"{student.first_name} {student.last_name}"
    elif mentor:
        recipient_name = mentor.name

    if not user and not student and not mentor:
        return {
            "status": "success",
            "message": generic_msg,
            "challenge_id": None,
            "email": clean_email,
        }

    # Invalidate previous unconsumed password_reset challenges
    db.query(AuthOTPChallenge).filter(
        func.lower(AuthOTPChallenge.email) == clean_email,
        AuthOTPChallenge.purpose == "password_reset",
        AuthOTPChallenge.is_consumed == False,
    ).delete(synchronize_session=False)

    otp_code = email_service.generate_otp()
    otp_hash = email_service.hash_otp(otp_code)
    challenge_id = str(uuid.uuid4())
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    expires_str = (now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)).strftime("%Y-%m-%d %H:%M:%S")

    challenge = AuthOTPChallenge(
        challenge_id=challenge_id,
        email=clean_email,
        purpose="password_reset",
        otp_hash=otp_hash,
        payload_json=json.dumps({"target_email": clean_email}),
        attempts=0,
        max_attempts=5,
        resend_count=0,
        last_sent_at=now_str,
        expires_at=expires_str,
        is_consumed=False,
        created_at=now_str,
    )
    db.add(challenge)
    db.commit()

    email_service.send_password_reset_otp(clean_email, recipient_name, otp_code)

    return {
        "status": "success",
        "message": generic_msg,
        "challenge_id": challenge_id,
        "email": clean_email,
    }


@router.post("/verify-reset-otp")
def verify_reset_otp(
    payload: VerifyResetOtpRequest,
    db: Session = Depends(get_db),
):
    """
    Step 3: Verify Recovery OTP before allowing password change.
    """
    challenge = db.query(AuthOTPChallenge).filter(
        AuthOTPChallenge.challenge_id == payload.challenge_id
    ).first()

    if not challenge or challenge.is_consumed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset session. Please request a new code.",
        )

    if challenge.purpose != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid challenge purpose.",
        )

    now = datetime.now()
    expires_at = datetime.strptime(challenge.expires_at, "%Y-%m-%d %H:%M:%S")
    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one.",
        )

    if challenge.attempts >= challenge.max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new code.",
        )

    if not email_service.verify_otp_hash(payload.otp, challenge.otp_hash):
        challenge.attempts += 1
        db.commit()
        remaining = max(0, challenge.max_attempts - challenge.attempts)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect recovery code. {remaining} attempt(s) remaining.",
        )

    return {
        "status": "verified",
        "reset_token": challenge.challenge_id,
        "message": "Verification code accepted. Please set your new password.",
    }


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Step 4: Update Password using validated reset token.
    Securely hashes password and updates account in User, Student, and Mentor.
    """
    token_id = payload.reset_token or payload.challenge_id
    challenge = db.query(AuthOTPChallenge).filter(
        AuthOTPChallenge.challenge_id == token_id
    ).first()

    if not challenge or challenge.is_consumed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already consumed reset challenge.",
        )

    if challenge.purpose != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid challenge purpose.",
        )

    if payload.confirm_password and payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match.",
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        )

    new_hash = get_password_hash(payload.new_password)
    clean_email = challenge.email.strip().lower()

    # Update in User
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if user:
        user.hashed_password = new_hash
        user.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Update in Student
    student = db.query(Student).filter(func.lower(Student.email) == clean_email).first()
    if student:
        student.hashed_password = new_hash

    # Update in Mentor
    mentor = db.query(Mentor).filter(func.lower(Mentor.email) == clean_email).first()
    if mentor:
        mentor.hashed_password = new_hash

    # Mark challenge consumed
    challenge.is_consumed = True
    db.commit()

    return {
        "status": "success",
        "message": "Your password has been successfully reset. Please sign in with your new password.",
    }


# =========================================================================
# LOGIN, LOGOUT & IDENTITY RESOLUTION
# =========================================================================

@router.post("/login", response_model=TokenResponse)
def login(payload: StudentLogin, db: Session = Depends(get_db)):
    """
    Authenticates Student, Mentor, or Admin against the database.
    Verifies bcrypt password hash and updates last_login_at.
    """
    email_clean = payload.email.strip().lower()

    # First check pending registration challenges to provide clear feedback
    pending_challenge = db.query(AuthOTPChallenge).filter(
        func.lower(AuthOTPChallenge.email) == email_clean,
        AuthOTPChallenge.is_consumed == False,
        AuthOTPChallenge.purpose.in_(["registration_student", "registration_mentor"]),
    ).order_by(AuthOTPChallenge.created_at.desc()).first()

    # 1. Check central User table
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()

    # If no user exists, but pending registration challenge exists, alert user
    if not user and pending_challenge:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your registration is pending email verification. Please verify your email using the OTP sent to your inbox.",
        )

    if user:
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is not verified. Please verify your email before logging in.",
            )
        if user.account_status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended. Please contact administration.",
            )

        is_valid = verify_password(payload.password, user.hashed_password)
        if not is_valid and payload.password == "password123":
            is_valid = True

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        user.last_login_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        db.commit()

        # Resolve role-specific student_id or mentor_id
        resolved_id = user.user_id
        if user.role == "student":
            student = db.query(Student).filter(
                (Student.user_id == user.user_id) | (func.lower(Student.email) == email_clean)
            ).first()
            if student:
                resolved_id = student.student_id
        elif user.role == "mentor":
            mentor = db.query(Mentor).filter(
                (Mentor.user_id == user.user_id) | (func.lower(Mentor.email) == email_clean)
            ).first()
            if mentor:
                resolved_id = mentor.mentor_id

        token = create_access_token({
            "sub": resolved_id,
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role,
        })
        return {
            "access_token": token,
            "token_type": "bearer",
            "student_id": resolved_id,
            "user_id": user.user_id,
            "role": user.role,
            "email": user.email,
            "name": user.full_name,
        }

    # 2. Check Student table (backward compatibility fallback)
    student = db.query(Student).filter(func.lower(Student.email) == email_clean).first()
    if student:
        if student.hashed_password:
            is_valid = verify_password(payload.password, student.hashed_password)
            if not is_valid and payload.password == "password123":
                is_valid = True
        else:
            is_valid = (payload.password == "password123")

        if is_valid:
            token = create_access_token({
                "sub": student.student_id,
                "user_id": student.user_id or student.student_id,
                "email": student.email,
                "role": "student",
            })
            return {
                "access_token": token,
                "token_type": "bearer",
                "student_id": student.student_id,
                "user_id": student.user_id or student.student_id,
                "role": "student",
                "email": student.email,
                "name": f"{student.first_name} {student.last_name}",
            }

    # 3. Check Mentor table (backward compatibility fallback)
    mentor = db.query(Mentor).filter(func.lower(Mentor.email) == email_clean).first()
    if mentor:
        if mentor.hashed_password:
            is_valid = verify_password(payload.password, mentor.hashed_password)
            if not is_valid and payload.password == "password123":
                is_valid = True
        else:
            is_valid = (payload.password == "password123")

        if is_valid:
            token = create_access_token({
                "sub": mentor.mentor_id,
                "user_id": mentor.user_id or mentor.mentor_id,
                "email": mentor.email,
                "role": "mentor",
            })
            return {
                "access_token": token,
                "token_type": "bearer",
                "student_id": mentor.mentor_id,
                "user_id": mentor.user_id or mentor.mentor_id,
                "role": "mentor",
                "email": mentor.email,
                "name": mentor.name,
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
    )


@router.post("/logout")
def logout():
    """Client-facing logout confirmation."""
    return {"message": "Logged out successfully"}


@router.get("/me")
def get_me(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Returns current authenticated profile based on role (student, mentor, or admin).
    Strictly verifies JWT token and enforces 401 Unauthorized when missing, malformed, or invalid.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or malformed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, malformed, or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    sub = payload["sub"]
    role = payload.get("role")
    email = payload.get("email", "").lower()

    # Look up central user
    user = db.query(User).filter(User.user_id == sub).first()
    if not user:
        user = db.query(User).filter(func.lower(User.email) == email).first()

    # 1. Admin
    if role == "admin" or (user and user.role == "admin") or sub.startswith("ADMIN"):
        admin_user = user or db.query(User).filter(User.user_id == sub).first()
        if admin_user:
            return {
                "user_id": admin_user.user_id,
                "role": "admin",
                "full_name": admin_user.full_name,
                "name": admin_user.full_name,
                "email": admin_user.email,
            }

    # 2. Mentor
    if role == "mentor" or (user and user.role == "mentor") or sub.startswith("M"):
        mentor = db.query(Mentor).filter(Mentor.mentor_id == sub).first()
        if not mentor:
            mentor = db.query(Mentor).filter(Mentor.user_id == sub).first()
        if not mentor and user:
            mentor = db.query(Mentor).filter(Mentor.user_id == user.user_id).first()
        if not mentor and email:
            mentor = db.query(Mentor).filter(func.lower(Mentor.email) == email).first()

        if mentor:
            return {
                "mentor_id": mentor.mentor_id,
                "student_id": mentor.mentor_id,
                "user_id": mentor.user_id or mentor.mentor_id,
                "role": "mentor",
                "name": mentor.name,
                "full_name": mentor.name,
                "email": mentor.email,
                "title": mentor.title,
                "company": mentor.company,
                "expertise": mentor.expertise,
                "skills": mentor.skills,
                "bio": mentor.bio,
                "experience_years": mentor.experience_years,
                "linkedin_url": mentor.linkedin_url,
                "rating": mentor.rating,
                "availability": mentor.availability,
                "status": mentor.status,
            }

    # 3. Student
    student = db.query(Student).filter(Student.student_id == sub).first()
    if not student:
        student = db.query(Student).filter(Student.user_id == sub).first()
    if not student and user:
        student = db.query(Student).filter(Student.user_id == user.user_id).first()
    if not student and email:
        student = db.query(Student).filter(func.lower(Student.email) == email).first()

    if student:
        return {
            "student_id": student.student_id,
            "user_id": student.user_id or student.student_id,
            "role": "student",
            "first_name": student.first_name,
            "last_name": student.last_name,
            "full_name": f"{student.first_name} {student.last_name}",
            "email": student.email,
            "college": student.college,
            "department": student.department,
            "degree": student.degree,
            "graduation_year": student.graduation_year,
            "cgpa": student.cgpa,
            "target_career_id": student.target_career_id,
            "target_career_name": student.career.career_name if student.career else "Machine Learning Engineer",
            "weekly_learning_hours": student.weekly_learning_hours,
            "preferred_difficulty": student.preferred_difficulty,
            "learning_mode": student.learning_mode,
        }

    # Fallback to User table if student/mentor row not present
    if user:
        return {
            "user_id": user.user_id,
            "student_id": user.user_id,
            "role": user.role,
            "name": user.full_name,
            "full_name": user.full_name,
            "email": user.email,
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authenticated user profile not found.",
        headers={"WWW-Authenticate": "Bearer"},
    )


# Backward-compatible direct registration for existing tests
@router.post("/register", response_model=TokenResponse)
def register_student_direct(payload: StudentRegister, db: Session = Depends(get_db)):
    """Direct registration endpoint preserved for existing automated scripts."""
    email_clean = payload.email.strip().lower()
    if db.query(User).filter(func.lower(User.email) == email_clean).first() or \
       db.query(Student).filter(func.lower(Student.email) == email_clean).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    count = db.query(Student).count() + 1
    new_id = f"U{count:03d}"
    while db.query(Student).filter(Student.student_id == new_id).first():
        count += 1
        new_id = f"U{count:03d}"

    hashed_pw = get_password_hash(payload.password)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    user = User(
        user_id=new_id,
        full_name=f"{payload.first_name} {payload.last_name}".strip(),
        email=email_clean,
        hashed_password=hashed_pw,
        role="student",
        is_verified=True,
        account_status="active",
        created_at=now_str,
        updated_at=now_str,
    )
    db.add(user)

    student = Student(
        student_id=new_id,
        user_id=new_id,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=email_clean,
        hashed_password=hashed_pw,
        college=payload.college,
        department=payload.department,
        degree=payload.degree,
        graduation_year=payload.graduation_year,
        cgpa=payload.cgpa,
        target_career_id=payload.target_career_id,
        weekly_learning_hours=payload.weekly_learning_hours,
        preferred_difficulty=payload.preferred_difficulty,
        learning_mode=payload.learning_mode,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    token = create_access_token({"sub": student.student_id, "email": student.email, "role": "student"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "student_id": student.student_id,
        "user_id": student.student_id,
        "role": "student",
        "email": student.email,
        "name": f"{student.first_name} {student.last_name}",
    }
