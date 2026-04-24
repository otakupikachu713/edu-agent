"""
Entry point for the PyInstaller frozen executable.
Calls the start() function defined in app/main.py.
"""
from app.main import start

if __name__ == "__main__":
    start()