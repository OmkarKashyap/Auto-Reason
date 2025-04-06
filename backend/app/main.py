from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials

from app.core.config import initialize_firebase_admin
from app.api.endpoints import auth, graphs
from app.api.endpoints.graphs import driver
import time

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    # Initialize Firebase first
    start_time = time.time()
    initialize_firebase_admin()
    firebase_time = time.time()
    print(f"Firebase initialized in {firebase_time - start_time:.2f} seconds.")

    # Then handle the driver (Neo4j?)
    if driver:
        try: # Add try-except for driver verification
            start_time = time.time()
            driver.verify_connectivity()
            end_time = time.time()
            print(f"Driver connectivity verified in {end_time - start_time:.2f} seconds.")
        except Exception as e:
            print(f"Error verifying driver connectivity: {e}") # Log error

@app.on_event("shutdown")
async def shutdown_event(): # Renamed for clarity
    if driver:
        driver.close()
        print("Driver closed.") # Add print/log

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
app.include_router(graphs.router, prefix="/api", tags=["Graphs"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    