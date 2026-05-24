from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta, date
from app.core.database import get_db
from app.models.patient import Patient
from app.models.glucose import GlucoseLog
from app.schemas.glucose import GlucoseLogCreate, GlucoseLogResponse, GlucoseTodaySlot, GlucoseSyncRequest, GlucoseSyncItem
from app.routers.patient import get_current_patient
from typing import Optional

router = APIRouter(prefix="/glucose", tags=["glucose"])

READING_TYPES = ["Fasting", "Post-Breakfast", "Pre-Lunch", "Post-Lunch", "Pre-Dinner", "Bedtime"]


@router.post("/log", response_model=GlucoseLogResponse)
def create_glucose_log(payload: GlucoseLogCreate, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    if payload.value < 20 or payload.value > 600:
        raise HTTPException(status_code=400, detail="Glucose value must be between 20 and 600 mg/dL")
    if payload.reading_type not in READING_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid reading type. Must be one of: {', '.join(READING_TYPES)}")

    log = GlucoseLog(
        patient_id=current_patient.id,
        value=payload.value,
        reading_type=payload.reading_type,
        timestamp=payload.timestamp,
        symptoms=payload.symptoms,
        synced=payload.synced,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/today")
def get_today_readings(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    logs = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == current_patient.id,
        GlucoseLog.timestamp >= today_start,
        GlucoseLog.timestamp < today_end,
    ).order_by(GlucoseLog.timestamp).all()

    log_map = {}
    for log in logs:
        log_map[log.reading_type] = log

    slots = []
    for rt in READING_TYPES:
        if rt in log_map:
            log = log_map[rt]
            slots.append(GlucoseTodaySlot(reading_type=rt, value=log.value, timestamp=log.timestamp, id=log.id))
        else:
            slots.append(GlucoseTodaySlot(reading_type=rt))

    return {"date": today_start.date().isoformat(), "slots": slots}


@router.get("/history")
def get_history(days: int = Query(30, ge=1, le=90), current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)

    logs = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == current_patient.id,
        GlucoseLog.timestamp >= cutoff,
    ).order_by(GlucoseLog.timestamp.desc()).all()

    return {"logs": [GlucoseLogResponse.model_validate(l) for l in logs]}


@router.post("/sync")
def sync_logs(payload: GlucoseSyncRequest, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    created = []
    for item in payload.logs:
        if item.value < 20 or item.value > 600:
            continue
        if item.reading_type not in READING_TYPES:
            continue
        log = GlucoseLog(
            patient_id=current_patient.id,
            value=item.value,
            reading_type=item.reading_type,
            timestamp=item.timestamp,
            symptoms=item.symptoms,
            synced=True,
        )
        db.add(log)
        created.append(log)
    db.commit()
    for log in created:
        db.refresh(log)
    return {"synced": len(created)}


@router.get("/stats")
def get_stats(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    thirty_days_ago = today_start - timedelta(days=30)

    today_logs = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == current_patient.id,
        GlucoseLog.timestamp >= today_start,
    ).all()

    month_logs = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == current_patient.id,
        GlucoseLog.timestamp >= thirty_days_ago,
    ).all()

    last_reading = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == current_patient.id,
    ).order_by(GlucoseLog.timestamp.desc()).first()

    fasting_logs = [l for l in month_logs if l.reading_type == "Fasting"]
    avg_fasting = round(sum(l.value for l in fasting_logs) / len(fasting_logs), 1) if fasting_logs else None

    total_days = len(set(l.timestamp.date() for l in month_logs))
    high_count = len([l for l in today_logs if l.value > 180])

    return {
        "last_glucose": last_reading.value if last_reading else None,
        "avg_fasting": avg_fasting,
        "days_logged": total_days,
        "today_high_count": high_count,
        "today_count": len(today_logs),
    }
