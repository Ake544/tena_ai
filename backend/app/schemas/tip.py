from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class TipResponse(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    category: str
    fact: Optional[str]
    date: datetime

    class Config:
        from_attributes = True


class TipListResponse(BaseModel):
    today: list[TipResponse]
    history: list[TipResponse]
