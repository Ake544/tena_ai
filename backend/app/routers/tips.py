from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.models.patient import Patient
from app.models.tip import Tip
from app.schemas.tip import TipResponse, TipListResponse
from app.routers.patient import get_current_patient
from app.services.tip_generator import generate_tip
from app.core.redis import get_redis
import json

router = APIRouter(prefix="/tips", tags=["tips"])


@router.get("/today", response_model=TipListResponse)
def get_today_tips(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    r = get_redis()
    cache_key = f"tip_today_{current_patient.id}"
    cached = r.get(cache_key)
    if not cached:
        generate_tip(current_patient, db)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_tips = db.query(Tip).filter(
        Tip.patient_id == current_patient.id,
        Tip.date >= today_start,
    ).order_by(Tip.created_at.desc()).limit(3).all()
    history = db.query(Tip).filter(
        Tip.patient_id == current_patient.id,
        Tip.date < today_start,
    ).order_by(Tip.created_at.desc()).limit(20).all()
    return TipListResponse(today=today_tips, history=history)


@router.get("/history", response_model=list[TipResponse])
def get_tip_history(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(Tip).filter(
        Tip.patient_id == current_patient.id,
    ).order_by(Tip.created_at.desc()).limit(50).all()


@router.post("/generate")
def force_generate(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    result = generate_tip(current_patient, db, force=True)
    return result
