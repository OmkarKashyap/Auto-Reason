from app.db.models import Edge, Node

DEFAULT_TOP_K = 5
DEFAULT_MIN_SIMILARITY = 0.2
DEFAULT_HOPS = 2
DEFAULT_MAX_NODES = 40
DEFAULT_MAX_EDGES = 80


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(y * y for y in b) ** 0.5
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def select_seed_nodes(
    question_embedding: list[float],
    nodes: list[Node],
    top_k: int = DEFAULT_TOP_K,
    min_similarity: float = DEFAULT_MIN_SIMILARITY,
) -> list[Node]:
    """Returns the top-K nodes by cosine similarity to the question."""
    scored = [
        (cosine_similarity(question_embedding, node.embedding), node)
        for node in nodes
        if node.embedding
    ]
    scored = [(score, node) for score, node in scored if score >= min_similarity]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [node for _, node in scored[:top_k]]


def expand_subgraph(
    seed_nodes: list[Node],
    all_nodes: list[Node],
    all_edges: list[Edge],
    hops: int = DEFAULT_HOPS,
    max_nodes: int = DEFAULT_MAX_NODES,
    max_edges: int = DEFAULT_MAX_EDGES,
) -> tuple[list[Node], list[Edge]]:
    """Breadth-first expansion from the seed nodes along edges in either direction."""
    nodes_by_id = {node.id: node for node in all_nodes}
    touched_node_ids = {node.id for node in seed_nodes}
    frontier = set(touched_node_ids)
    touched_edges: dict = {}

    for _ in range(hops):
        if not frontier or len(touched_node_ids) >= max_nodes:
            break
        next_frontier: set = set()
        for edge in all_edges:
            if len(touched_edges) >= max_edges:
                break
            if edge.source_node_id in frontier or edge.target_node_id in frontier:
                touched_edges[edge.id] = edge
                for node_id in (edge.source_node_id, edge.target_node_id):
                    if node_id not in touched_node_ids and len(touched_node_ids) < max_nodes:
                        touched_node_ids.add(node_id)
                        next_frontier.add(node_id)
        frontier = next_frontier

    result_nodes = [nodes_by_id[nid] for nid in touched_node_ids if nid in nodes_by_id]
    result_edges = list(touched_edges.values())[:max_edges]
    return result_nodes, result_edges


def assemble_context(nodes: list[Node], edges: list[Edge]) -> str:
    """Renders a subgraph as compact text for the LLM prompt."""
    nodes_by_id = {node.id: node for node in nodes}
    lines = ["Entities:"]
    for node in nodes:
        desc = f" - {node.description}" if node.description else ""
        lines.append(f"  - {node.label}{desc}")

    lines.append("\nRelationships:")
    for edge in edges:
        source = nodes_by_id.get(edge.source_node_id)
        target = nodes_by_id.get(edge.target_node_id)
        if source is None or target is None:
            continue
        if edge.grounded is True:
            grounded_label = "yes"
        elif edge.grounded is False:
            grounded_label = "no"
        else:
            grounded_label = "unknown"
        lines.append(
            f"  - [id={edge.id}] {source.label} --[{edge.label}]--> {target.label} "
            f"(confidence={edge.confidence}, grounded={grounded_label})"
        )
        if edge.evidence:
            lines.append(f'    evidence: "{edge.evidence}"')

    return "\n".join(lines)
