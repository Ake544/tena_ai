import re
import logging
from zoneinfo import ZoneInfo
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta, timezone
from app.core.database import SessionLocal
from app.models.medication import Medication, Appointment
from app.models.glucose import GlucoseLog
from app.models.patient import Patient
from app.services.notification import send_to_patient, retry_pending

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def _get_offset(tz_name: str) -> int:
    now = datetime.now(ZoneInfo(tz_name))
    return int(now.utcoffset().total_seconds() / 3600)


def _parse_time_to_utc(time_str: str, tz_name: str = "Africa/Addis_Ababa") -> tuple[int, int]:
    parts = time_str.replace("\u202f", " ").split()
    h_str, m_str = parts[0].split(":")
    h, m = int(h_str), int(m_str)
    is_pm = len(parts) > 1 and "PM" in parts[1].upper()
    is_am = len(parts) > 1 and "AM" in parts[1].upper()
    if is_pm and h != 12:
        h += 12
    if is_am and h == 12:
        h = 0
    offset = _get_offset(tz_name)
    utc_h = (h - offset) % 24
    return (utc_h, m)


def _split_times(t: str | None) -> list[str]:
    if not t:
        return []
    return [x.strip() for x in t.split(",") if x.strip()]


def send_medication_reminder(patient_id: str, med_name: str, med_dose: str, time_str: str):
    send_to_patient(
        patient_id,
        f"Time for {med_name}",
        f"Take {med_dose} of {med_name}",
        {"screen": "log"},
    )


def _get_patient_tz(patient_id) -> str:
    db = SessionLocal()
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        return patient.timezone if patient else "Africa/Addis_Ababa"
    finally:
        db.close()


def schedule_medication(med):
    med_id = str(med.id)
    unschedule_medication(med_id)
    tz_name = _get_patient_tz(med.patient_id)
    times = _split_times(med.times)
    for t in times:
        h, m = _parse_time_to_utc(t, tz_name)
        job_id = f"med_{med_id}_{h:02d}{m:02d}"
        scheduler.add_job(
            send_medication_reminder,
            CronTrigger(hour=h, minute=m, timezone="UTC"),
            id=job_id,
            args=[str(med.patient_id), med.name, med.dose, t],
            replace_existing=True,
            misfire_grace_time=300,
        )


def unschedule_medication(med_id: str):
    existing = list(scheduler.get_jobs())
    for job in existing:
        if job.id.startswith(f"med_{med_id}_"):
            scheduler.remove_job(job.id)


def reschedule_all_medications():
    db = SessionLocal()
    try:
        meds = db.query(Medication).all()
        for med in meds:
            schedule_medication(med)
        logger.info(f"Rescheduled {len(meds)} medications")
    finally:
        db.close()


def reset_taken_today():
    db = SessionLocal()
    try:
        count = db.query(Medication).filter(Medication.taken_today == True).update(
            {"taken_today": False, "taken_times": None, "skipped_times": None},
            synchronize_session=False,
        )
        db.commit()
        logger.info(f"Reset taken_today for {count} medications")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to reset taken_today: {e}")
    finally:
        db.close()


def glucose_nudge():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        patient_ids = set()
        for log in db.query(GlucoseLog.patient_id).filter(
            GlucoseLog.timestamp >= today_start,
            GlucoseLog.reading_type == "Fasting",
        ).distinct():
            patient_ids.add(log[0])
        all_patients = db.query(Patient).all()
        for p in all_patients:
            if p.id not in patient_ids:
                send_to_patient(
                    str(p.id),
                    "Morning glucose check",
                    "Log your fasting glucose reading to track your morning levels",
                    {"screen": "log"},
                )
        logger.info("Glucose nudge sent")
    except Exception as e:
        logger.error(f"Glucose nudge failed: {e}")
    finally:
        db.close()


def evening_checkin():
    db = SessionLocal()
    try:
        patient_ids = set()
        for med in db.query(Medication).all():
            times = _split_times(med.times)
            taken = set(_split_times(med.taken_times))
            skipped = set(_split_times(med.skipped_times))
            done = taken | skipped
            pending = [t for t in times if t not in done]
            if pending:
                patient_ids.add(str(med.patient_id))
        for pid in patient_ids:
            send_to_patient(
                pid,
                "Evening medication check",
                "You have pending medications for today. Don't forget to take them!",
                {"screen": "log"},
            )
        logger.info("Evening check-in sent")
    except Exception as e:
        logger.error(f"Evening check-in failed: {e}")
    finally:
        db.close()


def appointment_reminders():
    db = SessionLocal()
    try:
        utc_now = datetime.now(timezone.utc)
        for apt, tz_name in db.query(Appointment, Patient.timezone).join(Patient, Appointment.patient_id == Patient.id).filter(Appointment.date >= utc_now - timedelta(days=14)).all():
            offset = _get_offset(tz_name)
            local_today = (utc_now + timedelta(hours=offset)).date()
            apt_local = (apt.date.astimezone(timezone.utc) + timedelta(hours=offset)).date()
            diff_days = (apt_local - local_today).days
            if diff_days == 7 and not apt.reminder_7d_sent:
                send_to_patient(
                    str(apt.patient_id),
                    f"Appointment in 7 days: {apt.title}",
                    f"At {apt.hospital} — {apt.date.strftime('%b %d at %I:%M %p')}",
                    {"screen": "appointments"},
                )
                apt.reminder_7d_sent = True
            elif diff_days == 1 and not apt.reminder_1d_sent:
                send_to_patient(
                    str(apt.patient_id),
                    f"Appointment tomorrow: {apt.title}",
                    f"At {apt.hospital} — {apt.date.strftime('%b %d at %I:%M %p')}",
                    {"screen": "appointments"},
                )
                apt.reminder_1d_sent = True
            elif diff_days == 0 and not apt.reminder_0d_sent:
                send_to_patient(
                    str(apt.patient_id),
                    f"Today's the day: {apt.title}",
                    f"Your appointment at {apt.hospital} is today at {apt.date.strftime('%I:%M %p')}. Please don't miss it!",
                    {"screen": "appointments"},
                )
                apt.reminder_0d_sent = True
        db.commit()
        logger.info("Appointment reminders checked")
    except Exception as e:
        db.rollback()
        logger.error(f"Appointment reminders failed: {e}")
    finally:
        db.close()


def start():
    scheduler.add_job(reset_taken_today, CronTrigger(hour=0, minute=0, timezone="UTC"), id="reset_taken_today", replace_existing=True)
    scheduler.add_job(glucose_nudge, CronTrigger(hour=6, minute=0, timezone="UTC"), id="glucose_nudge", replace_existing=True)
    scheduler.add_job(evening_checkin, CronTrigger(hour=18, minute=0, timezone="UTC"), id="evening_checkin", replace_existing=True)
    scheduler.add_job(appointment_reminders, CronTrigger(hour=5, minute=0, timezone="UTC"), id="appointment_reminders", replace_existing=True, misfire_grace_time=300)
    scheduler.add_job(retry_pending, IntervalTrigger(minutes=5), id="retry_pending", replace_existing=True)
    scheduler.start()
    reschedule_all_medications()
    logger.info("Scheduler started — event-based med reminders")


def shutdown():
    scheduler.shutdown(wait=False)
    logger.info("Scheduler shut down")
