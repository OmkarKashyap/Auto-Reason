import logging

import anthropic

from app.core.config import settings
from app.llm.base import (
    ANSWER_SYSTEM_PROMPT,
    EXTRACTION_SYSTEM_PROMPT,
    AskAnswer,
    ExtractionResult,
    LLMProvider,
)

logger = logging.getLogger(__name__)


class AnthropicProvider(LLMProvider):
    def __init__(self) -> None:
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not configured; cannot use the Anthropic LLM provider."
            )
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    async def extract_graph(self, text: str) -> ExtractionResult:
        try:
            response = await self._client.messages.parse(
                model=self._model,
                max_tokens=4096,
                system=EXTRACTION_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": text}],
                output_format=ExtractionResult,
            )
        except anthropic.RateLimitError:
            logger.warning("Anthropic rate limit hit during graph extraction.")
            raise
        except anthropic.APIStatusError:
            logger.exception("Anthropic API error during graph extraction.")
            raise
        except anthropic.APIConnectionError:
            logger.exception("Network error calling Anthropic during graph extraction.")
            raise

        if response.parsed_output is None:
            raise RuntimeError("Anthropic response did not include a parsed extraction result.")

        return response.parsed_output

    async def answer_question(self, question: str, context: str) -> AskAnswer:
        try:
            response = await self._client.messages.parse(
                model=self._model,
                max_tokens=2048,
                system=ANSWER_SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": f"Graph context:\n{context}\n\nQuestion: {question}"}
                ],
                output_format=AskAnswer,
            )
        except anthropic.RateLimitError:
            logger.warning("Anthropic rate limit hit during question answering.")
            raise
        except anthropic.APIStatusError:
            logger.exception("Anthropic API error during question answering.")
            raise
        except anthropic.APIConnectionError:
            logger.exception("Network error calling Anthropic during question answering.")
            raise

        if response.parsed_output is None:
            raise RuntimeError("Anthropic response did not include a parsed answer.")

        return response.parsed_output
