# EduAgent Backend

FastAPI-based backend service for the EduAgent desktop application.
Packaged as a standalone executable and embedded into the Tauri shell as a sidecar.

## Stack

- Python 3.11 (conda environment: `edu-agent-backend`)
- FastAPI + Uvicorn
- Pydantic v2 for data validation
- PyInstaller for producing a standalone executable

## Project layout
backend/
├── app/ # application source
│ ├── init.py
│ └── main.py # FastAPI app definition + start() entry point
├── tests/ # pytest suite
│ └── test_main.py
├── scripts/ # developer scripts (PowerShell)
│ ├── dev.ps1 # run dev server with hot reload
│ ├── test.ps1 # run pytest
│ ├── build.ps1 # build standalone exe via PyInstaller
│ └── smoke.ps1 # end-to-end smoke test against the built exe
├── run.py # PyInstaller entry script
├── build.spec # PyInstaller configuration
├── requirements.txt # pinned dependencies
└── README.md # this file
## Prerequisites

- Miniconda / Anaconda
- A conda environment named `edu-agent-backend` with Python 3.11:

conda create -n edu-agent-backend python=3.11 -y
conda activate edu-agent-backend
pip install -r requirements.txt
## Common workflows

All commands are run from the `backend/` directory with the conda env activated.

### Start the development server


.\scripts\dev.ps1


- Server: http://localhost:8765
- Interactive API docs: http://localhost:8765/docs

### Run tests


.\scripts\test.ps1 # run suite
.\scripts\test.ps1 -v # verbose


### Build standalone executable


.\scripts\build.ps1


Produces `dist/edu-agent-backend/edu-agent-backend.exe`.
The entire `dist/edu-agent-backend/` folder is self-contained
and does **not** require Python to be installed on the target machine.

### Smoke-test the built executable


.\scripts\smoke.ps1

angelscript

Launches the exe on port 8799, hits key endpoints, then shuts it down.
Fails loudly if anything is broken.

## Configuration (environment variables)

| Variable            | Default     | Purpose                                   |
|---------------------|-------------|-------------------------------------------|
| `EDU_AGENT_HOST`    | `127.0.0.1` | Network interface to bind                 |
| `EDU_AGENT_PORT`    | `8765`      | TCP port to listen on                     |

Tauri will set `EDU_AGENT_PORT` at launch to an available port.

## API endpoints (current)

| Method | Path              | Description                       |
|--------|-------------------|-----------------------------------|
| GET    | `/`               | Service metadata                  |
| GET    | `/health`         | Health check (status, uptime, …)  |
| GET    | `/api/ping`       | Pings the service; accepts `echo` |

More endpoints will be added in later phases (document ingestion, LLM chat, etc.).