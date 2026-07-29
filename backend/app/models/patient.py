from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class Patient(Base):
    __tablename__ = "patient"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    email_verified = Column(Boolean, default=False)
    language = Column(String, default="en")
    age = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)
    bmi = Column(Float, nullable=True)
    education_level = Column(String, nullable=True)
    family_history = Column(Boolean, default=False)
    family_history_details = Column(Text, nullable=True)
    exercise_habit = Column(String, nullable=True)
    staple_diet = Column(Text, nullable=True)
    timezone = Column(String, default="Africa/Addis_Ababa")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    push_token = Column(String, nullable=True)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
