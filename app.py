import os
import click
import json
import time
import math
import decimal
import datetime
import functools
import jwt
from flask import Flask, request, jsonify, make_response, send_from_directory, g, render_template, redirect, url_for
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import ValidationError
from slugify import slugify
from werkzeug.exceptions import HTTPException, NotFound

import schemas
import db_config
import config
from logger import logger
from seeds.products import INITIAL_PRODUCTS

# --- App Initialization ---
app = Flask(__name__)
current_config = config.get_config()
app.config.from_object(current_config)

bcrypt = Bcrypt(app)

# Rate Limiter
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["5000 per day", "1000 per hour"],
    storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", "memory://")
)

# CORS
CORS(app, resources={r"/api/*": {"origins": current_config.ALLOWED_ORIGINS}}, supports_credentials=True)

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin in current_config.ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# --- Helper Functions ---
def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

def format_row(cursor, row):
    if not row: return None
    d = {}
    for idx, col in enumerate(cursor.description):
        name = col[0]
        val = row[idx]
        if isinstance(val, (datetime.datetime, datetime.date)):
            d[name] = val.isoformat()
        elif isinstance(val, decimal.Decimal):
            d[name] = float(val)
        else:
            d[name] = val
    return d

def format_rows(cursor, rows):
    return [format_row(cursor, row) for row in rows]

def generate_product_slug(product_id, name):
    return f"{slugify(name)}-{product_id}"

# Login Attempt Helpers
def _reset_login_attempts(cursor, email):
    cursor.execute("DELETE FROM login_attempts WHERE email = %s", (email,))

def _record_failed_login(cursor, email):
    cursor.execute("SELECT attempts FROM login_attempts WHERE email = %s", (email,))
    row = cursor.fetchone()
    now = utc_now()
    if row:
        attempts = row[0] + 1
        locked_until = None
        if attempts >= 10:
            locked_until = now + datetime.timedelta(minutes=30)
        cursor.execute(
            "UPDATE login_attempts SET attempts = %s, last_attempt = %s, locked_until = %s WHERE email = %s",
            (attempts, now, locked_until, email)
        )
    else:
        cursor.execute(
            "INSERT INTO login_attempts (email, attempts, last_attempt) VALUES (%s, 1, %s)",
            (email, now)
        )

# --- Auth Decorators ---
def token_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('auth_token')
        if not token:
            return jsonify({"message": "Token is missing!"}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            with db_config.get_db() as (conn, cursor):
                cursor.execute("SELECT * FROM users WHERE id = %s", (data['user_id'],))
                user = format_row(cursor, cursor.fetchone())
            if not user:
                return jsonify({"message": "User not found!"}), 401
            g.user = user
        except Exception as e:
            return jsonify({"message": "Token is invalid!", "error": str(e)}), 401
        return f(user, *args, **kwargs)
    return decorated

def validate_payload(schema_class):
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            try:
                schema = schema_class()
                data = schema.load(request.json or {})
                return f(data, *args, **kwargs)
            except ValidationError as err:
                return jsonify({"errors": err.messages}), 422
        return decorated
    return decorator

# --- Pagination Helper ---
def paginate_collection(base_query, count_query, params=None, schema=None, order_by="id DESC"):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    if per_page > 100: per_page = 100
    offset = (page - 1) * per_page

    params = params or ()
    with db_config.get_db() as (conn, cursor):
        cursor.execute(count_query, params)
        total_items = cursor.fetchone()[0]
        
        data_query = f"{base_query} ORDER BY {order_by} LIMIT {per_page} OFFSET {offset}"
        cursor.execute(data_query, params)
        rows = format_rows(cursor, cursor.fetchall())

    total_pages = math.ceil(total_items / per_page)
    has_next = page < total_pages
    has_prev = page > 1

    return {
        "data": rows,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }
    }

# --- Database Initialization ---
_db_initialized = False

def init_db():
    global _db_initialized
    if _db_initialized: return
    
    with db_config.get_db() as (conn, cursor):
        # Users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                password VARCHAR(255),
                address TEXT,
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX ix_users_email (email),
                INDEX ix_users_updated (updated_at)
            )
        """)
        
        # Products
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                price DECIMAL(10,2),
                category VARCHAR(100),
                image TEXT,
                rating DECIMAL(3,2) DEFAULT 4.5,
                slug VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX ix_products_slug (slug),
                INDEX ix_products_category (category)
            )
        """)
        
        # Wishlist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wishlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                product_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_product (user_id, product_id),
                INDEX ix_wishlist_user (user_id)
            )
        """)
        
        # Orders
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                total DECIMAL(10,2),
                status VARCHAR(50) DEFAULT 'Pending',
                shipping_name VARCHAR(255),
                shipping_address TEXT,
                shipping_phone VARCHAR(20),
                shipping_method VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX ix_orders_user (user_id)
            )
        """)
        
        # Order Items
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT,
                product_id INT,
                quantity INT,
                unit_price DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
                INDEX ix_order_items_order (order_id)
            )
        """)
        
        # Login Attempts
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS login_attempts (
                email VARCHAR(255) PRIMARY KEY,
                attempts INT DEFAULT 0,
                last_attempt TIMESTAMP,
                locked_until TIMESTAMP NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX ix_login_email_locked (email, locked_until)
            )
        """)
        
    _db_initialized = True
    logger.info("Database initialized.")

@app.before_request
def setup():
    init_db()
    # Load logged in user
    g.user = None
    token = request.cookies.get('auth_token')
    if token:
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            with db_config.get_db() as (conn, cursor):
                cursor.execute("SELECT id, name, email FROM users WHERE id = %s", (data['user_id'],))
                g.user = format_row(cursor, cursor.fetchone())
        except:
            pass

@app.context_processor
def inject_globals():
    return {
        "current_year": datetime.datetime.now().year,
        "current_user": g.user
    }

# --- API Routes ---

@app.route('/api/health')
def health():
    return jsonify({
        "status": "healthy",
        "database": db_config.get_pool_stats(),
        "timestamp": utc_now().isoformat(),
        "version": "1.2.0",
        "api": "SHOP EASE API"
    })

@app.route('/api/admin/seed', methods=['POST', 'GET'])
def secret_seed():
    auth_key = request.args.get('key')
    if auth_key != app.config['SECRET_KEY']:
        return jsonify({"message": "Unauthorized"}), 401
        
    with db_config.get_db() as (conn, cursor):
        for p in INITIAL_PRODUCTS:
            cursor.execute("SELECT id FROM products WHERE name = %s", (p['name'],))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO products (name, price, category, image, rating) VALUES (%s, %s, %s, %s, %s)",
                    (p['name'], p['price'], p['category'], p['image'], p['rating'])
                )
                pid = cursor.lastrowid
                slug = generate_product_slug(pid, p['name'])
                cursor.execute("UPDATE products SET slug = %s WHERE id = %s", (slug, pid))
    return jsonify({"message": "Database seeded successfully"}), 200

@app.route('/api/signup', methods=['POST'])
@limiter.limit("3 per minute; 10 per hour")
@validate_payload(schemas.SignupSchema)
def signup(data):
    with db_config.get_db() as (conn, cursor):
        cursor.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            return jsonify({"message": "Email already registered"}), 409
        
        hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
            (data['name'], data['email'], hashed_pw)
        )
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute; 20 per hour")
@validate_payload(schemas.LoginSchema)
def login(data):
    email = data['email']
    with db_config.get_db() as (conn, cursor):
        # Check lockout
        cursor.execute("SELECT attempts, locked_until FROM login_attempts WHERE email = %s", (email,))
        attempt_row = cursor.fetchone()
        if attempt_row and attempt_row[1]:
            locked_until = attempt_row[1]
            # Handle both SQLite (string) and MySQL (datetime)
            if isinstance(locked_until, str):
                locked_until = datetime.datetime.fromisoformat(locked_until.replace('Z', '+00:00'))
            
            if locked_until > utc_now():
                retry_after = int((locked_until - utc_now()).total_seconds())
                return jsonify({
                    "message": "Account locked due to too many failed attempts",
                    "retry_after": retry_after
                }), 423
        
        cursor.execute("SELECT id, name, email, password FROM users WHERE email = %s", (email,))
        user = format_row(cursor, cursor.fetchone())
        
        if user and bcrypt.check_password_hash(user['password'], data['password']):
            _reset_login_attempts(cursor, email)
            token = jwt.encode({
                "user_id": user['id'],
                "exp": utc_now() + datetime.timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm="HS256")
            
            res = make_response(jsonify({
                "user": {
                    "id": user['id'],
                    "name": user['name'],
                    "email": user['email']
                }
            }))
            res.set_cookie(
                'auth_token', 
                token, 
                httponly=True, 
                secure=app.config['SESSION_COOKIE_SECURE'],
                samesite='Lax',
                max_age=86400
            )
            return res
        else:
            _record_failed_login(cursor, email)
            return jsonify({"message": "Invalid credentials"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    res = make_response(jsonify({"message": "Logged out successfully"}))
    res.delete_cookie('auth_token')
    return res

@app.route('/api/me')
@token_required
def get_me(user):
    user.pop('password', None)
    with db_config.get_db() as (conn, cursor):
        cursor.execute("SELECT product_id FROM wishlist WHERE user_id = %s", (user['id'],))
        user['wishlist_ids'] = [r[0] for r in cursor.fetchall()]
    return jsonify(user)

@app.route('/api/profile/update', methods=['POST', 'PUT'])
@token_required
@validate_payload(schemas.ProfileUpdateSchema)
def update_profile(user, data):
    client_updated_at = data.get('updated_at')
    with db_config.get_db() as (conn, cursor):
        if client_updated_at:
            cursor.execute("SELECT updated_at FROM users WHERE id = %s", (user['id'],))
            db_val = cursor.fetchone()[0]
            # Normalizing comparison
            if str(db_val) != str(client_updated_at):
                return jsonify({
                    "error": "Conflict",
                    "message": "Profile was updated elsewhere. Please refresh.",
                    "db_updated_at": str(db_val)
                }), 409
        
        cursor.execute(
            "UPDATE users SET address = %s, phone = %s WHERE id = %s",
            (data.get('address'), data.get('phone'), user['id'])
        )
    return jsonify({"message": "Profile updated successfully"})

@app.route('/api/products')
@limiter.limit("30 per minute")
def get_products():
    category = request.args.get('category')
    base = "SELECT * FROM products"
    count = "SELECT COUNT(*) FROM products"
    params = ()
    if category:
        base += " WHERE category = %s"
        count += " WHERE category = %s"
        params = (category,)
    
    return jsonify(paginate_collection(base, count, params, order_by="id ASC"))

@app.route('/api/products/<int:id>')
def get_product(id):
    with db_config.get_db() as (conn, cursor):
        cursor.execute("SELECT * FROM products WHERE id = %s", (id,))
        product = format_row(cursor, cursor.fetchone())
    if not product:
        return jsonify({"message": "Product not found"}), 404
    return jsonify(product)

@app.route('/api/wishlist')
@token_required
def get_wishlist(user):
    base = "SELECT p.* FROM products p JOIN wishlist w ON p.id = w.product_id WHERE w.user_id = %s"
    count = "SELECT COUNT(*) FROM wishlist WHERE user_id = %s"
    return jsonify(paginate_collection(base, count, (user['id'],), order_by="w.created_at DESC"))

@app.route('/api/wishlist/toggle', methods=['POST'])
@token_required
@limiter.limit("20 per minute")
@validate_payload(schemas.WishlistToggleSchema)
def toggle_wishlist(user, data):
    pid = data['product_id']
    with db_config.get_db() as (conn, cursor):
        cursor.execute("SELECT id FROM wishlist WHERE user_id = %s AND product_id = %s", (user['id'], pid))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("DELETE FROM wishlist WHERE id = %s", (existing[0],))
            return jsonify({"message": "Removed from wishlist", "action": "removed"})
        else:
            cursor.execute("INSERT INTO wishlist (user_id, product_id) VALUES (%s, %s)", (user['id'], pid))
            return jsonify({"message": "Added to wishlist", "action": "added"})

@app.route('/api/orders')
@token_required
def get_orders(user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    offset = (page - 1) * per_page
    
    with db_config.get_db() as (conn, cursor):
        cursor.execute("SELECT COUNT(*) FROM orders WHERE user_id = %s", (user['id'],))
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s", 
                       (user['id'], per_page, offset))
        orders = format_rows(cursor, cursor.fetchall())
        
        if orders:
            order_ids = [o['id'] for o in orders]
            placeholders = ','.join(['%s'] * len(order_ids))
            cursor.execute(f"""
                SELECT oi.*, p.name, p.image 
                FROM order_items oi 
                LEFT JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id IN ({placeholders})
            """, tuple(order_ids))
            items = format_rows(cursor, cursor.fetchall())
            
            for order in orders:
                order['items'] = [i for i in items if i['order_id'] == order['id']]
                for i in order['items']:
                    i['subtotal'] = float(i['unit_price']) * i['quantity']
        
    total_pages = math.ceil(total / per_page)
    return jsonify({
        "data": orders,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total_items": total,
            "total_pages": total_pages
        }
    })

@app.route('/api/orders', methods=['POST'])
@token_required
@limiter.limit("10 per minute")
@validate_payload(schemas.OrderSchema)
def place_order(user, data):
    with db_config.get_db() as (conn, cursor):
        server_subtotal = 0
        order_items = []
        for item in data['items']:
            cursor.execute("SELECT price, name FROM products WHERE id = %s", (item['product_id'],))
            prod = cursor.fetchone()
            if not prod:
                return jsonify({"message": f"Product {item['product_id']} not found"}), 400
            price = float(prod[0])
            server_subtotal += price * item['qty']
            order_items.append({
                "product_id": item['product_id'],
                "qty": item['qty'],
                "price": price
            })
            
        discount = int(math.floor(server_subtotal * 0.2 + 0.5))
        delivery = 15
        server_grand = server_subtotal - discount + delivery
        
        if abs(data['total'] - server_grand) > 0.02:
            return jsonify({
                "message": "Order total mismatch",
                "expected_total": server_grand
            }), 400
            
        ship = data['shipping']
        cursor.execute("""
            INSERT INTO orders (user_id, total, shipping_name, shipping_address, shipping_phone, shipping_method)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user['id'], server_grand, ship['name'], ship['address'], ship['phone'], ship.get('method', 'Standard')))
        order_id = cursor.lastrowid
        
        for i in order_items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                VALUES (%s, %s, %s, %s)
            """, (order_id, i['product_id'], i['qty'], i['price']))
            
    return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201

@app.route('/api/orders/<order_id>/cancel', methods=['DELETE', 'PUT'])
@token_required
def cancel_order(user, order_id):
    try:
        oid = int(order_id)
    except:
        return jsonify({"message": "Invalid order ID"}), 400
        
    with db_config.get_db() as (conn, cursor):
        cursor.execute("DELETE FROM orders WHERE id = %s AND user_id = %s", (oid, user['id']))
        if cursor.rowcount == 0:
            return jsonify({"message": "Order not found or not authorized"}), 404
            
    return jsonify({"message": "Order cancelled"})

@app.route('/api/sync')
def sync_products():
    since = request.args.get('since')
    query = "SELECT * FROM products"
    params = ()
    if since:
        query += " WHERE updated_at > %s"
        params = (since,)
    
    with db_config.get_db() as (conn, cursor):
        cursor.execute(query, params)
        data = format_rows(cursor, cursor.fetchall())
        
    return jsonify({
        "data": data,
        "meta": {"count": len(data), "since": since}
    })

@app.route('/health/db')
def db_health():
    try:
        with db_config.get_db() as (conn, cursor):
            cursor.execute("SELECT 1")
        return jsonify({"status": "healthy", "stats": db_config.get_pool_stats()}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 503

# --- Static Serving & SEO ---

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if not os.path.splitext(path)[1]:
        path += '.html'
    
    if path.endswith('.html'):
        if os.path.exists(os.path.join('templates', path)):
            return render_template(path)
    
    return send_from_directory('.', path)

@app.route('/products/<int:id>/<slug>')
def product_canonical(id, slug):
    with db_config.get_db() as (conn, cursor):
        cursor.execute("SELECT * FROM products WHERE id = %s", (id,))
        product = format_row(cursor, cursor.fetchone())
        
    if not product:
        return abort(404)
        
    expected_slug = slugify(product['name'])
    if slug != expected_slug:
        return redirect(url_for('product_canonical', id=id, slug=expected_slug), code=301)
        
    return render_template('product-detail.html', product=product)

@app.route('/product-detail.html')
def legacy_product_redirect():
    pid = request.args.get('id', type=int)
    if not pid: return redirect(url_for('index'))
    
    with db_config.get_db() as (conn, cursor):
        cursor.execute("SELECT name FROM products WHERE id = %s", (pid,))
        row = cursor.fetchone()
    
    if not row: return redirect(url_for('index'))
    return redirect(url_for('product_canonical', id=pid, slug=slugify(row[0])), code=301)

# --- Error Handlers ---
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "error": "Too Many Requests",
        "message": str(e.description),
        "retry_after": e.retry_after,
        "limit": str(e.limit)
    }), 429

@app.errorhandler(403)
def forbidden_handler(e):
    return jsonify({"error": "CORS Forbidden", "message": str(e), "status": 403}), 403

@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e.get_response()
    logger.exception("Unhandle exception occurred")
    return jsonify({"message": str(e)}), 500

# --- CLI Commands ---
@app.cli.command("seed-db")
@click.option('--force', is_flag=True)
def seed_db(force):
    if not force:
        if not click.confirm('This will seed the database with initial products. Continue?'):
            return
            
    with db_config.get_db() as (conn, cursor):
        for p in INITIAL_PRODUCTS:
            cursor.execute("SELECT id FROM products WHERE name = %s", (p['name'],))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO products (name, price, category, image, rating) VALUES (%s, %s, %s, %s, %s)",
                    (p['name'], p['price'], p['category'], p['image'], p['rating'])
                )
                pid = cursor.lastrowid
                slug = generate_product_slug(pid, p['name'])
                cursor.execute("UPDATE products SET slug = %s WHERE id = %s", (slug, pid))
    
    click.echo("Database seeded successfully.")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)