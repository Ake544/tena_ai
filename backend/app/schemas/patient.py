from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, date
import uuid


class PatientCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    language: str = "en"
    timezone: str = "Africa/Addis_Ababa"
    age: Optional[int] = None
    sex: Optional[str] = None
    education_level: Optional[str] = None
    family_history: bool = False
    family_history_details: Optional[str] = None
    diagnosis_date: Optional[date] = None
    diabetes_type: Optional[int] = None
    other_conditions: Optional[str] = None
    hba1c: Optional[float] = None
    bmi: Optional[float] = None
    exercise_habit: Optional[str] = None
    staple_diet: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Full name must be 2-100 characters")
        return v

    @field_validator("bmi")
    @classmethod
    def validate_bmi(cls, v: float) -> float:
        if v is not None and (v < 5 or v > 80):
            raise ValueError("BMI must be between 5 and 80")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    bmi: Optional[float] = None
    education_level: Optional[str] = None
    family_history: Optional[bool] = None
    family_history_details: Optional[str] = None
    diagnosis_date: Optional[date] = None
    diabetes_type: Optional[int] = None
    other_conditions: Optional[str] = None
    hba1c: Optional[float] = None
    exercise_habit: Optional[str] = None
    staple_diet: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if v is not None and (len(v) < 2 or len(v) > 100):
            raise ValueError("Full name must be 2-100 characters")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v is not None and (v < 1 or v > 120):
            raise ValueError("Age must be between 1 and 120")
        return v

    @field_validator("bmi")
    @classmethod
    def validate_bmi(cls, v: float) -> float:
        if v is not None and (v < 5 or v > 80):
            raise ValueError("BMI must be between 5 and 80")
        return v

    @field_validator("hba1c")
    @classmethod
    def validate_hba1c(cls, v: float) -> float:
        if v is not None and (v < 2 or v > 20):
            raise ValueError("HbA1c must be between 2 and 20")
        return v


class PatientResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    email_verified: bool
    language: str
    age: Optional[int]
    sex: Optional[str]
    bmi: Optional[float]
    education_level: Optional[str]
    family_history: bool
    family_history_details: Optional[str] = None
    diagnosis_date: Optional[date] = None
    diabetes_type: Optional[int] = None
    other_conditions: Optional[str] = None
    hba1c: Optional[float] = None
    exercise_habit: Optional[str]
    staple_diet: Optional[str]
    timezone: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class EmailRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordOTP(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be exactly 6 digits")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class PushTokenUpdate(BaseModel):
    push_token: str
    device_id: Optional[str] = None
