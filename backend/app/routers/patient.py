from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.patient import Patient
from app.models.device import Device
from app.models.glucose import GlucoseLog
from app.models.medication import Medication, Appointment
from app.models.symptom import SymptomLog
from app.models.alert import Alert
from app.models.tip import Tip
from app.models.chat import ChatMessage
from app.models.pending_notification import PendingNotification
from app.schemas.patient import PatientUpdate, PatientResponse, PushTokenUpdate
from fastapi import Header

router = APIRouter(prefix="/patient", tags=["patient"])


def get_current_patient(authorization: str = Header(...), db: Session = Depends(get_db)) -> Patient:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    patient = db.query(Patient).filter(Patient.id == payload.get("sub")).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("/profile", response_model=PatientResponse)
def get_profile(current_patient: Patient = Depends(get_current_patient)):
    return current_patient


@router.put("/profile", response_model=PatientResponse)
def update_profile(payload: PatientUpdate, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_patient, field, value)
    db.commit()
    db.refresh(current_patient)
    return current_patient


@router.put("/push-token")
def update_push_token(payload: PushTokenUpdate, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    if payload.device_id:
        db.query(Device).filter(
            Device.patient_id == current_patient.id,
            Device.device_id == payload.device_id,
        ).update({"is_active": False}, synchronize_session=False)
    device = Device(
        patient_id=current_patient.id,
        push_token=payload.push_token,
        device_id=payload.device_id,
    )
    db.add(device)
    if not payload.device_id:
        current_patient.push_token = payload.push_token
    db.commit()
    return {"status": "ok"}


@router.delete("/account")
def delete_account(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    patient_id = current_patient.id
    db.query(GlucoseLog).filter(GlucoseLog.patient_id == patient_id).delete()
    db.query(Medication).filter(Medication.patient_id == patient_id).delete()
    db.query(Appointment).filter(Appointment.patient_id == patient_id).delete()
    db.query(SymptomLog).filter(SymptomLog.patient_id == patient_id).delete()
    db.query(Device).filter(Device.patient_id == patient_id).delete()
    db.query(PendingNotification).filter(PendingNotification.patient_id == patient_id).delete()
    db.query(ChatMessage).filter(ChatMessage.patient_id == patient_id).delete()
    db.query(Alert).filter(Alert.patient_id == patient_id).delete()
    db.query(Tip).filter(Tip.patient_id == patient_id).delete()
    db.query(Patient).filter(Patient.id == patient_id).delete()
    db.commit()
    return {"status": "ok", "message": "Account and all data permanently deleted"}
