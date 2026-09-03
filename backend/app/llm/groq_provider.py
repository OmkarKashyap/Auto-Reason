import json
import logging

import groq
from pydantic import ValidationError

from app.core.config import settings
from app.llm.base import EXTRACTION_SYSTEM_PROMPT, ExtractionResult, LLMProvider

logger = logging.getLogger(__name__)

_JSON_FORMAT_INSTRUCTIONS = (
    "Respond with a single JSON object and nothing else, matching this shape exactly: "
    '{"summary": "...", '
    '"entities": [{"name": "...", "description": "..." | null}], '
    '"relationships": [{"source": "...", "target": "...", "relation": "..."}]}'
)


class GroqProvider(LLMProvider):
    def __init__(self) -> None:
        if not settings.groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not configured; cannot use the Groq LLM provider."
            )
        self._client = groq.AsyncGroq(api_key=settings.groq_api_key)
        self._model = settings.groq_model

    async def extract_graph(self, text: str) -> ExtractionResult:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                max_tokens=4096,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": f"{EXTRACTION_SYSTEM_PROMPT}\n\n{_JSON_FORMAT_INSTRUCTIONS}",
                    },
                    {"role": "user", "content": text},
                ],
            )
        except groq.RateLimitError:
            logger.warning("Groq rate limit hit during graph extraction.")
            raise
        except groq.APIStatusError:
            logger.exception("Groq API error during graph extraction.")
            raise
        except groq.APIConnectionError:
            logger.exception("Network error calling Groq during graph extraction.")
            raise

        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("Groq response did not include any content.")

        try:
            return ExtractionResult.model_validate(json.loads(content))
        except (json.JSONDecodeError, ValidationError) as exc:
            logger.exception("Groq response did not match the expected extraction schema.")
            raise RuntimeError(
                "Groq response did not match the expected extraction schema."
            ) from exc
