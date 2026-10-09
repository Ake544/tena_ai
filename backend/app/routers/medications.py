from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.scheduler import schedule_medication, unschedule_medication
from app.models.patient import Patient
from app.models.medication import Medication
from app.schemas.medication import MedicationCreate, MedicationUpdate, MedicationResponse
from app.routers.patient import get_current_patient
import logging
import re

logger = logging.getLogger(__name__)


def _split_times(t: str | None) -> list[str]:
    if not t:
        return []
    return [x.strip() for x in t.split(",") if x.strip()]


def _parse_time(t: str) -> list | None:
    try:
        s = t.replace("\u202f", " ").strip()
        s = re.sub(r"\.(\d{2})", r":\1", s)
        match = re.match(r"^(\d{1,2})(?::(\d{1,2}))?\s*([AaPp][Mm])?$", s)
        if not match:
            raise ValueError(s)
        h = int(match.group(1))
        m = int(match.group(2) or 0)
        mer = (match.group(3) or "").upper()
        if mer == "PM" and h != 12:
            h += 12
        if mer == "AM" and h == 12:
            h = 0
        if 0 <= h < 24 and 0 <= m < 60:
            return [h, m]
    except (ValueError, IndexError):
        pass
    logger.warning(f"Unparseable medication time: {t!r}")
    return None


def _time_sort_key(t: str) -> list:
    return _parse_time(t) or [0, 0]


def _validate_times(raw: str) -> None:
    times = _split_times(raw)
    if not times:
        raise HTTPException(status_code=400, detail="At least one time is required")
    for t in times:
        if _parse_time(t) is None:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid time '{t}' — use a format like 8:00 AM or 20:00",
            )

router = APIRouter(prefix="/medications", tags=["medications"])


@router.post("", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medication(payload: MedicationCreate, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    _validate_times(payload.times)
    med = Medication(
        patient_id=current_patient.id,
        name=payload.name,
        dose=payload.dose,
        frequency=payload.frequency,
        times=payload.times,
        notes=payload.notes,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    schedule_medication(med)
    return med


@router.get("", response_model=list[MedicationResponse])
def list_medications(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(Medication).filter(Medication.patient_id == current_patient.id).order_by(Medication.created_at.desc()).all()


@router.put("/{med_id}", response_model=MedicationResponse)
def update_medication(med_id: str, payload: MedicationUpdate, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    med = db.query(Medication).filter(Medication.id == med_id, Medication.patient_id == current_patient.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("times") is not None:
        _validate_times(update_data["times"])
    for field, value in update_data.items():
        setattr(med, field, value)
    db.commit()
    db.refresh(med)
    schedule_medication(med)
    return med


@router.delete("/{med_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(med_id: str, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    med = db.query(Medication).filter(Medication.id == med_id, Medication.patient_id == current_patient.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    unschedule_medication(med_id)
    db.delete(med)
    db.commit()


@router.post("/{med_id}/taken", response_model=MedicationResponse)
def mark_taken(med_id: str, time: str = Query(...), current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    med = db.query(Medication).filter(Medication.id == med_id, Medication.patient_id == current_patient.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    if time not in _split_times(med.times):
        raise HTTPException(status_code=400, detail=f"Time '{time}' is not a valid time for this medication")

    current_taken = set(_split_times(med.taken_times))
    current_taken.add(time)
    med.taken_times = ", ".join(sorted(current_taken, key=_time_sort_key))

    current_skipped = set(_split_times(med.skipped_times))
    current_skipped.discard(time)
    med.skipped_times = ", ".join(sorted(current_skipped, key=_time_sort_key)) if current_skipped else None

    med.taken_today = set(_split_times(med.times)) == current_taken
    db.commit()
    db.refresh(med)
    return med


@router.post("/{med_id}/skip", response_model=MedicationResponse)
def mark_skip(med_id: str, time: str = Query(...), current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    med = db.query(Medication).filter(Medication.id == med_id, Medication.patient_id == current_patient.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    if time not in _split_times(med.times):
        raise HTTPException(status_code=400, detail=f"Time '{time}' is not a valid time for this medication")

    current_skipped = set(_split_times(med.skipped_times))
    current_skipped.add(time)
    med.skipped_times = ", ".join(sorted(current_skipped, key=_time_sort_key))

    current_taken = set(_split_times(med.taken_times))
    current_taken.discard(time)
    med.taken_times = ", ".join(sorted(current_taken, key=_time_sort_key)) if current_taken else None

    med.taken_today = set(_split_times(med.times)) == current_taken
    db.commit()
    db.refresh(med)
    return med
