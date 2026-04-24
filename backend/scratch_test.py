"""Manual test script - run while uvicorn is serving on port 8765."""
import httpx

BASE = "http://localhost:8765"

print("=" * 50)
print("Test 1: GET /")
r = httpx.get(f"{BASE}/")
print(f"  Status: {r.status_code}")
print(f"  Body:   {r.json()}")

print("=" * 50)
print("Test 2: GET /health")
r = httpx.get(f"{BASE}/health")
print(f"  Status: {r.status_code}")
print(f"  Body:   {r.json()}")

print("=" * 50)
print("Test 3: GET /api/ping (no echo)")
r = httpx.get(f"{BASE}/api/ping")
print(f"  Status: {r.status_code}")
print(f"  Body:   {r.json()}")

print("=" * 50)
print("Test 4: GET /api/ping?echo=hello")
r = httpx.get(f"{BASE}/api/ping", params={"echo": "hello"})
print(f"  Status: {r.status_code}")
print(f"  Body:   {r.json()}")
print(f"  Final URL: {r.url}")

print("=" * 50)
print("Test 5: GET /nonexistent (should be 404)")
r = httpx.get(f"{BASE}/nonexistent")
print(f"  Status: {r.status_code}")
print(f"  Body:   {r.json()}")