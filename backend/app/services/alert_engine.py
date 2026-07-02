import logging
from datetime import datetime, timedelta, timezone
from app.models.alert import Alert
from app.models.glucose import GlucoseLog
from app.models.medication import Medication
from app.models.symptom import SymptomLog

logger = logging.getLogger(__name__)


def evaluate_alerts(patient_id, db) -> list[Alert]:
    now = datetime.now(timezone.utc)
    new_alerts = []

    rules = [
        _check_high_fasting_trend,
        _check_critical_high,
        _check_critical_low,
        _check_missed_meds,
        _check_chest_pain,
    ]

    for rule in rules:
        try:
            alert = rule(patient_id, db, now)
            if alert:
                db.add(alert)
                db.commit()
                new_alerts.append(alert)
        except Exception as e:
            logger.error(f"Alert rule {rule.__name__} failed: {e}")
            db.rollback()

    return new_alerts


ACTIONS = {
    "high_fasting_trend": "soon",
    "critical_high": "now",
    "critical_low": "now",
    "missed_meds": "soon",
    "chest_pain": "now",
}


def _check_high_fasting_trend(patient_id, db, now) -> Alert | None:
    cutoff = now - timedelta(days=3)
    logs = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == patient_id,
        GlucoseLog.reading_type == "Fasting",
        GlucoseLog.timestamp >= cutoff,
        GlucoseLog.value > 250,
    ).order_by(GlucoseLog.timestamp.desc()).all()
    if len(logs) >= 3:
        existing = db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.category == "high_fasting_trend",
            Alert.created_at >= now - timedelta(days=1),
        ).first()
        if not existing:
            vals = [g.value for g in logs]
            return Alert(
                patient_id=patient_id,
                title="High fasting trend detected",
                body=f"Your fasting glucose has been consistently high: {', '.join(str(v) for v in vals)} mg/dL over {len(logs)} days. Review your evening meal and medication timing. Contact your doctor if the pattern continues.",
                severity="warning",
                category="high_fasting_trend",
                action=ACTIONS["high_fasting_trend"],
            )
    return None


def _check_critical_high(patient_id, db, now) -> Alert | None:
    recent = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == patient_id,
        GlucoseLog.timestamp >= now - timedelta(hours=6),
        GlucoseLog.value > 400,
    ).first()
    if recent:
        existing = db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.category == "critical_high",
            Alert.created_at >= now - timedelta(hours=6),
        ).first()
        if not existing:
            return Alert(
                patient_id=patient_id,
                title="Critical high glucose",
                body=f"Your glucose reading is {recent.value} mg/dL — dangerously high. Take your fast-acting medication as prescribed. Drink water and avoid eating until your level drops. Seek emergency care if you experience nausea, confusion, or difficulty breathing.",
                severity="urgent",
                category="critical_high",
                action=ACTIONS["critical_high"],
            )
    return None


def _check_critical_low(patient_id, db, now) -> Alert | None:
    recent = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == patient_id,
        GlucoseLog.timestamp >= now - timedelta(hours=6),
        GlucoseLog.value < 70,
    ).first()
    if recent:
        existing = db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.category == "critical_low",
            Alert.created_at >= now - timedelta(hours=6),
        ).first()
        if not existing:
            return Alert(
                patient_id=patient_id,
                title="Low glucose alert",
                body=f"Your glucose is {recent.value} mg/dL — below the safe range. Consume 15g of fast-acting carbohydrates (juice, glucose tablets, or regular soda). Recheck in 15 minutes. If still low, repeat. Seek help if you feel confused or cannot swallow.",
                severity="urgent",
                category="critical_low",
                action=ACTIONS["critical_low"],
            )
    return None


def _check_missed_meds(patient_id, db, now) -> Alert | None:
    cutoff = now - timedelta(days=2)
    meds = db.query(Medication).filter(
        Medication.patient_id == patient_id,
        Medication.created_at >= cutoff,
    ).all()
    for med in meds:
        if med.taken_today is not None and med.taken_today is False:
            existing = db.query(Alert).filter(
                Alert.patient_id == patient_id,
                Alert.category == "missed_meds",
                Alert.created_at >= now - timedelta(days=1),
            ).first()
            if not existing:
                return Alert(
                    patient_id=patient_id,
                    title=f"Missed medication: {med.name}",
                    body=f"You have not taken {med.name} {med.dose} for 2+ days. Take your next dose as soon as you remember unless it is almost time for the next one. Do not double-dose. If side effects are causing you to skip, speak with your doctor about alternative options.",
                    severity="warning",
                    category="missed_meds",
                    action=ACTIONS["missed_meds"],
                )
    return None


def _check_chest_pain(patient_id, db, now) -> Alert | None:
    recent = db.query(SymptomLog).filter(
        SymptomLog.patient_id == patient_id,
        SymptomLog.timestamp >= now - timedelta(hours=24),
        SymptomLog.name.ilike("%chest%"),
    ).first()
    if recent:
        existing = db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.category == "chest_pain",
            Alert.created_at >= now - timedelta(days=1),
        ).first()
        if not existing:
            return Alert(
                patient_id=patient_id,
                title="Chest pain reported",
                body="You reported chest pain in your symptom log. Chest pain can be a sign of a heart problem, especially in people with diabetes. Do not wait — seek emergency medical evaluation immediately. Call your local emergency number.",
                severity="urgent",
                category="chest_pain",
                action=ACTIONS["chest_pain"],
            )
    return None
