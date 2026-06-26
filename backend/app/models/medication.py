from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class Medication(Base):
    __tablename__ = "medication"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    dose = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    times = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    taken_times = Column(String, nullable=True)
    skipped_times = Column(String, nullable=True)
    taken_today = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Appointment(Base):
    __tablename__ = "appointment"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    hospital = Column(String, nullable=False)
    appointment_type = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    notes = Column(String, nullable=True)
    reminder_7d_sent = Column(Boolean, default=False)
    reminder_1d_sent = Column(Boolean, default=False)
    reminder_0d_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
