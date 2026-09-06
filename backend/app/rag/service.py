from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Edge, Graph, Node
from app.llm.base import AskAnswer, LLMProvider
from app.rag.embeddings import embed_text, embed_texts
from app.rag.retrieval import assemble_context, expand_subgraph, select_seed_nodes

NO_CONTEXT_ANSWER = "I don't have enough information in this graph to answer that."


async def ensure_node_embeddings(session: AsyncSession, graph: Graph) -> list[Node]:
    """Lazily backfills embeddings for any Node missing one."""
    result = await session.execute(select(Node).where(Node.graph_id == graph.id))
    nodes = list(result.scalars().all())

    missing = [node for node in nodes if not node.embedding]
    if missing:
        texts = [
            f"{node.label}: {node.description}" if node.description else node.label
            for node in missing
        ]
        vectors = embed_texts(texts)
        for node, vector in zip(missing, vectors):
            node.embedding = vector
        await session.commit()

    return nodes


async def answer_question(
    session: AsyncSession, graph: Graph, question: str, provider: LLMProvider
) -> AskAnswer:
    nodes = await ensure_node_embeddings(session, graph)
    edges_result = await session.execute(select(Edge).where(Edge.graph_id == graph.id))
    edges = list(edges_result.scalars().all())

    question_embedding = embed_text(question)
    seed_nodes = select_seed_nodes(question_embedding, nodes)

    if not seed_nodes:
        return AskAnswer(answer=NO_CONTEXT_ANSWER, claims=[], used_edge_ids=[])

    context_nodes, context_edges = expand_subgraph(seed_nodes, nodes, edges)
    context = assemble_context(context_nodes, context_edges)

    return await provider.answer_question(question, context)
