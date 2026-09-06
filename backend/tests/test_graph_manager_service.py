import pytest
from sqlalchemy import select

from app.db.models import Edge, Node
from app.graph_manager.service import create_graph, merge_extraction_into_graph, normalize_label
from app.llm.base import ExtractedEntity, ExtractedRelationship, ExtractionResult


def test_normalize_label_collapses_whitespace_and_case():
    assert normalize_label("  Marie   Curie ") == "marie curie"
    assert normalize_label("MARIE CURIE") == "marie curie"


@pytest.mark.asyncio
async def test_merge_creates_nodes_and_edges(db_session):
    graph = await create_graph(db_session, "anonymous", "test-owner-1", "Test Graph")
    extraction = ExtractionResult(
        summary="A causes B.",
        entities=[ExtractedEntity(name="A"), ExtractedEntity(name="B")],
        relationships=[
            ExtractedRelationship(source="A", target="B", relation="causes", evidence="A causes B", confidence=0.9)
        ],
    )

    result = await merge_extraction_into_graph(db_session, graph, extraction, "A causes B.")

    assert len(result.nodes) == 2
    assert len(result.edges) == 1
    assert result.edges[0].label == "causes"
    assert result.edges[0].grounded is True


@pytest.mark.asyncio
async def test_merge_deduplicates_entities_via_normalized_label(db_session):
    graph = await create_graph(db_session, "anonymous", "test-owner-2", "Test Graph")
    first = ExtractionResult(
        summary="Marie Curie discovered radium.",
        entities=[ExtractedEntity(name="Marie Curie"), ExtractedEntity(name="Radium")],
        relationships=[
            ExtractedRelationship(
                source="Marie Curie", target="Radium", relation="discovered",
                evidence="Marie Curie discovered radium", confidence=0.95,
            )
        ],
    )
    await merge_extraction_into_graph(db_session, graph, first, "Marie Curie discovered radium.")

    second = ExtractionResult(
        summary="marie curie also discovered polonium.",
        entities=[ExtractedEntity(name="  MARIE CURIE  "), ExtractedEntity(name="Polonium")],
        relationships=[
            ExtractedRelationship(
                source="  MARIE CURIE  ", target="Polonium", relation="discovered",
                evidence="marie curie also discovered polonium", confidence=0.9,
            )
        ],
    )
    result = await merge_extraction_into_graph(
        db_session, graph, second, "marie curie also discovered polonium."
    )

    node_labels = {n.normalized_label for n in result.nodes}
    assert node_labels == {"marie curie", "radium", "polonium"}
    assert len(result.nodes) == 3
    assert len(result.edges) == 2


@pytest.mark.asyncio
async def test_merge_does_not_duplicate_identical_relationship(db_session):
    graph = await create_graph(db_session, "anonymous", "test-owner-3", "Test Graph")
    extraction = ExtractionResult(
        summary="A causes B.",
        entities=[ExtractedEntity(name="A"), ExtractedEntity(name="B")],
        relationships=[
            ExtractedRelationship(source="A", target="B", relation="causes", evidence="A causes B", confidence=0.9)
        ],
    )

    await merge_extraction_into_graph(db_session, graph, extraction, "A causes B.")
    result = await merge_extraction_into_graph(db_session, graph, extraction, "A causes B.")

    edges_result = await db_session.execute(select(Edge).where(Edge.graph_id == graph.id))
    nodes_result = await db_session.execute(select(Node).where(Node.graph_id == graph.id))
    assert len(edges_result.scalars().all()) == 1
    assert len(nodes_result.scalars().all()) == 2
    assert len(result.edges) == 1


@pytest.mark.asyncio
async def test_merge_flags_ungrounded_evidence(db_session):
    graph = await create_graph(db_session, "anonymous", "test-owner-4", "Test Graph")
    extraction = ExtractionResult(
        summary="A causes B.",
        entities=[ExtractedEntity(name="A"), ExtractedEntity(name="B")],
        relationships=[
            ExtractedRelationship(
                source="A", target="B", relation="causes",
                evidence="this quote does not appear anywhere in the source", confidence=0.9,
            )
        ],
    )

    result = await merge_extraction_into_graph(db_session, graph, extraction, "A causes B.")

    assert result.edges[0].grounded is False
