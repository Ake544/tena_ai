import json
import logging
import httpx
from datetime import datetime, timezone
from app.core.database import SessionLocal
from app.models.device import Device
from app.models.patient import Patient
from app.models.pending_notification import PendingNotification

logger = logging.getLogger(__name__)
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push(push_token: str, title: str, body: str, data: dict | None = None) -> bool:
    if not push_token:
        return False
    try:
        resp = httpx.post(
            EXPO_PUSH_URL,
            json={"to": push_token, "title": title, "body": body, "data": data or {}},
            timeout=10,
        )
        result = resp.json()
        if resp.is_error or result.get("errors"):
            err_msg = str(result.get("errors", result))
            logger.error(f"Push failed for {push_token}: {err_msg}")
            return False
        logger.info(f"Push sent: {title}")
        return True
    except Exception as e:
        logger.error(f"Push error: {e}")
        return False


def send_to_patient(patient_id: str, title: str, body: str, data: dict | None = None) -> bool:
    db = SessionLocal()
    try:
        devices = db.query(Device).filter(
            Device.patient_id == patient_id,
            Device.is_active == True,
        ).all()
        if not devices:
            return False
        sent = False
        for dev in devices:
            ok = send_push(dev.push_token, title, body, data)
            if ok:
                sent = True
            else:
                _queue_retry(db, patient_id, dev.push_token, title, body, data)
        return sent
    finally:
        db.close()


def _queue_retry(db, patient_id: str, push_token: str, title: str, body: str, data: dict | None = None):
    from datetime import timedelta
    pending = PendingNotification(
        patient_id=patient_id,
        push_token=push_token,
        title=title,
        body=body,
        data_json=json.dumps(data) if data else None,
        next_retry_at=datetime.now(timezone.utc) + timedelta(minutes=1),
    )
    db.add(pending)
    db.commit()
    logger.info(f"Queued retry for {push_token}: {title}")


def retry_pending():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        pending = db.query(PendingNotification).filter(
            PendingNotification.next_retry_at <= now,
            PendingNotification.retry_count < PendingNotification.max_retries,
        ).all()
        for p in pending:
            data = json.loads(p.data_json) if p.data_json else None
            ok = send_push(p.push_token, p.title, p.body, data)
            if ok:
                db.delete(p)
            else:
                from datetime import timedelta
                p.retry_count += 1
                backoff = (2 ** p.retry_count) * 60
                p.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=backoff)
                p.last_error = "retry failed"
                if p.retry_count >= p.max_retries:
                    _mark_device_inactive(db, p.push_token)
        db.commit()
        if pending:
            logger.info(f"Retried {len(pending)} pending notifications")
    except Exception as e:
        logger.error(f"Retry failed: {e}")
    finally:
        db.close()


def _mark_device_inactive(db, push_token: str):
    count = db.query(Device).filter(Device.push_token == push_token).update(
        {"is_active": False},
        synchronize_session=False,
    )
    if count:
        logger.info(f"Marked device {push_token} inactive (max retries)")
