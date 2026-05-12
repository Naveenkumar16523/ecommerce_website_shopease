import os
import sqlite3
import re
import mysql.connector
from mysql.connector import pooling
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

# --- SQLite Shim ---
class SQLiteCursorShim:
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, query, params=None):
        # 1. Replace %s -> ?
        query = query.replace('%s', '?')
        
        # 2. Remove AUTO_INCREMENT (Strip it from INT/INTEGER PRIMARY KEY context)
        query = re.sub(r'\s+AUTO_INCREMENT', '', query, flags=re.IGNORECASE)
        
        # 3. Replace INT PRIMARY KEY -> INTEGER PRIMARY KEY
        query = re.sub(r'INT\s+PRIMARY\s+KEY', 'INTEGER PRIMARY KEY', query, flags=re.IGNORECASE)
        
        # 4. Fix UNIQUE KEY syntax: UNIQUE KEY keyname (col1, col2) -> UNIQUE (col1, col2)
        query = re.sub(
            r'UNIQUE\s+KEY\s+\w+\s*(\([^)]+\))',
            r'UNIQUE \1',
            query,
            flags=re.IGNORECASE
        )
        
        # 5. Strip ,INDEX ix_... lines (entire comma + INDEX definition)
        query = re.sub(r',\s*INDEX\s+ix_\w+\s+\(.*\)', '', query, flags=re.IGNORECASE)
        
        # 6. Strip ON UPDATE CURRENT_TIMESTAMP
        query = re.sub(r'ON\s+UPDATE\s+CURRENT_TIMESTAMP', '', query, flags=re.IGNORECASE)

        if params:
            return self.cursor.execute(query, params)
        return self.cursor.execute(query)

    def fetchone(self): return self.cursor.fetchone()
    def fetchall(self): return self.cursor.fetchall()
    def close(self): self.cursor.close()
    @property
    def lastrowid(self): return self.cursor.lastrowid
    @property
    def description(self): return self.cursor.description

class SQLiteConnection:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")

    def cursor(self):
        return SQLiteCursorShim(self.conn.cursor())

    def commit(self): self.conn.commit()
    def rollback(self): self.conn.rollback()
    def close(self): self.conn.close()

class SQLitePool:
    def __init__(self, db_path):
        self.db_path = db_path

    def get_connection(self):
        return SQLiteConnection(self.db_path)

# --- Database Selection Logic ---
TIDB_HOST = os.environ.get('TIDB_HOST')
USE_SQLITE = not TIDB_HOST or TIDB_HOST == "your-tidb-host.tidbcloud.com"

if USE_SQLITE:
    pool = SQLitePool('ecommerce_demo.db')
else:
    pool = pooling.MySQLConnectionPool(
        pool_name="shopease_pool",
        pool_size=5,
        host=os.environ.get('TIDB_HOST'),
        port=int(os.environ.get('TIDB_PORT', 4000)),
        user=os.environ.get('TIDB_USER'),
        password=os.environ.get('TIDB_PASSWORD'),
        database=os.environ.get('TIDB_DB'),
        ssl_ca=os.environ.get('TIDB_CA_PATH')
    )

@contextmanager
def get_db():
    conn = pool.get_connection()
    cursor = conn.cursor()
    try:
        yield conn, cursor
        if not USE_SQLITE:
            conn.commit()
        else:
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def get_pool_stats():
    if USE_SQLITE:
        return {"type": "sqlite", "mode": "demo"}
    return {"status": "mysql"}
