"""add embedding to nodes

Revision ID: 1a6f42445531
Revises: 34969732d551
Create Date: 2026-09-04 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '1a6f42445531'
down_revision: Union[str, Sequence[str], None] = '34969732d551'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "nodes", sa.Column("embedding", postgresql.ARRAY(sa.Float()), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("nodes", "embedding")
