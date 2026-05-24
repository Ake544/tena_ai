from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.patient import Patient
from app.schemas.patient import PatientUpdate, PatientResponse
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
