# Tenachin AI

A free, AI-powered companion application for people living with Type 2 diabetes in Ethiopia. Combines glucose logging, medication and appointment tracking, personalized AI coaching, and clinician-ready PDF reports in a single mobile application available in English and Amharic.

Tenachin AI is not a medical device. It does not diagnose, prescribe, or replace a doctor. In an emergency, users are directed to call emergency services or go to the nearest health facility.

## Features

- **Blood glucose logging** — Record readings with reading types (fasting, post-meal, random) and optional symptom tags
- **Personalized AI tips** — A daily, individualized tip generated from the patient's profile and history, grounded in WHO, IDF, and Ethiopian Ministry of Health guidance
- **AI chat assistant** — Ask questions about diet, medication, glucose patterns, and lifestyle
- **Medication tracking** — Log medications with dose, frequency, and times; mark doses taken or skipped to build adherence history
- **Appointment tracking** — Manage hospital visits with automatic reminder escalations (7 days, 1 day, and the day of)
- **Alerts** — Alert engine surfaces out-of-range glucose readings and other clinically significant patterns
- **Health dashboard** — Profile, BMI, HbA1c, history, and trend summaries
- **PDF report export** — Generate a formatted, clinician-ready PDF report stored in Cloudflare R2
- **Bilingual UI** — Full English and Amharic translations
- **Offline-first sync** — Glucose logs can be recorded and synced, resilient to poor connectivity
- **Push notifications** — Medication reminders, glucose nudges, appointment reminders, and evening check-ins

## Technology Stack

### Mobile (`frontend/`)

| Layer | Technology |
|---|---|
| Framework | Expo SDK 58, React Native 0.88, React 19.3 |
| Routing | expo-router 58 |
| Language | TypeScript 5.9 |
| State / data | TanStack Query, axios (JWT auth with refresh) |
| i18n | i18next + react-i18next (`en`, `am`) |
| Storage | expo-secure-store (tokens), expo-sqlite (offline/sync) |
| Notifications | expo-notifications (Firebase FCM for Android) |
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

## Project Structure

```
tena_ai/
├── backend/          # FastAPI backend (Python)
│   ├── app/
│   │   ├── core/     # Config, database, scheduler
│   │   ├── models/   # SQLAlchemy models
│   │   ├── routers/  # API endpoints
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic (chat, tips, PDF, notifications)
│   └── alembic/      # Database migrations
├── frontend/         # Expo/React Native mobile app
│   ├── app/          # Screens (expo-router file-based routing)
│   ├── components/   # Reusable UI components
│   ├── services/     # API clients
│   ├── locales/      # i18n translations (en, am)
│   └── constants/    # Theme, colors, spacing
├── landing/          # Marketing website
└── docs/             # Internal documentation
```

## Development Setup

### Prerequisites

- Node 20+
- Python 3.11+
- Docker
- An Expo account
- API keys: Resend (email), Groq (AI), Cloudflare R2 (PDF storage)

### Backend (local with Docker)

```bash
cd backend
cp .env.example .env  
docker compose up -d
```

This starts PostgreSQL 16, Redis 7, and the FastAPI backend with hot reload. The API is served from `http://localhost:8000`. Swagger is available at `/docs` when `ENABLE_DOCS=true`.

### Backend (local without Docker)

```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
cp .env.example .env   # fill in values
# Start PostgreSQL and Redis manually, then:
uvicorn app.main:app --reload
```

### Mobile (local)

```bash
cd frontend
npm install
export EXPO_PUBLIC_API_URL=http://localhost:8000
npx expo start
```

Compile check:

```bash
npx tsc --noEmit
```

### Tests

```bash
cd frontend
npx jest
```

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `GROQ_API_KEY` | Groq API key for AI chat/tips |
| `RESEND_API_KEY` | Resend API key for email OTP |
| `R2_ACCESS_KEY` | Cloudflare R2 access key |
| `R2_SECRET_KEY` | Cloudflare R2 secret key |
| `R2_BUCKET` | R2 bucket name |
| `ENABLE_DOCS` | Set to `true` to enable Swagger/Redoc |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API URL (e.g., `https://api.tenachinai.site`) |

## License

This project is proprietary. All rights reserved.

## Contact

For questions or support, reach out to aklilwassie@gmail.com.