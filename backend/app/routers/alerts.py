from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.patient import Patient
from app.models.alert import Alert
from app.schemas.alert import AlertResponse
from app.routers.patient import get_current_patient
import uuid

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/active", response_model=list[AlertResponse])
def get_active_alerts(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(Alert).filter(
        Alert.patient_id == current_patient.id,
        Alert.acknowledged == False,
    ).order_by(Alert.created_at.desc()).all()


@router.get("/history", response_model=list[AlertResponse])
def get_alert_history(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    return db.query(Alert).filter(
        Alert.patient_id == current_patient.id,
    ).order_by(Alert.created_at.desc()).limit(50).all()


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: str, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.patient_id == current_patient.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(alert_id: str, current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.patient_id == current_patient.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert
