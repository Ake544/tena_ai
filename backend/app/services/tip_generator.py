import logging
import json
import re
from datetime import datetime, timedelta, timezone
from groq import Groq
from app.core.config import get_settings
from app.models.patient import Patient
from app.models.medication import Medication
from app.models.glucose import GlucoseLog
from app.models.symptom import SymptomLog
from app.models.tip import Tip
from app.services.knowledge_base import retrieve_semantic, LANGUAGE_MAP
from app.core.redis import get_redis
from sqlalchemy import func

logger = logging.getLogger(__name__)


def _build_monthly_compact(db, patient_id, start, end) -> dict:
    logs = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == patient_id,
        GlucoseLog.timestamp >= start,
        GlucoseLog.timestamp < end,
    ).all()
    total = len(logs)
    if total == 0:
        return None
    fasting = [g.value for g in logs if g.reading_type == "Fasting"]
    post = [g.value for g in logs if g.reading_type in ("Post-Breakfast", "Post-Lunch", "Pre-Dinner")]
    symptoms_7d = db.query(SymptomLog).filter(
        SymptomLog.patient_id == patient_id,
        SymptomLog.timestamp >= start,
        SymptomLog.timestamp < end,
    ).count()
    return {
        "range": f"{start.strftime('%b %d')} - {end.strftime('%b %d')}",
        "days_logged": total,
        "avg_fasting": round(sum(fasting) / len(fasting), 1) if fasting else None,
        "avg_post_meal": round(sum(post) / len(post), 1) if post else None,
        "min_glucose": min(g.value for g in logs) if logs else None,
        "max_glucose": max(g.value for g in logs) if logs else None,
        "symptom_days": symptoms_7d,
    }


def build_context(patient: Patient, db) -> dict:
    now = datetime.now(timezone.utc)
    yesterday_start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_end = now.replace(hour=0, minute=0, second=0, microsecond=0)
    profile = {
        "age": patient.age,
        "sex": patient.sex,
        "bmi": patient.bmi,
        "language": patient.language,
    }
    yesterday_logs = db.query(GlucoseLog).filter(
        GlucoseLog.patient_id == patient.id,
        GlucoseLog.timestamp >= yesterday_start,
        GlucoseLog.timestamp < yesterday_end,
    ).order_by(GlucoseLog.timestamp.asc()).all()
    yesterday_glucose = [{"value": g.value, "reading_type": g.reading_type, "timestamp": g.timestamp.isoformat()} for g in yesterday_logs]
    meds = db.query(Medication).filter(Medication.patient_id == patient.id).all()
    med_data = []
    for m in meds:
        scheduled = [t.strip() for t in m.times.split(",") if t.strip()] if m.times else []
        taken_list = [t.strip() for t in m.taken_times.split(",") if t.strip()] if m.taken_times else []
        skipped_list = [t.strip() for t in m.skipped_times.split(",") if t.strip()] if m.skipped_times else []
        done = len(taken_list) + len(skipped_list)
        total = len(scheduled)
        med_data.append({
            "name": m.name,
            "dose": m.dose,
            "frequency": m.frequency,
            "scheduled_times": scheduled,
            "taken_times": taken_list,
            "skipped_times": skipped_list,
            "done": done,
            "total": total,
            "adherent": done >= total,
        })
    yesterday_symptoms = db.query(SymptomLog).filter(
        SymptomLog.patient_id == patient.id,
        SymptomLog.timestamp >= yesterday_start,
        SymptomLog.timestamp < yesterday_end,
    ).all()
    symptom_data = [{"name": s.name, "severity": s.severity, "timestamp": s.timestamp.isoformat()} for s in yesterday_symptoms]
    first_log = db.query(func.min(GlucoseLog.timestamp)).filter(GlucoseLog.patient_id == patient.id).scalar()
    compacts = []
    if first_log and first_log < yesterday_start.replace(tzinfo=timezone.utc):
        bucket_start = yesterday_start.replace(tzinfo=timezone.utc) - timedelta(days=30)
        while bucket_start > first_log:
            bucket_end = bucket_start + timedelta(days=30)
            compact = _build_monthly_compact(db, patient.id, bucket_start, bucket_end)
            if compact:
                compacts.append(compact)
            bucket_start -= timedelta(days=30)
        remaining_end = bucket_start + timedelta(days=30)
        if remaining_end > first_log:
            compact = _build_monthly_compact(db, patient.id, first_log, remaining_end)
            if compact:
                compacts.append(compact)
    compacts.reverse()
    return {
        "profile": profile,
        "yesterday_glucose": yesterday_glucose,
        "yesterday_medications": med_data,
        "yesterday_symptoms": symptom_data,
        "monthly_compacts": compacts,
    }


def classify_progress(context: dict) -> tuple[str, int]:
    logs = context.get("yesterday_glucose", [])
    meds = context.get("yesterday_medications", [])
    all_adherent = all(m.get("adherent", False) for m in meds) if meds else True
    high_readings = [g for g in logs if g.get("value", 0) > 250]
    low_readings = [g for g in logs if g.get("value", 0) < 70]
    streak = sum(1 for m in meds if m.get("adherent", False))
    if not logs and not meds:
        return "new_user", 3
    if high_readings and not all_adherent:
        return "high_glucose_missed_meds", 3
    if low_readings:
        return "hypoglycemia_risk", 2
    if streak >= 3 and not high_readings:
        return "good_streak", 1
    if all_adherent and not high_readings:
        return "doing_well", 1
    return "neutral", 2

'''here'''
def _build_system_prompt(context: dict, state: str, language: str) -> str:
    lang_instruction = f"Respond in {LANGUAGE_MAP.get(language, 'English')}."
    yesterday_logs = context.get("yesterday_glucose", [])
    logs_summary = ""
    if yesterday_logs:
        vals = [str(g["value"]) for g in yesterday_logs]
        logs_summary = f"Glucose yesterday: {', '.join(vals)} mg/dL."
    meds_summary = ""
    if context.get("yesterday_medications"):
        parts = []
        for m in context["yesterday_medications"]:
            parts.append(f"{m['name']} {m['dose']}: {m['done']}/{m['total']}")
        meds_summary = "Meds: " + "; ".join(parts)
    symptom_summary = ""
    if context.get("yesterday_symptoms"):
        counts = {}
        for s in context["yesterday_symptoms"]:
            counts[s["name"]] = counts.get(s["name"], 0) + 1
        symptom_summary = "Symptoms: " + "; ".join(f"{n}: {c}x" for n, c in counts.items())
    compact_summary = ""
    if context.get("monthly_compacts"):
        parts = []
        for c in context["monthly_compacts"][-2:]:
            parts.append(f"{c['range']}: {c['days_logged']} logs, avg {c.get('avg_fasting','?')}")
        compact_summary = "Monthly: " + " | ".join(parts)

    query = f"Patient state: {state}. {logs_summary} {meds_summary} {symptom_summary}"
    chunks = retrieve_semantic(query, top_k=1)
    fact_text = chunks[0]["text"] if chunks else ""

    return f"""You are Tena AI. Generate one short practical tip for a type 2 diabetes patient.

State: {state}
{logs_summary}{meds_summary}{symptom_summary}{compact_summary}
{lang_instruction}

Guideline: {fact_text}

Return JSON with: title, body (2-3 sentences), category (medication/glucose/diet/exercise/complication/adherence/monitoring/lifestyle/education), fact."""


def _generate_via_groq(context: dict, state: str, language: str) -> dict | None:
    try:
        settings = get_settings()
        client = Groq(api_key=settings.groq_api_key)
        system = _build_system_prompt(context, state, language)
        resp = client.chat.completions.create(
            model="qwen/qwen3.6-27b",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": "Generate a personalized tip for today."},
            ],
            temperature=0.7,
            max_tokens=500,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
        content = re.sub(r'<think>.*', '', content, flags=re.DOTALL).strip()
        return json.loads(content)
    except Exception as e:
        logger.error(f"Groq tip generation failed: {e}")
        return None


def _fallback_tip(state: str) -> dict:
    fallbacks = {
        "new_user": {
            "title": "Welcome to Tena AI",
            "body": "Tracking your glucose daily helps you understand how food, activity, and medication affect your body. Start by logging your first reading.",
            "category": "education",
            "fact": "Self-monitoring of blood glucose is recommended for all people with diabetes to guide treatment decisions."
        },
        "high_glucose_missed_meds": {
            "title": "Stay on track with medication",
            "body": "High readings combined with missed medication increase your risk. Taking every dose on time helps keep your levels stable.",
            "category": "medication",
            "fact": "Medication adherence reduces HbA1c by 0.5-1.0% on average."
        },
        "hypoglycemia_risk": {
            "title": "Watch for low glucose",
            "body": "A reading below 70 mg/dL needs attention. Eat a fast-acting carbohydrate like fruit juice or glucose tablets and recheck after 15 minutes.",
            "category": "glucose",
            "fact": "Hypoglycemia is defined as glucose <70 mg/dL. Severe hypoglycemia (<54 mg/dL) requires immediate medical attention."
        },
        "good_streak": {
            "title": "Your streak is working",
            "body": "Consistent medication adherence builds real progress. Keep going — each dose strengthens your control.",
            "category": "adherence",
            "fact": "Patients with a 7-day streak are 3x more likely to reach their target HbA1c."
        },
        "doing_well": {
            "title": "Great job staying on track",
            "body": "Your adherence and glucose levels look good. Keep up the routine and continue monitoring regularly.",
            "category": "lifestyle",
            "fact": "Consistent self-care behaviors reduce the risk of long-term diabetes complications."
        },
    }
    return fallbacks.get(state, fallbacks["new_user"])


def generate_tip(patient: Patient, db, force: bool = False) -> dict | None:
    r = get_redis()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = f"tip_{patient.id}_{today_str}"
    if not force:
        cached = r.get(cache_key)
        if cached:
            try:
                return json.loads(cached)
            except Exception:
                pass
    context = build_context(patient, db)
    state, tip_count = classify_progress(context)
    result = _generate_via_groq(context, state, patient.language or "en")
    if not result:
        result = _fallback_tip(state)
    tip_record = Tip(
        patient_id=patient.id,
        title=result.get("title", "Diabetes tip"),
        body=result.get("body", ""),
        category=result.get("category", "education"),
        fact=result.get("fact"),
        date=datetime.now(timezone.utc),
    )
    db.add(tip_record)
    db.commit()
    r.setex(cache_key, 86400, json.dumps(result))
    return result
