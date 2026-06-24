from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.patient import Patient
from app.models.device import Device
from app.services.notification import send_push
from app.routers.patient import get_current_patient

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/test")
def test_notification(current_patient: Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    devices = db.query(Device).filter(
        Device.patient_id == current_patient.id,
        Device.is_active == True,
    ).all()
    if not devices:
        raise HTTPException(status_code=400, detail="No active push tokens found. Open the app on a physical device and grant notification permission first.")
    sent = 0
    for dev in devices:
        if send_push(dev.push_token, "Test notification", "Tena AI notifications are working! 🎉"):
            sent += 1
    return {"status": "ok", "sent": sent, "devices": len(devices)}
