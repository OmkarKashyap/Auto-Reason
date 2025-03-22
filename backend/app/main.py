from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials

from core.config import initialize_firebase_admin
from api.endpoints import auth

try:
    cred = credentials.Certificate("backend/admin-sdk.json")
    firebase_admin.initialize_app(cred)
except Exception as e:
    print(f"Error initializing Firebase: {e}")

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    initialize_firebase_admin()

origins = [
    "http://localhost:3000",  # Add the origin of your frontend app
    # Add other origins if needed, e.g., for production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["Authentication"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)