from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import auth as firebase_auth
# from ..db.neo4j import get_user_graphs
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()
# Configuration - you can also use environment variables for these.
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "")

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
                "MATCH (g:Graph) WHERE g.userId = $uid RETURN g, g.createdAt AS createdAt",
                uid=uid
            )
            graphs = [{"name": record["g"].get("name", ""), "createdAt": record["createdAt"]} for record in result]
        return graphs
    except Exception as e:
        print(f"Error retrieving graphs: {e}")
        return []
    
router = APIRouter()

def verify_firebase_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    id_token = auth_header.split("Bearer ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        return decoded_token["uid"]
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    
def fetch_graph_data_from_neo4j(uid: str, graph_name: str):
    if driver is None:
        raise HTTPException(status_code=500, detail="Neo4j driver is not initialized.")
    try:
        with driver.session() as session:
            # Adjust this Cypher query based on how your graph data is structured
            result = session.run(
                """
                MATCH (u:User {userId: $uid})-[:HAS_GRAPH]->(g:Graph {name: $graphName})
                OPTIONAL MATCH (g)-[:CONTAINS_THOUGHT]->(t:Thought)
                RETURN g.name AS name, collect(t.content) AS thoughts
                """,
                uid=uid,
                graphName=graph_name
            )
            if result.peek() is None:
                raise HTTPException(status_code=404, detail=f"Graph '{graph_name}' not found for user.")
            record = result.single()
            return {"name": record["name"], "thoughts": record["thoughts"]}
    except Exception as e:
        print(f"Error fetching graph data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching graph data from Neo4j")

@router.get("/graphs")
async def user_graphs(uid: str = Depends(verify_firebase_token)):
    try:
        graphs = get_user_graphs(uid)
        return {"graphs": graphs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving graphs: {e}")
    
@router.get("/graphs/{graph_name}") # Or use a unique ID instead of name
async def get_specific_graph(graph_name: str, uid: str = Depends(verify_firebase_token)):
    try:
        graph_data = fetch_graph_data_from_neo4j(uid, graph_name)
        return {"graph": graph_data}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving graph '{graph_name}': {e}")
