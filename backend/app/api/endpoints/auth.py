from fastapi import APIRouter, HTTPException, Header, status, Depends
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth
from firebase_admin import firestore  
from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions 
from core.config import get_firebase_app

router = APIRouter(tags=["Authentication"])

class SignUpRequest(BaseModel):
    fullName: str
    email: str
    password: str

class SignInRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register_user(request: SignUpRequest, firebase_app=Depends(get_firebase_app)):
    
    db = firestore.client(app=firebase_app)
    
    try:
        user = auth.create_user(
            email=request.email,
            password=request.password,
            display_name=request.fullName,
            app=firebase_app
        )
        print(f"Successfully created new user: {user.uid}")

        if db:
            users_collection = db.collection("users")
            users_collection.document(user.uid).set({
                "uid": user.uid,
                "fullName": request.fullName,
                "email": request.email,
            })
            print(f"User data stored in Firestore for UID: {user.uid}")

        return {"message": "User created successfully"}
    except auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already in use"
        )
    except auth.FirebaseError as e:
        print(f"Firebase error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {e}"
        )
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {e}"
        )

@router.post("/signin")
async def signin_user(authorization: str = Header(None), firebase_app=Depends(get_firebase_app)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header with Bearer token is required",
        )
    id_token = authorization.split(" ")[1]

    try:
        decoded_token = firebase_auth.verify_id_token(id_token, app=firebase_app)
        uid = decoded_token.get("uid")
        if uid:
            user = firebase_auth.get_user(uid, app=firebase_app)
            print(f"Successfully signed in user: {uid} ({user.email})")
            return {"message": "Sign in successful", "userId": uid}
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Firebase ID token",
            )
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token",
        )
    except firebase_auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Firebase user not found",
        )
    except Exception as e:
        print(f"Error verifying Firebase ID token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during sign in: {e}",
        )