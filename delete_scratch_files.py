import os

paths = [
    r"c:\Users\Welcome\OneDrive\Documents\E commerce website\find_stats.py",
    r"c:\Users\Welcome\OneDrive\Documents\E commerce website\query_db.py",
    r"c:\Users\Welcome\OneDrive\Documents\E commerce website\find_db_config.py",
    r"c:\Users\Welcome\OneDrive\Documents\E commerce website\find_admin_password.py"
]

for p in paths:
    if os.path.exists(p):
        try:
            os.remove(p)
            print(f"Deleted {p}")
        except Exception as e:
            print(f"Error deleting {p}: {e}")
