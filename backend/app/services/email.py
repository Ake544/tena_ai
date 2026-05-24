import resend
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()
resend.api_key = settings.resend_api_key

FROM_ADDRESS = "Tena AI <onboarding@resend.dev>"


def send_verification_otp(to_email: str, otp: str):
    logger.info(f"Verification OTP for {to_email}: {otp}")
    try:
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": to_email,
            "subject": "Verify your Tena AI account",
            "html": f"<p>Your verification code is: <strong>{otp}</strong></p><p>This code expires in 10 minutes.</p>",
        })
    except Exception as e:
        logger.error(f"Failed to send verification OTP to {to_email}: {e}")


def send_password_reset_otp(to_email: str, otp: str):
    logger.info(f"Password reset OTP for {to_email}: {otp}")
    try:
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": to_email,
            "subject": "Reset your Tena AI password",
            "html": f"<p>Your password reset code is: <strong>{otp}</strong></p><p>This code expires in 10 minutes.</p>",
        })
    except Exception as e:
        logger.error(f"Failed to send password reset OTP to {to_email}: {e}")
