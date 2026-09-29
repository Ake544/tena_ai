from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class MedicationCreate(BaseModel):
    name: str = Field(max_length=100)
    dose: str = Field(max_length=50)
    frequency: str = Field(max_length=50)
    times: str = Field(max_length=200)
    notes: Optional[str] = Field(default=None, max_length=500)


class MedicationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    dose: Optional[str] = Field(default=None, max_length=50)
    frequency: Optional[str] = Field(default=None, max_length=50)
    times: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=500)


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
    title: str = Field(max_length=100)
    hospital: str = Field(max_length=100)
    appointment_type: Optional[str] = Field(default=None, max_length=50)
    date: datetime
    notes: Optional[str] = Field(default=None, max_length=500)


class AppointmentUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=100)
    hospital: Optional[str] = Field(default=None, max_length=100)
    appointment_type: Optional[str] = Field(default=None, max_length=50)
    date: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=500)


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    title: str
    hospital: str
    appointment_type: Optional[str]
    date: datetime
    notes: Optional[str]
    reminder_7d_sent: bool = False
    reminder_1d_sent: bool = False
    reminder_0d_sent: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
