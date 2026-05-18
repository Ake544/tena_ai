# DiabeTrack — full architecture

> Ethiopian Type 2 diabetes assistant app — 100% free stack  
> Mobile: Expo + React Native | Backend: FastAPI | AI: Groq (Llama 3.3 70B) | DB: PostgreSQL

---

## Table of contents

1. [Stack summary](#1-stack-summary)
2. [System overview](#2-system-overview)
3. [Layer breakdown](#3-layer-breakdown)
4. [Daily data flow](#4-daily-data-flow)
5. [AI engine](#5-ai-engine)
6. [Alert engine](#6-alert-engine)
7. [Tip generator](#7-tip-generator)
8. [Database schema](#8-database-schema)
9. [Auth flow](#9-auth-flow)
10. [Notification system](#10-notification-system)
11. [Doctor PDF export](#11-doctor-pdf-export)
12. [What the app does NOT do](#12-what-the-app-does-not-do)

---

## 1. Stack summary

| Layer | Tool | Cost |
|---|---|---|
| Mobile | Expo + React Native (iOS + Android) | Free |
| Language | i18next — Amharic + English | Free |
| Offline store | SQLite (expo-sqlite) + MMKV | Free |
| Backend | FastAPI (Python) | Free |
| Auth | Email + bcrypt + JWT | Free |
| Email sending | Resend (3,000/month free) | Free |
| Push notifications | Expo Notifications + FCM/APNS | Free |
| LLM | Groq API — Llama 3.3 70B | Free tier |
| Vector store | FAISS (local) | Free |
| Database | PostgreSQL (self-hosted) | Free |
| Cache | Redis (self-hosted) | Free |
| Object storage | Cloudflare R2 (10GB free) | Free |
| PDF generation | reportlab (Python) | Free |
| Hosting | Railway / Render free tier | Free to start |

---

## 2. System overview

```
┌─────────────────────────────────────────────────────────┐
│                     MOBILE CLIENT                       │
│  Expo + React Native — iOS & Android                    │
│                                                         │
│  ┌──────────────┐ ┌────────────┐ ┌───────────────────┐  │
│  │ Offline store│ │    i18n    │ │   Notifications   │  │
│  │SQLite / MMKV │ │ AM + EN    │ │   Expo push       │  │
│  └──────────────┘ └────────────┘ └───────────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │              PDF viewer (doctor report)          │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS + JWT
┌─────────────────────────▼───────────────────────────────┐
│                   FASTAPI GATEWAY                       │
│          Auth · Rate limiting · Routing                 │
└──────┬──────────────┬───────────────┬───────────────────┘
       │              │               │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────────────┐
│ Auth service│ │  Patient   │ │     Export service     │
│ Email+JWT   │ │  service   │ │   PDF via reportlab    │
│ bcrypt      │ │  Glucose   │ │                        │
└─────────────┘ │  Meds      │ └────────────────────────┘
                │  Symptoms  │
                └─────┬──────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     AI ENGINE                           │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │    Tip generator     │  │     Alert engine         │ │
│  │ Groq Llama 3.3 70B   │  │   Rule-based (no LLM)    │ │
│  │ FAISS RAG            │  │   Severity classifier    │ │
│  └──────────────────────┘  └──────────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    DATA LAYER                           │
│                                                         │
│  ┌──────────────┐ ┌────────┐ ┌───────────┐ ┌────────┐  │
│  │  PostgreSQL  │ │ Redis  │ │  CF R2    │ │ Resend │  │
│  │  All patient │ │Sessions│ │  PDFs +   │ │ Email  │  │
│  │  data        │ │+ cache │ │  backups  │ │        │  │
│  └──────────────┘ └────────┘ └───────────┘ └────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Layer breakdown

### Mobile (Expo + React Native)

- Single codebase for iOS and Android
- `expo-sqlite` for offline glucose/medication logging — syncs to backend when internet available
- `i18next` for Amharic/English toggle, stored in user preferences
- `expo-notifications` for push reminders (medication, follow-up, glucose logging nudge)
- PDF viewer screen to display doctor report downloaded from backend

### API gateway (FastAPI)

- Single entry point for all mobile requests
- JWT middleware validates token on every protected route
- Rate limiting per user to prevent abuse
- Routes requests to the correct service module

### Core services (FastAPI modules)

| Service | Responsibility |
|---|---|
| Auth service | Signup, login, email verification, password reset, JWT issue/refresh |
| Patient service | Profile CRUD, glucose log, medication log, symptom log |
| Alert engine | Runs on every new glucose log, evaluates rules, fires push if triggered |
| Export service | Generates PDF from patient history, uploads to R2, returns download URL |

### AI engine

Two completely separate systems — see sections 5, 6, and 7 for detail.

### Data layer

| Store | What lives there |
|---|---|
| PostgreSQL | All patient data — profile, glucose logs, medications, symptoms, tips, alerts, episodes |
| Redis | JWT session cache, Groq response cache (avoid duplicate calls same day) |
| Cloudflare R2 | Generated PDF reports, database backups |
| Resend | Transactional email only — verification + password reset |

---

## 4. Daily data flow

```
Patient logs glucose reading
         │
         ▼
Offline check
→ Save to SQLite first
→ Sync to FastAPI when online
         │
         ▼
FastAPI validates + saves to PostgreSQL
         │
         ├─────────────────────────┐
         ▼                         ▼
  Alert engine               Tip generator
  (runs immediately)         (runs once per tip slot)
         │                         │
         ▼                         ▼
  Triggered?              Progress detector
  → Push notification      → Decides story type
    to patient             → RAG retrieval
                           → Groq API call
                           → Tip in user language
         │                         │
         └──────────┬──────────────┘
                    ▼
         Stored in history
         (available for PDF export)
```

---

## 5. AI engine

The AI engine has two independent subsystems. They share no code and run independently.

**Tip generator** — uses Groq LLM. Generates story-driven, fact-based health tips personalized to the patient's current data and progress. See section 7.

**Alert engine** — purely rule-based Python. No LLM. Fast, deterministic, runs synchronously on every glucose log. See section 6.

---

## 6. Alert engine

No LLM involved. Pure Python rule evaluation. Runs on every new glucose log entry and every nightly medication check.

### Alert rules

| Condition | Severity | Message type |
|---|---|---|
| Fasting glucose > 250 mg/dL for 3+ consecutive days | Urgent | See a doctor soon |
| Any single reading < 70 mg/dL | Urgent | Eat something sweet now |
| Any single reading > 400 mg/dL | Urgent | Go to hospital now |
| Fasting glucose 126–250 mg/dL for 5+ days | Warning | Your readings have been high |
| Medication not logged for 2+ days | Warning | You may have missed your medication |
| Symptom: chest pain logged | Urgent | Seek medical attention today |
| Symptom: foot ulcer logged | Warning | Show your doctor at next visit |
| No glucose log for 3+ days | Info | Reminder to log today |

### Severity levels

- **Info** — gentle in-app notification, no push
- **Warning** — push notification, shown prominently in app
- **Urgent** — push notification with sound, full-screen alert in app, message to seek care

### Implementation

```python
def evaluate_alerts(patient_id: str, db: Session) -> list[Alert]:
    alerts = []
    logs = get_recent_logs(patient_id, days=5, db=db)
    
    # Hypoglycemia — immediate
    latest = logs[0] if logs else None
    if latest and latest.value_mgdl < 70:
        alerts.append(Alert(severity="urgent", message="..."))
    
    # Persistent hyperglycemia
    fasting = [l for l in logs if l.reading_type == "fasting"]
    if len(fasting) >= 3 and all(l.value_mgdl > 250 for l in fasting[:3]):
        alerts.append(Alert(severity="urgent", message="..."))
    
    return alerts
```

---

## 7. Tip generator

### Frequency by awareness level

| Awareness level | Tips per day | Assessed by |
|---|---|---|
| Low | 3 | Onboarding quiz score |
| Medium | 2 | Onboarding quiz score |
| High | 1 | Onboarding quiz score |

Awareness level is re-evaluated monthly based on quiz responses and engagement.

### Tip format — always story + fact

Every single tip, regardless of user state, follows this format:

> Short story (2–3 sentences) that connects to the user's specific data today + one embedded real medical fact + a closing sentence that either warns or reinforces.

The content of the story depends on the user's current progress state:

| Progress state | Story type | Emotional tone |
|---|---|---|
| Missed medication | Consequence story — what skipping does physiologically | Concerned, not guilt-tripping |
| Medication streak | Reinforcement story — what consistent meds are doing right now | Pride, specific |
| High glucose (trend) | Consequence story — what prolonged hyperglycemia does | Urgent but calm |
| Good glucose reading | Reinforcement story — why that number matters | Celebratory, specific |
| Skipped exercise | Opportunity story — what they're missing out on | Motivating |
| Poor diet logged | Educational story — postprandial spike mechanism | Informative |
| Neutral day | Educational story — based on weakest data area | Informative |

### Tip generator pipeline

```
1. Frequency decider
   → Read awareness level from patient profile
   → Determine how many tips to generate today (1, 2, or 3)

2. Progress detector (runs once per tip slot)
   → Read last 7 days: glucose logs, medication logs, exercise logs
   → Classify current state (see table above)
   → Select story type

3. FAISS RAG retrieval
   → Convert story type + patient state to a query
   → Retrieve most relevant chunk from diabetes knowledge base
   → Knowledge base sources: WHO guidelines, IDF Atlas,
     Ethiopian MOH diabetes protocol, peer-reviewed summaries

4. Groq API call
   → Model: llama-3.3-70b-versatile
   → Input: patient context + retrieved fact chunk + story type
   → Output: story-driven tip in structured format
   → Cache response in Redis (don't regenerate if data unchanged)

5. Language layer
   → If patient language = Amharic → translate tip
   → If patient language = English → return as-is

6. Store + deliver
   → Save tip to TIP table (patient_id, content, language, category, sent_at)
   → Push notification to patient
   → Display in app home screen
```

### Groq API call (Python)

```python
from groq import Groq

client = Groq(api_key=settings.GROQ_API_KEY)

def generate_tip(patient_context: dict, retrieved_fact: str, story_type: str, language: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a diabetes health educator for Ethiopian Type 2 diabetes patients. "
                    "Write a short tip (max 4 sentences) that tells a story and embeds one real medical fact. "
                    "Never suggest changing medication doses. Never diagnose. "
                    f"Write in {language}. Story type: {story_type}."
                )
            },
            {
                "role": "user",
                "content": f"Patient data: {patient_context}\nRelevant fact: {retrieved_fact}"
            }
        ],
        max_tokens=200
    )
    return response.choices[0].message.content
```

---

## 8. Database schema

### Tables

#### `patient`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| full_name | VARCHAR | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | bcrypt |
| email_verified | BOOLEAN | default false |
| language | VARCHAR | 'am' or 'en' |
| age | INT | |
| sex | VARCHAR | |
| bmi | FLOAT | calculated from height/weight |
| education_level | VARCHAR | 'low', 'medium', 'high' |
| family_history | BOOLEAN | |
| exercise_habit | VARCHAR | |
| staple_diet | TEXT | |
| created_at | TIMESTAMP | |

#### `glucose_log`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| patient_id | UUID FK → patient | |
| value_mgdl | FLOAT | mg/dL |
| reading_type | VARCHAR | fasting, post_breakfast, pre_lunch, post_lunch, pre_dinner, pre_sleep |
| logged_at | TIMESTAMP | |
| synced | BOOLEAN | for offline sync tracking |

#### `medication`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| patient_id | UUID FK → patient | |
| name | VARCHAR | e.g. metformin |
| dose | VARCHAR | e.g. 500mg |
| frequency | VARCHAR | e.g. twice daily |
| taken_today | BOOLEAN | reset nightly |
| updated_at | TIMESTAMP | |

#### `symptom_log`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| patient_id | UUID FK → patient | |
| symptom_type | VARCHAR | e.g. chest_pain, blurred_vision |
| severity | INT | 1–5 |
| logged_at | TIMESTAMP | |

#### `alert`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| patient_id | UUID FK → patient | |
| severity | VARCHAR | info, warning, urgent |
| message | TEXT | |
| acknowledged | BOOLEAN | |
| created_at | TIMESTAMP | |

#### `tip`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| patient_id | UUID FK → patient | |
| content | TEXT | |
| language | VARCHAR | |
| category | VARCHAR | consequence, reinforcement, educational |
| sent_at | TIMESTAMP | |

#### `episode`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| patient_id | UUID FK → patient | |
| type | VARCHAR | hypoglycemia, HHS, other |
| description | TEXT | |
| occurred_at | TIMESTAMP | |

### Relationships

```
patient ──< glucose_log
patient ──< medication
patient ──< symptom_log
patient ──< alert
patient ──< tip
patient ──< episode
```

---

## 9. Auth flow

```
SIGNUP
──────
1. User enters name, email, password
2. FastAPI hashes password with bcrypt
3. Creates patient row (email_verified = false)
4. Sends verification email via Resend
5. User clicks link → email_verified = true
6. JWT issued → user enters app

LOGIN
─────
1. User enters email + password
2. FastAPI checks bcrypt hash
3. JWT access token (15min) + refresh token (30 days) issued
4. Stored in secure storage on device (expo-secure-store)

PASSWORD RESET
──────────────
1. User requests reset → Resend sends reset link
2. User clicks link → enters new password
3. bcrypt rehash → new JWT issued
```

---

## 10. Notification system

All notifications sent via Expo push + FCM (Android) + APNS (iOS). All free.

| Notification | Trigger | Time |
|---|---|---|
| Medication reminder | Daily, configurable | User-set time |
| Glucose log nudge | If no log by 9am | 9:00 AM |
| Evening adherence check | Nightly | 9:00 PM |
| Follow-up reminder | 1 week + 1 day before date | Scheduled |
| Screening reminder | 1 week + 1 day before date | Scheduled |
| Daily tip | After tip generation | Morning |
| Alert (warning) | On alert engine trigger | Immediate |
| Alert (urgent) | On alert engine trigger | Immediate + sound |

---

## 11. Doctor PDF export

Patient can generate a report at any time from the app. Report is generated server-side, stored in Cloudflare R2, and a download link is returned.

### Report contents

1. Patient profile summary (name, age, BMI, diabetes type, medications)
2. Glucose log — last 90 days (table + line chart)
3. Medication adherence — last 30 days (percentage + calendar view)
4. Symptom history (if any logged)
5. Alert history (if any triggered)
6. Episode history (hypoglycemia, HHS)
7. Generated date + disclaimer: "This report was generated by DiabeTrack and is intended to assist your healthcare provider, not replace clinical judgment."

### Implementation

```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph

def generate_report(patient_id: str, db: Session) -> str:
    patient = get_patient(patient_id, db)
    glucose_logs = get_logs(patient_id, days=90, db=db)
    # ... build PDF with reportlab
    # upload to Cloudflare R2
    # return download URL
```

---

## 12. What the app does NOT do

- No diagnosis of any condition
- No prescription or medication dosage recommendations
- No changes to treatment plans
- No emergency response system (urgent alerts say "go to hospital" — nothing more)
- No billing or insurance features
- No doctor-facing interface (v1) — the PDF is patient-generated and patient-carried

---

## Free tier limits (at scale)

| Service | Free limit | Hits limit at |
|---|---|---|
| Groq API | 14,400 req/day (Llama 3.3 70B) | ~4,800 DAU (3 tips each) |
| Resend | 3,000 emails/month | ~3,000 new signups/month |
| Cloudflare R2 | 10GB storage | ~10,000 PDF reports |
| Expo push | Unlimited | Never |
| Railway/Render | 500hrs/month free | Upgrade at first users |

At Ethiopian pilot scale (target: 50–500 DAU), all free tiers are comfortably sufficient.
