import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """A user who registered for a persistent account. Anonymous visitors never get a row here."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Graph(Base):
    __tablename__ = "graphs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # owner_type is "user" (owner_id = users.id) or "anonymous" (owner_id = session id).
    owner_type: Mapped[str] = mapped_column(String, nullable=False)
    owner_id: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    nodes: Mapped[list["Node"]] = relationship(back_populates="graph", cascade="all, delete-orphan")
    edges: Mapped[list["Edge"]] = relationship(back_populates="graph", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_graphs_owner", "owner_type", "owner_id"),
    )


class Node(Base):
    __tablename__ = "nodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    graph_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("graphs.id", ondelete="CASCADE"))
    label: Mapped[str] = mapped_column(String, nullable=False)
    normalized_label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    graph: Mapped[Graph] = relationship(back_populates="nodes")

    __table_args__ = (
        UniqueConstraint("graph_id", "normalized_label", name="uq_node_graph_normalized_label"),
    )


class Edge(Base):
    __tablename__ = "edges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    graph_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("graphs.id", ondelete="CASCADE"))
    source_node_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("nodes.id", ondelete="CASCADE"))
    target_node_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("nodes.id", ondelete="CASCADE"))
    label: Mapped[str] = mapped_column(String, nullable=False)
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String, nullable=False, default="user-provided text", server_default="user-provided text")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    graph: Mapped[Graph] = relationship(back_populates="edges")

    __table_args__ = (
        UniqueConstraint(
            "graph_id", "source_node_id", "target_node_id", "label",
            name="uq_edge_graph_source_target_label",
        ),
    )
