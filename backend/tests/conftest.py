import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import get_settings
settings = get_settings()

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.models.patient import Patient
from app.models.glucose import GlucoseLog
from app.models.alert import Alert

engine = create_engine(settings.database_url.replace("postgresql://", "postgresql+psycopg://"))
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    from app.main import app

    def override_get_db():
        try:
            yield db
        finally:
            pass

    mock_r = MagicMock()
    mock_r.get.return_value = None
    mock_r.incr.return_value = 1
    mock_r.exists.return_value = False

    with patch("app.routers.auth.get_redis", return_value=mock_r), \
         patch("app.routers.auth.send_verification_otp"), \
         patch("app.routers.auth.send_password_reset_otp"):
        app.dependency_overrides[get_db] = override_get_db
        with TestClient(app) as c:
            yield c
        app.dependency_overrides.clear()


@pytest.fixture
def verified_user(db):
    from app.core.security import hash_password
    patient = Patient(
        full_name="Test User",
        email="test@example.com",
        password_hash=hash_password("TestPass123!"),
        email_verified=True,
        language="en",
        timezone="Africa/Addis_Ababa",
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@pytest.fixture
def unverified_user(db):
    from app.core.security import hash_password
    patient = Patient(
        full_name="Unverified User",
        email="unverified@example.com",
        password_hash=hash_password("TestPass123!"),
        email_verified=False,
        language="en",
        timezone="Africa/Addis_Ababa",
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@pytest.fixture
def auth_header(verified_user):
    token = create_access_token(data={"sub": str(verified_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_glucose_log(db, verified_user):
    log = GlucoseLog(
        patient_id=verified_user.id,
        value=120.0,
        reading_type="Fasting",
        timestamp="2026-09-21T07:00:00",
        symptoms=None,
        synced=True,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@pytest.fixture
def sample_alert(db, verified_user):
    alert = Alert(
        patient_id=verified_user.id,
        title="High Glucose",
        body="Your fasting glucose was above 180 mg/dL",
        severity="high",
        category="glucose",
        acknowledged=False,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
