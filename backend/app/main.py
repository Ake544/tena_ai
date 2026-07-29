import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.core.config import get_settings
from app.core.scheduler import start as start_scheduler, shutdown as stop_scheduler
from app.routers import auth, patient, glucose, medications, appointments, symptoms, tips, alerts, chat, history, export

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Tena AI API", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(glucose.router)
app.include_router(medications.router)
app.include_router(appointments.router)
app.include_router(symptoms.router)
app.include_router(tips.router)
app.include_router(alerts.router)
app.include_router(chat.router)
app.include_router(history.router)
app.include_router(export.router)



@app.middleware("http")
async def log_400_errors(request: Request, call_next):
    response = await call_next(request)
    if response.status_code == 400:
        body = b""
        try:
            body = await request.body()
        except Exception:
            pass
        logger.warning(f"400 {request.method} {request.url.path} body={body.decode('utf-8', errors='replace')[:500]}")
    return response


@app.get("/health")
def health_check():
    return {"status": "ok"}
