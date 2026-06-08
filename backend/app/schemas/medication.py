from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class MedicationCreate(BaseModel):
    name: str
    dose: str
    frequency: str
    times: str
    notes: Optional[str] = None


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    times: Optional[str] = None
    notes: Optional[str] = None


class MedicationResponse(BaseModel):
    id: uuid.UUID
    name: str
    dose: str
    frequency: str
    times: str
    notes: Optional[str]
    taken_times: Optional[str] = None
    skipped_times: Optional[str] = None
    taken_today: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AppointmentCreate(BaseModel):
    title: str
    hospital: str
    appointment_type: Optional[str] = None
    date: datetime
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    hospital: Optional[str] = None
    appointment_type: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    title: str
    hospital: str
    appointment_type: Optional[str]
    date: datetime
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
