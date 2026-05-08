import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

# Required environment variables
required_vars = ["TIDB_HOST", "TIDB_USER", "TIDB_PASSWORD", "TIDB_DB"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    print(f"CRITICAL ERROR: Missing required environment variables: {', '.join(missing_vars)}")
    print("Please set them in your .env file or environment.")
    exit(1)

# Create a connection pool
db_config = {
    "host": os.getenv("TIDB_HOST"),
    "port": int(os.getenv("TIDB_PORT", 4000)),
    "user": os.getenv("TIDB_USER"),
    "password": os.getenv("TIDB_PASSWORD"),
    "database": os.getenv("TIDB_DB"),
    "ssl_ca": os.getenv("TIDB_CA_PATH"),
    "ssl_verify_cert": True if os.getenv("TIDB_CA_PATH") else False
}

try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="mypool",
        pool_size=5,
        pool_reset_session=True,
        **db_config
    )
    print("MySQL Connection Pool created successfully.")
except Exception as e:
    print(f"Error creating MySQL Connection Pool: {e}")
    connection_pool = None

def get_db():
    if connection_pool:
        try:
            return connection_pool.get_connection()
        except Exception as e:
            print(f"Error getting connection from pool: {e}")
            return None
    return None
