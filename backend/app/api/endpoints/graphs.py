import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import Owner, get_current_owner, get_db_session
from app.core.config import settings
from app.core.rate_limit import ask_limiter, process_text_limiter
from app.graph_manager.service import (
    create_graph,
    delete_graph,
    get_owned_graph,
    list_graphs_for_owner,
    merge_extraction_into_graph,
)
from app.llm.factory import get_llm_provider
from app.rag.service import answer_question
from app.schemas.graph import (
    AskRequest,
    AskResponse,
    CitedClaimOut,
    CreateGraphRequest,
    EdgeOut,
    GraphDetail,
    GraphSummary,
    NodeOut,
    ProcessTextRequest,
)

router = APIRouter(prefix="/graphs", tags=["Graphs"])


def _to_detail(graph) -> GraphDetail:
    return GraphDetail(
        id=graph.id,
        name=graph.name,
        summary=graph.summary,
        nodes=[NodeOut(id=n.id, label=n.label, description=n.description) for n in graph.nodes],
        edges=[
            EdgeOut(
                id=e.id,
                source=e.source_node_id,
                target=e.target_node_id,
                label=e.label,
                evidence=e.evidence,
                confidence=e.confidence,
                source_label=e.source,
                grounded=e.grounded,
                groundedness_score=e.groundedness_score,
            )
            for e in graph.edges
        ],
    )


@router.post("", status_code=status.HTTP_201_CREATED, response_model=GraphSummary)
async def create_new_graph(
    body: CreateGraphRequest,
    owner: Owner = Depends(get_current_owner),
    session: AsyncSession = Depends(get_db_session),
):
    graph = await create_graph(session, owner.type, owner.id, body.name)
    return GraphSummary.model_validate(graph)


@router.get("", response_model=list[GraphSummary])
async def list_my_graphs(
    owner: Owner = Depends(get_current_owner),
    session: AsyncSession = Depends(get_db_session),
):
    graphs = await list_graphs_for_owner(session, owner.type, owner.id)
    return [GraphSummary.model_validate(g) for g in graphs]


@router.get("/{graph_id}", response_model=GraphDetail)
async def get_graph_detail(
    graph_id: uuid.UUID,
    owner: Owner = Depends(get_current_owner),
    session: AsyncSession = Depends(get_db_session),
):
    graph = await get_owned_graph(session, graph_id, owner.type, owner.id)
    return _to_detail(graph)


@router.delete("/{graph_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_graph_endpoint(
    graph_id: uuid.UUID,
    owner: Owner = Depends(get_current_owner),
    session: AsyncSession = Depends(get_db_session),
):
    await delete_graph(session, graph_id, owner.type, owner.id)


@router.post("/{graph_id}/process-text", response_model=GraphDetail)
async def process_text(
    graph_id: uuid.UUID,
    body: ProcessTextRequest,
    owner: Owner = Depends(get_current_owner),
    session: AsyncSession = Depends(get_db_session),
):
    if len(body.text) > settings.max_input_chars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text exceeds the {settings.max_input_chars} character limit.",
        )

    process_text_limiter.check(key=f"{owner.type}:{owner.id}")

    graph = await get_owned_graph(session, graph_id, owner.type, owner.id)

    provider = get_llm_provider()
    extraction = await provider.extract_graph(body.text)

    graph = await merge_extraction_into_graph(session, graph, extraction, body.text)
    return _to_detail(graph)


@router.post("/{graph_id}/ask", response_model=AskResponse)
async def ask_graph(
    graph_id: uuid.UUID,
    body: AskRequest,
    owner: Owner = Depends(get_current_owner),
    session: AsyncSession = Depends(get_db_session),
):
    ask_limiter.check(key=f"{owner.type}:{owner.id}")

    graph = await get_owned_graph(session, graph_id, owner.type, owner.id)

    provider = get_llm_provider()
    ask_answer = await answer_question(session, graph, body.question, provider)

    edges_by_id = {e.id: e for e in graph.edges}
    cited_edges = [
        EdgeOut(
            id=edge.id,
            source=edge.source_node_id,
            target=edge.target_node_id,
            label=edge.label,
            evidence=edge.evidence,
            confidence=edge.confidence,
            source_label=edge.source,
            grounded=edge.grounded,
            groundedness_score=edge.groundedness_score,
        )
        for edge_id in ask_answer.used_edge_ids
        if (edge := edges_by_id.get(edge_id)) is not None
    ]

    return AskResponse(
        answer=ask_answer.answer,
        claims=[CitedClaimOut(claim=c.claim, edge_ids=c.edge_ids) for c in ask_answer.claims],
        used_edge_ids=ask_answer.used_edge_ids,
        cited_edges=cited_edges,
    )
