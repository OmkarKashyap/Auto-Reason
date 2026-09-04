import re
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Edge, Graph, Node
from app.llm.base import ExtractionResult


def normalize_label(label: str) -> str:
    return re.sub(r"\s+", " ", label.strip().lower())


async def create_graph(session: AsyncSession, owner_type: str, owner_id: str, name: str) -> Graph:
    graph = Graph(name=name, owner_type=owner_type, owner_id=owner_id)
    session.add(graph)
    await session.commit()
    await session.refresh(graph)
    return graph


async def list_graphs_for_owner(session: AsyncSession, owner_type: str, owner_id: str) -> list[Graph]:
    result = await session.execute(
        select(Graph)
        .where(Graph.owner_type == owner_type, Graph.owner_id == owner_id)
        .order_by(Graph.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_owned_graph(
    session: AsyncSession, graph_id: uuid.UUID, owner_type: str, owner_id: str
) -> Graph:
    result = await session.execute(
        select(Graph)
        .where(Graph.id == graph_id, Graph.owner_type == owner_type, Graph.owner_id == owner_id)
        .options(selectinload(Graph.nodes), selectinload(Graph.edges))
    )
    graph = result.scalar_one_or_none()
    if graph is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Graph not found.")
    return graph


async def merge_extraction_into_graph(
    session: AsyncSession, graph: Graph, extraction: ExtractionResult
) -> Graph:
    existing_nodes = await session.execute(select(Node).where(Node.graph_id == graph.id))
    nodes_by_key: dict[str, Node] = {
        node.normalized_label: node for node in existing_nodes.scalars().all()
    }

    def get_or_create_node(label: str, description: str | None = None) -> Node:
        key = normalize_label(label)
        node = nodes_by_key.get(key)
        if node is None:
            node = Node(graph_id=graph.id, label=label.strip(), normalized_label=key, description=description)
            session.add(node)
            nodes_by_key[key] = node
        elif description and not node.description:
            node.description = description
        return node

    for entity in extraction.entities:
        get_or_create_node(entity.name, entity.description)

    for rel in extraction.relationships:
        get_or_create_node(rel.source)
        get_or_create_node(rel.target)

    await session.flush()  # assign node ids before creating edges that reference them

    existing_edges = await session.execute(select(Edge).where(Edge.graph_id == graph.id))
    edge_keys = {
        (e.source_node_id, e.target_node_id, e.label) for e in existing_edges.scalars().all()
    }

    for rel in extraction.relationships:
        source_node = nodes_by_key[normalize_label(rel.source)]
        target_node = nodes_by_key[normalize_label(rel.target)]
        key = (source_node.id, target_node.id, rel.relation)
        if key in edge_keys:
            continue
        session.add(
            Edge(
                graph_id=graph.id,
                source_node_id=source_node.id,
                target_node_id=target_node.id,
                label=rel.relation,
                evidence=rel.evidence,
                confidence=rel.confidence,
                source="user-provided text",
            )
        )
        edge_keys.add(key)

    graph.summary = extraction.summary
    await session.commit()
    await session.refresh(graph, attribute_names=["nodes", "edges"])
    return graph
