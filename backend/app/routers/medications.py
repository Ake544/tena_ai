from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.patient import Patient
from app.models.medication import Medication
from app.schemas.medication import MedicationCreate, MedicationUpdate, MedicationResponse
from app.routers.patient import get_current_patient
import re


def _split_times(t: str | None) -> list[str]:
    if not t:
        return []
    return [x.strip() for x in t.split(",") if x.strip()]


def _time_sort_key(t: str) -> list:
    t = t.strip()
    is_pm = "PM" in t.upper()
    is_am = "AM" in t.upper()
    clean = re.sub(r"\s*[APap][Mm]\s*", "", t).strip()
    h_str, m_str = clean.split(":")
    h = int(h_str)
    m = int(m_str)
    if is_pm and h != 12:
        h += 12
    if is_am and h == 12:
        h = 0
    return [h, m]

router = APIRouter(prefix="/medications", tags=["medications"])


@router.post("", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medication(payload: MedicationCreate, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
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
    for field, value in update_data.items():
        setattr(med, field, value)
    db.commit()
    db.refresh(med)
    return med


@router.delete("/{med_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(med_id: str, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    med = db.query(Medication).filter(Medication.id == med_id, Medication.patient_id == current_patient.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
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
