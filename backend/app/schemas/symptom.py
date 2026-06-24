from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class SymptomLogCreate(BaseModel):
    name: str
    severity: Optional[int] = None
    timestamp: datetime = None


class SymptomLogResponse(BaseModel):
    id: uuid.UUID
    name: str
    severity: Optional[int]
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True
