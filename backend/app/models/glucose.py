from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class GlucoseLog(Base):
    __tablename__ = "glucose_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patient.id"), nullable=False, index=True)
    value = Column(Float, nullable=False)
    reading_type = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    symptoms = Column(String, nullable=True)
    synced = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
