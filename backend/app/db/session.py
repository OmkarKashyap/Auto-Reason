from collections.abc import AsyncGenerator
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

_LOCAL_HOSTS = {"localhost", "127.0.0.1", "postgres"}  # "postgres" = the docker-compose service name


def normalize_database_url(raw_url: str) -> str:
    """Force the asyncpg driver and strip the query string from a connection string.

    Managed Postgres dashboards (Render, Neon, Supabase, RDS, ...) hand out
    plain `postgres://` / `postgresql://` connection strings with no driver
    specified - SQLAlchemy then defaults to the sync psycopg2 driver, which
    isn't installed here, so we pin it to postgresql+asyncpg explicitly. Those
    URLs also carry libpq-only query params (sslmode, channel_binding, ...)
    that asyncpg's connect() does not accept as keyword arguments - it raises,
    it doesn't ignore them. SSL is configured explicitly via connect_args
    below instead, so none of that is needed in the URL itself.
    """
    parts = urlsplit(raw_url)
    return urlunsplit(("postgresql+asyncpg", parts.netloc, parts.path, "", ""))


def build_connect_args(raw_url: str) -> dict:
    """Managed Postgres requires SSL; local/docker-compose Postgres does not."""
    hostname = urlsplit(raw_url).hostname
    if hostname in _LOCAL_HOSTS:
        return {}
    return {"ssl": "require"}


engine = create_async_engine(
    normalize_database_url(settings.database_url),
    pool_pre_ping=True,
    connect_args=build_connect_args(settings.database_url),
)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
