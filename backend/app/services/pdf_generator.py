from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta, date
from app.models.patient import Patient
from typing import Dict, List, Any, Optional
import json

W, H = A4
M_L = 22 * mm
M_R = 22 * mm
M_B = 18 * mm
CONTENT_W = W - M_L - M_R
HEADER_H = 52 * mm
CONTENT_TOP = H - HEADER_H - 10 * mm
FOOTER_CLEAR = M_B + 14 * mm

GREEN_DARK = HexColor('#0B4D3B')
GREEN_MED = HexColor('#1A6B52')
GREEN_LIGHT = HexColor('#E3F0EB')
GREEN_XLIGHT = HexColor('#F0F8F4')
GOLD = HexColor('#E8A020')
RED = HexColor('#D94F3D')
RED_LIGHT = HexColor('#FDECEA')
AMBER = HexColor('#F07A30')
AMBER_LIGHT = HexColor('#FEF0E6')
BLUE = HexColor('#2A6DB5')
BLUE_LIGHT = HexColor('#E8F0FB')
GRAY_LIGHT = HexColor('#F7F9F7')
GRAY_BORDER = HexColor('#DDE8E3')
TEXT_MUTED = HexColor('#7A9E90')
BLACK = HexColor('#1C2B25')
BORDERLINE = HexColor('#C47A20')


def glucose_color(value: float, reading_type: str) -> HexColor:
    if value is None:
        return TEXT_MUTED
    if value < 80:
        return AMBER
    if reading_type in ('Fasting', 'Pre-Lunch', 'Pre-Dinner'):
        if value <= 130:
            return GREEN_MED
        if value <= 180:
            return BORDERLINE
        return RED
    if reading_type in ('Post-Breakfast', 'Post-Lunch', 'Post-Dinner'):
        if value <= 180:
            return GREEN_MED
        if value <= 250:
            return BORDERLINE
        return RED
    if reading_type == 'Bedtime':
        if value <= 140:
            return GREEN_MED
        if value <= 180:
            return BORDERLINE
        return RED
    if value <= 130:
        return GREEN_MED
    if value <= 180:
        return BORDERLINE
    return RED


BORDERLINE = HexColor('#C47A20')


def _fmt_symptoms(symptoms: List[Dict[str, Any]]) -> str:
    best = {}
    for s in symptoms:
        name = s.get("symptom", "")
        if not name:
            continue
        sev = int(s.get("severity", 0) or 0)
        if name not in best or sev > best[name]:
            best[name] = sev
    if not best:
        return ""
    return ", ".join(f"{name} ({sev}/10)" for name, sev in sorted(best.items(), key=lambda x: x[1], reverse=True))


def _fmt_family_history(patient: Dict[str, Any]) -> str:
    details = patient.get("family_history_details")
    if details:
        try:
            entries = json.loads(details)
            if isinstance(entries, list) and entries:
                return ", ".join(f"{e['relation']}: {e['condition']}" for e in entries if e.get("relation") and e.get("condition"))
        except Exception:
            pass
        if isinstance(details, str) and details.strip():
            return details
    if patient.get("family_history"):
        return "type 2 diabetes in a family member"
    return ""


def _fmt_medications(medications: List[Dict[str, Any]]) -> str:
    parts = []
    for m in medications:
        name = m.get("name", "")
        dose = m.get("dose", "")
        times = "; ".join(t.strip() for t in (m.get("times") or "").split(",") if t.strip())
        entry = " ".join(x for x in [name, dose, times] if x)
        if entry:
            parts.append(entry.strip())
    return parts


def build_patient_history(data: Dict[str, Any]) -> str:
    patient = data.get("patient", {})
    medications = data.get("medications", [])
    symptoms = data.get("symptoms", [])
    adherence_pct = data.get("adherence_pct")

    age = patient.get("age")
    sex = (patient.get("sex") or "").strip().lower()
    if sex.startswith("m"):
        subj_pr, poss = "He", "His"
    elif sex.startswith("f"):
        subj_pr, poss = "She", "Her"
    else:
        subj_pr, poss = "The patient", "Their"

    diag_date = patient.get("diagnosis_date")
    diabetes_type = patient.get("diabetes_type")
    type_str = f" type {diabetes_type}" if diabetes_type else ""

    known = ""
    if diag_date:
        try:
            diag_dt = datetime.strptime(diag_date, "%Y-%m-%d").date()
            total_m = (date.today().year - diag_dt.year) * 12 + (date.today().month - diag_dt.month)
            if total_m <= 3:
                status = "newly diagnosed"
                dur = f" for {total_m} month{'s' if total_m > 1 else ''}" if total_m > 0 else ""
            else:
                status = "known"
                yr, rm = divmod(max(total_m, 0), 12)
                if yr > 0 and rm > 0:
                    dur = f" for {yr} year{'s' if yr > 1 else ''} and {rm} month{'s' if rm > 1 else ''}"
                elif yr > 0:
                    dur = f" for {yr} year{'s' if yr > 1 else ''}"
                else:
                    dur = f" for {rm} month{'s' if rm > 1 else ''}"
            known = f"{status}{type_str} diabetes patient{dur}"
        except Exception:
            known = f"known{type_str} diabetes patient"
    else:
        known = f"known{type_str} diabetes patient" if type_str else "known diabetes patient"

    parts = []
    age_str = f"{age} years old" if age else "an adult"
    sex_lbl = sex or "patient"
    parts.append(f"This is a {age_str} {sex_lbl} who is a {known}.")
    other_conditions = patient.get("other_conditions")
    if other_conditions:
        parts.append(f"{subj_pr} also has {other_conditions}.")

    med_str = _fmt_medications(medications)
    if med_str:
        parts.append(f"Currently on {'; '.join(med_str)}.")
    elif medications is None or len(medications) == 0:
        parts.append("Currently on no medications.")

    if adherence_pct is not None:
        status = "adherent" if adherence_pct >= 80 else "non-adherent"
        parts.append(f"{subj_pr} is {status} ({adherence_pct}% medication adherence).")

    symp_str = _fmt_symptoms(symptoms)
    if symp_str:
        parts.append(f"Currently, {subj_pr.lower()} presented {symp_str}.")
    else:
        parts.append(f"{subj_pr} has no pertinent medical history.")

    family = _fmt_family_history(patient)
    if family:
        parts.append(f"{subj_pr} has a family history of {family}.")

    staple = patient.get("staple_diet")
    if staple:
        parts.append(f"{poss} diet consists of {staple}.")

    return " ".join(parts)


def build_report_data(patient: Patient, db: Session, days: int = 90) -> Dict[str, Any]:
    cutoff = datetime.utcnow() - timedelta(days=days)
    pid = str(patient.id)

    glucose_rows = db.execute(
        text(
            """
            SELECT id, patient_id, value, reading_type, timestamp, symptoms
            FROM glucose_log
            WHERE patient_id = :pid AND timestamp >= :cutoff
            ORDER BY timestamp ASC
            """
        ),
        {"pid": pid, "cutoff": cutoff},
    ).fetchall()

    glucose_by_day: Dict[str, Dict[str, Any]] = {}
    all_values = []
    fasting_values = []
    for row in glucose_rows:
        ts = row.timestamp
        if not ts:
            continue
        day_key = ts.date().isoformat()
        if day_key not in glucose_by_day:
            glucose_by_day[day_key] = {"date": day_key}
        glucose_by_day[day_key][row.reading_type] = float(row.value)
        all_values.append(float(row.value))
        if row.reading_type == "Fasting":
            fasting_values.append(float(row.value))

    glucose_readings = []
    for day_key in sorted(glucose_by_day.keys()):
        day_data = glucose_by_day[day_key]
        entry = (
            day_key,
            day_data.get("Fasting"),
            day_data.get("Post-Breakfast"),
            day_data.get("Pre-Lunch"),
            day_data.get("Post-Lunch"),
            day_data.get("Pre-Dinner"),
            day_data.get("Bedtime"),
        )
        glucose_readings.append(entry)

    avg_by_type = {}
    type_rows = db.execute(
        text(
            """
            SELECT reading_type, AVG(value) as avg_val
            FROM glucose_log
            WHERE patient_id = :pid AND timestamp >= :cutoff
            GROUP BY reading_type
            """
        ),
        {"pid": pid, "cutoff": cutoff},
    ).fetchall()
    for row in type_rows:
        avg_by_type[row.reading_type] = round(float(row.avg_val), 1)

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

    weekly_fasting = []
    for i in range(0, len(fasting_values), 7):
        chunk = fasting_values[i:i + 7]
        weekly_fasting.append(round(sum(chunk) / len(chunk), 1))

    hba1c_est = round((sum(all_values) / len(all_values) + 46.7) / 28.7, 1) if all_values else 0

    hba1c_lab = round(float(patient.hba1c), 1) if patient.hba1c else None

    medication_rows = db.execute(
        text(
            """
            SELECT id, name, dose, frequency, times, taken_times, skipped_times, taken_today, created_at
            FROM medication
            WHERE patient_id = :pid
            ORDER BY created_at DESC
            """
        ),
        {"pid": pid},
    ).fetchall()

    medications = []
    adherence_pct = None
    adherence_doses = 0
    adherence_total = 0
    for row in medication_rows:
        scheduled = [t.strip() for t in (row.times or "").split(",") if t.strip()]
        taken = [t.strip() for t in (row.taken_times or "").split(",") if t.strip()]
        skipped = [t.strip() for t in (row.skipped_times or "").split(",") if t.strip()]
        done = len(taken) + len(skipped)
        total = len(scheduled)
        if total > 0:
            adherence_doses += done
            adherence_total += total
        elif row.taken_today:
            adherence_doses += 1
            adherence_total += 1
        medications.append({
            "name": row.name,
            "dose": row.dose,
            "times": row.times,
            "adherent": done >= total if total > 0 else bool(row.taken_today),
        })
    if adherence_total > 0:
        adherence_pct = round(adherence_doses / adherence_total * 100)

    symptom_rows = db.execute(
        text(
            """
            SELECT id, name, severity, timestamp
            FROM symptom_log
            WHERE patient_id = :pid AND timestamp >= :cutoff
            ORDER BY timestamp DESC
            """
        ),
        {"pid": pid, "cutoff": cutoff},
    ).fetchall()

    symptoms = []
    for row in symptom_rows:
        ts = row.timestamp
        d_str = ts.strftime("%b %d") if ts else ""
        symptoms.append({
            "date": d_str,
            "symptom": row.name,
            "severity": row.severity,
        })

    total_readings = len(glucose_rows)

    return {
        "patient": {
            "full_name": patient.full_name,
            "age": patient.age,
            "sex": patient.sex,
            "bmi": patient.bmi,
            "email": patient.email,
            "language": "English",
            "timezone": patient.timezone or "Africa/Addis_Ababa",
            "diagnosis_date": patient.diagnosis_date.isoformat() if patient.diagnosis_date else None,
            "diabetes_type": patient.diabetes_type,
            "other_conditions": patient.other_conditions,
            "family_history": patient.family_history,
            "family_history_details": patient.family_history_details,
            "staple_diet": patient.staple_diet,
        },
        "adherence_pct": adherence_pct,
        "period_label": f"{days}-day summary",
        "generated_date": datetime.utcnow().strftime("%B %d, %Y"),
        "glucose_summary": {
            "total_readings": total_readings,
            "avg_fasting": avg_by_type.get("Fasting"),
            "avg_post_breakfast": avg_by_type.get("Post-Breakfast"),
            "avg_pre_lunch": avg_by_type.get("Pre-Lunch"),
            "avg_post_lunch": avg_by_type.get("Post-Lunch"),
            "avg_pre_dinner": avg_by_type.get("Pre-Dinner"),
            "avg_bedtime": avg_by_type.get("Bedtime"),
            "days_in_range": days_in_range,
            "days_high": days_high,
            "days_low": days_low,
            "hba1c_est": hba1c_est,
            "hba1c_lab": hba1c_lab,
        },
        "weekly_fasting": [("Wk " + str(i + 1), v) for i, v in enumerate(weekly_fasting)],
        "glucose_readings": glucose_readings,
        "medications": medications,
        "symptoms": symptoms,
    }


def generate_pdf(data: Dict[str, Any]) -> bytes:
    patient_info = data.get("patient", {})
    period_label = data.get("period_label", "90-day summary")
    generated_date = data.get("generated_date", datetime.utcnow().strftime("%B %d, %Y"))
    gs = data.get("glucose_summary", {})
    weekly_fasting = data.get("weekly_fasting", [])
    glucose_readings = data.get("glucose_readings", [])
    medications = data.get("medications", [])
    symptoms = data.get("symptoms", [])

    import io

    def do_render(buf: io.BytesIO, total_pgs: int) -> int:
        c = canvas.Canvas(buf, pagesize=A4)
        page_num = 1

        def draw_header(c):
            c.setFillColor(GREEN_DARK)
            c.rect(0, H - HEADER_H, W, HEADER_H, fill=1, stroke=0)
            c.setFillColor(GREEN_MED)
            c.rect(0, H - HEADER_H - 1.5 * mm, W, 1.5 * mm, fill=1, stroke=0)
            logo_x = M_L
            logo_y = H - HEADER_H + 10 * mm
            logo_size = 22 * mm
            c.setFillColor(HexColor('#0F5C47'))
            c.roundRect(logo_x, logo_y, logo_size, logo_size, 4 * mm, fill=1, stroke=0)
            cx = logo_x + logo_size / 2
            cy = logo_y + logo_size / 2
            arm = logo_size * 0.22
            inner = logo_size * 0.5
            c.setFillColor(white)
            c.roundRect(cx - arm / 2, cy - inner / 2, arm, inner, arm / 2, fill=1, stroke=0)
            c.roundRect(cx - inner / 2, cy - arm / 2, inner, arm, arm / 2, fill=1, stroke=0)
            spark_cx = cx + inner * 0.35
            spark_cy = cy + inner * 0.35
            c.setFillColor(GOLD)
            c.circle(spark_cx, spark_cy, logo_size * 0.14, fill=1, stroke=0)
            c.setFillColor(white)
            c.circle(spark_cx, spark_cy, logo_size * 0.07, fill=1, stroke=0)
            text_x = logo_x + logo_size + 5 * mm
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", 18)
            c.drawString(text_x, logo_y + logo_size - 6 * mm, "Tena AI")
            c.setFont("Helvetica", 9)
            c.setFillColor(HexColor('#A8CFC3'))
            c.drawString(text_x, logo_y + logo_size - 11 * mm, "Health Report")
            pr_x = W - M_R
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", 14)
            c.drawRightString(pr_x, logo_y + logo_size - 6 * mm, patient_info.get("full_name", "N/A"))
            c.setFont("Helvetica", 9)
            c.setFillColor(HexColor('#A8CFC3'))
            c.drawRightString(pr_x, logo_y + logo_size - 11 * mm, f"{period_label}  ·  Generated {generated_date}")
            c.drawRightString(pr_x, logo_y + logo_size - 16 * mm, f"Age {patient_info.get('age', 'N/A')}  ·  {patient_info.get('sex', 'N/A')}  ·  BMI {patient_info.get('bmi', 'N/A')}")
            c.drawRightString(pr_x, logo_y + logo_size - 21 * mm, f"{patient_info.get('language', 'English')}  ·  {patient_info.get('timezone', 'Africa/Addis_Ababa')}")
            c.setStrokeColor(GOLD)
            c.setLineWidth(2)
            c.line(M_L, H - HEADER_H - 1.5 * mm - 1 * mm, W - M_R, H - HEADER_H - 1.5 * mm - 1 * mm)

        def draw_footer(c, pn, tp):
            c.setStrokeColor(GRAY_BORDER)
            c.setLineWidth(0.5)
            c.line(M_L, M_B + 8 * mm, W - M_R, M_B + 8 * mm)
            c.setFont("Helvetica", 7)
            c.setFillColor(TEXT_MUTED)
            c.drawString(M_L, M_B + 2 * mm, "This report is for informational purposes only. Consult your healthcare provider for medical advice.")
            c.setFont("Helvetica-Bold", 8)
            c.setFillColor(GREEN_DARK)
            c.drawRightString(W - M_R, M_B + 2 * mm, f"Page {pn} of {tp}")

        def new_page():
            nonlocal page_num
            c.showPage()
            page_num += 1
            draw_header(c)
            draw_footer(c, page_num, total_pgs)
            return CONTENT_TOP

        y = CONTENT_TOP

        def draw_section_title(title):
            nonlocal y
            c.setFillColor(GREEN_DARK)
            c.rect(M_L, y - 5 * mm, 3 * mm, 5 * mm, fill=1, stroke=0)
            c.setFillColor(GREEN_DARK)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(M_L + 5 * mm, y - 3.5 * mm, title.upper())
            c.setStrokeColor(GRAY_BORDER)
            c.setLineWidth(0.5)
            c.line(M_L, y - 8 * mm, W - M_R, y - 8 * mm)
            y = y - 16 * mm

        def check_space(needed_mm):
            nonlocal y
            if y < FOOTER_CLEAR + needed_mm * mm:
                y = new_page()

        def draw_stat_cards():
            nonlocal y
            check_space(40)
            draw_section_title("Glucose Overview")
            card_w = (CONTENT_W - 3 * 8 * mm) / 4
            card_h = 20 * mm
            card_y = y - card_h
            cards = [
                ("Total Readings", str(gs.get("total_readings", 0)), "readings", GREEN_DARK, GREEN_XLIGHT),
                ("HbA1c", f"{gs.get('hba1c_lab') or gs.get('hba1c_est', 0)}%", ("lab result" if gs.get("hba1c_lab") else "estimated"), GREEN_MED, GREEN_XLIGHT),
                ("Days In Range", f"{gs.get('days_in_range', 0)}", "days", GREEN_MED, GREEN_XLIGHT),
                ("Days Above Range", f"{gs.get('days_high', 0)}", "days", RED, RED_LIGHT),
            ]
            for i, (title, value, unit, val_color, bg) in enumerate(cards):
                cx = M_L + i * (card_w + 8 * mm)
                c.setFillColor(bg)
                c.roundRect(cx, card_y, card_w, card_h, 3 * mm, fill=1, stroke=0)
                c.setStrokeColor(GRAY_BORDER)
                c.setLineWidth(0.5)
                c.roundRect(cx, card_y, card_w, card_h, 3 * mm, fill=0, stroke=1)
                c.setFillColor(val_color)
                c.setFont("Helvetica-Bold", 16)
                c.drawCentredString(cx + card_w / 2, card_y + card_h - 8 * mm, value)
                c.setFillColor(TEXT_MUTED)
                c.setFont("Helvetica", 7)
                c.drawCentredString(cx + card_w / 2, card_y + card_h - 12 * mm, unit)
                c.setFillColor(TEXT_MUTED)
                c.setFont("Helvetica", 7.5)
                c.drawCentredString(cx + card_w / 2, card_y + 3 * mm, title)
            y = card_y - 15 * mm

        def draw_avg_readings_table():
            nonlocal y
            check_space(80)
            draw_section_title("Average Readings by Time of Day")
            header_h = 7 * mm
            row_h = 9 * mm
            col_x = [M_L, M_L + 48 * mm, M_L + 78 * mm, M_L + 130 * mm]
            col_w = [48 * mm, 30 * mm, 52 * mm, 36 * mm]
            c.setFillColor(GREEN_DARK)
            c.roundRect(M_L, y - header_h, CONTENT_W, header_h, 2 * mm, fill=1, stroke=0)
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", 8)
            headers = ["Reading Type", "Average", "Target (mg/dL)", "Status"]
            for i, h in enumerate(headers):
                c.drawString(col_x[i] + 3 * mm, y - header_h + 2.5 * mm, h)
            y -= header_h
            reading_data = [
                ("\u2600 Fasting", "avg_fasting", 130),
                ("\U0001f373 Post-Breakfast", "avg_post_breakfast", 180),
                ("\U0001f550 Pre-Lunch", "avg_pre_lunch", 130),
                ("\U0001f37d Post-Lunch", "avg_post_lunch", 180),
                ("\U0001f319 Pre-Dinner", "avg_pre_dinner", 130),
                ("\U0001f634 Bedtime", "avg_bedtime", 140),
            ]
            for idx, (label, key, target) in enumerate(reading_data):
                check_space(12)
                val = gs.get(key)
                bg = GRAY_LIGHT if idx % 2 == 0 else white
                c.setFillColor(bg)
                c.rect(M_L, y - row_h, CONTENT_W, row_h, fill=1, stroke=0)
                c.setStrokeColor(GRAY_BORDER)
                c.setLineWidth(0.3)
                c.line(M_L, y - row_h, W - M_R, y - row_h)
                c.setFillColor(BLACK)
                c.setFont("Helvetica", 8)
                c.drawString(col_x[0] + 3 * mm, y - row_h + 2.5 * mm, label)
                if val is not None:
                    diff = val - target
                    if diff <= 0:
                        val_color = GREEN_MED; status = "In Range"; pill_bg = GREEN_XLIGHT; pill_text = GREEN_MED
                    elif diff <= 30:
                        val_color = AMBER; status = "Borderline"; pill_bg = AMBER_LIGHT; pill_text = AMBER
                    else:
                        val_color = RED; status = "High"; pill_bg = RED_LIGHT; pill_text = RED
                    c.setFillColor(val_color)
                    c.setFont("Helvetica-Bold", 11)
                    c.drawCentredString(col_x[1] + col_w[1] / 2, y - row_h + 2.5 * mm, f"{val}")
                    c.setFillColor(TEXT_MUTED)
                    c.setFont("Helvetica", 7)
                    c.drawCentredString(col_x[1] + col_w[1] / 2 + 15 * mm, y - row_h + 2.5 * mm, "mg/dL")
                    c.setFillColor(white)
                    c.setFont("Helvetica", 7)
                    c.drawCentredString(col_x[2] + col_w[2] / 2, y - row_h + 2.5 * mm, str(target))
                    pill_x = col_x[3] + (col_w[3] - 18 * mm) / 2
                    c.setFillColor(pill_bg)
                    c.roundRect(pill_x, y - row_h + 2 * mm, 18 * mm, 5 * mm, 2 * mm, fill=1, stroke=0)
                    c.setFillColor(pill_text)
                    c.setFont("Helvetica-Bold", 7.5)
                    c.drawCentredString(pill_x + 9 * mm, y - row_h + 3.5 * mm, status)
                else:
                    c.setFillColor(TEXT_MUTED)
                    c.setFont("Helvetica", 11)
                    c.drawCentredString(col_x[1] + col_w[1] / 2, y - row_h + 2.5 * mm, "\u2014")
                    c.setFillColor(white)
                    c.drawCentredString(col_x[2] + col_w[2] / 2, y - row_h + 2.5 * mm, str(target))
                    c.drawCentredString(col_x[3] + col_w[3] / 2, y - row_h + 2.5 * mm, "\u2014")
                y -= row_h
            c.setStrokeColor(GRAY_BORDER)
            c.setLineWidth(0.5)
            c.roundRect(M_L, y, CONTENT_W, row_h * 6, 2 * mm, fill=0, stroke=1)
            y -= 10 * mm

        def draw_90day_table():
            nonlocal y
            check_space(60)
            c.setFillColor(TEXT_MUTED)
            c.setFont("Helvetica", 7.5)
            c.drawRightString(W - M_R, y, "All values in mg/dL")
            legend_y = y - 6 * mm
            c.setFont("Helvetica", 7)
            items = [
                (GREEN_MED, "Normal (80\u2013130)"), (BORDERLINE, "Borderline"),
                (AMBER, "Low (<80)"), (RED, "High (>180)"),
            ]
            lx = M_L
            for col, txt in items:
                c.setFillColor(col)
                c.circle(lx + 3 * mm, legend_y + 1.5 * mm, 2.5, fill=1, stroke=0)
                c.setFillColor(TEXT_MUTED)
                c.drawString(lx + 8 * mm, legend_y - 1 * mm, txt)
                lx += 35 * mm
            y = legend_y - 8 * mm
            header_h = 7 * mm
            row_h = 7.5 * mm
            col_x = [M_L, M_L + 22 * mm, M_L + 44 * mm, M_L + 66 * mm, M_L + 92 * mm, M_L + 118 * mm, M_L + 144 * mm]
            col_w = [22 * mm, 22 * mm, 22 * mm, 26 * mm, 26 * mm, 26 * mm, 22 * mm]

            def draw_table_header(y_pos):
                c.setFillColor(GREEN_DARK)
                c.roundRect(M_L, y_pos - header_h, CONTENT_W, header_h, 2 * mm, fill=1, stroke=0)
                c.setFillColor(white)
                c.setFont("Helvetica-Bold", 7.5)
                headers = ["Date", "Fasting", "Post-B'fast", "Pre-Lunch", "Post-Lunch", "Pre-Dinner", "Bedtime"]
                for i, h in enumerate(headers):
                    c.drawCentredString(col_x[i] + col_w[i] / 2, y_pos - header_h + 2 * mm, h)
                return y_pos - header_h

            def draw_outer_border(y_top, y_bottom):
                c.setStrokeColor(GRAY_BORDER)
                c.setLineWidth(0.5)
                c.roundRect(M_L, y_bottom, CONTENT_W, y_top - y_bottom, 2 * mm, fill=0, stroke=1)

            y = draw_table_header(y)
            table_top = y + header_h
            for idx, row in enumerate(glucose_readings):
                if y < FOOTER_CLEAR + 5 * mm:
                    draw_outer_border(table_top, y + row_h)
                    y = new_page()
                    c.setFillColor(TEXT_MUTED)
                    c.setFont("Helvetica-Bold", 10)
                    c.drawString(M_L + 5 * mm, y - 3.5 * mm, "90-DAY GLUCOSE READINGS (CONTINUED)".upper())
                    c.setStrokeColor(GRAY_BORDER)
                    c.setLineWidth(0.5)
                    c.line(M_L, y - 8 * mm, W - M_R, y - 8 * mm)
                    y = y - 16 * mm
                    y = draw_table_header(y)
                    table_top = y + header_h
                date_str = row[0]
                vals = row[1:]
                reading_types = ["Fasting", "Post-Breakfast", "Pre-Lunch", "Post-Lunch", "Pre-Dinner", "Bedtime"]
                bg = GRAY_LIGHT if idx % 2 == 0 else white
                c.setFillColor(bg)
                c.rect(M_L, y - row_h, CONTENT_W, row_h, fill=1, stroke=0)
                c.setStrokeColor(GRAY_BORDER)
                c.setLineWidth(0.25)
                c.line(M_L, y - row_h, W - M_R, y - row_h)
                c.setFillColor(BLACK)
                c.setFont("Helvetica-Bold", 8)
                c.drawString(col_x[0] + 2 * mm, y - row_h + 1.5 * mm, date_str)
                for i, (val, rt) in enumerate(zip(vals, reading_types)):
                    if val is not None:
                        color = glucose_color(val, rt)
                        c.setFillColor(color)
                        c.setFont("Helvetica-Bold", 8.5)
                    else:
                        c.setFillColor(TEXT_MUTED)
                        c.setFont("Helvetica", 8.5)
                    c.drawCentredString(col_x[i + 1] + col_w[i + 1] / 2, y - row_h + 1.5 * mm, str(val) if val is not None else "")
                y -= row_h
            draw_outer_border(table_top, y)
            y -= 10 * mm

        def draw_medications():
            nonlocal y
            if not medications: return
            check_space(30)
            draw_section_title("Medications")
            card_w = CONTENT_W / 2 - 3 * mm
            card_h = 13 * mm
            for i, med in enumerate(medications):
                check_space(20)
                row = i // 2
                col = i % 2
                cx = M_L + col * (card_w + 6 * mm)
                cy = y - row * (card_h + 4 * mm) - card_h
                c.setFillColor(GREEN_XLIGHT)
                c.roundRect(cx, cy, card_w, card_h, 2 * mm, fill=1, stroke=0)
                c.setStrokeColor(GREEN_LIGHT)
                c.setLineWidth(1)
                c.roundRect(cx, cy, card_w, card_h, 2 * mm, fill=0, stroke=1)
                c.setFillColor(GREEN_DARK)
                c.roundRect(cx, cy, 2.5, card_h, 2 * mm, fill=1, stroke=0)
                c.setFillColor(BLACK)
                c.setFont("Helvetica-Bold", 10)
                c.drawString(cx + 6 * mm, cy + 5 * mm, f"{med['name']}  {med['dose']}")
                c.setFillColor(TEXT_MUTED)
                c.setFont("Helvetica", 8)
                c.drawString(cx + 6 * mm, cy + 1.5 * mm, med['times'])
            y = y - ((len(medications) + 1) // 2) * (card_h + 4 * mm) - 10 * mm

        def draw_symptoms():
            nonlocal y
            if not symptoms: return
            check_space(30)
            draw_section_title("Reported Symptoms")

            grouped = {}
            for sym in symptoms:
                day = sym['date']
                name = sym['symptom']
                sev = int(sym['severity'] or 0)
                if day not in grouped:
                    grouped[day] = {}
                grouped[day][name] = max(grouped[day].get(name, 0), sev)

            ordered = sorted(grouped.items(), key=lambda kv: kv[0], reverse=True)

            date_col_x = M_L
            date_col_w = 24 * mm
            sym_x = M_L + date_col_w + 3 * mm
            sym_w = CONTENT_W - date_col_w - 3 * mm
            lh = 5 * mm

            for day, items in ordered:
                sym_parts = ", ".join(f"{n} ({s}/10)" for n, s in sorted(items.items(), key=lambda x: x[1], reverse=True))
                words = sym_parts.split()
                lines, cur = [], []
                for w in words:
                    test = " ".join(cur + [w])
                    if stringWidth(test, "Helvetica", 9) > sym_w and cur:
                        lines.append(" ".join(cur))
                        cur = [w]
                    else:
                        cur.append(w)
                if cur:
                    lines.append(" ".join(cur))
                row_h = max(len(lines), 1) * lh + 6 * mm

                if y - row_h < FOOTER_CLEAR:
                    y = new_page()
                    draw_section_title("Reported Symptoms (continued)")

                c.setFillColor(TEXT_MUTED)
                c.setFont("Helvetica-Bold", 8)
                c.drawString(date_col_x, y - 3 * mm, day)

                c.setFillColor(BLACK)
                c.setFont("Helvetica-Bold", 9)
                for i, line in enumerate(lines):
                    c.drawString(sym_x, y - 3 * mm - i * lh, line)

                y -= row_h
            y -= 10 * mm

        def draw_clinical_summary():
            nonlocal y
            check_space(65)
            if y < FOOTER_CLEAR + 65 * mm:
                y = new_page()
            draw_section_title("Clinical Summary")
            box_h = 24 * mm
            box_y = y - box_h
            c.setFillColor(BLUE_LIGHT)
            c.roundRect(M_L, box_y, CONTENT_W, box_h, 3 * mm, fill=1, stroke=0)
            c.setStrokeColor(BLUE)
            c.setLineWidth(0.8)
            c.roundRect(M_L, box_y, CONTENT_W, box_h, 3 * mm, fill=0, stroke=1)
            c.setFillColor(BLUE)
            c.roundRect(M_L, box_y, 2.5, box_h, 3 * mm, fill=1, stroke=0)
            c.setFillColor(BLUE)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(M_L + 6 * mm, box_y + box_h - 5.5 * mm, "Clinical Summary for Healthcare Provider")
            fasting_avg = gs.get('avg_fasting')
            post_b_avg = gs.get('avg_post_breakfast')
            meds_str = ", ".join([m['name'] for m in medications]) if medications else "None"
            lines = []
            if fasting_avg is not None:
                if fasting_avg < 130: lines.append(f"Fasting average ({fasting_avg} mg/dL) is within target range (<130 mg/dL).")
                else: lines.append(f"Fasting average ({fasting_avg} mg/dL) exceeds target (130 mg/dL). Consider medication adjustment.")
            if post_b_avg is not None:
                if post_b_avg < 180: lines.append(f"Post-breakfast average ({post_b_avg} mg/dL) is within target (<180 mg/dL).")
                else: lines.append(f"Post-breakfast average ({post_b_avg} mg/dL) exceeds target (180 mg/dL). Review carbohydrate intake.")
            lines.append(f"Current medications: {meds_str}.")
            lines.append("Recommendation: Maintain consistent meal timing and glucose monitoring. Follow up with provider for HbA1c review.")
            c.setFillColor(BLACK)
            c.setFont("Helvetica", 8.5)
            ty = box_y + box_h - 10 * mm
            for line in lines[:4]:
                c.drawString(M_L + 6 * mm, ty, line)
                ty -= 4 * mm
            y = box_y - 10 * mm

        def draw_patient_history():
            nonlocal y
            history_text = build_patient_history(data)
            avail_w = CONTENT_W - 10 * mm
            words = history_text.split()
            lines, cur = [], []
            for w in words:
                test = " ".join(cur + [w])
                if stringWidth(test, "Helvetica", 9) > avail_w and cur:
                    lines.append(" ".join(cur))
                    cur = [w]
                else:
                    cur.append(w)
            if cur:
                lines.append(" ".join(cur))
            lh = 5 * mm
            card_h = len(lines) * lh + 14 * mm

            check_space(card_h / mm + 10)
            draw_section_title("Patient History")
            c.setFillColor(BLUE_LIGHT)
            c.roundRect(M_L, y - card_h, CONTENT_W, card_h, 3 * mm, fill=1, stroke=0)
            c.setStrokeColor(BLUE)
            c.setLineWidth(0.8)
            c.roundRect(M_L, y - card_h, CONTENT_W, card_h, 3 * mm, fill=0, stroke=1)
            c.setFillColor(BLUE)
            c.roundRect(M_L, y - card_h, 2.5, card_h, 1.5, fill=1, stroke=0)
            c.setFont("Helvetica", 9)
            c.setFillColor(BLACK)
            for i, line in enumerate(lines):
                c.drawString(M_L + 5 * mm, y - 7 * mm - i * lh, line)
            y = y - card_h - 8 * mm

        def run():
            nonlocal page_num, y
            page_num = 1
            y_new = CONTENT_TOP
            dl = draw_section_title
            draw_header(c)
            draw_footer(c, page_num, total_pgs)
            draw_patient_history()
            draw_stat_cards()
            draw_avg_readings_table()

            draw_section_title("90-Day Glucose Readings")
            draw_90day_table()
            draw_medications()
            draw_symptoms()
            draw_clinical_summary()
            c.showPage()
            c.save()
            return page_num

        return run()

    tmp = io.BytesIO()
    actual_pages = do_render(tmp, 1)

    tmp.seek(0)
    from pypdf import PdfReader
    reader = PdfReader(tmp)
    total_pages_actual = len(reader.pages)

    final_buf = io.BytesIO()
    do_render(final_buf, total_pages_actual)
    final_buf.seek(0)
    return final_buf.read()
