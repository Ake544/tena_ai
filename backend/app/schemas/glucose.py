from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class GlucoseLogCreate(BaseModel):
    value: float
    reading_type: str
    timestamp: datetime
    symptoms: Optional[str] = None
    synced: bool = True
    client_id: Optional[str] = None


class GlucoseLogResponse(BaseModel):
    id: uuid.UUID
    value: float
    reading_type: str
    timestamp: datetime
    symptoms: Optional[str]
    synced: bool
    created_at: datetime

    class Config:
        from_attributes = True


class GlucoseTodaySlot(BaseModel):
    reading_type: str
    value: Optional[float] = None
    timestamp: Optional[datetime] = None
    id: Optional[uuid.UUID] = None


class GlucoseHistoryResponse(BaseModel):
    date: str
    avg_value: Optional[float] = None
    readings: list[GlucoseLogResponse]


class GlucoseSyncItem(BaseModel):
    value: float
    reading_type: str
    timestamp: datetime
    symptoms: Optional[str] = None
    client_id: Optional[str] = None


class GlucoseSyncRequest(BaseModel):
    logs: list[GlucoseSyncItem]
