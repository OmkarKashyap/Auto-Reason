FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
# Install the CPU-only torch wheel first (sentence-transformers' dependency):
# a plain `pip install torch` on Linux pulls the CUDA-enabled build, which is
# multiple GB larger than needed for this CPU-only deploy target (Render has
# no GPU) and was blowing up local disk usage during `docker-compose build`.
# Once this constraint is satisfied, requirements.txt's own torch dependency
# (pulled in transitively by sentence-transformers) is a no-op.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model at build time so it's baked into the image
# rather than fetched from HuggingFace on the first /ask request in
# production - avoids first-request latency and a runtime dependency on
# HuggingFace being reachable from wherever this container ends up running.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY ./app ./app
COPY ./alembic ./alembic
COPY alembic.ini .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
