# Auto-Reason

Turn free-form text into an interactive knowledge graph. Paste in a paragraph — an
article, a set of notes, a document — and an LLM pulls out a summary, entities, and
relationships, which get merged into a graph you can keep adding to and explore visually.

Live at [auto-reason.vercel.app](https://auto-reason.vercel.app).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, Cytoscape.js for graph rendering, Zustand for state |
| Backend | FastAPI (async), SQLAlchemy 2 (async) + asyncpg, Alembic migrations |
| Database | PostgreSQL 16 |
| LLM extraction | Pluggable provider - Groq or Anthropic (Claude), selected via `LLM_PROVIDER` |
| Retrieval | Local embeddings (`sentence-transformers`, `all-MiniLM-L6-v2`) for GraphRAG-style Q&A - no external API, runs on CPU |
| Auth | Signed session cookie. Anonymous by default; email/password accounts upgrade the anonymous session's graphs on sign-up |

## Hosting

- **Neon** — Postgres
- **Render** — backend (FastAPI, Docker)
- **Vercel** — frontend (Next.js)

Frontend and backend run on different domains in production, so a couple of things
matter if you're touching auth or deployment config:

- `CORS_ORIGINS` on Render has to list the exact Vercel origin (no default will match it).
- The session cookie is `SameSite=None; Secure` in production, which requires `ENV=production`
  to be set on Render — otherwise the cookie won't survive the cross-site request.
- `NEXT_PUBLIC_API_BASE_URL` is baked into the Next.js build at build time, not read at
  runtime — changing it in Vercel's dashboard requires a redeploy to take effect.

None of this lives in a `render.yaml` or `vercel.json`, but it's all set directly in each
platform's dashboard.

## Running locally

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose — the supported way to run the whole stack
- An API key for at least one LLM provider:
  - [Anthropic](https://console.anthropic.com) (`ANTHROPIC_API_KEY`), or
  - [Groq](https://console.groq.com/keys) (`GROQ_API_KEY`)

Running frontend/backend outside Docker is also fine (see [below](#running-without-docker)),
and additionally requires Node.js 20+, Python 3.12+, and a local PostgreSQL 16 instance.

### Quick start (Docker Compose)

1. Copy the root env file and fill it in:

   ```bash
   cp .env.example .env
   ```

2. In `.env`, set `POSTGRES_PASSWORD` and `SECRET_KEY` to real values, and configure at
   least one LLM provider — see [Configuring the LLM provider](#configuring-the-llm-provider).

3. Build and start everything (frontend, backend, Postgres):

   ```bash
   docker compose up --build
   ```

4. Open the app:
   - Frontend: http://localhost:3000
   - Backend API docs (Swagger): http://localhost:8000/docs
   - Health check: http://localhost:8000/health

Database tables are created automatically on backend startup via Alembic migrations
(see `backend/entrypoint.sh`) — no manual migration step needed.

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

Get a key from [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys.
Create it scoped to a specific **workspace**, not an identity-linked/all-workspaces key —
identity-linked keys need extra config this app doesn't send and will fail with a 400
`anthropic-workspace-id is required` error.

**Groq** (`LLM_PROVIDER=groq`)

```bash
LLM_PROVIDER=groq
GROQ_API_KEY=add-groq-key-here
GROQ_MODEL=add-any-groq-model-here # any Groq-hosted model id
```

Get a free key from [console.groq.com/keys](https://console.groq.com/keys).

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
| `ENV` | `development` or `production` — controls cookie `SameSite`/`Secure` flags | `development` |
| `DATABASE_URL` | Postgres connection string used by the backend | `postgresql+asyncpg://postgres:postgres@localhost:5432/auto_reason` |
| `POSTGRES_PASSWORD` | Password for the Postgres container | — (required) |
| `LLM_PROVIDER` | `anthropic` or `groq` | `anthropic` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Anthropic provider config | — |
| `GROQ_API_KEY` / `GROQ_MODEL` | Groq provider config | model defaults to `llama-3.3-70b-versatile` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origin(s) | `http://localhost:3000` |
| `SECRET_KEY` | Signs the session cookie — set to a long random value | — (required) |
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

## API overview

All endpoints are prefixed with `/api`. Caller identity (`Owner`) is resolved from a
signed, `httponly` session cookie — issued anonymously on first visit, and upgraded to
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
| `POST` | `/api/graphs/{graph_id}/ask` | Ask a natural-language question about the graph; answer is grounded in the graph's own evidence, with per-claim citations to specific edges |

## Groundedness, evaluation, and GraphRAG Q&A

Three things exist to make extraction quality checkable rather than just trusted:

**Groundedness verification** — every extracted relationship comes with an `evidence` quote
the LLM claims is drawn from the source text. `backend/app/groundedness/service.py` checks
that quote against the actual submitted text (exact match, falling back to fuzzy matching via
`rapidfuzz`) at extraction time, before the edge is ever stored. The result is saved as
`grounded` (bool) and `groundedness_score` (0.0-1.0) on the edge and shown as a badge in the
dashboard's edge detail panel - so a fabricated or hallucinated quote is visibly flagged
rather than silently trusted.

**Extraction eval harness** — `backend/eval/` holds a small hand-labeled golden dataset
(`golden_dataset.py`) and a runnable scorer (`run_extraction_eval.py`) that computes
precision/recall/F1 for entity and relationship extraction against whichever provider/model
is configured. Run it manually after changing the extraction prompt or switching models:

```bash
cd backend
python -m eval.run_extraction_eval
```

It makes real LLM calls (so it costs API credits) and isn't run in CI - it exists to guide
manual prompt/model iteration, not to gate every push.

**GraphRAG-style Q&A** — the "Ask" box in the dashboard lets you ask a question about a graph
and get an answer grounded in its own evidence, not general model knowledge:

1. The question is embedded locally (no API call) and compared via cosine similarity against
   every node's embedding to find the most relevant seed nodes (`backend/app/rag/retrieval.py`).
2. The graph is expanded 2 hops out from those seeds (capped at 40 nodes / 80 edges) to build a
   relevant subgraph.
3. That subgraph - entity labels/descriptions plus each edge's label, confidence, groundedness,
   evidence, and id - is handed to the same LLM provider/model used for extraction, with
   instructions to answer using only that context and cite the specific edge id(s) behind each
   claim (`backend/app/rag/service.py`).
4. The dashboard renders the answer with clickable citations that jump straight to the cited
   edge in the graph view, reusing the existing edge-selection/highlight mechanism.

Node embeddings are computed lazily and cached on first use per graph (`Node.embedding`), so
older graphs work with no separate backfill step.

## Testing

```bash
cd backend
pytest
```

Needs a Postgres reachable via `DATABASE_URL` with migrations applied (`alembic upgrade head`) -
the schema uses Postgres-specific types (`UUID`, `ARRAY`), so this isn't SQLite-compatible.
`backend/tests/` covers the groundedness matcher and RAG retrieval/traversal logic as pure unit
tests (no DB needed), plus graph merge/dedup behavior against a real database. CI
(`.github/workflows/backend-tests.yml`) runs the same suite against a Postgres service
container on every push/PR touching `backend/**`.

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
│   │   ├── graph_manager/       # service.py — graph create/merge/delete logic
│   │   ├── groundedness/        # service.py — evidence-quote verification against source text
│   │   ├── llm/                 # base.py, factory.py, anthropic_provider.py, groq_provider.py
│   │   ├── rag/                 # embeddings.py, retrieval.py, service.py — GraphRAG Q&A
│   │   ├── schemas/             # Pydantic request/response models
│   │   └── main.py
│   ├── alembic/                 # DB migrations
│   ├── eval/                    # golden_dataset.py, run_extraction_eval.py — extraction eval harness
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
├── .github/workflows/            # backend-tests.yml — CI (pytest against a Postgres service container)
├── docker-compose.yml
├── .env.example
└── README.md
```
