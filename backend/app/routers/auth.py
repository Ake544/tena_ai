from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.patient import Patient
from app.schemas.patient import (
    PatientCreate,
    TokenResponse,
    EmailRequest,
    LoginRequest,
    VerifyOTP,
    ResetPasswordOTP,
)
from app.services.email import send_verification_otp, send_password_reset_otp
from app.services.otp import (
    generate_otp,
    store_otp,
    get_stored_otp,
    delete_otp,
    can_request_otp,
    is_on_cooldown,
    set_cooldown,
    can_verify_otp,
    record_failed_verify,
    clear_verify_fails,
    clear_attempts,
    clear_cooldown,
)
from app.core.limiter import limiter
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
@limiter.limit("5/hour")
def signup(request: Request, payload: PatientCreate, db: Session = Depends(get_db)):
    existing = db.query(Patient).filter(Patient.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    patient = Patient(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        language=payload.language,
        timezone=payload.timezone,
        age=payload.age,
        sex=payload.sex,
        education_level=payload.education_level,
        family_history=payload.family_history,
        family_history_details=payload.family_history_details,
        diagnosis_date=payload.diagnosis_date,
        diabetes_type=payload.diabetes_type,
        other_conditions=payload.other_conditions,
        hba1c=payload.hba1c,
        exercise_habit=payload.exercise_habit,
        staple_diet=payload.staple_diet,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    r = get_redis()
    otp = generate_otp()
    store_otp(r, payload.email, otp)
    can_request_otp(r, payload.email)
    set_cooldown(r, payload.email)
    send_verification_otp(payload.email, otp)

    return {"message": "Account created. Check your email for the verification code."}


@router.post("/verify-email")
@limiter.limit("10/hour")
def verify_email(request: Request, payload: VerifyOTP, db: Session = Depends(get_db)):
    r = get_redis()

    if not can_verify_otp(r, payload.email):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    stored = get_stored_otp(r, payload.email)
    if not stored or stored != payload.otp:
        record_failed_verify(r, payload.email)
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.email_verified = True
    db.commit()

    delete_otp(r, payload.email)
    clear_verify_fails(r, payload.email)
    clear_attempts(r, payload.email)
    clear_cooldown(r, payload.email)

    return {"message": "Email verified successfully"}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient or not verify_password(payload.password, patient.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not patient.email_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    access_token = create_access_token(data={"sub": str(patient.id)})
    refresh_token = create_refresh_token(data={"sub": str(patient.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/forgot-password")
@limiter.limit("5/hour")
def forgot_password(request: Request, payload: EmailRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient:
        return {"message": "If the email exists, a reset code has been sent"}

    r = get_redis()

    if is_on_cooldown(r, payload.email):
        raise HTTPException(status_code=429, detail="Please wait 60 seconds before requesting another code")

    if not can_request_otp(r, payload.email):
        raise HTTPException(status_code=429, detail="Too many requests. Try again in 1 hour.")

    otp = generate_otp()
    store_otp(r, payload.email, otp)
    set_cooldown(r, payload.email)
    send_password_reset_otp(payload.email, otp)

    return {"message": "If the email exists, a reset code has been sent"}


@router.post("/reset-password")
@limiter.limit("10/hour")
def reset_password(request: Request, payload: ResetPasswordOTP, db: Session = Depends(get_db)):
    r = get_redis()

    if not can_verify_otp(r, payload.email):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    stored = get_stored_otp(r, payload.email)
    if not stored or stored != payload.otp:
        record_failed_verify(r, payload.email)
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.password_hash = hash_password(payload.new_password)
    db.commit()

    delete_otp(r, payload.email)
    clear_verify_fails(r, payload.email)
    clear_attempts(r, payload.email)
    clear_cooldown(r, payload.email)

    return {"message": "Password reset successfully"}


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    patient_id = payload.get("sub")
    patient = db.query(Patient).filter(Patient.id == uuid.UUID(patient_id)).first()
    if not patient:
        raise HTTPException(status_code=401, detail="Patient not found")

    new_access = create_access_token(data={"sub": str(patient.id)})
    new_refresh = create_refresh_token(data={"sub": str(patient.id)})

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)
