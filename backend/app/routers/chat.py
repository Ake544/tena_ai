import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.patient import Patient
from app.models.chat import ChatMessage
from app.schemas.chat import ChatRequest, ChatHistoryResponse
from app.routers.patient import get_current_patient
from app.services.chat_service import generate_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message")
def chat_message(
    payload: ChatRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    response_text = generate_chat_response(current_patient, db, payload.message)
    return {"response": response_text}


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    messages = db.query(ChatMessage).filter(
        ChatMessage.patient_id == current_patient.id,
    ).order_by(ChatMessage.created_at.desc()).limit(limit).all()
    messages.reverse()
    return ChatHistoryResponse(messages=messages)
