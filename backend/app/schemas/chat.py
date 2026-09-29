from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class ChatRequest(BaseModel):
    message: str = Field(max_length=2000)


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
