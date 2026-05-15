import sys
import os

# Add the backend directory to the Python path
# This allows 'import app' to find backend/app.py
# and allows backend/app.py to find its local modules (schemas, db_config, etc.)
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app import app

if __name__ == "__main__":
    app.run()
