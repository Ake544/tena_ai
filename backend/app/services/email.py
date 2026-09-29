import resend
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()
resend.api_key = settings.resend_api_key

FROM_ADDRESS = "Tenachin AI <no-reply@mail.tenachinai.site>"

VERIFICATION_HTML = """<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="format-detection" content="telephone=no"/>
  <title>Verify your Tenachin AI account</title>
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Your Tenachin AI verification code: __OTP__. Expires in 10 minutes.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </span>
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; }
    @media only screen and (max-width: 599px) {
      .email-outer  { padding: 16px 8px !important; }
      .email-card   { border-radius: 16px !important; }
      .header-pad   { padding: 24px 20px 20px !important; }
      .body-pad     { padding: 28px 20px 24px !important; }
      .footer-pad   { padding: 18px 20px !important; }
      .otp-num      { font-size: 44px !important; letter-spacing: 12px !important; }
      .otp-pad      { padding: 22px 12px !important; }
      .h1-text      { font-size: 22px !important; }
      .sub-text     { font-size: 14px !important; }
      .note-text    { font-size: 13px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#EEF4F1;-webkit-font-smoothing:antialiased;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#EEF4F1;">
  <tr>
    <td class="email-outer" style="padding:40px 16px;">
      <table role="presentation" class="email-card" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 6px 32px rgba(11,77,59,0.12);">
        <tr>
          <td class="header-pad" style="background-color:#01533d;padding:28px 32px 24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width:40px;vertical-align:middle;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <rect width="40" height="40" rx="10" fill="#0B4D3B"/>
                    <rect x="14" y="10" width="8" height="28" rx="6" fill="#ffffff"/>
                    <rect x="4" y="19" width="28" height="8" rx="6" fill="#ffffff"/>
                    <circle cx="30" cy="10" r="6" fill="#E8A020"/>
                    <circle cx="30" cy="10" r="2.5" fill="#ffffff"/>
                  </svg>
                </td>
                <td style="padding-left:8px;vertical-align:middle;">
                  <span style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Tenachin&nbsp;<span style="color:#E8A020;">AI</span></span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#E8A020;height:3px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
        </tr>
        <tr>
          <td class="body-pad" style="padding:36px 32px 32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
              <tr>
                <td style="text-align:center;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                    <tr>
                      <td style="background-color:#E3F0EB;border-radius:50%;width:56px;height:56px;text-align:center;vertical-align:middle;font-size:0;line-height:0;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B4D3B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <p class="h1-text" style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0B4D3B;text-align:center;line-height:1.2;">Verify your account</p>
            <p class="sub-text" style="margin:0 0 28px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#7A9E90;text-align:center;line-height:1.55;">Hello <strong style="color:#1C2B25;">__NAME__</strong>, enter this code in the Tenachin&nbsp;AI app to complete your sign-up.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
              <tr>
                <td class="otp-pad" style="background-color:#F0F8F4;border-radius:14px;border:1.5px solid #D0E8DC;padding:26px 20px;text-align:center;">
                  <p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#7A9E90;letter-spacing:2px;text-transform:uppercase;">Your verification code</p>
                  <p class="otp-num" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:52px;font-weight:700;color:#0B4D3B;letter-spacing:16px;line-height:1;padding-left:16px;">__OTP__</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 28px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A9E90;text-align:center;line-height:1.5;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A9E90" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              This code expires in <strong style="color:#0B4D3B;">10 minutes</strong>
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
              <tr>
                <td style="border-top:1px solid #E3F0EB;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="note-text" style="background-color:#FEF3DC;border-radius:10px;border:1px solid #F5D98A;padding:14px 16px;">
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A4F00;line-height:1.55;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A4F00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:2px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <strong>Didn't create a Tenachin AI account?</strong> You can safely ignore this email. Someone may have entered your email address by mistake. Your account remains secure.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="footer-pad" style="background-color:#F7FAF8;border-top:1px solid #E3F0EB;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#0B4D3B;">Tenachin AI</p>
            <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7A9E90;">Addis Ababa, Ethiopia</p>
            <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#B2CEC5;">&mdash;</p>
            <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#B2CEC5;line-height:1.5;">This is an automated message. Please do not reply to this email.</p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#C8DDD7;">&copy; 2026 Tenachin AI. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>"""


def send_verification_otp(to_email: str, otp: str, patient_name: str = "there"):
    logger.info(f"Sending verification OTP to {to_email}")
    try:
        html = VERIFICATION_HTML.replace("__OTP__", otp).replace("__NAME__", patient_name)
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": to_email,
            "subject": "Verify your Tenachin AI account",
            "html": html,
        })
    except Exception as e:
        logger.error(f"Failed to send verification OTP to {to_email}: {e}")


def send_password_reset_otp(to_email: str, otp: str):
    logger.info(f"Sending password reset OTP to {to_email}")
    try:
        html = VERIFICATION_HTML.replace("__OTP__", otp).replace("__NAME__", "there")
        html = html.replace("Verify your account", "Reset your password")
        html = html.replace("enter this code in the Tenachin&nbsp;AI app to complete your sign-up.",
                            "enter this code to reset your Tenachin AI password.")
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": to_email,
            "subject": "Reset your Tenachin AI password",
            "html": html,
        })
    except Exception as e:
        logger.error(f"Failed to send password reset OTP to {to_email}: {e}")
