from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid


class PatientCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    language: str = "en"
    age: Optional[int] = None
    sex: Optional[str] = None
    education_level: Optional[str] = None
    family_history: bool = False
    exercise_habit: Optional[str] = None
    staple_diet: Optional[str] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    bmi: Optional[float] = None
    education_level: Optional[str] = None
    family_history: Optional[bool] = None
    exercise_habit: Optional[str] = None
    staple_diet: Optional[str] = None
    language: Optional[str] = None


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
    exercise_habit: Optional[str]
    staple_diet: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


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


class PushTokenUpdate(BaseModel):
    push_token: str
    device_id: Optional[str] = None
