"""
config/settings.py
──────────────────
Centralised settings loaded from .env using pydantic-settings.
Any environment variable is accessible via `settings.<FIELD>`.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str
    mongodb_db_name: str = "Hemoconnect"

    # Auth
    jwt_secret: str = "your_secret_key"
    jwt_algorithm: str = "HS256"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:5000"

    # Escalation fallback defaults (DB rules take precedence at runtime)
    escalation_interval_minutes: int = 15
    escalation_threshold_minutes: int = 30
    escalation_boost: float = 5.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def origins_list(self) -> list[str]:
        """Split comma-separated ALLOWED_ORIGINS into a Python list."""
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    lru_cache ensures we only parse .env once for the entire app lifecycle.
    """
    return Settings()
