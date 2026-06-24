import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.database import SessionLocal
from app.models.medication import Medication

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def reset_taken_today():
    db = SessionLocal()
    try:
        count = db.query(Medication).filter(Medication.taken_today == True).update(
            {"taken_today": False, "taken_times": None, "skipped_times": None},
            synchronize_session=False,
        )
        db.commit()
        logger.info(f"Reset taken_today for {count} medications")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to reset taken_today: {e}")
    finally:
        db.close()


def start():
    scheduler.add_job(
        reset_taken_today,
        CronTrigger(hour=0, minute=0, timezone="UTC"),
        id="reset_taken_today",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — daily reset at 00:00 UTC")


def shutdown():
    scheduler.shutdown(wait=False)
    logger.info("Scheduler shut down")
