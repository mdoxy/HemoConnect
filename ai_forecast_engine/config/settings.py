"""
config/settings.py
──────────────────
Centralised settings for the AI Forecast Engine.
Loaded from .env using pydantic-settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str
    mongodb_db_name: str = "Hemoconnect"

    # Server
    host: str = "0.0.0.0"
    port: int = 8001          # Different port from priority engine (8000)

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:5000"

    # ML Model
    ml_model_dir: str = "ml_models"

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
    """Returns a cached Settings instance."""
    return Settings()
