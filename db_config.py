import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def get_db():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("TIDB_HOST", "gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com"),
            port=int(os.getenv("TIDB_PORT", 4000)),
            user=os.getenv("TIDB_USER", "C1oET5ekms8MRP5.root"),
            password=os.getenv("TIDB_PASSWORD", "OSoCgL5M2UZ8JKO8"),
            database=os.getenv("TIDB_DB", "sys"),
            ssl_ca=os.getenv("TIDB_CA_PATH"), # Required for TiDB Cloud
            ssl_verify_cert=True if os.getenv("TIDB_CA_PATH") else False
        )
        return conn
    except Exception as e:
        print(f"Error connecting to TiDB: {e}")
        return None
