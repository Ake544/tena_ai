import random
import redis

OTP_EXPIRE_SECONDS = 600
COOLDOWN_SECONDS = 60
MAX_ATTEMPTS_PER_HOUR = 3
ATTEMPTS_WINDOW_SECONDS = 3600
MAX_VERIFY_FAILS = 5
VERIFY_FAIL_WINDOW_SECONDS = 900


def generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def store_otp(r: redis.Redis, email: str, otp: str) -> None:
    r.setex(f"otp:{email}", OTP_EXPIRE_SECONDS, otp)


def get_stored_otp(r: redis.Redis, email: str) -> str | None:
    val = r.get(f"otp:{email}")
    return val


def delete_otp(r: redis.Redis, email: str) -> None:
    r.delete(f"otp:{email}")


def can_request_otp(r: redis.Redis, email: str) -> bool:
    key = f"otp_attempts:{email}"
    attempts = r.get(key)
    if attempts and int(attempts) >= MAX_ATTEMPTS_PER_HOUR:
        return False
    r.incr(key)
    r.expire(key, ATTEMPTS_WINDOW_SECONDS)
    return True


def is_on_cooldown(r: redis.Redis, email: str) -> bool:
    return r.exists(f"otp_cooldown:{email}")


def set_cooldown(r: redis.Redis, email: str) -> None:
    r.setex(f"otp_cooldown:{email}", COOLDOWN_SECONDS, 1)


def can_verify_otp(r: redis.Redis, email: str) -> bool:
    key = f"otp_verify_fail:{email}"
    fails = r.get(key)
    if fails and int(fails) >= MAX_VERIFY_FAILS:
        return False
    return True


def record_failed_verify(r: redis.Redis, email: str) -> None:
    key = f"otp_verify_fail:{email}"
    r.incr(key)
    r.expire(key, VERIFY_FAIL_WINDOW_SECONDS)


def clear_verify_fails(r: redis.Redis, email: str) -> None:
    r.delete(f"otp_verify_fail:{email}")


def clear_attempts(r: redis.Redis, email: str) -> None:
    r.delete(f"otp_attempts:{email}")


def clear_cooldown(r: redis.Redis, email: str) -> None:
    r.delete(f"otp_cooldown:{email}")
