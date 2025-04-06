from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import auth as firebase_auth
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase
import time

from firebase_admin import auth
# Load environment variables
load_dotenv()

# Neo4j Configuration
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "")

# Initialize Neo4j driver
driver = None
try:
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    print("Connected to Neo4j database")
except Exception as e:
    print(f"Error connecting to Neo4j database: {e}")

def get_user_graphs(uid: str):
    if driver is None:
        print("Neo4j driver is not initialized.")
        return []
    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (u:User {userId: $uid})-[:HAS_GRAPH]->(g:Graph)
                RETURN g.name AS name
                """,
                uid=uid
            )
            graphs = [{"name": record["name"]} for record in result]
        return graphs
    except Exception as e:
        print(f"Error retrieving graphs: {e}")
        return []

# Helper function to verify Firebase token
def verify_firebase_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    id_token = auth_header.split("Bearer ")[1]
    try:
        server_time = int(time.time())
        print(f"Server time: {server_time}")

        # Decode the token
        decoded_token = auth.verify_id_token(id_token, check_revoked=True)

        # Log the token's issued-at time
        iat = decoded_token.get("iat")
        print(f"Token issued at (iat): {iat}")

        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# Helper function to fetch graph data from Neo4j
def fetch_graph_data_from_neo4j(uid: str, graph_name: str):
    if driver is None:
        raise HTTPException(status_code=500, detail="Neo4j driver is not initialized.")
    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (u:User {userId: $user_id})-[:HAS_GRAPH]->(g:Graph {name: $graph_name})
                OPTIONAL MATCH (g)-[:CONTAINS_THOUGHT]->(t:Thought)
                RETURN g.name AS name, collect(t.content) AS thoughts
                """,
                user_id=uid,
                graph_name=graph_name,
            )
            record = result.single()
            if not record:
                raise HTTPException(status_code=404, detail=f"Graph '{graph_name}' not found for user.")
            return {
                "name": record["name"],
                "thoughts": record["thoughts"],
            }
    except Exception as e:
        print(f"Error fetching graph data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching graph data from Neo4j")

def ensure_user_exists(uid: str):
    if driver is None:
        raise HTTPException(status_code=500, detail="Neo4j driver is not initialized.")
    try:
        with driver.session() as session:
            # Check if the user exists, and create if not
            session.run(
                """
                MERGE (u:User {userId: $uid})
                RETURN u
                """,
                uid=uid,
            )
    except Exception as e:
        print(f"Error ensuring user exists: {e}")
        raise HTTPException(status_code=500, detail="Error ensuring user exists in Neo4j.")
# FastAPI Router
router = APIRouter()

# Endpoint to retrieve all graphs for a user
@router.get("/graphs")
async def user_graphs(request: Request):
    print('hi')
    uid = verify_firebase_token(request)
    try:
        # Ensure the user exists in Neo4j
        ensure_user_exists(uid)
        
        # Retrieve the user's graphs
        graphs = get_user_graphs(uid)
        return {"graphs": graphs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving graphs: {e}")
    
@router.get("/graphs/{graph_name}")
async def get_specific_graph(graph_name: str, request: Request):
    uid = verify_firebase_token(request)
    try:
        # Ensure the user exists in Neo4j
        ensure_user_exists(uid)
        
        # Retrieve the specific graph
        graph_data = fetch_graph_data_from_neo4j(uid, graph_name)
        return {"graph": graph_data}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving graph '{graph_name}': {e}")
    
@router.post("/api/process-text")
async def process_text(request: Request, body: dict):
    uid = verify_firebase_token(request)  # Extract UID from Firebase token
    graph_name = body.get("graphName")
    text = body.get("text")

    if not graph_name or not text:
        raise HTTPException(status_code=400, detail="Graph name and text are required.")

    try:
        with driver.session() as session:
            session.run(
                """
                MATCH (u:User {userId: $uid})-[:HAS_GRAPH]->(g:Graph {name: $graph_name})
                MERGE (t:Thought {content: $text})
                MERGE (g)-[:CONTAINS_THOUGHT]->(t)
                """,
                uid=uid,
                graph_name=graph_name,
                text=text,
            )
        return {"message": "Node added successfully"}
    except Exception as e:
        print(f"Error processing text: {e}")
        raise HTTPException(status_code=500, detail="Error processing text.")