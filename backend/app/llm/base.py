from abc import ABC, abstractmethod

from pydantic import BaseModel, Field

EXTRACTION_SYSTEM_PROMPT = (
    "You extract structured knowledge graphs from user-submitted text. "
    "Identify the key entities/concepts mentioned and the relationships between them. "
    "Keep entity names short and canonical (merge obvious duplicates/synonyms). "
    "Keep relationship labels short verb phrases (e.g. 'causes', 'is part of', 'explains'). "
    "Every entity referenced in relationships must also appear in the entities list. "
    "For every relationship, also include: "
    "'evidence' - a short verbatim or near-verbatim quote from the input text that directly "
    "supports this relationship (do not paraphrase or invent a quote); and "
    "'confidence' - a number from 0.0 to 1.0 reflecting how directly the text supports the "
    "relationship (1.0 = explicitly and unambiguously stated, lower values = inferred or implied). "
    "If the text is too short or vague to extract a meaningful graph, return a summary "
    "explaining that and an empty entities/relationships list rather than inventing content."
)


class ExtractedEntity(BaseModel):
    name: str = Field(description="Concise canonical name of the entity or concept.")
    description: str | None = Field(
        default=None, description="One-sentence description of the entity, if useful context."
    )


class ExtractedRelationship(BaseModel):
    source: str = Field(description="Name of the source entity, matching an entry in entities.")
    target: str = Field(description="Name of the target entity, matching an entry in entities.")
    relation: str = Field(description="Short verb phrase describing the relationship, e.g. 'explains'.")
    evidence: str = Field(
        description="Short verbatim or near-verbatim quote from the input text supporting this relationship."
    )
    confidence: float = Field(
        ge=0.0, le=1.0, description="0.0-1.0: how directly the text supports this relationship."
    )


class ExtractionResult(BaseModel):
    summary: str = Field(description="One or two sentence summary of the input text.")
    entities: list[ExtractedEntity]
    relationships: list[ExtractedRelationship]


class LLMProvider(ABC):
    """Provider abstraction so the backend isn't locked to one LLM vendor/model."""

    @abstractmethod
    async def extract_graph(self, text: str) -> ExtractionResult:
        """Extract a summary, entities, and relationships from free-form text."""
        raise NotImplementedError
