import sys
import os

# Ensure the backend directory is in the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Import the actual Flask app from backend/app.py
from backend.app import app

if __name__ == "__main__":
    app.run()
