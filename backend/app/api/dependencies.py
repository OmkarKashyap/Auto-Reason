import logging
import uuid

from fastapi import HTTPException, Request, Response, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from pydantic import BaseModel

from app.core.config import firebase_enabled, settings
from app.db.session import get_db_session  # re-exported for endpoint imports

logger = logging.getLogger(__name__)

ANON_COOKIE_NAME = "ar_session"
ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365  # 1 year

_serializer = URLSafeTimedSerializer(settings.secret_key, salt="anon-session")

__all__ = ["get_db_session", "get_current_owner", "Owner"]


class Owner(BaseModel):
    type: str  # "user" | "anonymous"
    id: str


async def get_current_owner(request: Request, response: Response) -> Owner:
    """Resolve the caller's identity.

    Prefers a verified Firebase ID token (signed-in user); otherwise falls back
    to a signed anonymous session cookie, issuing one on first visit. This is
    what lets an anonymous visitor use the app with no login wall.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer ") and firebase_enabled():
        from firebase_admin import auth as firebase_auth

        token = auth_header.split("Bearer ", 1)[1]
        try:
            decoded = firebase_auth.verify_id_token(token, check_revoked=True)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired authentication token."
            ) from exc
        return Owner(type="user", id=decoded["uid"])

    raw_cookie = request.cookies.get(ANON_COOKIE_NAME)
    if raw_cookie:
        try:
            session_id = _serializer.loads(raw_cookie, max_age=ANON_COOKIE_MAX_AGE)
            return Owner(type="anonymous", id=session_id)
        except (BadSignature, SignatureExpired):
            logger.info("Rejected invalid/expired anonymous session cookie.")

    session_id = str(uuid.uuid4())
    signed = _serializer.dumps(session_id)
    response.set_cookie(
        ANON_COOKIE_NAME,
        signed,
        httponly=True,
        samesite="lax",
        secure=settings.env == "production",
        max_age=ANON_COOKIE_MAX_AGE,
    )
    return Owner(type="anonymous", id=session_id)
