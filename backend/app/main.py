"""
EduAgent Backend - Main FastAPI application.

This is the entry point of the backend service.
Run with: uvicorn app.main:app --reload --port 8765
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import platform
import sys

# ============================================================
# App instance
# ============================================================
app = FastAPI(
    title="EduAgent Backend",
    description="Backend service for the EduAgent desktop application.",
    version="0.1.0",
)

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
        timestamp=datetime.utcnow().isoformat() + "Z",
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