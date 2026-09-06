"""Scale/latency benchmark. Run with: python -m eval.run_benchmark"""
import asyncio
import random
import time
import uuid

from app.core.config import settings
from app.db.models import Edge, Node
from app.groundedness.service import check_groundedness
from app.llm.factory import get_llm_provider
from app.rag.embeddings import embed_text, embed_texts, preload_model
from app.rag.retrieval import expand_subgraph, select_seed_nodes
from eval.golden_dataset import GOLDEN_DATASET

INPUT_SIZE_TARGETS = {
    "short": 100,
    "medium": 1000,
    "long": settings.max_input_chars - 500,
}

GRAPH_SIZES = [50, 200, 1000]

_ENTITY_POOL = sorted({e for ex in GOLDEN_DATASET for e in ex.expected_entities})


def _build_text_of_length(target_chars: int) -> str:
    pool = [ex.text for ex in GOLDEN_DATASET]
    chunks: list[str] = []
    total = 0
    i = 0
    while total < target_chars:
        chunk = pool[i % len(pool)]
        chunks.append(chunk)
        total += len(chunk) + 1
        i += 1
    return " ".join(chunks)[:target_chars]


async def benchmark_extraction_latency(provider) -> list[dict]:
    """Times provider.extract_graph() across a few realistic input sizes."""
    results = []
    for name, target in INPUT_SIZE_TARGETS.items():
        text = _build_text_of_length(target)
        start = time.perf_counter()
        extraction = await provider.extract_graph(text)
        elapsed = time.perf_counter() - start
        results.append(
            {
                "size": name,
                "chars": len(text),
                "seconds": elapsed,
                "entities": len(extraction.entities),
                "relationships": len(extraction.relationships),
            }
        )
    return results


def _build_synthetic_graph(num_nodes: int, degree: int = 4, seed: int = 42) -> tuple[list[Node], list[Edge]]:
    rng = random.Random(seed)
    graph_id = uuid.uuid4()

    nodes = [
        Node(
            id=uuid.uuid4(),
            graph_id=graph_id,
            label=f"{_ENTITY_POOL[i % len(_ENTITY_POOL)]} #{i}",
            normalized_label=f"entity_{i}",
        )
        for i in range(num_nodes)
    ]

    edges = []
    for i, node in enumerate(nodes):
        for offset in range(1, degree // 2 + 1):
            target = nodes[(i + offset) % num_nodes]
            edges.append(
                Edge(
                    id=uuid.uuid4(),
                    graph_id=graph_id,
                    source_node_id=node.id,
                    target_node_id=target.id,
                    label="relates_to",
                    source="synthetic-benchmark",
                )
            )
    for _ in range(max(1, num_nodes // 20)):
        a, b = rng.sample(nodes, 2)
        edges.append(
            Edge(
                id=uuid.uuid4(),
                graph_id=graph_id,
                source_node_id=a.id,
                target_node_id=b.id,
                label="relates_to",
                source="synthetic-benchmark",
            )
        )

    return nodes, edges


def benchmark_graph_scale(num_nodes: int) -> dict:
    """Times local embedding + retrieval over a synthetic graph of the given size."""
    nodes, edges = _build_synthetic_graph(num_nodes)
    labels = [n.label for n in nodes]

    start = time.perf_counter()
    embeddings = embed_texts(labels)
    embed_seconds = time.perf_counter() - start
    for node, embedding in zip(nodes, embeddings):
        node.embedding = embedding

    question_embedding = embed_text(f"Tell me about {_ENTITY_POOL[0]}.")

    start = time.perf_counter()
    seeds = select_seed_nodes(question_embedding, nodes)
    result_nodes, result_edges = expand_subgraph(seeds, nodes, edges)
    retrieval_seconds = time.perf_counter() - start

    return {
        "nodes": num_nodes,
        "edges": len(edges),
        "embed_seconds": embed_seconds,
        "ms_per_node": embed_seconds / num_nodes * 1000,
        "retrieval_seconds": retrieval_seconds,
        "expanded_nodes": len(result_nodes),
        "expanded_edges": len(result_edges),
    }


def benchmark_groundedness(n: int = 200) -> float:
    evidence = "Marie Curie discovered radium"
    source = GOLDEN_DATASET[1].text * 5
    start = time.perf_counter()
    for _ in range(n):
        check_groundedness(evidence, source)
    return (time.perf_counter() - start) / n * 1000


async def main() -> None:
    preload_model()
    provider = get_llm_provider()

    print("=== Extraction Latency ===")
    for r in await benchmark_extraction_latency(provider):
        print(
            f"{r['size']:>6} ({r['chars']:>5} chars): {r['seconds']:.2f}s  "
            f"entities={r['entities']} relationships={r['relationships']}"
        )

    print("\n=== Graph Scale & Retrieval Latency ===")
    for size in GRAPH_SIZES:
        r = benchmark_graph_scale(size)
        print(
            f"nodes={r['nodes']:>5} edges={r['edges']:>5} | "
            f"embed_texts: {r['embed_seconds']*1000:.1f}ms ({r['ms_per_node']:.3f}ms/node) | "
            f"select_seed_nodes+expand_subgraph: {r['retrieval_seconds']*1000:.2f}ms "
            f"(-> {r['expanded_nodes']} nodes, {r['expanded_edges']} edges)"
        )

    print("\n=== Groundedness Check Overhead ===")
    print(f"check_groundedness: {benchmark_groundedness():.3f}ms/call (avg over 200 calls)")


if __name__ == "__main__":
    asyncio.run(main())
