"""Application configuration.

Single typed Settings object read from environment variables / .env.
Replaces the previous scattered os.environ.get(...) calls throughout the app.
"""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = Field(default="development", alias="ENV")

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/auto_reason",
        alias="DATABASE_URL",
    )

    llm_provider: str = Field(default="anthropic", alias="LLM_PROVIDER")
    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-opus-5", alias="ANTHROPIC_MODEL")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")

    cors_origins: str = Field(
        default="http://localhost:3000", alias="CORS_ORIGINS"
    )

    secret_key: str = Field(
        default="dev-only-insecure-secret-change-me", alias="SECRET_KEY"
    )

    rate_limit_per_minute: int = Field(default=10, alias="RATE_LIMIT_PER_MINUTE")
    max_input_chars: int = Field(default=20000, alias="MAX_INPUT_CHARS")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
