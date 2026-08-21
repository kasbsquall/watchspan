FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY attention/ attention/
COPY watchspan/ watchspan/
COPY fleet/ fleet/
COPY evidence/ evidence/
COPY api/ api/

# Cloud Run injects PORT; default for local runs.
ENV PORT=8080
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT}"]
