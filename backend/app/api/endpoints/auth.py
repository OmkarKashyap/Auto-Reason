import uuid

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    IDENTITY_COOKIE_NAME,
    Owner,
    get_anonymous_id_if_present,
    get_current_owner,
    get_db_session,
    set_identity_cookie,
)
from app.core.config import settings
from app.db.models import Graph, User
from app.schemas.auth import AuthResponse, LoginRequest, MeResponse, RegisterRequest

router = APIRouter(tags=["Authentication"])

_MAX_PASSWORD_BYTES = 72  # bcrypt's hard limit


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _check_password_length(password: str) -> None:
    if len(password.encode("utf-8")) > _MAX_PASSWORD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be {_MAX_PASSWORD_BYTES} bytes or fewer.",
        )


async def _upgrade_anonymous_graphs(session: AsyncSession, request: Request, new_user_id: str) -> None:
    """If the caller was using the app anonymously, re-own their existing
    graphs to the account they just registered/logged into, instead of
    leaving that work stranded under the old anonymous session id."""
    anon_id = get_anonymous_id_if_present(request)
    if not anon_id:
        return
    await session.execute(
        update(Graph)
        .where(Graph.owner_type == "anonymous", Graph.owner_id == anon_id)
        .values(owner_type="user", owner_id=new_user_id)
    )


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
async def register_user(
    body: RegisterRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
):
    """Register a new account. Optional: anonymous use never requires this."""
    _check_password_length(body.password)

    existing = await session.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email address is already in use."
        )

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        full_name=body.fullName,
        password_hash=_hash_password(body.password),
    )
    session.add(user)
    await _upgrade_anonymous_graphs(session, request, user.id)
    await session.commit()

    set_identity_cookie(response, "user", user.id)
    return AuthResponse(message="Account created successfully", userId=user.id)


@router.post("/login", response_model=AuthResponse)
async def login_user(
    body: LoginRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
):
    _check_password_length(body.password)

    result = await session.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or not user.password_hash or not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    await _upgrade_anonymous_graphs(session, request, user.id)
    await session.commit()

    set_identity_cookie(response, "user", user.id)
    return AuthResponse(message="Sign in successful", userId=user.id)


@router.post("/logout")
async def logout_user(response: Response):
    """Clear the identity cookie. The next request gets a fresh anonymous session."""
    is_production = settings.env == "production"
    # These attributes must match how the cookie was originally set
    # (set_identity_cookie) - a deletion Set-Cookie with mismatched
    # Secure/SameSite can fail to clear the real cookie in the browser,
    # leaving the caller still resolved as the logged-out user.
    response.delete_cookie(
        IDENTITY_COOKIE_NAME,
        path="/",
        secure=is_production,
        samesite="none" if is_production else "lax",
    )
    return {"message": "Logged out"}


@router.get("/me", response_model=MeResponse)
async def get_me(
    owner: Owner = Depends(get_current_owner),
    session: AsyncSession = Depends(get_db_session),
):
    """Resolve the caller's current identity, for the frontend to decide
    whether to show signed-in or anonymous UI."""
    if owner.type != "user":
        return MeResponse(type=owner.type, id=owner.id)

    result = await session.execute(select(User).where(User.id == owner.id))
    user = result.scalar_one_or_none()
    return MeResponse(
        type="user",
        id=owner.id,
        fullName=user.full_name if user else None,
        email=user.email if user else None,
    )
