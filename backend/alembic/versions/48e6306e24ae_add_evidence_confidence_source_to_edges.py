"""add evidence confidence source to edges

Revision ID: 48e6306e24ae
Revises: b27bef4b68bf
Create Date: 2026-09-03 16:49:11.810976

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '48e6306e24ae'
down_revision: Union[str, Sequence[str], None] = 'b27bef4b68bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("edges", sa.Column("evidence", sa.Text(), nullable=True))
    op.add_column("edges", sa.Column("confidence", sa.Float(), nullable=True))
    op.add_column(
        "edges",
        sa.Column("source", sa.String(), nullable=False, server_default="user-provided text"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("edges", "source")
    op.drop_column("edges", "confidence")
    op.drop_column("edges", "evidence")
