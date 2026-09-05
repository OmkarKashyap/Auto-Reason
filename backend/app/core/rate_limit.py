"""Minimal in-memory sliding-window rate limiter.

Process-local by design: this app runs as a single backend instance for a
low-traffic public demo, so a shared store (Redis, etc.) would be
infrastructure the project doesn't need yet. Good enough to blunt casual
abuse of the LLM-calling endpoint; not a substitute for a real gateway if
this ever needs to scale to multiple instances.
"""
import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, status

from app.core.config import settings


class RateLimiter:
    def __init__(self, limit_per_minute: int):
        self.limit = limit_per_minute
        self.window_seconds = 60
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str) -> None:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            hits = [t for t in self._hits[key] if t > cutoff]
            if len(hits) >= self.limit:
                self._hits[key] = hits
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please slow down and try again shortly.",
                )
            hits.append(now)
            self._hits[key] = hits


process_text_limiter = RateLimiter(settings.rate_limit_per_minute)
# Separate instance from process_text_limiter: Q&A and extraction have
# different cost/abuse profiles and may need independent tuning later.
ask_limiter = RateLimiter(settings.ask_rate_limit_per_minute)
