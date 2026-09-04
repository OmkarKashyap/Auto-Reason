import logging
import uuid

from fastapi import Request, Response
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db_session  # re-exported for endpoint imports

logger = logging.getLogger(__name__)

IDENTITY_COOKIE_NAME = "ar_session"
IDENTITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365  # 1 year

_serializer = URLSafeTimedSerializer(settings.secret_key, salt="anon-session")

__all__ = ["get_db_session", "get_current_owner", "get_anonymous_id_if_present", "set_identity_cookie", "Owner"]


class Owner(BaseModel):
    type: str  # "user" | "anonymous"
    id: str


def set_identity_cookie(response: Response, owner_type: str, owner_id: str) -> None:
    """Sign and set the identity cookie. Used both for anonymous session issuance
    and for login/register, so both identity kinds flow through one mechanism.

    Authenticated identities persist for a year. Anonymous ones are issued as a
    plain session cookie (no max_age) so they end when the browser is actually
    closed, rather than quietly outliving the anonymous visit that created them.
    """
    signed = _serializer.dumps({"type": owner_type, "id": owner_id})
    is_production = settings.env == "production"
    response.set_cookie(
        IDENTITY_COOKIE_NAME,
        signed,
        httponly=True,
        # SameSite=None is required for the cookie to survive a cross-site fetch
        # (frontend and backend on different domains in production, e.g. Vercel +
        # Render). Browsers only accept SameSite=None paired with Secure, hence
        # both are conditioned on the same flag. Lax is fine locally where
        # frontend/backend differ only by port (same-site).
        samesite="none" if is_production else "lax",
        secure=is_production,
        max_age=IDENTITY_COOKIE_MAX_AGE if owner_type == "user" else None,
    )


def _decode_identity_cookie(request: Request) -> Owner | None:
    raw_cookie = request.cookies.get(IDENTITY_COOKIE_NAME)
    if not raw_cookie:
        return None
    try:
        payload = _serializer.loads(raw_cookie, max_age=IDENTITY_COOKIE_MAX_AGE)
    except (BadSignature, SignatureExpired):
        logger.info("Rejected invalid/expired identity cookie.")
        return None

    if isinstance(payload, dict) and "type" in payload and "id" in payload:
        return Owner(type=payload["type"], id=payload["id"])
    if isinstance(payload, str):
        # Legacy cookie format from before identity unification: a bare anonymous session id.
        return Owner(type="anonymous", id=payload)
    return None


async def get_current_owner(request: Request, response: Response) -> Owner:
    """Resolve the caller's identity from a single signed cookie.

    The cookie carries either an anonymous session id (issued here on first
    visit) or an authenticated user id (set by /api/login or /api/register) -
    both flow through the same mechanism, so there is only one identity path.
    """
    owner = _decode_identity_cookie(request)
    if owner is not None:
        return owner

    session_id = str(uuid.uuid4())
    set_identity_cookie(response, "anonymous", session_id)
    return Owner(type="anonymous", id=session_id)


def get_anonymous_id_if_present(request: Request) -> str | None:
    """Peek at the caller's current anonymous session id, if any, without
    issuing a new cookie. Used by login/register to upgrade anonymous graphs
    to the newly-identified account."""
    owner = _decode_identity_cookie(request)
    if owner is not None and owner.type == "anonymous":
        return owner.id
    return None
