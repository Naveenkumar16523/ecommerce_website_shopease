import os
import re
import sqlite3
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

# ─── Detect environment ───────────────────────────────────────────────
USE_SQLITE = not os.getenv("TIDB_HOST")
DB_FILE    = os.getenv("SQLITE_DB", "ecommerce_demo.db")

# ─────────────────────────────────────────────────────────────────────
# SQLite shim — translates MySQL DDL/DML to SQLite-compatible syntax
# ─────────────────────────────────────────────────────────────────────
def _mysql_to_sqlite(query):
    # 1. Placeholders
    query = query.replace("%s", "?")
    # 2. AUTO_INCREMENT  → AUTOINCREMENT (already on INTEGER PRIMARY KEY cols)
    query = re.sub(r"\s+AUTO_INCREMENT", "", query, flags=re.IGNORECASE)
    # 3. INT/BIGINT PRIMARY KEY → INTEGER PRIMARY KEY (required for rowid alias)
    query = re.sub(r"\b(INT|BIGINT)\b\s+PRIMARY\s+KEY", "INTEGER PRIMARY KEY", query, flags=re.IGNORECASE)
    query = re.sub(r"\b(INT|BIGINT)\b\s+AUTOINCREMENT\s+PRIMARY\s+KEY", "INTEGER PRIMARY KEY", query, flags=re.IGNORECASE)
    # 4. ON UPDATE CURRENT_TIMESTAMP → (not supported, drop clause)
    query = re.sub(r"\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP", "", query, flags=re.IGNORECASE)
    # 5. UNIQUE KEY name (cols) → UNIQUE (cols)
    query = re.sub(r"\bUNIQUE\s+KEY\s+\w+\s*\(", "UNIQUE (", query, flags=re.IGNORECASE)
    # 6. INDEX / KEY declarations inside CREATE TABLE → remove (SQLite ignores)
    query = re.sub(r",?\s*\bINDEX\s+\w+\s*\([^)]+\)", "", query, flags=re.IGNORECASE)
    query = re.sub(r",?\s*\bKEY\s+\w+\s*\([^)]+\)", "", query, flags=re.IGNORECASE)
    # 7. FOREIGN KEY constraints → remove (or simplify; here we drop for simplicity)
    query = re.sub(r",?\s*FOREIGN\s+KEY\s*\([^)]+\)\s+REFERENCES\s+\w+\s*\([^)]+\)[^,)]*", "", query, flags=re.IGNORECASE)
    # 8. ON DUPLICATE KEY UPDATE → INSERT OR REPLACE workaround signal
    #    We'll handle this with a flag approach in the cursor execute
    # 9. VARCHAR(n) / TEXT / DECIMAL etc. → TEXT (SQLite is dynamically typed)
    # (SQLite accepts these natively — no conversion needed)
    # 10. CURRENT_TIMESTAMP is the same in both
    # 11. Strip trailing commas before closing paren (left by removed clauses)
    query = re.sub(r",\s*\)", "\n)", query)
    return query


class _SQLiteCursorShim:
    """Wraps sqlite3.Cursor with MySQL compatibility helpers."""

    def __init__(self, conn):
        self._conn   = conn
        self._cursor = conn.cursor()
        self.lastrowid   = None
        self.description = None
        self.rowcount    = 0

    def execute(self, query, params=None):
        original = query

        # Special: ON DUPLICATE KEY UPDATE → INSERT OR REPLACE
        if re.search(r"ON\s+DUPLICATE\s+KEY\s+UPDATE", query, re.IGNORECASE):
            # Convert INSERT INTO … VALUES … ON DUPLICATE KEY UPDATE …
            # to INSERT OR REPLACE INTO … VALUES …
            query = re.sub(
                r"INSERT\s+INTO",
                "INSERT OR REPLACE INTO",
                query, count=1, flags=re.IGNORECASE
            )
            query = re.sub(
                r"\s+ON\s+DUPLICATE\s+KEY\s+UPDATE\s+.*",
                "",
                query,
                flags=re.IGNORECASE | re.DOTALL
            )

        query = _mysql_to_sqlite(query)

        try:
            if params is not None:
                self._cursor.execute(query, params)
            else:
                self._cursor.execute(query)
        except Exception as e:
            raise Exception(f"SQLite execute error:\n  SQL: {query!r}\n  Params: {params!r}\n  Error: {e}")

        self.lastrowid   = self._cursor.lastrowid
        self.description = self._cursor.description
        self.rowcount    = self._cursor.rowcount
        return self

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def close(self):
        self._cursor.close()


class _SQLiteConnShim:
    """Wraps sqlite3.Connection to expose a MySQL-like .cursor() interface."""

    def __init__(self, path):
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row  # dict-like rows
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA foreign_keys=ON")

    def cursor(self):
        return _SQLiteCursorShim(self._conn)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def is_connected(self):
        return True

    def close(self):
        pass  # Keep connection alive (single-file SQLite; close at exit)


# ─── SQLite singleton ─────────────────────────────────────────────────
_sqlite_conn = None

def _get_sqlite_conn():
    global _sqlite_conn
    if _sqlite_conn is None:
        _sqlite_conn = _SQLiteConnShim(DB_FILE)
    return _sqlite_conn


# ─── MySQL / TiDB pool (only created when env vars are present) ───────
_mysql_pool = None

def _get_mysql_pool():
    global _mysql_pool
    if _mysql_pool is not None:
        return _mysql_pool
    try:
        import mysql.connector
        from mysql.connector import pooling
        params = {
            "host":     os.getenv("TIDB_HOST"),
            "port":     int(os.getenv("TIDB_PORT", 4000)),
            "user":     os.getenv("TIDB_USER"),
            "password": os.getenv("TIDB_PASSWORD"),
            "database": os.getenv("TIDB_DB", "test"),
        }
        ca = os.getenv("TIDB_CA_PATH")
        if ca:
            params["ssl_ca"] = ca
            params["ssl_verify_cert"] = True
        _mysql_pool = pooling.MySQLConnectionPool(
            pool_name="ecommerce_pool",
            pool_size=int(os.getenv("DB_POOL_MAX", 10)),
            pool_reset_session=True,
            **params
        )
        print(f"[db] MySQL/TiDB pool initialised (size={_mysql_pool.pool_size})")
    except Exception as e:
        print(f"[db] WARNING: Could not connect to MySQL/TiDB: {e}")
        _mysql_pool = None
    return _mysql_pool


# ─── Public context-manager ───────────────────────────────────────────
@contextmanager
def get_db():
    if USE_SQLITE:
        conn   = _get_sqlite_conn()
        cursor = conn.cursor()
        try:
            yield conn, cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
    else:
        pool = _get_mysql_pool()
        if pool is None:
            raise RuntimeError("MySQL/TiDB pool is not available.")
        conn = pool.get_connection()
        cursor = conn.cursor()
        try:
            yield conn, cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            if conn.is_connected():
                conn.close()


def get_pool_stats():
    if USE_SQLITE:
        return {"engine": "SQLite", "db_file": DB_FILE}
    pool = _get_mysql_pool()
    if pool:
        return {"engine": "MySQL/TiDB", "pool_name": pool.pool_name, "pool_size": pool.pool_size}
    return {"engine": "unavailable"}
