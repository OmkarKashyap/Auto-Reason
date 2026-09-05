"""Shared pytest fixtures.

Uses a real Postgres database (via DATABASE_URL, expected to already have
migrations applied - see .github/workflows/backend-tests.yml) rather than
SQLite: the schema uses Postgres-only types (UUID, ARRAY), so SQLite would
either need those swapped behind a dialect check or DB-touching tests
skipped in CI - both worse than just running Postgres in CI, which is a
well-trodden GitHub Actions pattern.

Each test runs inside a transaction that is rolled back afterward, so tests
never leave data behind or depend on each other's state.
"""
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.session import engine


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    connection = await engine.connect()
    transaction = await connection.begin()
    # join_transaction_mode="create_savepoint": the service code under test
    # calls session.commit() internally (see merge_extraction_into_graph) -
    # without this, that commit would commit the outer `transaction` itself,
    # leaving nothing for the rollback below to undo. With it, each commit
    # only releases a SAVEPOINT, so the whole test's writes roll back together.
    session_factory = async_sessionmaker(
        bind=connection, expire_on_commit=False, join_transaction_mode="create_savepoint"
    )
    session = session_factory()

    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()
