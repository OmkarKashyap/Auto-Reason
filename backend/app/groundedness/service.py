"""Verifies that an LLM-claimed evidence quote actually appears in the source
text it was supposedly drawn from, instead of trusting the model's claim as-is.

Checked once, at extraction time, against the in-memory request text - the
raw source text itself is never persisted, to avoid retaining arbitrary
user-submitted free text indefinitely for a public demo with anonymous users.
"""
import re

from rapidfuzz import fuzz

DEFAULT_THRESHOLD = 90.0


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def check_groundedness(
    evidence: str, source_text: str, threshold: float = DEFAULT_THRESHOLD
) -> tuple[bool, float]:
    """Returns (grounded, groundedness_score in [0.0, 1.0]).

    Tries an exact substring match first (fast path - most legitimate quotes
    are exact or near-exact, since the extraction prompt asks for a "verbatim
    or near-verbatim quote"); falls back to fuzzy partial-ratio matching to
    tolerate minor whitespace/punctuation differences without accepting
    fabricated quotes that merely share some words with the source.
    """
    normalized_evidence = _normalize(evidence)
    normalized_source = _normalize(source_text)

    if not normalized_evidence:
        return False, 0.0

    if normalized_evidence in normalized_source:
        return True, 1.0

    score = fuzz.partial_ratio(normalized_evidence, normalized_source)
    return score >= threshold, score / 100.0
