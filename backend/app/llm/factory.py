from functools import lru_cache

from app.core.config import settings
from app.llm.base import LLMProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    if settings.llm_provider == "anthropic":
        from app.llm.anthropic_provider import AnthropicProvider

        return AnthropicProvider()

    if settings.llm_provider == "groq":
        from app.llm.groq_provider import GroqProvider

        return GroqProvider()

    raise ValueError(
        f"Unknown LLM_PROVIDER '{settings.llm_provider}'. "
        "'anthropic' and 'groq' are implemented today; add a provider class in app/llm/ "
        "and register it here to support others (e.g. 'openai', 'huggingface')."
    )
