from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class SymptomLogCreate(BaseModel):
    name: str = Field(max_length=100)
    severity: Optional[int] = Field(default=None, ge=1, le=10)
    timestamp: datetime = None


class SymptomLogResponse(BaseModel):
    id: uuid.UUID
    name: str
    severity: Optional[int]
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True
