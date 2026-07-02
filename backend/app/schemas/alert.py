from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class AlertResponse(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    severity: str
    category: str
    action: str | None = None
    acknowledged: bool
    created_at: datetime

    class Config:
        from_attributes = True
