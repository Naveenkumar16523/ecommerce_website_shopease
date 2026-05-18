import os
# Ensure test environment variables are set before any flask imports happen
os.environ["FLASK_ENV"] = "testing"
os.environ["TIDB_HOST"] = ""
