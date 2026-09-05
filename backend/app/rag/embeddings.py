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


def preload_model() -> None:
    """Force the embedding model to load now rather than lazily on first use.

    Call this once at app startup (see app/main.py) so the multi-second
    torch/sentence-transformers import + model load cost is paid during boot,
    not on the first live /ask request after a deploy/restart - a slow first
    request risks exceeding the platform's own proxy timeout and looking like
    a dead connection to the client.
    """
    _get_model()


def embed_text(text: str) -> list[float]:
    return embed_texts([text])[0]


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    model = _get_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()
