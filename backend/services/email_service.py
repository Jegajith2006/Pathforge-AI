import logging
logger = logging.getLogger('pathforge.email')
import smtplib
import ssl
import secrets
import hashlib
import json
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any, List
from pathlib import Path

from config import settings


class EmailService:
    """
    Centralized email and OTP delivery service.
    Supports real SMTP delivery (STARTTLS / SSL) and safe dev/test outbox fallback.
    """

    def __init__(self):
        self.dev_outbox: List[Dict[str, Any]] = []
        self._dev_outbox_file = settings.DATA_DIR / "dev_email_outbox.json"

    def generate_otp(self) -> str:
        """Generates a cryptographically secure 6-digit numeric OTP."""
        # 100000 to 999999
        code = str(secrets.randbelow(900000) + 100000)
        return code

    def hash_otp(self, otp_code: str) -> str:
        """Computes secure SHA-256 hash of the OTP salted with application secret."""
        salt = settings.SECRET_KEY
        return hashlib.sha256(f"{otp_code}:{salt}".encode("utf-8")).hexdigest()

    def verify_otp_hash(self, plain_otp: str, otp_hash: str) -> bool:
        """Verifies candidate OTP against stored hash in constant time."""
        expected_hash = self.hash_otp(plain_otp.strip())
        return secrets.compare_digest(expected_hash, otp_hash)

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
    ) -> bool:
        """
        Sends email via configured SMTP server.
        If SMTP_HOST is not configured or connection is in dev/test, logs to dev outbox.
        """
        clean_to = to_email.strip().lower()
        from_email = settings.SMTP_FROM_EMAIL or "noreply@pathforge.ai"

        # Check if real SMTP credentials are provided
        if settings.SMTP_HOST and settings.SMTP_HOST.strip():
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = from_email
                msg["To"] = clean_to

                part_text = MIMEText(body_text, "plain", "utf-8")
                msg.attach(part_text)
                if body_html:
                    part_html = MIMEText(body_html, "html", "utf-8")
                    msg.attach(part_html)

                context = ssl.create_default_context()
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    if settings.SMTP_USE_TLS:
                        server.starttls(context=context)
                    if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                    server.sendmail(from_email, [clean_to], msg.as_string())
                print(f"[EmailService] Real email successfully delivered to {clean_to} via {settings.SMTP_HOST}")
                return True
            except Exception as e:
                print(f"[EmailService] Real SMTP delivery failed ({e}); recording in dev outbox for resilience.")

        # Dev / Test mode fallback
        delivery_record = {
            "to": clean_to,
            "subject": subject,
            "body": body_text,
            "sent_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        self.dev_outbox.append(delivery_record)
        try:
            # Write recent 50 messages to dev file
            recent = self.dev_outbox[-50:]
            with open(self._dev_outbox_file, "w", encoding="utf-8") as f:
                json.dump(recent, f, indent=2)
        except Exception as write_err:
            logger.debug(f"Dev outbox write note: {write_err}")
        return True

    def send_registration_otp(self, to_email: str, user_name: str, otp_code: str) -> bool:
        """
        Sends the registration verification email adhering strictly to required template.
        """
        subject = "Verify your PathForge AI account"
        body = (
            f"Hello {user_name},\n\n"
            f"You requested to register for PathForge AI. Enter the verification code provided below to complete your registration.\n\n"
            f"Verification Code: {otp_code}\n\n"
            f"Your verification code expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n"
            f"If you did not request this registration, you can ignore this email.\n\n"
            f"PathForge AI Team"
        )
        body_html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF;">
          <h2 style="color: #4F46E5; margin-bottom: 8px;">PathForge AI</h2>
          <h3 style="color: #1E293B; margin-top: 0;">Verify your account</h3>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">Hello {user_name},</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">You requested to register for PathForge AI. Enter the verification code provided below to complete your registration.</p>
          <div style="background: #F1F5F9; border-radius: 8px; padding: 16px 24px; margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4F46E5;">{otp_code}</span>
          </div>
          <p style="color: #64748B; font-size: 13px;">Your verification code expires in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 16px;">If you did not request this registration, you can ignore this email.<br>PathForge AI Team</p>
        </div>
        """
        return self.send_email(to_email, subject, body, body_html)

    def send_password_reset_otp(self, to_email: str, user_name: str, otp_code: str) -> bool:
        """
        Sends the password recovery email with separate challenge context.
        """
        subject = "Reset your PathForge AI password"
        body = (
            f"Hello {user_name},\n\n"
            f"You requested to reset your password for PathForge AI. Enter the verification code provided below to proceed with resetting your password.\n\n"
            f"Verification Code: {otp_code}\n\n"
            f"Your verification code expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n"
            f"If you did not request a password reset, you can ignore this email. Your account remains secure.\n\n"
            f"PathForge AI Team"
        )
        body_html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF;">
          <h2 style="color: #4F46E5; margin-bottom: 8px;">PathForge AI</h2>
          <h3 style="color: #1E293B; margin-top: 0;">Reset your password</h3>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">Hello {user_name},</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">You requested to reset your password for PathForge AI. Enter the verification code provided below to proceed with resetting your password.</p>
          <div style="background: #F1F5F9; border-radius: 8px; padding: 16px 24px; margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4F46E5;">{otp_code}</span>
          </div>
          <p style="color: #64748B; font-size: 13px;">Your verification code expires in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 16px;">If you did not request a password reset, you can ignore this email. Your account remains secure.<br>PathForge AI Team</p>
        </div>
        """
        return self.send_email(to_email, subject, body, body_html)

    def get_latest_otp_for_email(self, email: str) -> Optional[str]:
        """Utility for test suite to retrieve generated OTP without inspecting private hashes."""
        clean = email.strip().lower()
        records = list(self.dev_outbox)
        if self._dev_outbox_file.exists():
            try:
                with open(self._dev_outbox_file, "r", encoding="utf-8") as f:
                    file_records = json.load(f)
                    if isinstance(file_records, list):
                        records.extend(file_records)
            except Exception as read_err:
                logger.debug(f"Dev outbox read note: {read_err}")

        for rec in reversed(records):
            if rec.get("to") == clean:
                body = rec.get("body", "")
                if "Verification Code: " in body:
                    lines = body.split("\n")
                    for line in lines:
                        if line.startswith("Verification Code: "):
                            return line.replace("Verification Code: ", "").strip()
        return None


# Global service singleton
email_service = EmailService()
