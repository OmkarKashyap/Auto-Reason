import uuid

from app.db.models import Edge, Node
from app.rag.retrieval import (
    assemble_context,
    cosine_similarity,
    expand_subgraph,
    select_seed_nodes,
)


def _node(label: str, embedding: list[float] | None = None, description: str | None = None) -> Node:
    return Node(
        id=uuid.uuid4(),
        graph_id=uuid.uuid4(),
        label=label,
        normalized_label=label.lower(),
        description=description,
        embedding=embedding,
    )


def _edge(source: Node, target: Node, label: str, **kwargs) -> Edge:
    return Edge(
        id=uuid.uuid4(),
        graph_id=source.graph_id,
        source_node_id=source.id,
        target_node_id=target.id,
        label=label,
        evidence=kwargs.get("evidence"),
        confidence=kwargs.get("confidence"),
        source="user-provided text",
        grounded=kwargs.get("grounded"),
        groundedness_score=kwargs.get("groundedness_score"),
    )


def test_cosine_similarity_identical_vectors():
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0


def test_cosine_similarity_orthogonal_vectors():
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0


def test_cosine_similarity_mismatched_or_empty_is_zero():
    assert cosine_similarity([], [1.0]) == 0.0
    assert cosine_similarity([1.0, 2.0], [1.0]) == 0.0
    assert cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0


def test_select_seed_nodes_ranks_by_similarity():
    close = _node("close", embedding=[1.0, 0.0])
    far = _node("far", embedding=[0.0, 1.0])
    no_embedding = _node("no_embedding", embedding=None)

    seeds = select_seed_nodes([1.0, 0.0], [far, no_embedding, close], top_k=5, min_similarity=0.0)

    assert seeds[0] is close
    assert no_embedding not in seeds


def test_select_seed_nodes_respects_min_similarity_floor():
    unrelated = _node("unrelated", embedding=[0.0, 1.0])
    seeds = select_seed_nodes([1.0, 0.0], [unrelated], top_k=5, min_similarity=0.5)
    assert seeds == []


def test_select_seed_nodes_respects_top_k():
    nodes = [_node(f"n{i}", embedding=[1.0, float(i)]) for i in range(10)]
    seeds = select_seed_nodes([1.0, 0.0], nodes, top_k=3, min_similarity=-1.0)
    assert len(seeds) == 3


def test_expand_subgraph_one_hop_reaches_direct_neighbors_only():
    a, b, c = _node("A"), _node("B"), _node("C")
    edge_ab = _edge(a, b, "connects")
    edge_bc = _edge(b, c, "connects")

    nodes, edges = expand_subgraph([a], [a, b, c], [edge_ab, edge_bc], hops=1)

    node_labels = {n.label for n in nodes}
    assert node_labels == {"A", "B"}
    assert edges == [edge_ab]


def test_expand_subgraph_two_hops_reaches_second_degree_neighbors():
    a, b, c, d = _node("A"), _node("B"), _node("C"), _node("D")
    edge_ab = _edge(a, b, "connects")
    edge_bc = _edge(b, c, "connects")
    edge_cd = _edge(c, d, "connects")

    nodes, edges = expand_subgraph([a], [a, b, c, d], [edge_ab, edge_bc, edge_cd], hops=2)

    node_labels = {n.label for n in nodes}
    assert node_labels == {"A", "B", "C"}
    assert set(edges) == {edge_ab, edge_bc}


def test_expand_subgraph_respects_max_nodes_cap():
    a = _node("A")
    others = [_node(f"n{i}") for i in range(10)]
    edges = [_edge(a, other, "connects") for other in others]

    nodes, _ = expand_subgraph([a], [a] + others, edges, hops=1, max_nodes=3)

    assert len(nodes) <= 3


def test_expand_subgraph_traverses_edges_in_either_direction():
    a, b = _node("A"), _node("B")
    edge_ba = _edge(b, a, "connects")

    nodes, edges = expand_subgraph([a], [a, b], [edge_ba], hops=1)

    assert {n.label for n in nodes} == {"A", "B"}
    assert edges == [edge_ba]


def test_assemble_context_includes_entities_and_cited_evidence():
    a = _node("Deforestation", description="Loss of forest cover")
    b = _node("Global warming")
    edge = _edge(a, b, "causes", evidence="deforestation causes warming", confidence=0.9, grounded=True)

    context = assemble_context([a, b], [edge])

    assert "Deforestation" in context
    assert "Loss of forest cover" in context
    assert f"id={edge.id}" in context
    assert "deforestation causes warming" in context
    assert "grounded=yes" in context


def test_assemble_context_skips_edges_with_missing_endpoints():
    a = _node("A")
    dangling_target = _node("Dangling")
    edge = _edge(a, dangling_target, "connects")

    context = assemble_context([a], [edge])

    assert f"id={edge.id}" not in context
