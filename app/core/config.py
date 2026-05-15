from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "House Rental Management System"
    app_version: str = "1.0.0"
    debug: bool = True

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return v

    # Default to local SQLite for zero-config startup.
    # Override with PostgreSQL in .env for production.
    database_url: str = f"sqlite:///{(BASE_DIR / 'house_rental.db').as_posix()}"
    db_connect_timeout_seconds: int = 5

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    cors_origins: list[str] = ["*"]

    upload_dir: str = str(BASE_DIR / "app" / "uploads")
    max_upload_size_mb: int = 5

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
