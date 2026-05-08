from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt
import datetime
from functools import wraps
from db_config import get_db
import json
import os

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your_secret_key_change_this')

def init_db():
    conn = get_db()
    if not conn: return
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            password VARCHAR(255),
            address TEXT,
            phone VARCHAR(20),
            wishlist JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            price DECIMAL(10, 2),
            category VARCHAR(100),
            image TEXT,
            rating DECIMAL(3, 2) DEFAULT 4.5
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            items JSON,
            total DECIMAL(10, 2),
            shipping_name VARCHAR(255),
            shipping_address TEXT,
            shipping_phone VARCHAR(20),
            shipping_method VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()

init_db()

# Helper to format SQL rows as dicts
def format_row(cursor, row):
    if not row: return None
    desc = cursor.description
    return {desc[i][0]: row[i] for i in range(len(row))}

def format_rows(cursor, rows):
    return [format_row(cursor, r) for r in rows]

@app.route("/")
def home():
    conn = get_db()
    if conn:
        conn.close()
        return "<h1>SHOP EASE API is running! 🚀</h1><p>TiDB Connection: <b>Connected ✅</b></p><p>Go to <a href='/api/seed'>/api/seed</a> to populate your data.</p>"
    else:
        return "<h1>SHOP EASE API is running! 🚀</h1><p>TiDB Connection: <b>Failed ❌</b></p>"

# Authentication Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = %s", (data['user_id'],))
            user = format_row(cursor, cursor.fetchone())
            cursor.close()
            conn.close()
            if not user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': f'Token is invalid! {str(e)}'}), 401
        return f(user, *args, **kwargs)
    return decorated

# --- AUTH ROUTES ---

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    if not data.get('email') or not data.get('password'):
        return jsonify({"message": "Missing email or password"}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"message": "User already exists"}), 409
    
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    try:
        cursor.execute("""
            INSERT INTO users (name, email, password, address, phone, wishlist)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (data.get('name', 'User'), data['email'], hashed_pw, "", "", "[]"))
        conn.commit()
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({"message": "User created successfully", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (data.get('email'),))
    user = format_row(cursor, cursor.fetchone())
    cursor.close()
    conn.close()
    
    if user and bcrypt.check_password_hash(user['password'], data.get('password')):
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "address": user.get('address', ''),
                "phone": user.get('phone', ''),
                "wishlist": json.loads(user.get('wishlist', '[]'))
            }
        }), 200
    
    return jsonify({"message": "Invalid credentials"}), 401

@app.route("/api/me", methods=["GET"])
@token_required
def get_me(current_user):
    if 'password' in current_user: del current_user['password']
    if 'wishlist' in current_user and isinstance(current_user['wishlist'], str):
        current_user['wishlist'] = json.loads(current_user['wishlist'])
    return jsonify(current_user)

@app.route("/api/profile/update", methods=["POST"])
@token_required
def update_profile(current_user):
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users SET name = %s, address = %s, phone = %s WHERE id = %s
    """, (
        data.get('name', current_user.get('name')),
        data.get('address', current_user.get('address')),
        data.get('phone', current_user.get('phone')),
        current_user['id']
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Profile updated successfully"})

# --- PRODUCT ROUTES ---

@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category")
    conn = get_db()
    cursor = conn.cursor()
    if category:
        cursor.execute("SELECT * FROM products WHERE category = %s", (category,))
    else:
        cursor.execute("SELECT * FROM products")
    products = format_rows(cursor, cursor.fetchall())
    cursor.close()
    conn.close()
    return jsonify(products)

@app.route("/api/products/search", methods=["GET"])
def search_products():
    q = request.args.get("q", "")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE name LIKE %s", (f"%{q}%",))
    products = format_rows(cursor, cursor.fetchall())
    cursor.close()
    conn.close()
    return jsonify(products)

# --- WISHLIST ROUTES ---

@app.route("/api/wishlist", methods=["GET"])
@token_required
def get_wishlist(current_user):
    wishlist_ids = current_user.get('wishlist', [])
    if not wishlist_ids: return jsonify([])
    
    # Ensure ids are integers
    ids = [int(i) for i in wishlist_ids if str(i).isdigit()]
    if not ids: return jsonify([])
    
    format_strings = ','.join(['%s'] * len(ids))
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM products WHERE id IN ({format_strings})", tuple(ids))
    products = format_rows(cursor, cursor.fetchall())
    cursor.close()
    conn.close()
    return jsonify(products)

@app.route("/api/wishlist/toggle", methods=["POST"])
@token_required
def toggle_wishlist(current_user):
    data = request.json
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({"message": "Product ID required"}), 400
    
    wishlist = current_user.get('wishlist', [])
    if isinstance(wishlist, str): wishlist = json.loads(wishlist)
    
    product_id = int(product_id)
    if product_id in wishlist:
        wishlist.remove(product_id)
        action = "removed"
    else:
        wishlist.append(product_id)
        action = "added"
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET wishlist = %s WHERE id = %s", (json.dumps(wishlist), current_user['id']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": f"Product {action} wishlist", "action": action})

# --- ORDER ROUTES ---

@app.route("/api/orders", methods=["GET"])
@token_required
def get_orders(current_user):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC", (current_user['id'],))
        orders = format_rows(cursor, cursor.fetchall())
        for o in orders:
            if isinstance(o['items'], str): o['items'] = json.loads(o['items'])
        cursor.close()
        conn.close()
        return jsonify(orders)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/api/orders", methods=["POST"])
@token_required
def place_order(current_user):
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO orders (user_id, items, total, shipping_name, shipping_address, shipping_phone, shipping_method)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            current_user['id'],
            json.dumps(data.get('items', [])),
            data.get('total', 0),
            data.get('shipping', {}).get('name', ''),
            data.get('shipping', {}).get('address', ''),
            data.get('shipping', {}).get('phone', ''),
            data.get('shipping', {}).get('method', '')
        ))
        conn.commit()
        order_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/api/orders/<order_id>/cancel", methods=["PUT"])
@token_required
def cancel_order(current_user, order_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM orders WHERE id = %s AND user_id = %s", (order_id, current_user['id']))
        order = cursor.fetchone()
        if not order:
            cursor.close()
            conn.close()
            return jsonify({"message": "Order not found"}), 404
        
        if order[0] != 'Pending':
            cursor.close()
            conn.close()
            return jsonify({"message": f"Cannot cancel order with status: {order[0]}"}), 400
            
        cursor.execute("UPDATE orders SET status = 'Cancelled' WHERE id = %s", (order_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Order cancelled successfully"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# Seed database with initial products
@app.route("/api/seed", methods=["GET", "POST"])
def seed_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products")
    initial_products = [
        ("T-shirt with Tape Details", 120, "casual", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80"),
        ("Skinny Fit Jeans", 240, "casual", "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80"),
        ("Checkered Shirt", 180, "formal", "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=400&q=80"),
        ("Sleeve Striped T-Shirt", 130, "casual", "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&q=80"),
        ("Vertical Striped Shirt", 212, "formal", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80"),
        ("Courage Graphic T-Shirt", 145, "men", "https://images.unsplash.com/photo-1576566582419-1738421c7e7b?w=400&q=80"),
        ("Loose Fit Bermuda Shorts", 80, "men", "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80"),
        ("Faded Skinny Jeans", 210, "women", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80"),
        ("Gym Stringer Tank", 45, "gym", "https://images.unsplash.com/photo-1583454110551-21f2fa2ec617?w=400&q=80"),
        ("Party Sparkle Dress", 320, "party", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80"),
        ("Kids Cartoon Tee", 35, "kids", "https://images.unsplash.com/photo-1519235106638-30cc49daeb66?w=400&q=80")
    ]
    cursor.executemany("""
        INSERT INTO products (name, price, category, image) VALUES (%s, %s, %s, %s)
    """, initial_products)
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": f"Database seeded with {len(initial_products)} products"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)