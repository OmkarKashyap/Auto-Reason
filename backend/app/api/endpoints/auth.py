from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db_session
from app.core.config import firebase_enabled
from app.db.models import User

router = APIRouter(tags=["Authentication"])


def _require_firebase() -> None:
    if not firebase_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sign-in is not configured on this deployment. You can still use the app anonymously.",
        )


class SignUpRequest(BaseModel):
    fullName: str
    email: str
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(request: SignUpRequest, session: AsyncSession = Depends(get_db_session)):
    """Register a new account. Optional: anonymous use never requires this."""
    _require_firebase()
    from firebase_admin import auth as firebase_auth

    try:
        user = firebase_auth.create_user(
            email=request.email, password=request.password, display_name=request.fullName
        )
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email address is already in use."
        )

    await session.execute(
        pg_insert(User)
        .values(id=user.uid, email=request.email, full_name=request.fullName)
        .on_conflict_do_nothing(index_elements=["id"])
    )
    await session.commit()

    return {"message": "User created successfully", "userId": user.uid}


@router.post("/signin")
async def signin_user(
    authorization: str = Header(..., description="Firebase ID Token prefixed with 'Bearer '"),
    session: AsyncSession = Depends(get_db_session),
):
    _require_firebase()
    from firebase_admin import auth as firebase_auth

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme. Use 'Bearer <token>'.",
        )
    id_token = authorization.split("Bearer ", 1)[1]

    try:
        decoded_token = firebase_auth.verify_id_token(id_token, check_revoked=True)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    uid = decoded_token["uid"]
    email = decoded_token.get("email")

    await session.execute(
        pg_insert(User)
        .values(id=uid, email=email)
        .on_conflict_do_nothing(index_elements=["id"])
    )
    await session.commit()

    return {"message": "Sign in successful", "userId": uid}
