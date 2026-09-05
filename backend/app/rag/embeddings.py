"""Local embedding model for GraphRAG-style retrieval.

Uses a small local sentence-transformers model instead of a paid embedding
API: zero marginal cost per question (this app takes anonymous public
traffic) and keeps embedding generation entirely in-process. Loaded lazily as
a singleton on first use rather than at app startup, so the one-time model
load doesn't slow down every process boot for graphs that never get queried.
"""
from threading import Lock

_MODEL_NAME = "all-MiniLM-L6-v2"

_model = None
_model_lock = Lock()


def _get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from sentence_transformers import SentenceTransformer

                _model = SentenceTransformer(_MODEL_NAME)
    return _model


def embed_text(text: str) -> list[float]:
    return embed_texts([text])[0]


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    model = _get_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()
