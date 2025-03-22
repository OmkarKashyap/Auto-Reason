# Personal Thought Graph

#frontend
npm run dev

#backend
python -m venv venv
venv/scripts/activate.ps1
pip install -r requirements.txt
python app/main.py

## Project Overview

**Personal Thought Graph** is a web-based platform that transforms user-entered text into a dynamic knowledge graph. It leverages a locally running, open-source LLM to extract summaries, entities (nodes), and relationships (edges) from text. Users can choose to either create a brand-new graph or add to an existing one. The system then visualizes the evolving network of ideas in an interactive UI.

## Key Use Cases

1. **Knowledge Management:**
   - Capture and visually organize ideas, notes, or documents.
2. **Educational & Research:**
   - Automatically generate concept maps from study materials and research papers.
3. **Legal/Business Document Summaries:**
   - Simplify complex documents by summarizing key points and highlighting critical relationships.

## Architecture & Data Flow

### 1. Frontend

- **Technologies:**
  - **React.js / Next.js:** For building a dynamic, responsive, and SEO-friendly user interface.
  - **Cytoscape.js / D3.js:** For interactive graph visualization.
- **Functionality:**
  - **Text Input & Action Buttons:** Users enter text and choose “Create New Graph” or “Add to Existing Graph.”
  - **Graph Visualization:** Displays nodes (ideas) and edges (relationships) in real time.
  - **User Interaction:** Supports dynamic updates, search, and node detail views.

### 2. Backend API

- **Technologies:**
  - **FastAPI (Python):** For building a RESTful API.
  - **Docker & Docker Compose:** For containerizing services for local development.
- **Functionality:**
  - **API Endpoints:**
    - `/process-text`: Receives text and action (new or add), then forwards it to the LLM Integration Service.
    - `/get-graph`: Returns current graph data in JSON format for visualization.
  - **Data Handling:** Validates and preprocesses input before sending to the LLM module.

### 3. LLM Integration Module

- **Technologies:**
  - **Hugging Face Transformers:** To run a free, open-source small LLM (e.g., GPT-Neo 125M).
  - **LangChain (Optional):** For chaining tasks such as entity extraction and relationship inference.
- **Functionality:**
  - **Text Preprocessing:** Cleans and tokenizes incoming text.
  - **Model Inference:** Processes the text to generate:
    - A brief summary.
    - A list of entities (nodes).
    - Inferred relationships (edges) between these entities.
  - **Output Formatting:** Structures the output in JSON format:
    ```json
    {
      "summary": "Brief summary of the text",
      "entities": ["Entity A", "Entity B"],
      "relationships": [
        { "source": "Entity A", "target": "Entity B", "relation": "explains" }
      ]
    }
    ```

### 4. Graph Manager & Database

- **Technologies:**
  - **Neo4j Community Edition:** A free graph database for storing nodes and edges.
  - **Python Neo4j Driver:** For CRUD operations on graph data.
- **Functionality:**
  - **Graph Decision Logic:**
    - **Create New Graph:** Initializes a new graph structure.
    - **Add to Existing Graph:** Merges new nodes/edges into an existing graph by checking for duplicate entities.
  - **Data Exposure:** Provides endpoints to retrieve graph data for frontend visualization.

### 5. Caching & Additional Services

- **Technologies:**
  - **Redis (Optional):** For caching frequently accessed data, like sessions and recent graph queries.
  - **Nginx (Optional):** As a reverse proxy/load balancer for development purposes.
- **Functionality:**
  - **Performance Optimization:** Reduces latency and improves response times.

## Tools & Technologies Summary

- **Frontend:**
  - React.js / Next.js
  - Cytoscape.js / D3.js
  - Tailwind CSS / Material-UI (for design)
- **Backend:**
  - FastAPI (Python)
  - Docker & Docker Compose
- **LLM Integration:**
  - Hugging Face Transformers (e.g., GPT-Neo 125M)
  - LangChain (Optional)
- **Graph Database:**
  - Neo4j Community Edition
  - Python Neo4j Driver
- **Optional Services:**
  - Redis for caching
  - Nginx for reverse proxy

## Functionality Recap

1. **User Input & Action:**
   - Users submit text with an action flag ("Create New Graph" or "Add to Existing Graph").
2. **Text Processing:**
   - FastAPI receives and preprocesses the text, then forwards it to the LLM Integration Module.
3. **LLM Processing:**
   - The LLM extracts a summary, entities, and relationships, and returns structured JSON.
4. **Graph Update:**
   - The Graph Manager either creates a new graph or merges the new data into an existing graph in Neo4j.
5. **Visualization:**
   - The frontend periodically retrieves updated graph data and renders it interactively.

## Project Components

1. **Frontend:**

   - **Framework:** Next.js
   - **Purpose:**
     - Provides a dynamic, responsive, and SEO-friendly user interface.
     - Renders an interactive graph using libraries like Cytoscape.js or D3.js.
   - **Tech Stack:**
     - Next.js (React-based)
     - Tailwind CSS / Material-UI for styling
     - Graph visualization libraries (e.g., Cytoscape.js)

2. **Backend API:**

   - **Framework:** FastAPI (Python)
   - **Purpose:**
     - Exposes RESTful endpoints for processing text, updating graphs, and retrieving graph data.
     - Integrates with the LLM module and the graph manager.
   - **Tech Stack:**
     - FastAPI
     - Uvicorn as the ASGI server

3. **LLM Integration Module:**

   - **Tools:** Hugging Face Transformers, optionally LangChain
   - **Purpose:**
     - Loads and runs a small, open-source LLM (e.g., GPT-Neo 125M) locally.
     - Processes user text to extract summaries, entities, and relationships.
   - **Tech Stack:**
     - Python, Hugging Face Transformers
     - LangChain (for chaining tasks, if needed)

4. **Graph Manager & Database:**

   - **Database:** Neo4j Community Edition
   - **Purpose:**
     - Stores and manages the knowledge graph (nodes & edges).
     - Supports operations to create a new graph or update an existing one.
   - **Tech Stack:**
     - Neo4j (via Docker container)
     - Python Neo4j driver for integration

5. **Caching & Auxiliary Services:**

   - **Caching:** Redis (for session data and fast graph queries)
   - **Optional Reverse Proxy/Load Balancer:** Nginx (for production routing)

6. **MLOps & CI/CD Tools:**
   - **Docker & Docker Compose:** Containerize each service for reproducibility and scalability.
   - **MLflow or DVC (Optional):** For tracking model experiments and versioning if you decide to fine-tune the LLM later.
   - **Git:** For version control and integration with CI/CD pipelines (e.g., GitHub Actions).

---

## Directory Structure

````plaintext
personal-thought-graph/
├── frontend/
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── GraphDisplay.jsx
│   │   │   ├── TextInput.jsx
│   │   │   ├── ActionButtons.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── _app.js
│   │   │   ├── index.js
│   │   │   └── ...
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── ...
│   │   └── utils/
│   │       └── api.js
│   ├── tailwind.config.js
│   └── yarn.lock (or package-lock.json)
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── process_text.py
│   │   │   │   └── graph.py
│   │   │   ├── dependencies.py
│   │   │   └── ...
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── ...
│   │   ├── llm_integration/
│   │   │   ├── __init__.py
│   │   │   ├── llm_processor.py
│   │   │   └── models.py
│   │   ├── graph_manager/
│   │   │   ├── __init__.py
│   │   │   ├── graph_operations.py
│   │   │   └── database.py
│   │   └── schemas/
│   │       └── ...
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pyproject.toml (or setup.py)
├── database/
│   ├── Dockerfile (for Neo4j)
│   └── neo4j.conf (optional custom config)
├── mlflow/
│   └── Dockerfile (optional, if you want a dedicated MLflow server)
├── docker-compose.yml
├── .env (for environment variables)
├── README.md
└── .gitignore


## How to Run Locally

1. **Clone the Repository**
   ```bash
   git clone <repo-url>
   cd personal-thought-graph
````
