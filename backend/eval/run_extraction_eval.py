"""Extraction quality eval harness. Run with: python -m eval.run_extraction_eval"""
import asyncio
import re

from rapidfuzz import fuzz

from app.graph_manager.service import normalize_label
from app.llm.factory import get_llm_provider
from eval.golden_dataset import GOLDEN_DATASET, GoldenExample

ENTITY_MATCH_THRESHOLD = 85.0
RELATION_MATCH_THRESHOLD = 70.0


def _normalize_relation(text: str) -> str:
    return normalize_label(re.sub(r"[_-]+", " ", text))


def _entities_match(predicted: str, expected: str) -> bool:
    return (
        fuzz.token_set_ratio(normalize_label(predicted), normalize_label(expected))
        >= ENTITY_MATCH_THRESHOLD
    )


def _relation_matches(predicted: str, expected: str) -> bool:
    return (
        fuzz.token_set_ratio(_normalize_relation(predicted), _normalize_relation(expected))
        >= RELATION_MATCH_THRESHOLD
    )


def entity_match(predicted: list[str], expected: list[str]) -> tuple[int, int, int]:
    """Matches predicted entity names against expected ones. Returns (tp, fp, fn)."""
    predicted_norm = {normalize_label(p) for p in predicted}
    expected_norm = {normalize_label(e) for e in expected}
    tp = len(predicted_norm & expected_norm)
    fp = len(predicted_norm - expected_norm)
    fn = len(expected_norm - predicted_norm)
    return tp, fp, fn


def relationship_match(
    predicted: list[tuple[str, str, str]], expected: list[tuple[str, str, str]]
) -> tuple[int, int, int]:
    """Matches predicted relationships against expected ones. Returns (tp, fp, fn)."""
    remaining_expected = list(expected)
    tp = 0
    fp = 0
    for p_source, p_relation, p_target in predicted:
        match_idx = None
        for i, (e_source, e_relation, e_target) in enumerate(remaining_expected):
            same_direction = _entities_match(p_source, e_source) and _entities_match(p_target, e_target)
            reversed_direction = _entities_match(p_source, e_target) and _entities_match(p_target, e_source)
            if (same_direction or reversed_direction) and _relation_matches(p_relation, e_relation):
                match_idx = i
                break
        if match_idx is not None:
            tp += 1
            remaining_expected.pop(match_idx)
        else:
            fp += 1
    fn = len(remaining_expected)
    return tp, fp, fn


def _precision_recall_f1(tp: int, fp: int, fn: int) -> tuple[float, float, float]:
    precision = tp / (tp + fp) if (tp + fp) else 1.0
    recall = tp / (tp + fn) if (tp + fn) else 1.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    return precision, recall, f1


async def _run_example(provider, example: GoldenExample) -> dict:
    extraction = await provider.extract_graph(example.text)
    predicted_entities = [e.name for e in extraction.entities]
    predicted_relationships = [(r.source, r.relation, r.target) for r in extraction.relationships]

    return {
        "name": example.name,
        "entities": entity_match(predicted_entities, example.expected_entities),
        "relationships": relationship_match(predicted_relationships, example.expected_relationships),
        "predicted_entities": predicted_entities,
        "predicted_relationships": predicted_relationships,
    }


async def main() -> None:
    provider = get_llm_provider()

    total_e = [0, 0, 0]
    total_r = [0, 0, 0]

    for example in GOLDEN_DATASET:
        result = await _run_example(provider, example)
        e_tp, e_fp, e_fn = result["entities"]
        r_tp, r_fp, r_fn = result["relationships"]
        for totals, (tp, fp, fn) in ((total_e, (e_tp, e_fp, e_fn)), (total_r, (r_tp, r_fp, r_fn))):
            totals[0] += tp
            totals[1] += fp
            totals[2] += fn

        e_p, e_r, e_f1 = _precision_recall_f1(e_tp, e_fp, e_fn)
        r_p, r_r, r_f1 = _precision_recall_f1(r_tp, r_fp, r_fn)
        passed = e_fp == 0 and e_fn == 0 and r_fp == 0 and r_fn == 0
        print(f"[{'PASS' if passed else 'FAIL'}] {result['name']}")
        print(f"  entities:      P={e_p:.2f} R={e_r:.2f} F1={e_f1:.2f}  predicted={result['predicted_entities']}")
        print(
            f"  relationships: P={r_p:.2f} R={r_r:.2f} F1={r_f1:.2f}  "
            f"predicted={result['predicted_relationships']}"
        )

    print("\n=== Aggregate ===")
    e_p, e_r, e_f1 = _precision_recall_f1(*total_e)
    r_p, r_r, r_f1 = _precision_recall_f1(*total_r)
    print(f"Entities:      precision={e_p:.3f} recall={e_r:.3f} f1={e_f1:.3f}")
    print(f"Relationships: precision={r_p:.3f} recall={r_r:.3f} f1={r_f1:.3f}")


if __name__ == "__main__":
    asyncio.run(main())
