import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CreateGraphRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ProcessTextRequest(BaseModel):
    text: str = Field(min_length=1)


class NodeOut(BaseModel):
    id: uuid.UUID
    label: str
    description: str | None = None

    model_config = {"from_attributes": True}


class EdgeOut(BaseModel):
    id: uuid.UUID
    source: uuid.UUID
    target: uuid.UUID
    label: str
    evidence: str | None = None
    confidence: float | None = None
    source_label: str = Field(default="user-provided text")

    model_config = {"from_attributes": True}


class GraphSummary(BaseModel):
    id: uuid.UUID
    name: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class GraphDetail(BaseModel):
    id: uuid.UUID
    name: str
    summary: str | None
    nodes: list[NodeOut]
    edges: list[EdgeOut]
