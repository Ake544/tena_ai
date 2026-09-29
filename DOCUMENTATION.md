# Tenachin AI — Product Documentation

Version 1.0.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [The Problem](#2-the-problem)
3. [Core Features](#3-core-features)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Data Model](#6-data-model)
7. [API Reference](#7-api-reference)
8. [Authentication & Security](#8-authentication--security)
9. [Privacy & Compliance](#9-privacy--compliance)
10. [Deployment](#10-deployment)
11. [Development Setup](#11-development-setup)
12. [Monitoring & Operations](#12-monitoring--operations)
13. [Roadmap](#13-roadmap)
14. [Contact](#14-contact)

---

## 1. Overview

Tenachin AI (named "our health" in Amharic) is a free, AI-powered companion application for people living with Type 2 diabetes in Ethiopia. It combines glucose logging, medication and appointment tracking, personalized AI coaching, and clinician-ready PDF reports in a single mobile application available in English and Amharic.

The application is built by an Ethiopian developer and is designed specifically around the Ethiopian healthcare reality: local staple foods, medications available in Ethiopia, and the practical constraints patients face in managing a chronic condition.

Tenachin AI is not a medical device. It does not diagnose, prescribe, or replace a doctor. In an emergency, users are directed to call 911 or go to the nearest health facility.

---

## 2. The Problem

- Approximately **2.6 million** Ethiopians live with Type 2 diabetes.
- An estimated **24-40%** of patients regularly miss medication doses, the single largest driver of complications.
- Studies of tracked diabetes care show about **37% fewer complications** when patients actively track their condition.
- Roughly **1 in 8** patients can access personalized, ongoing support.

At scale, Type 2 diabetes is manageable with consistent self-care: daily glucose monitoring, medication adherence, healthy eating, and physical activity. Tenachin AI turns those behaviors into a daily routine a patient can actually sustain, in their own language.

---

## 3. Core Features

| Feature | Description |
|---|---|
| Blood glucose logging | Record readings with reading types (fasting, post-meal, random) and optional symptom tags. |
| Personalized AI tips | A daily, individualized tip generated from the patient's profile and history, grounded in WHO, IDF, and Ethiopian Ministry of Health guidance (in Amharic or English). |
| AI chat assistant | Ask questions about diet, medication, glucose patterns, and lifestyle. Responses are grounded in a curated knowledge base; the model has no live internet access. |
| Medication tracking | Log medications with dose, frequency, and times; mark doses taken or skipped to build adherence history. |
| Appointment tracking | Manage hospital visits with automatic reminder escalations (7 days, 1 day, and the day of). |
| Alerts | An alert engine surfaces out-of-range glucose readings and other clinically significant patterns with an acknowledgment flow. |
| Health dashboard | Profile, BMI (computed from weight and height at signup), HbA1c, history, and trend summaries. |
| PDF report export | Generate a formatted, clinician-ready PDF report of the patient's data, stored in Cloudflare R2 and shareable from the app. |
| Bilingual UI | Full English and Amharic translations (the Amharic experience is in active rollout). |
| Offline-first sync | Glucose logs can be recorded and synced, resilient to poor connectivity. |

---

## 4. System Architecture

```
[Expo React Native mobile app]
            |
            | HTTPS
            v
  api.tenachinai.site  (A record -> production VPS)
            |
            v
     nginx:1.27-alpine          (TLS termination, ports 80/443)
            |
            v
  backend (FastAPI / uvicorn, 1 worker, port 8000)
     |           |          |            |
     v           v          v            v
  postgres:16  redis:7   Cloudflare R2  external services
  (tenachin_ai (cache,     (PDF storage) (Resend email,
    database)   rate                    Groq LLM)
                limits)
```

### Client

A React Native application (Expo SDK 57) using expo-router for navigation. State and data access live in `frontend/services/` (axios client with token refresh queueing), and translations are managed with i18next under `frontend/locales/`.

### Backend

A FastAPI single-process service. The process runs exactly **one uvicorn worker**: an in-process APScheduler drives medication and appointment reminders, and multiple workers would duplicate scheduled jobs. All state is held in PostgreSQL; Redis backs rate limiting, OTP flows, and cooldowns.

### Auxiliary services

- **Resend** — transactional email for OTP verification and password resets (sending domain: `mail.tenachinai.site`).
- **Groq** — hosts the LLM (`qwen/qwen3.8-27b`) used for the daily tip generator and the chat assistant.
- **Cloudflare R2** — object storage for exported PDF reports.

---

## 5. Technology Stack

### Mobile (`frontend/`)

| Layer | Technology |
|---|---|
| Framework | Expo SDK 57, React Native 0.86, React 19.2 |
| Routing | expo-router 57 |
| Language | TypeScript 6 |
| State / data | axios (JWT auth, refresh-queue computed in `services/api.ts`) |
| i18n | i18next + react-i18next (`en`, `am`) |
| Storage | expo-secure-store (tokens), expo-sqlite (offline/sync) |
| Notifications | expo-notifications |
| UI | expo-linear-gradient, expo-font, SVG icons; custom theme in `constants/theme.ts` |

### Backend (`backend/`)

| Layer | Technology |
|---|---|
| Framework | FastAPI, uvicorn (1 worker) |
| ORM / migrations | SQLAlchemy 2, Alembic |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (access 15 min, refresh 30 days), hashed passwords, OTP email verification |
| AI | Groq `qwen/qwen3.8-27b` via `services/chat_service.py` and `services/tip_generator.py` |
| Scheduling | APScheduler (in-process) |
| PDF | reportlab (`services/pdf_generator.py`) |
| Rate limiting | slowapi backed by Redis |
| Docs | Swagger/Redoc served only when enabled by config |

### Infrastructure

- VPS: Ubuntu 24.04 (production host for the API)
- Orchestration: Docker Compose (`docker-compose.prod.yml`)
- Reverse proxy / TLS: nginx 1.27-alpine + certbot auto-renewal
- Landing site: static HTML hosted on Vercel (project `landing`), domain `tenachinai.site`

---

## 6. Data Model

All primary keys are UUIDs; standalone entities live under `backend/app/models/`.

| Entity | Table | Key fields |
|---|---|---|
| Patient | `patient` | email (unique), password_hash, email_verified, language, age, sex, bmi, education_level, family_history, diagnosis_date, diabetes_type, other_conditions, hba1c, exercise_habit, staple_diet, timezone, push_token |
| GlucoseLog | `glucose_log` | patient_id, value, reading_type, timestamp, symptoms, synced |
| Medication | `medication` | patient_id, name, dose, frequency, times, notes, taken_times, skipped_times, taken_today |
| Appointment | `appointment` | patient_id, title, hospital, appointment_type, date, reminder_7d_sent, reminder_1d_sent, reminder_0d_sent |
| Alert | `alert` | patient_id, title, body, severity, category, action, acknowledged |
| SymptomLog | `symptom_log` | patient_id, name, severity, timestamp |
| ChatMessage | `chat` | patient_id, role, content, created_at |
| Tip | `tip` | patient_id, content, category, date |
| Device | `device` | patient_id, device identifiers |
| PendingNotification | `pending_notification` | queued push notifications for retry |

---

## 7. API Reference

Base URL: `https://api.tenachinai.site` (production). All routes except `health`, `auth/signup`, `auth/verify-email`, `auth/login`, `auth/forgot-password`, `auth/reset-password`, and `auth/refresh` require a Bearer access token.

### Auth (`/auth`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/signup` | Create an account (cooldown 60 s, 5/hour), sends OTP email |
| POST | `/verify-email` | Confirm email with 6-digit OTP (10/hour) |
| POST | `/login` | Exchange credentials for access + refresh tokens |
| POST | `/forgot-password` | Request password-reset OTP |
| POST | `/reset-password` | Reset password with OTP |
| POST | `/refresh` | Rotate refresh token for a new access token |

### Patient (`/patient`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/profile` | Fetch own profile |
| PUT | `/profile` | Update profile fields (validated ranges, BMI 5-80, HbA1c 2-20, etc.) |
| PUT | `/push-token` | Register/update push notification token |
| DELETE | `/account` | Delete account and personal data |

### Glucose (`/glucose`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/log` | Record a reading |
| GET | `/today` | Readings for today |
| GET | `/history` | Paginated reading history |
| POST | `/sync` | Batch-sync offline readings |
| GET | `/stats` | Aggregated statistics |

### Medications (`/medications`)

| Method | Path | Purpose |
|---|---|---|
| POST | `` | Create a medication |
| GET | `` | List medications |
| PUT | `/{med_id}` | Update a medication |
| DELETE | `/{med_id}` | Remove a medication |
| POST | `/{med_id}/taken` | Mark dose taken (adherence tracking) |
| POST | `/{med_id}/skip` | Mark dose skipped |

### Appointments (`/appointments`)

| Method | Path | Purpose |
|---|---|---|
| POST | `` | Schedule an appointment |
| GET | `` | List appointments |
| PUT | `/{apt_id}` | Update an appointment |
| DELETE | `/{apt_id}` | Delete an appointment |

### Symptoms (`/symptoms`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/log` | Record a symptom |
| GET | `/history` | List symptom history |

### Tips (`/tips`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/today` | Get today's personalized tip |
| GET | `/history` | Past tips |
| POST | `/generate` | Request a new individualized tip |

### Alerts (`/alerts`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/active` | Active (unacknowledged) alerts |
| GET | `/history` | Acknowledged/past alerts |
| GET | `/{alert_id}` | A single alert |
| POST | `/{alert_id}/acknowledge` | Acknowledge an alert |
| POST | `/acknowledge-all` | Acknowledge all active alerts |

### Chat (`/chat`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/message` | Send a message to the AI assistant |
| GET | `/history` | Conversation history |

### History (`/history`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/summary` | Combined health summary |
| GET | `/glucose-chart` | Chart-ready glucose series |
| GET | `/alerts` | Alert timeline |

### Export (`/export`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/pdf` | Generate a patient PDF report (stored in R2, URL returned) |

### Health

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness probe, returns `{"status":"ok"}` |

---

## 8. Authentication & Security

- **Passwords** — hashed with a modern password hasher; policy requires a minimum of 8 characters including uppercase, lowercase, and a digit.
- **JWT** — short-lived access tokens (15 minutes) plus long-lived refresh tokens (30 days). The client keeps tokens in platform secure storage and runs a refresh queue so concurrent 401s are coalesced into a single refresh. Tokens are rotated on refresh.
- **Email verification** — accounts are created unverified; a 6-digit OTP is emailed (Resend) and must be confirmed before full use. Failed attempts are tracked and limited (max ~10, then blocked 15 minutes).
- **Rate limiting** — slowapi with Redis storage: signup 5/hour, verification 10/hour, OTP cooldowns of 60 seconds.
- **Input validation** — Pydantic schemas enforce types and ranges server-side (name length, age 1-120, BMI 5-80, HbA1c 2-20, OTP format, password policy).
- **Error hygiene** — centralized exception handlers return structured 400/409/422/500 responses without leaking stack traces.
- **CORS** — restricted to `https://tenachinai.site` and `https://www.tenachinai.site`.
- **API docs** — Swagger/Redoc/OpenAPI are disabled in production (`enable_docs`).

---

## 9. Privacy & Compliance

- Data is stored in the project's own PostgreSQL database on the VPS; PDF exports live in Cloudflare R2.
- Data processors are disclosed: Resend (email), Groq (AI inference), Cloudflare R2 (storage).
- The application does not sell data and does not show advertising.
- Users can exercise access, export, update, and deletion rights by emailing `hello@tenachinai.site` (response within 30 days) or deleting their account in-app (which performs data deletion).
- The app is not intended for users under 18.
- Governing law for the service is the Federal Democratic Republic of Ethiopia.
- Public policies: `https://tenachinai.site/privacy.html`, `https://tenachinai.site/terms.html`, `https://tenachinai.site/cookies.html`.

---

## 10. Deployment

The production environment consists of:

- **Backend API** — runs on a private VPS as a Docker Compose stack (FastAPI, PostgreSQL 16, Redis 7, nginx with automatic TLS). Deployment and operational procedures are maintained in internal operations documentation and are intentionally not published.
- **Landing site** — the static `landing/` directory is deployed to Vercel (project `landing`), serving the marketing pages, SEO/GEO files, the favicon set, the policies, and the distributable Android APK.
- **App distribution** — Android APKs are built with EAS Build (`eas build -p android --profile preview`) and placed at `landing/tenachinai.apk`; the `preview` profile bakes in the production API URL. App Store and Google Play releases are the next distribution stage.

All infrastructure configuration and credentials are managed outside the public repository.

---

## 11. Development Setup

Prerequisites: Node 20+, Python 3.11+, Docker, an Expo account token, and API keys (Resend, Groq, Cloudflare R2).
Secrets are read from `backend/.env` (see `server_setup.md`(private)).

### Backend (local)

```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
cp .env.example .env   # fill in values
uvicorn app.main:app --reload
```

The API is served from `http://localhost:8000`. Swagger is available at `/docs` when `ENABLE_DOCS=true`.

### Mobile (local)

```bash
cd frontend
npm install
export EXPO_PUBLIC_API_URL=http://localhost:8000   # or a tunnel URL
npx expo start
```

Compile check:

```bash
npx tsc --noEmit
```

### Tests

Jest + React Native Testing Library are configured in `frontend`. Run with:

```bash
npm test
```

---

## 12. Monitoring & Operations

- **Liveness** — `GET https://api.tenachinai.site/health` returns `{"status":"ok"}`.
- **Status** — internal container tooling confirms the database and cache report healthy and the backend is up.
- **Logs** — backend warnings on 400s and errors on 500s are collected through centralized exception handlers.
- **TLS** — certificates renew automatically and the proxy is reloaded on renewal.
- **Firewall** — the host exposes only the SSH, HTTP, and HTTPS ports.

---

## 13. Roadmap

- Launch the landing site on the root domain (in progress, DNS + SSL finalization).
- Full Amharic experience across all screens.
- Submit Google Play and App Store listings.

---

## 14. Contact

| Purpose | Address |
|---|---|
| General, bugs, feedback | `hello@tenachinai.site` |
| Privacy / data requests | `privacy@tenachinai.site` |

Web: `https://tenachinai.site` (landing), `https://api.tenachinai.site` (API).