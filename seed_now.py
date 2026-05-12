from app import app, INITIAL_PRODUCTS
from db_config import get_db, USE_SQLITE

def force_seed():
    print(f"Seeding Database (Mode: {'SQLite' if USE_SQLITE else 'MySQL'})...")
    with app.app_context():
        try:
            with get_db() as (conn, cursor):
                for p in INITIAL_PRODUCTS:
                    name, price, cat, img = p
                    # Check if product exists
                    cursor.execute("SELECT id FROM products WHERE name = %s", (name,))
                    if not cursor.fetchone():
                        cursor.execute("""
                            INSERT INTO products (name, price, category, image, rating)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (name, price, cat, img, 4.5))
                conn.commit()
            print("Database seeded successfully! ✅")
        except Exception as e:
            print(f"Seeding error: {e}")

if __name__ == "__main__":
    force_seed()
