import os
import sys
import mysql.connector
from mysql.connector import pooling
import sqlite3
from dotenv import load_dotenv
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

load_dotenv()

# Check if we should use SQLite fallback (Demo Mode)
TIDB_HOST = os.getenv("TIDB_HOST")
USE_SQLITE = TIDB_HOST in [None, "", "your-tidb-host.tidbcloud.com"]

class SQLiteCursorShim:
    def __init__(self, cursor):
        self.cursor = cursor
    
    def execute(self, query, params=None):
        import re
        # Convert MySQL-isms to SQLite-isms
        query = query.replace('%s', '?')
        query = query.replace('AUTO_INCREMENT', '')
        # INTEGER PRIMARY KEY is required for SQLite rowid / lastrowid behavior
        query = re.sub(r'\bINT\s+PRIMARY\s+KEY\b', 'INTEGER PRIMARY KEY', query, flags=re.IGNORECASE)
        # SQLite uses UNIQUE instead of UNIQUE KEY and doesn't support named unique keys inside CREATE TABLE
        query = re.sub(r'UNIQUE KEY\s+\w+\s*', 'UNIQUE', query, flags=re.IGNORECASE)
        query = re.sub(r'UNIQUE\s+\w+\s*', 'UNIQUE', query, flags=re.IGNORECASE)
        # Strip MySQL-specific INDEX definitions inside CREATE TABLE
        query = re.sub(r',\s*INDEX\s+ix_.*\(.*\)', '', query, flags=re.IGNORECASE)
        # Strip MySQL-specific ON UPDATE CURRENT_TIMESTAMP
        query = re.sub(r'DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'DEFAULT CURRENT_TIMESTAMP', query, flags=re.IGNORECASE)
        
        if params:
            return self.cursor.execute(query, params)
        return self.cursor.execute(query)
    
    def fetchone(self): return self.cursor.fetchone()
    def fetchall(self): return self.cursor.fetchall()
    def close(self): self.cursor.close()
    
    @property
    def description(self): return self.cursor.description
    @property
    def lastrowid(self): return self.cursor.lastrowid

class SQLiteConnection:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
    
    def cursor(self, dictionary=True, buffered=True):
        return SQLiteCursorShim(self.conn.cursor())
    
    def commit(self): self.conn.commit()
    def rollback(self): self.conn.rollback()
    def close(self): self.conn.close()

class SQLitePool:
    def __init__(self, db_path):
        self.db_path = db_path
    def get_connection(self):
        return SQLiteConnection(self.db_path)

connection_pool = None

if USE_SQLITE:
    logger.info("Using SQLite Fallback (Demo Mode)")
    connection_pool = SQLitePool("ecommerce_demo.db")
else:
    db_params = {
        "host": TIDB_HOST,
        "port": int(os.getenv("TIDB_PORT", 4000)),
        "user": os.getenv("TIDB_USER"),
        "password": os.getenv("TIDB_PASSWORD"),
        "database": os.getenv("TIDB_DB"),
        "ssl_ca": os.getenv("TIDB_CA_PATH")
    }
    try:
        connection_pool = pooling.MySQLConnectionPool(
            pool_name="ecommerce_pool",
            pool_size=5,
            **db_params
        )
    except Exception as e:
        logger.error(f"Failed to initialize MySQL Pool: {e}")

@contextmanager
def get_db():
    if not connection_pool:
        raise Exception("Database connection pool is not initialized.")
    conn = connection_pool.get_connection()
    try:
        cursor = conn.cursor()
        yield conn, cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

def get_pool_stats():
    if USE_SQLITE: return {"type": "sqlite", "mode": "demo"}
    return {"status": "mysql"}
