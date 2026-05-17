"""
EduAgent Backend - Main FastAPI application.

This is the entry point of the backend service.
Run with: uvicorn app.main:app --reload --port 8765
"""
from datetime import datetime, timezone
import platform
import sys

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load .env before importing routers — chat.py reads OPENAI_API_KEY at request time,
# but other future modules may read env at import time.
load_dotenv()

from app.routes import chat
# ============================================================
# App instance
# ============================================================
app = FastAPI(
    title="EduAgent Backend",
    description="Backend service for the EduAgent desktop application.",
    version="0.1.0",
)
app.include_router(chat.router)
# ============================================================
# CORS configuration
# Allow the Next.js frontend (dev: 3000, prod: tauri://localhost) to call us.
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "tauri://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Pydantic response models
# ============================================================
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    python_version: str
    platform: str


class PingResponse(BaseModel):
    message: str
    echo: str | None = None


# ============================================================
# Routes
# ============================================================
@app.get("/")
def root():
    return {"message": "Hello! 🎉"}

@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint.
    Used by the Tauri shell to verify the backend is alive.
    """
    return HealthResponse(
        status="ok",
        service="edu-agent-backend",
        version="0.1.0",
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        python_version=sys.version.split()[0],
        platform=platform.system(),
    )


@app.get("/api/ping", response_model=PingResponse)
def ping(echo: str | None = None):
    """
    Simple ping endpoint.
    Optional query parameter: ?echo=hello
    """
    return PingResponse(message="pong", echo=echo)

# ============================================================
# Entry point when running as a script or frozen executable
# ============================================================
def start():
    """Start the uvicorn server. Used by PyInstaller entry point."""
    import uvicorn
    import os

    # Port can be overridden via env var (Tauri will set this in production)
    port = int(os.environ.get("EDU_AGENT_PORT", "8765"))
    host = os.environ.get("EDU_AGENT_HOST", "127.0.0.1")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
    )


if __name__ == "__main__":
    start()