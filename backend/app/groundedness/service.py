import re

from rapidfuzz import fuzz

DEFAULT_THRESHOLD = 90.0


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def check_groundedness(
    evidence: str, source_text: str, threshold: float = DEFAULT_THRESHOLD
) -> tuple[bool, float]:
    """Checks whether an evidence quote actually appears in the source text."""
    normalized_evidence = _normalize(evidence)
    normalized_source = _normalize(source_text)

    if not normalized_evidence:
        return False, 0.0

    if normalized_evidence in normalized_source:
        return True, 1.0

    score = fuzz.partial_ratio(normalized_evidence, normalized_source)
    return score >= threshold, score / 100.0
