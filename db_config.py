import os
import sys
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv
from contextlib import contextmanager
from logger import setup_logger

logger = setup_logger(__name__)

load_dotenv()

def _require_env(name):
    value = os.getenv(name)
    if not value:
        logger.error(f"Missing required environment variable: {name}")
        sys.exit(1)
    return value

# Pool Configuration
DB_POOL_MIN = int(os.getenv("DB_POOL_MIN", 2))
DB_POOL_MAX = int(os.getenv("DB_POOL_MAX", 20))

db_params = {
    "host": _require_env("TIDB_HOST"),
    "port": int(os.getenv("TIDB_PORT", 4000)),
    "user": _require_env("TIDB_USER"),
    "password": _require_env("TIDB_PASSWORD"),
    "database": _require_env("TIDB_DB"),
    "ssl_ca": os.getenv("TIDB_CA_PATH"),
    "ssl_verify_cert": True if os.getenv("TIDB_CA_PATH") else False
}

try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="ecommerce_pool",
        pool_size=DB_POOL_MAX,
        pool_reset_session=True,
        **db_params
    )
    logger.info(f"MySQL Connection Pool initialized (size: {DB_POOL_MAX})")
except Exception as e:
    logger.critical(f"Failed to initialize MySQL Connection Pool: {e}")
    connection_pool = None

@contextmanager
def get_db():
    if not connection_pool:
        raise Exception("Database connection pool is not initialized.")
    
    conn = connection_pool.get_connection()
    cursor = conn.cursor()
    try:
        yield conn, cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        if conn and conn.is_connected():
            conn.close() # Returns to pool

def get_pool_stats():
    if not connection_pool:
        return None
    return {
        "pool_name": connection_pool.pool_name,
        "pool_size": connection_pool.pool_size,
    }
