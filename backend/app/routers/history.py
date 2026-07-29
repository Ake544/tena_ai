from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta, date
from app.core.database import get_db
from app.routers.patient import get_current_patient
from app.models.patient import Patient
from typing import List

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/summary")
def get_summary(
    days: int = Query(30, ge=1, le=365),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    pid = str(current_patient.id)

    rows = db.execute(
        text(
            """
            SELECT reading_type, AVG(value) as avg_val, COUNT(*) as cnt
            FROM glucose_log
            WHERE patient_id = :pid AND timestamp >= :cutoff
            GROUP BY reading_type
            """
        ),
        {"pid": pid, "cutoff": cutoff},
    ).fetchall()

    avg_by_type = {}
    total_readings = 0
    all_values = []
    for row in rows:
        avg_by_type[row.reading_type] = round(float(row.avg_val), 1)
        total_readings += row.cnt
        all_values.append(float(row.avg_val))

    days_rows = db.execute(
        text(
            """
            SELECT DATE(timestamp) as d, MAX(value) as max_val, MIN(value) as min_val
            FROM glucose_log
            WHERE patient_id = :pid AND timestamp >= :cutoff
            GROUP BY DATE(timestamp)
            """
        ),
        {"pid": pid, "cutoff": cutoff},
    ).fetchall()

    days_in_range = 0
    days_high = 0
    days_low = 0
    for dr in days_rows:
        if dr.max_val >= 70 and dr.max_val <= 180:
            days_in_range += 1
        if dr.max_val > 180:
            days_high += 1
        if dr.min_val < 70:
            days_low += 1

    avg_all = sum(all_values) / len(all_values) if all_values else 0
    hba1c_est = round((avg_all + 46.7) / 28.7, 1) if avg_all else None

    return {
        "avg_readings": avg_by_type,
        "days_in_range": days_in_range,
        "days_high": days_high,
        "days_low": days_low,
        "hba1c_est": hba1c_est,
        "total_readings": total_readings,
    }


@router.get("/glucose-chart")
def get_glucose_chart(
    days: int = Query(30, ge=1, le=365),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    pid = str(current_patient.id)

    rows = db.execute(
        text(
            """
            SELECT DATE(timestamp) as date, value, reading_type
            FROM glucose_log
            WHERE patient_id = :pid AND timestamp >= :cutoff
            ORDER BY timestamp ASC
            """
        ),
        {"pid": pid, "cutoff": cutoff},
    ).fetchall()

    return [
        {"date": row.date.isoformat() if isinstance(row.date, date) else str(row.date), "value": float(row.value), "reading_type": row.reading_type}
        for row in rows
    ]


@router.get("/alerts")
def get_alerts(
    days: int = Query(30, ge=1, le=365),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    pid = str(current_patient.id)

    rows = db.execute(
        text(
            """
            SELECT id, title, body, severity, category, action, acknowledged, created_at
            FROM alert
            WHERE patient_id = :pid AND created_at >= :cutoff
            ORDER BY created_at DESC
            """
        ),
        {"pid": pid, "cutoff": cutoff},
    ).fetchall()

    return [
        {
            "id": str(row.id),
            "title": row.title,
            "body": row.body,
            "severity": row.severity,
            "action": row.action,
            "acknowledged": row.acknowledged,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]
