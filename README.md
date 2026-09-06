# Auto-Reason

Auto-Reason turns free-form text into a visual knowledge graph, basically a map of
ideas showing how things connect, instead of just a block of text you have to reread
to remember how everything fits together. Paste in a paragraph or an article or a set of
notes and an LLM reads it, picks out the important entities and figures out how they relate to
each other. Those get added to a graph you can
keep building on over time, and you can click around it visually to see how everything
connects.

You can also ask the graph questions in plain English, like "how are X and Y related",
and get back an answer that's backed by the actual evidence in your own text, with
links straight to the specific facts it used, instead of the model just answering from
general knowledge it already had.

Live at [auto-reason.vercel.app](https://auto-reason.vercel.app).

## Features

1. **Text to graph extraction.** Submit any text and a pluggable LLM provider (Anthropic
or Groq) pulls out entities and relationships, each with a supporting evidence quote
and a confidence score. Submitting more text later merges into the same graph instead
of creating duplicates.

2. **Groundedness verification.** The LLM claims every relationship is backed by a quote
from the source text, but nothing forces that to actually be true. `backend/app/groundedness/service.py`
checks each evidence quote against the real submitted text (exact match first, fuzzy
match as a fallback) before it's ever stored, and the result shows up as a "Grounded"
or "Not grounded" badge in the graph UI. If a model hallucinates a quote, you'll see it.

3. **GraphRAG-style Q&A.** Ask a question about a graph and get an answer that's actually
grounded in it, not just general model knowledge:

   -  The question gets embedded locally (a small `sentence-transformers` model) and compared against every node's embedding to find the most relevant entities.
   -  The graph expands two hops out from those entities to build a relevant subgraph.
   -  That subgraph (entity labels, descriptions, relationships, evidence, confidence,
   groundedness) gets handed to the LLM with instructions to answer using only that
   context and cite the specific relationships behind each claim.
   -  The answer comes back with clickable citations that jump straight to the edge they
   came from.

4. **Extraction eval harness.** `backend/eval/` has a small hand-labeled golden dataset
and a script that scores entity and relationship extraction (precision, recall, F1)
against whichever provider and model is configured:

   ```bash
   cd backend
   python -m eval.run_extraction_eval
   ```

   Here's what that looked like comparing a few Groq models on the same golden set:

   | Model | Entity F1 | Relationship F1 |
   |---|---|---|
   | openai/gpt-oss-120b | 0.969 | 0.811 |
   | qwen/qwen3.8-27b | 0.954 | 0.776 |
   | qwen/qwen3.6-27b | 0.944 | 0.743 |
   | openai/gpt-oss-20b | 0.947 | 0.704 |
   | llama-3.1-8b-instant | 0.869 | 0.575 |

   Bigger models score higher on both, and relationship extraction is consistently the
   harder half, which makes sense since it means getting two entities and the connection
   between them right at the same time.


## Performance at scale.

   `backend/eval/run_benchmark.py` measures how the extraction
   and retrieval pipelines hold up as input size and graph size grow, using synthetic
   graphs so most of it costs nothing to re-run:

   ```bash
   cd backend
   python -m eval.run_benchmark
   ```

   Extraction latency across increasing input sizes (Groq `openai/gpt-oss-120b`):

   | Input size | Latency | Entities / Relationships |
   |---|---|---|
   | short (100 chars) | 2.31s | 6 / 4 |
   | medium (1,000 chars) | 7.24s | 39 / 29 |
   | long (19,500 chars, near the 20K input cap) | 13.31s | 36 / 26 |

   Graph retrieval latency across increasing entity counts, using local CPU embeddings
   (zero API cost), with the app's real production settings (top 5 seed entities, 2 hops
   out, capped at 40 entities / 80 relationships per answer):

   | Entities | Relationships | Embedding time | Retrieval time | Subgraph returned |
   |---|---|---|---|---|
   | 50 | 102 | 102ms (2.05ms/entity) | 8.6ms | 37 entities, 61 relationships |
   | 200 | 410 | 355ms (1.78ms/entity) | 25.7ms | 40 entities, 72 relationships |
   | 1,000 | 2,050 | 1.76s (1.76ms/entity) | 126ms | 40 entities, 67 relationships |

   Groundedness verification adds only about 0.06ms per relationship checked.

   Both embedding and retrieval scale close to linearly with the number of entities, rather than quadratically. Embeddings run each entity’s label through the model once, while retrieval scans and sorts the entities, then follows their relationships for two hops. The relationships touched grow with the graph but are capped by the production limit. Going from 200 to 1,000 entities (5× more) took about 4.9× longer, which is close enough to linear that the difference is just normal measurement noise.

   A few things keep this fast without special tuning. The LLM client and app settings are created once per process and reused with @lru_cache. The embedding model is loaded once and warmed up at startup, avoiding the 30–40 second first-request cost of importing torch and loading the model. Entity embeddings are computed once and stored in Postgres, so later questions can reuse them instead of recomputing them.


## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, Cytoscape.js for graph rendering, Zustand for state |
| Backend | FastAPI (async), SQLAlchemy 2 (async) + asyncpg, Alembic migrations |
| Database | PostgreSQL 16 |
| LLM extraction | Pluggable provider, Groq or Anthropic (Claude), selected via `LLM_PROVIDER` |
| Retrieval | Local embeddings (`sentence-transformers`, `all-MiniLM-L6-v2`) for GraphRAG Q&A, no external API, runs on CPU |
| Auth | Signed session cookie. Anonymous by default; email/password accounts upgrade the anonymous session's graphs on sign-up |

## Getting started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose, the supported way to run the whole stack
- An API key for at least one LLM provider:
  - [Anthropic](https://console.anthropic.com) (`ANTHROPIC_API_KEY`), or
  - [Groq](https://console.groq.com/keys) (`GROQ_API_KEY`)

Running frontend/backend outside Docker works too (see [below](#running-without-docker)),
and additionally requires Node.js 20+, Python 3.12+, and a local PostgreSQL 16 instance.

### Quick start (Docker Compose)

1. Copy the root env file and fill it in:

   ```bash
   cp .env.example .env
   ```

2. In `.env`, set `POSTGRES_PASSWORD` and `SECRET_KEY` to real values, and configure at
   least one LLM provider, see [Configuring the LLM provider](#configuring-the-llm-provider).

3. Build and start everything (frontend, backend, Postgres):

   ```bash
   docker compose up --build
   ```

4. Open the app:
   - Frontend: http://localhost:3000
   - Backend API docs (Swagger): http://localhost:8000/docs
   - Health check: http://localhost:8000/health

Database tables are created automatically on backend startup via Alembic migrations
(see `backend/entrypoint.sh`), no manual migration step needed.

To stop everything: `docker compose down` (add `-v` to also drop the Postgres volume).

### Configuring the LLM provider

Text extraction goes through a pluggable provider (`backend/app/llm/`), chosen at
runtime via `LLM_PROVIDER` in `.env`:

**Anthropic** (`LLM_PROVIDER=anthropic`, default)

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=add-anthropic-key-here
ANTHROPIC_MODEL=add-any-anthropic-model-here  # any Claude model id
```

Get a key from [console.anthropic.com](https://console.anthropic.com), under Settings,
API Keys. Create it scoped to a specific **workspace**, not an identity-linked or
all-workspaces key. Identity-linked keys need extra config this app doesn't send and
will fail with a 400 `anthropic-workspace-id is required` error.

**Groq** (`LLM_PROVIDER=groq`)

```bash
LLM_PROVIDER=groq
GROQ_API_KEY=add-groq-key-here
GROQ_MODEL=add-any-groq-model-here # any Groq-hosted model id
```

Get a free key from [console.groq.com/keys](https://console.groq.com/keys). Different
Groq models have very different rate limits on the free tier. If you hit a
`RateLimitError`, try a more mainstream model like `llama-3.3-70b-versatile`.

You only need a key for whichever provider `LLM_PROVIDER` points at.

### Environment variables

Three separate env files, one per runtime context:

| File | Used by | Notes |
|---|---|---|
| `.env` (repo root) | `docker compose up` | The one you'll normally edit. Copy from `.env.example`. |
| `backend/.env` | `uvicorn` run directly (no Docker) | Copy from `backend/.env.example`. |
| `frontend/.env.local` | `npm run dev` (no Docker) | Copy from `frontend/.env.example`. |

| Variable | Purpose | Default |
|---|---|---|
| `ENV` | `development` or `production`, controls cookie `SameSite`/`Secure` flags | `development` |
| `DATABASE_URL` | Postgres connection string used by the backend | `postgresql+asyncpg://postgres:postgres@localhost:5432/auto_reason` |
| `POSTGRES_PASSWORD` | Password for the Postgres container | (required) |
| `LLM_PROVIDER` | `anthropic` or `groq` | `anthropic` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Anthropic provider config | |
| `GROQ_API_KEY` / `GROQ_MODEL` | Groq provider config | model defaults to `llama-3.3-70b-versatile` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origin(s) | `http://localhost:3000` |
| `SECRET_KEY` | Signs the session cookie, set to a long random value | (required) |
| `RATE_LIMIT_PER_MINUTE` | Per-owner rate limit on `/process-text` | `10` |
| `ASK_RATE_LIMIT_PER_MINUTE` | Per-owner rate limit on `/ask` | `10` |
| `MAX_INPUT_CHARS` | Max characters accepted per text submission | `20000` |
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL the frontend calls (build-time) | `http://localhost:8000` |

### Running without Docker

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1     # Windows PowerShell
# source venv/bin/activate    # Linux/Mac

pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL, an LLM provider key, etc.

# Point DATABASE_URL at a locally running Postgres 16 instance, then:
alembic upgrade head

uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
cp .env.example .env.local    # fill in NEXT_PUBLIC_API_BASE_URL
npm install
npm run dev
```

## API reference

All endpoints are prefixed with `/api`. Caller identity (`Owner`) is resolved from a
signed, `httponly` session cookie, issued anonymously on first visit and upgraded to
an account when you register or log in. Full interactive docs at `/docs`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/register` | Create an account (email + password); upgrades any anonymous graphs to the new account |
| `POST` | `/api/login` | Log in, same upgrade behavior as register |
| `POST` | `/api/logout` | Clear the session cookie |
| `GET` | `/api/me` | Resolve the current caller's identity (anonymous or account) |
| `POST` | `/api/graphs` | Create a new (empty) graph |
| `GET` | `/api/graphs` | List graphs owned by the current caller |
| `GET` | `/api/graphs/{graph_id}` | Get a graph's nodes and edges |
| `DELETE` | `/api/graphs/{graph_id}` | Delete a graph |
| `POST` | `/api/graphs/{graph_id}/process-text` | Extract entities/relationships from submitted text and merge them into the graph |
| `POST` | `/api/graphs/{graph_id}/ask` | Ask a question about the graph and get a grounded, cited answer |

## Testing

```bash
cd backend
pytest
```

Needs a Postgres reachable via `DATABASE_URL` with migrations applied (`alembic upgrade head`).
The schema uses Postgres-specific types (`UUID`, `ARRAY`), so this isn't SQLite-compatible.
The suite covers the groundedness matcher and RAG retrieval/traversal logic as pure unit
tests (no DB needed), plus graph merge/dedup behavior against a real database. CI
(`.github/workflows/backend-tests.yml`) runs the same suite against a Postgres service
container on every push and PR touching `backend/**`.

## Hosting

- **Neon**, Postgres
- **Render**, backend (FastAPI, Docker)
- **Vercel**, frontend (Next.js)

Frontend and backend run on different domains in production, so a couple of things
matter if you're touching auth or deployment config:

- `CORS_ORIGINS` on Render has to list the exact Vercel origin
- The session cookie is `SameSite=None; Secure` in production, which requires
  `ENV=production` to be set on Render. Otherwise the cookie won't survive the
  cross-site request.


## Project structure

```
Auto-Reason/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/       # auth.py, graphs.py
│   │   │   └── dependencies.py  # owner resolution from the session cookie, DB session
│   │   ├── core/                # config.py (Settings), rate_limit.py
│   │   ├── db/                  # models.py (SQLAlchemy), session.py
│   │   ├── graph_manager/       # service.py, graph create/merge/delete logic
│   │   ├── groundedness/        # service.py, evidence-quote verification against source text
│   │   ├── llm/                 # base.py, factory.py, anthropic_provider.py, groq_provider.py
│   │   ├── rag/                 # embeddings.py, retrieval.py, service.py, GraphRAG Q&A
│   │   ├── schemas/             # Pydantic request/response models
│   │   └── main.py
│   ├── alembic/                 # DB migrations
│   ├── eval/                    # golden_dataset.py, run_extraction_eval.py, extraction eval harness
│   ├── tests/                   # pytest suite
│   ├── Dockerfile
│   ├── entrypoint.sh            # runs `alembic upgrade head` then starts uvicorn
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages (landing, dashboard, signin, signup)
│   │   ├── components/          # GraphDisplay, TextInput, AskBox, Navbar, SideBar, EdgeDetail, etc.
│   │   ├── lib/                 # api.ts (backend client), types.ts
│   │   └── store/                # graphStore.ts, authStore.ts (Zustand)
│   └── Dockerfile
├── .github/workflows/            # backend-tests.yml, CI (pytest against a Postgres service container)
├── docker-compose.yml
├── .env.example
└── README.md
```
