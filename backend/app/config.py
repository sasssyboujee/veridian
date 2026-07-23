"""RWA Escrow Backend Configuration."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "postgresql+asyncpg://localhost:5432/rwa_escrow"
    database_url_sync: str = "postgresql://localhost:5432/rwa_escrow"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False

    # Oracle / Chainlink
    oracle_api_key: str = ""
    gemini_api_key: str = ""

    # Contract Addresses
    rwa_token_address: str = ""
    escrow_address: str = ""
    yield_distributor_address: str = ""
    identity_registry_address: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def formatted_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        if url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


@lru_cache()
def get_settings() -> Settings:
    return Settings()
