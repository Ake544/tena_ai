import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
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


app = FastAPI(
    title="Tenachin AI API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url="/redoc" if settings.enable_docs else None,
    openapi_url="/openapi.json" if settings.enable_docs else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = []
    for e in exc.errors():
        loc = " -> ".join(str(l) for l in e.get("loc", []))
        errors.append({"field": loc, "message": e.get("msg", "Invalid value")})
    return JSONResponse(status_code=422, content={"detail": "Validation error", "errors": errors})


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.warning(f"Database integrity error: {request.method} {request.url.path}")
    return JSONResponse(status_code=409, content={"detail": "Data conflict"})


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {request.method} {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Database error"})


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {request.method} {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "https://tenachinai.site",
        "https://www.tenachinai.site",
    ],
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
        logger.warning(f"400 {request.method} {request.url.path}")
    return response


@app.get("/health")
def health_check():
    return {"status": "ok"}
