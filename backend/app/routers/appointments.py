from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.patient import Patient
from app.models.medication import Appointment
from app.schemas.medication import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.routers.patient import get_current_patient

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    apt = Appointment(
        patient_id=current_patient.id,
        title=payload.title,
        hospital=payload.hospital,
        appointment_type=payload.appointment_type,
        date=payload.date,
        notes=payload.notes,
    )
    db.add(apt)
    db.commit()
    db.refresh(apt)
    return apt


@router.get("", response_model=list[AppointmentResponse])
def list_appointments(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(Appointment).filter(Appointment.patient_id == current_patient.id).order_by(Appointment.date.asc()).all()


@router.put("/{apt_id}", response_model=AppointmentResponse)
def update_appointment(apt_id: str, payload: AppointmentUpdate, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.patient_id == current_patient.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(apt, field, value)
    db.commit()
    db.refresh(apt)
    return apt


@router.delete("/{apt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(apt_id: str, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.patient_id == current_patient.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(apt)
    db.commit()
