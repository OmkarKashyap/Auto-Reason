# import os
# from neo4j import GraphDatabase

# # Configuration - you can also use environment variables for these.
# NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
# NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
# NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "your_password")

# driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

# def get_user_graphs(uid: str):
#     try:
#         with driver.session() as session:
#             result = session.run(
#                 "MATCH (g:Graph) WHERE g.userId = $uid RETURN g",
#                 uid=uid
#             )
#             graphs = [record["g"] for record in result]
#         return graphs
#     except Exception as e:
#         # Handle exceptions (e.g., log the error)
#         return []