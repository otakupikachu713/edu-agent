"""Unit tests for the FastAPI application.

These tests assert the *current* observable behavior of the API.
If you extend the API later, add corresponding tests here.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------- GET / ----------

def test_root_returns_message():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert isinstance(data["message"], str)
    assert len(data["message"]) > 0


# ---------- GET /health ----------

def test_health_status_is_ok():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_health_identifies_service():
    response = client.get("/health")
    data = response.json()
    assert data["service"] == "edu-agent-backend"


# ---------- GET /api/ping ----------

def test_ping_default():
    response = client.get("/api/ping")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "pong"


def test_ping_with_echo():
    response = client.get("/api/ping?echo=hello")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "pong"
    assert data["echo"] == "hello"
