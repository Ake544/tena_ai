from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.routers.patient import get_current_patient
from app.models.patient import Patient
from app.services.pdf_generator import build_report_data, generate_pdf
from app.core.r2 import upload_to_r2
import uuid

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/pdf")
def export_pdf(
    days: int = Query(90, ge=1, le=365),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    data = build_report_data(current_patient, db, days)
    pdf_bytes = generate_pdf(data)
    key = f"reports/{current_patient.id}/{uuid.uuid4()}.pdf"
    url = upload_to_r2(pdf_bytes, key)
    return {"url": url, "expires_in": 3600}
