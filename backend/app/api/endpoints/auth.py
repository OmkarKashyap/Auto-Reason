from fastapi import APIRouter, HTTPException, Header, status, Depends
from pydantic import BaseModel
import firebase_admin # Import the base module
from firebase_admin import auth as firebase_auth # Alias for clarity
from firebase_admin import firestore
from firebase_admin import exceptions as firebase_exceptions # Use for specific Firebase exceptions if needed elsewhere
from app.core.config import initialize_firebase_admin # Import your config function

# def get_firebase_app():
#     if not firebase_admin._apps:
#         initialize_firebase_admin()
#     return firebase_admin.get_app()

def get_firebase_app():
    """Placeholder: Replace with your actual implementation from core.config"""
    if not firebase_admin._apps:
        try:
            cred = firebase_admin.credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
            print("Default Firebase app initialized.")
        except Exception as e:
            print(f"Warning: Could not initialize default Firebase app: {e}")
            pass
    try:
        return firebase_admin.get_app()
    except ValueError:
        print("Error: Firebase app not initialized and default failed.")
        
        return None 

router = APIRouter(tags=["Authentication"])

class SignUpRequest(BaseModel):
    """Request model for user registration."""
    fullName: str
    email: str
    password: str

# SignInRequest model is removed as it's not used by the /signin endpoint

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    request: SignUpRequest,
    firebase_app: firebase_admin.App = Depends(get_firebase_app)
):
    """
    Registers a new user with Firebase Authentication and stores basic info in Firestore.
    """
    if not firebase_app:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firebase application not initialized."
        )

    db = firestore.client(app=firebase_app)

    try:
        user = firebase_auth.create_user(
            email=request.email,
            password=request.password,
            display_name=request.fullName,
            app=firebase_app # Pass the specific app instance
        )
        print(f"Successfully created new Firebase Auth user: {user.uid}")

        # Store additional user details in Firestore
        if db:
            users_collection = db.collection("users")
            # Use user.uid as the document ID for easy lookup
            users_collection.document(user.uid).set({
                "uid": user.uid,
                "fullName": request.fullName, # Store the provided full name
                "email": request.email, # Store email for potential backend use
                "createdAt": firestore.SERVER_TIMESTAMP # Add a timestamp
            })
            print(f"User data stored in Firestore for UID: {user.uid}")
        else:
             print(f"Warning: Firestore client not available for app {firebase_app.name}. Skipping Firestore write.")


        return {"message": "User created successfully", "userId": user.uid}

    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already in use by another account."
        )
    except firebase_auth.FirebaseAuthError as e:
        # Catch specific Firebase Auth errors
        print(f"Firebase Auth error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during Firebase user creation: {e}"
        )
    except Exception as e:
        # Catch potential Firestore errors or other unexpected issues
        print(f"An unexpected error occurred during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}"
        )

@router.post("/signin")
async def signin_user(
    authorization: str = Header(..., description="Firebase ID Token prefixed with 'Bearer '"),
    firebase_app: firebase_admin.App = Depends(get_firebase_app)
):
    """
    Verifies a Firebase ID token provided by the client and returns the user ID.
    Assumes the client has already signed in using a Firebase client SDK (Web, Android, iOS).
    """
    if not firebase_app:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firebase application not initialized."
        )

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme. Use 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"}, # Standard practice
        )

    id_token = authorization.split("Bearer ")[1]

    if not id_token:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Verify the ID token using the Firebase Admin SDK.
        # This checks expiration, signature, audience, issuer, etc.
        # It also handles clock skew automatically.
        decoded_token = firebase_auth.verify_id_token(id_token, app=firebase_app, check_revoked=True)
        uid = decoded_token.get("uid")

        if not uid:
             # This case should technically be caught by verify_id_token, but defensive check
             raise firebase_auth.InvalidIdTokenError("Token is missing 'uid' claim.")

        # Optional: Retrieve full user data if needed for backend logic
        try:
            user = firebase_auth.get_user(uid, app=firebase_app)
            print(f"Successfully verified token for user: {uid} ({user.email})")
            # You could add checks here (e.g., if user is disabled: if user.disabled:)
            if user.disabled:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User account is disabled.",
                )
        except firebase_auth.UserNotFoundError:
             # This indicates an inconsistency: token is valid, but user doesn't exist in Auth.
             # Might happen if user was deleted very recently *after* token issuance.
             print(f"User not found for UID: {uid}, though token was valid.")
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, # Or 401 depending on policy
                detail="User associated with this token not found.",
             )

        # Return user ID upon successful verification
        return {"message": "Sign in successful", "userId": uid}

    except firebase_auth.RevokedIdTokenError:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has been revoked.",
             headers={"WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"Token revoked\""},
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has expired.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"Token expired\""},
        )
    except firebase_auth.InvalidIdTokenError as e:
        print(f"Invalid Firebase ID token received: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase ID token: {e}",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        )
    except firebase_auth.FirebaseAuthError as e:
         # Catch other potential Firebase Auth errors during verification/get_user
        print(f"Firebase Auth error during sign-in verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during Firebase sign-in verification: {e}",
        )
    except Exception as e:
        # Catch-all for unexpected errors
        print(f"An unexpected error occurred during sign-in: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during sign in: {e}",
        )