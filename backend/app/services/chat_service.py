import json
import hashlib
import re
import logging
from datetime import datetime, timedelta, timezone
from groq import Groq
from app.core.config import get_settings
from app.core.redis import get_redis
from app.models.patient import Patient
from app.models.chat import ChatMessage
from app.models.glucose import GlucoseLog
from app.models.medication import Medication, Appointment
from app.models.symptom import SymptomLog

logger = logging.getLogger(__name__)


def clean_response(text: str) -> str:
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
    text = re.sub(r'<think>.*', '', text, flags=re.DOTALL).strip()
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'^#{1,3}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

GREETING_KEYWORDS = {"hi", "hello", "hey", "你好", "ሰላም", "helo", "good morning", "good evening"}
CACHED_GREETING = "Hi there! I'm Tena AI, your diabetes care assistant. How can I help you today? You can ask me about your glucose readings, medications, diet tips, or anything diabetes-related."


def _cache_key(patient_id, text: str) -> str:
    h = hashlib.sha256(text.lower().strip().encode()).hexdigest()[:16]
    return f"chat:{patient_id}:{h}"


def _build_context(patient: Patient, db) -> str:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    days_ago = now - timedelta(days=3)

    profile = f"Age {patient.age}, BMI {patient.bmi}"
    meds = db.query(Medication).filter(Medication.patient_id == patient.id).all()
    med_line = ""
    if meds:
        parts = []
        for m in meds:
            taken = m.taken_times or ""
            skipped = m.skipped_times or ""
            t_list = [t.strip() for t in taken.split(",") if t.strip()]
            s_list = [t.strip() for t in skipped.split(",") if t.strip()]
            sched = [t.strip() for t in m.times.split(",") if t.strip()]
            done = len(t_list) + len(s_list)
            pct = f"{done}/{len(sched)}" if sched else "?"
            parts.append(f"{m.name} {m.dose}: {pct} today")
        med_line = "Meds: " + "; ".join(parts)

    logs = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == patient.id,
        GlucoseLog.timestamp >= days_ago,
    ).order_by(GlucoseLog.timestamp.desc()).limit(10).all()
    log_line = ""
    if logs:
        vals = [f"{g.value} {g.reading_type[:3]}" for g in logs]
        log_line = "Glucose: " + ", ".join(vals)
    else:
        log_line = "No recent readings"

    appts = db.query(Appointment).filter(
        Appointment.patient_id == patient.id,
        Appointment.date >= today_start,
    ).order_by(Appointment.date.asc()).limit(2).all()
    appt_line = ""
    if appts:
        appt_line = "Upcoming: " + "; ".join(f"{a.title} {a.date.strftime('%b %d')}" for a in appts)

    return " | ".join(filter(None, [profile, med_line, log_line, appt_line]))


def _get_history(patient_id, db, limit=4):
    msgs = db.query(ChatMessage).filter(
        ChatMessage.patient_id == patient_id,
    ).order_by(ChatMessage.created_at.desc()).limit(limit).all()
    msgs.reverse()
    return msgs


def _is_greeting(text: str) -> bool:
    t = text.lower().strip().rstrip("?!.")
    return t in GREETING_KEYWORDS or any(t.startswith(g) for g in GREETING_KEYWORDS)


def generate_chat_response(patient: Patient, db, user_message: str) -> str:
    r = get_redis()

    if _is_greeting(user_message):
        user_msg = ChatMessage(patient_id=patient.id, role="user", content=user_message)
        db.add(user_msg)
        assistant_msg = ChatMessage(patient_id=patient.id, role="assistant", content=CACHED_GREETING)
        db.add(assistant_msg)
        db.commit()
        return CACHED_GREETING

    cache_key = _cache_key(patient.id, user_message)
    cached = r.get(cache_key)
    if cached:
        try:
            cached_resp = json.loads(cached)
            user_msg = ChatMessage(patient_id=patient.id, role="user", content=user_message)
            db.add(user_msg)
            assistant_msg = ChatMessage(patient_id=patient.id, role="assistant", content=cached_resp)
            db.add(assistant_msg)
            db.commit()
            return cached_resp
        except Exception:
            pass

    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)
    context = _build_context(patient, db)
    history = _get_history(patient.id, db)

    system = f"You are Tena AI, a diabetes assistant. Be warm, concise (2-4 sentences). Do not diagnose. Current: {context}"

    messages = [{"role": "system", "content": system}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": user_message})

    user_msg = ChatMessage(patient_id=patient.id, role="user", content=user_message)
    db.add(user_msg)
    db.flush()

    try:
        completion = client.chat.completions.create(
            model="qwen/qwen3.6-27b",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        response_text = clean_response(completion.choices[0].message.content or "")
        if response_text:
            assistant_msg = ChatMessage(patient_id=patient.id, role="assistant", content=response_text)
            db.add(assistant_msg)
            db.commit()
            r.setex(cache_key, 3600, json.dumps(response_text))
        return response_text
    except Exception as e:
        logger.error(f"Groq chat failed: {e}")
        db.rollback()
        return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
