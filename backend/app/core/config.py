from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    redis_url: str
    resend_api_key: str
    groq_api_key: str
    cloudflare_r2_access_key_id: str
    cloudflare_r2_secret_access_key: str
    cloudflare_r2_bucket_name: str
    cloudflare_r2_endpoint_url: str
    frontend_url: str

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
