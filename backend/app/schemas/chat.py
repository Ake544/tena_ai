from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class ChatRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
