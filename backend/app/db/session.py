from collections.abc import AsyncGenerator
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

_LOCAL_HOSTS = {"localhost", "127.0.0.1", "postgres"}  


def normalize_database_url(raw_url: str) -> str:
    parts = urlsplit(raw_url)
    return urlunsplit(("postgresql+asyncpg", parts.netloc, parts.path, "", ""))


def build_connect_args(raw_url: str) -> dict:
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
