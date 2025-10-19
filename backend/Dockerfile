FROM python:3.11-slim

# Keep Python from writing .pyc files and buffer output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required to build some Python packages and to
# allow database client libraries to compile where needed (libpq for Postgres).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       libpq-dev \
       gcc \
       curl \
       netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage Docker cache for installs
COPY requirements.txt /app/requirements.txt

RUN pip install --upgrade pip setuptools wheel \
    && pip install -r /app/requirements.txt

# Copy project code
COPY / /app/

# (Optional) create a non-root user if you want to run as non-root in prod
# RUN useradd -m appuser && chown -R appuser /app
# USER appuser

# Expose port used by Daphne
EXPOSE 8000

# Ensure Django settings module is set by default; override at runtime if needed
ENV DJANGO_SETTINGS_MODULE=backend.settings

# Run Daphne to serve the Channels ASGI application on 0.0.0.0:8000
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]
