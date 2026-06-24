from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.core.database import get_db
from app.models.patient import Patient
from app.models.symptom import SymptomLog
from app.schemas.symptom import SymptomLogCreate, SymptomLogResponse
from app.routers.patient import get_current_patient

router = APIRouter(prefix="/symptoms", tags=["symptoms"])


@router.post("/log", response_model=SymptomLogResponse, status_code=status.HTTP_201_CREATED)
def log_symptom(payload: SymptomLogCreate, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    if payload.severity is not None and (payload.severity < 1 or payload.severity > 10):
        raise HTTPException(status_code=400, detail="Severity must be between 1 and 10")
    ts = payload.timestamp or datetime.now(timezone.utc)
    log = SymptomLog(
        patient_id=current_patient.id,
        name=payload.name,
        severity=payload.severity,
        timestamp=ts,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/history", response_model=list[SymptomLogResponse])
def symptom_history(days: int = Query(30, ge=1, le=90), current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    return db.query(SymptomLog).filter(
        SymptomLog.patient_id == current_patient.id,
        SymptomLog.timestamp >= cutoff,
    ).order_by(SymptomLog.timestamp.desc()).all()
