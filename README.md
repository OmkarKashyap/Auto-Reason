# Auto-Reason

Turn free-form text into an interactive knowledge graph. Paste in a paragraph (an article,
your notes, a document), and an LLM extracts a summary, entities, and relationships, which
get merged into a graph you can keep adding to and explore visually.


## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, Cytoscape.js (graph rendering), Zustand |
| Backend | FastAPI (async), SQLAlchemy 2 (async) + asyncpg, Alembic migrations |
| Database | PostgreSQL 16 |
| LLM extraction | Pluggable provider - Anthropic (Claude) or Groq, selected via `LLM_PROVIDER` |
| Auth | Anonymous session cookie by default; optional Firebase Auth for persistent accounts |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (this is the supported way to run the whole stack)
- An API key for at least one LLM provider:
  - [Anthropic](https://console.anthropic.com) (`ANTHROPIC_API_KEY`), or
  - [Groq](https://console.groq.com/keys) (`GROQ_API_KEY`) 

Running the frontend/backend outside Docker is also possible (see [Running without Docker](#running-without-docker-optional)) and additionally requires Node.js 20+, Python 3.12+, and a local PostgreSQL 16 instance.

## Quick start (Docker Compose)

1. Copy the root env file and fill it in:

   ```bash
   cp .env.example .env
   ```

2. In `.env`, set `POSTGRES_PASSWORD` and `SECRET_KEY` to real values, and configure at least one LLM provider - see [Configuring the LLM provider](#configuring-the-llm-provider) below.

3. Build and start everything (frontend, backend, Postgres):

   ```bash
   docker compose up --build
   ```

4. Open the app:
   - Frontend: http://localhost:3000
   - Backend API docs (Swagger): http://localhost:8000/docs
   - Health check: http://localhost:8000/health

Database tables are created automatically on backend startup via Alembic migrations (see `backend/entrypoint.sh`) - no manual migration step needed.

To stop everything: `docker compose down` (add `-v` to also drop the Postgres volume and wipe all data).

## Configuring the LLM provider

Text extraction is handled by a pluggable provider (`backend/app/llm/`), chosen at runtime via `LLM_PROVIDER` in `.env`:

### Anthropic (`LLM_PROVIDER=anthropic`, default)

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-5   # any Claude model id
```

Get a key from [console.anthropic.com](https://console.anthropic.com) → **Settings → API Keys**. Create it scoped to a specific **workspace** (not an identity-linked/all-workspaces key) - identity-linked keys require extra config this app doesn't send and will fail with a 400 `anthropic-workspace-id is required` error.

### Groq (`LLM_PROVIDER=groq`)

```bash
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b   # any Groq-hosted model id
```

Get a free key from [console.groq.com/keys](https://console.groq.com/keys).

You only need to set the keys for whichever provider `LLM_PROVIDER` points at; the other can be left blank.

## Environment variables

There are three separate env files, one per runtime context:

| File | Used by | Notes |
|---|---|---|
| `.env` (repo root) | `docker compose up` | The one you'll normally edit. Copy from `.env.example`. |
| `backend/.env` | `uvicorn` run directly (no Docker) | Copy from `backend/.env.example`. |
| `frontend/.env.local` | `npm run dev` (no Docker) | Copy from `frontend/.env.example`. |

Key variables (root `.env`):

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Postgres connection string used by the backend | `postgresql+asyncpg://postgres:postgres@localhost:5432/auto_reason` |
| `POSTGRES_PASSWORD` | Password for the Postgres container | --(required) |
| `LLM_PROVIDER` | `anthropic` or `groq` | `anthropic` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Anthropic provider config | -- |
| `GROQ_API_KEY` / `GROQ_MODEL` | Groq provider config | model defaults to `llama-3.3-70b-versatile` |
| `CORS_ORIGINS` | Allowed frontend origin(s) | `http://localhost:3000` |
| `SECRET_KEY` | Signs the anonymous session cookie - set to a long random value | -- (required) |
| `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` | Path to a Firebase Admin SDK service account JSON; enables sign-in | unset (auth disabled, anonymous use still works) |
| `RATE_LIMIT_PER_MINUTE` | Per-owner rate limit on `/process-text` | `10` |
| `MAX_INPUT_CHARS` | Max characters accepted per text submission | `20000` |
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL the frontend calls | `http://localhost:8000` |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config, used by the frontend | unset (sign-in UI disabled) |

Firebase (`FIREBASE_SERVICE_ACCOUNT_KEY_PATH` + `NEXT_PUBLIC_FIREBASE_*`) is entirely optional - leave it all blank and the app works fully anonymously, with graphs tied to a signed session cookie instead of an account.

### Enabling Firebase sign-in (optional)

1. Create a Firebase project and, under **Project Settings → Service Accounts**, generate a private key JSON file. Save it as e.g. `backend/admin-sdk.json` (gitignored) and set `FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./admin-sdk.json` in `.env`.
2. From **Project Settings → General → Your apps**, copy the web app config into the `NEXT_PUBLIC_FIREBASE_*` variables.
3. Rebuild so the frontend picks up the new build-time values: `docker compose up --build`.

## Running without Docker (optional)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1     # Windows PowerShell
# source venv/bin/activate    # Linux/Mac

pip install -r requirements.txt
cp .env.example .env          # then fill in DATABASE_URL, an LLM provider key, etc.

# Point DATABASE_URL at a locally running Postgres 16 instance, then:
alembic upgrade head

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env.local    # then fill in NEXT_PUBLIC_API_BASE_URL, Firebase vars if using sign-in
npm install
npm run dev
```

## API overview

All endpoints are prefixed with `/api`. Caller identity (`Owner`) is resolved automatically per-request - either a verified Firebase ID token in `Authorization: Bearer <token>`, or a signed anonymous cookie issued on first visit. Full interactive docs at `/docs`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/graphs` | Create a new (empty) graph |
| `GET` | `/api/graphs` | List graphs owned by the current caller |
| `GET` | `/api/graphs/{graph_id}` | Get a graph's nodes and edges |
| `POST` | `/api/graphs/{graph_id}/process-text` | Extract entities/relationships from submitted text via the LLM and merge them into the graph |
| `POST` | `/api/register` | Create a Firebase account (requires Firebase to be configured) |
| `POST` | `/api/signin` | Exchange a Firebase ID token for a session |

## Project structure

```
Auto-Reason/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/       # auth.py, graphs.py
│   │   │   └── dependencies.py  # owner resolution (Firebase or anonymous cookie), DB session
│   │   ├── core/                # config.py (Settings), rate_limit.py
│   │   ├── db/                  # models.py (SQLAlchemy), session.py
│   │   ├── graph_manager/       # service.py : graph create/merge logic
│   │   ├── llm/                 # base.py, factory.py, anthropic_provider.py, groq_provider.py
│   │   ├── schemas/             # Pydantic request/response models
│   │   └── main.py
│   ├── alembic/                 # DB migrations
│   ├── Dockerfile
│   ├── entrypoint.sh            # runs `alembic upgrade head` then starts uvicorn
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages (dashboard, signin, signup)
│   │   ├── components/          # GraphDisplay, TextInput, Navbar, SideBar, etc.
│   │   ├── config/firebaseConfig.ts
│   │   ├── lib/                 # api.ts (backend client), types.ts
│   │   └── store/graphStore.ts  # Zustand store
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

