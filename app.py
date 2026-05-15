import decimal
from flask import Flask, request, jsonify, send_from_directory, make_response, render_template, g
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt
import datetime
from functools import wraps
from marshmallow import ValidationError
from schemas import (
    SignupSchema, LoginSchema, ProfileUpdateSchema, 
    OrderSchema, WishlistToggleSchema
)
from db_config import get_db
from seeds.products import INITIAL_PRODUCTS
from config import get_config
import json
import os
import click
import time
from logger import setup_logger
from slugify import slugify

logger = setup_logger(__name__)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
config = get_config()
app.config.from_object(config)

# --- RATE LIMITER CONFIGURATION ---
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", "memory://"),
    enabled=os.getenv("FLASK_ENV") != "development"
)

# --- STRICT CORS CONFIGURATION ---
# support_credentials=True: Allows HttpOnly cookies to be sent
# origins: Pulled from config.ALLOWED_ORIGINS (env var in production)
CORS(app, resources={r"/api/*": {
    "origins": config.ALLOWED_ORIGINS,
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type"]
}}, supports_credentials=True)

@app.after_request
def add_cors_headers(response):
    # Security Defense-in-Depth: Double check origin
    origin = request.headers.get('Origin')
    if origin and origin in config.ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

@app.errorhandler(403)
def forbidden_error(e):
    origin = request.headers.get('Origin', 'Unknown')
    logger.warning(f"CORS REJECTION: Request from unauthorized origin: {origin}")
    return jsonify({
        "error": "CORS Forbidden",
        "message": f"Origin {origin} is not whitelisted.",
        "status": 403
    }), 403

bcrypt = Bcrypt(app)

# --- DATABASE INITIALIZATION ---
def init_db():
    logger.info("Initializing database...")
    try:
        with get_db() as (conn, cursor):
            # Create tables with comprehensive performance indexing
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
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255),
                    price DECIMAL(10, 2),
                    category VARCHAR(100),
                    image TEXT,
                    rating DECIMAL(3, 2) DEFAULT 4.5,
                    review_count INT DEFAULT 451,
                    description TEXT,
                    original_price DECIMAL(10, 2),
                    discount_tag VARCHAR(50),
                    images TEXT,
                    colors TEXT,
                    sizes TEXT,
                    related_products TEXT,
                    slug VARCHAR(255) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX ix_products_category (category),
                    INDEX ix_products_price (price),
                    INDEX ix_products_slug (slug),
                    INDEX ix_products_updated (updated_at)
                )
            """)
            
            # Migration: Ensure new columns exist for existing databases
            cols_to_add = [
                ("review_count", "INT DEFAULT 451"),
                ("description", "TEXT"),
                ("original_price", "DECIMAL(10, 2)"),
                ("discount_tag", "VARCHAR(50)"),
                ("images", "TEXT"),
                ("colors", "TEXT"),
                ("sizes", "TEXT"),
                ("related_products", "TEXT")
            ]
            for col_name, col_def in cols_to_add:
                try:
                    cursor.execute(f"ALTER TABLE products ADD COLUMN {col_name} {col_def}")
                except:
                    pass # Already exists
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
                    INDEX ix_wishlist_user (user_id),
                    INDEX ix_wishlist_product (product_id),
                    INDEX ix_wishlist_updated (updated_at)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    items TEXT,
                    total DECIMAL(10, 2),
                    status VARCHAR(50) DEFAULT 'Pending',
                    shipping_name VARCHAR(255),
                    shipping_address TEXT,
                    shipping_phone VARCHAR(20),
                    shipping_method VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX ix_orders_user_status (user_id, status),
                    INDEX ix_orders_user_date (user_id, updated_at DESC),
                    INDEX ix_orders_status_date (status, updated_at DESC),
                    INDEX ix_orders_updated (updated_at)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS order_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_id INT,
                    product_id INT,
                    quantity INT,
                    unit_price DECIMAL(10, 2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
                    INDEX ix_items_order (order_id),
                    INDEX ix_items_product (product_id),
                    INDEX ix_items_updated (updated_at)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS login_attempts (
                    email VARCHAR(255) PRIMARY KEY,
                    attempts INT DEFAULT 0,
                    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    locked_until TIMESTAMP NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX ix_login_email_locked (email, locked_until)
                )
            """)
            conn.commit()
            cursor.close()
        logger.info("Database initialization successful.")
    except Exception as e:
        logger.error(f"ERROR during database initialization: {e}")

_db_initialized = False

@app.before_request
def ensure_db_initialized():
    global _db_initialized
    if not _db_initialized:
        init_db()
        _db_initialized = True

# Helper to format SQL rows as dicts
def format_row(cursor, row):
    if not row: return None
    columns = [col[0] for col in cursor.description]
    data = dict(zip(columns, row))
    # Convert datetime/timestamp to ISO 8601
    for key, value in data.items():
        if isinstance(value, (datetime.datetime, datetime.date)):
            data[key] = value.isoformat()
        elif isinstance(value, decimal.Decimal):
            data[key] = float(value)
    return data

def format_rows(cursor, rows):
    return [format_row(cursor, row) for row in rows]

def safe_parse_wishlist(wl):
    if wl is None: return []
    if isinstance(wl, list): return wl
    if isinstance(wl, str):
        try:
            parsed = json.loads(wl)
            return parsed if isinstance(parsed, list) else []
        except:
            return []
    return []

# Authentication Decorator (Cookie Based)
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Exclusively read token from HttpOnly cookie
        token = request.cookies.get('auth_token')
        
        if not token:
            # Silent 200 for auth check endpoint to avoid console errors
            if request.path == "/api/me":
                return jsonify({'authenticated': False}), 200
            return jsonify({'message': 'Authentication cookie is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            with get_db() as (conn, cursor):
                cursor.execute("SELECT * FROM users WHERE id = %s", (data['user_id'],))
                user = format_row(cursor, cursor.fetchone())
                if not user:
                    if request.path == "/api/me":
                        return jsonify({'authenticated': False}), 200
                    return jsonify({'message': 'User not found!'}), 401
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            if request.path == "/api/me":
                return jsonify({'authenticated': False}), 200
            return jsonify({'message': 'Session expired or invalid.'}), 401
        except Exception as e:
            return jsonify({'message': f'Authentication error: {str(e)}'}), 401
        
        return f(user, *args, **kwargs)
    return decorated

@app.before_request
def load_logged_in_user():
    token = request.cookies.get('auth_token')
    g.user = None
    if token:
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            with get_db() as (conn, cursor):
                cursor.execute("SELECT * FROM users WHERE id = %s", (data['user_id'],))
                g.user = format_row(cursor, cursor.fetchone())
        except:
            pass

@app.context_processor
def inject_globals():
    return {
        'current_year': datetime.datetime.now().year,
        'current_user': g.user
    }

def validate_payload(schema_class):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            schema = schema_class()
            try:
                # data = schema.load(request.json or {})
                # Note: marshmallow 3.x returns just the data
                validated_data = schema.load(request.json or {})
                return f(validated_data, *args, **kwargs)
            except ValidationError as err:
                return jsonify({"errors": err.messages}), 422
        return wrapper
    return decorator

def paginate_collection(base_query, count_query, params, schema=None, order_by="id DESC"):
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
    except (ValueError, TypeError):
        return jsonify({"message": "Page and per_page must be positive integers"}), 400

    if page < 1 or per_page < 1:
        return jsonify({"message": "Page and per_page must be positive integers"}), 400
    
    per_page = min(per_page, 100)
    offset = (page - 1) * per_page

    try:
        with get_db() as (conn, cursor):
            # Get total count
            cursor.execute(count_query, params)
            total_items = cursor.fetchone()[0]
            
            # Get paginated data
            final_query = f"{base_query} ORDER BY {order_by} LIMIT %s OFFSET %s"
            cursor.execute(final_query, params + (per_page, offset))
            raw_data = format_rows(cursor, cursor.fetchall())

        total_pages = (total_items + per_page - 1) // per_page
        
        data = raw_data
        if schema:
            data = schema(many=True).dump(raw_data)

        return jsonify({
            "data": data,
            "meta": {
                "page": page,
                "per_page": per_page,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "links": {
                "next": f"{request.path}?page={page+1}&per_page={per_page}" if page < total_pages else None,
                "prev": f"{request.path}?page={page-1}&per_page={per_page}" if page > 1 else None
            }
        })
    except Exception as e:
        app.logger.error(f"Pagination error: {str(e)}")
        return jsonify({"message": "An error occurred while fetching the collection"}), 500

# --- API ROUTES ---

@app.route("/api/health")
def health_check():
    """Public health check and uptime monitor endpoint"""
    db_status = "Connected"
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except:
        db_status = "Disconnected"

    return jsonify({
        "status": "Healthy" if db_status == "Connected" else "Degraded",
        "database": db_status,
        "timestamp": time.time(),
        "version": "1.2.0",
        "api": "SHOP EASE API"
    })

@app.route("/api/signup", methods=["POST"])
@limiter.limit("3 per minute; 10 per hour")
@validate_payload(SignupSchema)
def signup(data):
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
            if cursor.fetchone():
                return jsonify({"message": "User already exists"}), 409
            cursor.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)", (
                data['name'], 
                data['email'], 
                bcrypt.generate_password_hash(data['password']).decode('utf-8')
            ))
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"message": f"Error during signup: {str(e)}"}), 500

@app.route("/api/login", methods=["POST"])
@limiter.limit("5 per minute; 20 per hour; 50 per day")
@validate_payload(LoginSchema)
def login(data):
    email = data.get('email')
    password = data.get('password')
    
    try:
        with get_db() as (conn, cursor):
            # --- ACCOUNT LOCKOUT CHECK ---
            cursor.execute("SELECT attempts, locked_until FROM login_attempts WHERE email = %s", (email,))
            row = format_row(cursor, cursor.fetchone())
            
            if row and row['locked_until'] and row['locked_until'] > datetime.datetime.utcnow():
                wait_seconds = int((row['locked_until'] - datetime.datetime.utcnow()).total_seconds())
                return jsonify({
                    "error": "Account Locked",
                    "message": f"Too many failed attempts. Account locked for {wait_seconds // 60} minutes.",
                    "retry_after": wait_seconds
                }), 423 # 423 Locked
            
            # Check credentials
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = format_row(cursor, cursor.fetchone())
            
            if user and bcrypt.check_password_hash(user['password'], data.get('password')):
                # Success: Reset attempts
                cursor.execute("INSERT INTO login_attempts (email, attempts, last_attempt, locked_until) VALUES (%s, 0, CURRENT_TIMESTAMP, NULL) ON DUPLICATE KEY UPDATE attempts = 0, locked_until = NULL", (email,))
                
                token = jwt.encode({
                    'user_id': user['id'],
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                }, app.config['SECRET_KEY'])
                
                resp = make_response(jsonify({
                    "user": {
                        "id": user['id'],
                        "name": user['name'],
                        "email": user['email']
                    }
                }))
                
                # secure=False is required for localhost HTTP
                resp.set_cookie('auth_token', token, httponly=True, secure=False, samesite='Lax', max_age=24 * 60 * 60)
                return resp
            else:
                # Failure: Increment attempts
                cursor.execute("""
                    INSERT INTO login_attempts (email, attempts, last_attempt, locked_until) 
                    VALUES (%s, 1, CURRENT_TIMESTAMP, NULL) 
                    ON DUPLICATE KEY UPDATE 
                        attempts = attempts + 1, 
                        last_attempt = CURRENT_TIMESTAMP,
                        locked_until = IF(attempts + 1 >= 10, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE), NULL)
                """, (email,))
                return jsonify({"message": "Invalid credentials"}), 401
                
    except Exception as e:
        return jsonify({"message": f"Error during login: {str(e)}"}), 500

@app.route("/api/logout", methods=["POST"])
def logout_api():
    resp = make_response(jsonify({"message": "Logged out successfully"}))
    resp.delete_cookie('auth_token')
    return resp

@app.route("/api/me", methods=["GET"])
@token_required
def get_me(current_user):
    # If we reached here, the user IS authenticated (via decorator)
    if 'password' in current_user: del current_user['password']
    current_user['authenticated'] = True
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT product_id FROM wishlist WHERE user_id = %s", (current_user['id'],))
            current_user['wishlist_ids'] = [row[0] for row in cursor.fetchall()]
    except:
        current_user['wishlist_ids'] = []
    return jsonify(current_user)

@app.route("/api/profile/update", methods=["POST"])
@token_required
@validate_payload(ProfileUpdateSchema)
def update_profile(data, current_user):
    client_updated_at = data.get('updated_at')
    
    try:
        with get_db() as (conn, cursor):
            # Optimistic Locking Check
            if client_updated_at:
                cursor.execute("SELECT updated_at FROM users WHERE id = %s", (current_user['id'],))
                db_row = cursor.fetchone()
                if db_row:
                    db_updated_at = db_row[0].isoformat() if hasattr(db_row[0], 'isoformat') else str(db_row[0])
                    if db_updated_at != client_updated_at:
                        return jsonify({
                            "error": "Conflict",
                            "message": "The profile was updated by another session. Please refresh.",
                            "db_updated_at": db_updated_at
                        }), 409

            cursor.execute("""
                UPDATE users SET address = %s, phone = %s WHERE id = %s
            """, (
                data.get('address', current_user.get('address')),
                data.get('phone', current_user.get('phone')),
                current_user['id']
            ))
        return jsonify({"message": "Profile updated successfully"})
    except Exception as e:
        return jsonify({"message": f"Error updating profile: {str(e)}"}), 500

def generate_product_slug(product_id, name):
    return f"{slugify(name)}-{product_id}"

@app.route("/api/products", methods=["GET"])
@limiter.limit("30 per minute")
def get_products():
    category = request.args.get("category")
    where_clause = "WHERE category = %s" if category else "WHERE 1=1"
    params = (category,) if category else ()
    
    return paginate_collection(
        base_query=f"SELECT * FROM products {where_clause}",
        count_query=f"SELECT COUNT(*) FROM products {where_clause}",
        params=params,
        order_by="id ASC"
    )

@app.route("/products/<int:product_id>/<string:slug>", methods=["GET"])
def get_product_canonical(product_id, slug):
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            product = format_row(cursor, cursor.fetchone())

        if not product:
            return render_template("404.html"), 404

        # Canonical check
        correct_slug = product.get('slug')
        if not correct_slug:
            correct_slug = generate_product_slug(product_id, product['name'])
            with get_db() as (conn, cursor):
                cursor.execute("UPDATE products SET slug = %s WHERE id = %s", (correct_slug, product_id))

        if slug != correct_slug:
            from flask import redirect, url_for
            return redirect(url_for('get_product_canonical', product_id=product_id, slug=correct_slug), code=301)

        return render_template("product-detail.html", product=product)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/product-detail.html", methods=["GET"])
def legacy_product_redirect():
    pid = request.args.get('id')
    if pid:
        try:
            with get_db() as (conn, cursor):
                cursor.execute("SELECT id, name, slug FROM products WHERE id = %s", (pid,))
                row = format_row(cursor, cursor.fetchone())
            if row:
                slug = row.get('slug') or generate_product_slug(row['id'], row['name'])
                from flask import redirect, url_for
                return redirect(url_for('get_product_canonical', product_id=row['id'], slug=slug), code=301)
        except:
            pass
    from flask import redirect
    return redirect("/", code=302)

@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            product = format_row(cursor, cursor.fetchone())
        if not product:
            return jsonify({"message": "Product not found"}), 404
        return jsonify(product)
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route("/api/wishlist", methods=["GET"])
@token_required
def get_wishlist(current_user):
    return paginate_collection(
        base_query="""
            SELECT p.* FROM products p
            JOIN wishlist w ON p.id = w.product_id
            WHERE w.user_id = %s
        """,
        count_query="SELECT COUNT(*) FROM wishlist WHERE user_id = %s",
        params=(current_user['id'],),
        order_by="w.created_at DESC"
    )

@app.route("/api/wishlist/toggle", methods=["POST"])
@token_required
@limiter.limit("20 per minute")
@validate_payload(WishlistToggleSchema)
def toggle_wishlist(data, current_user):
    pid = data.get('product_id')
    
    try:
        with get_db() as (conn, cursor):
            # Check if exists
            cursor.execute("SELECT id FROM wishlist WHERE user_id = %s AND product_id = %s", (current_user['id'], pid))
            exists = cursor.fetchone()
            
            if exists:
                cursor.execute("DELETE FROM wishlist WHERE user_id = %s AND product_id = %s", (current_user['id'], pid))
                action = "removed"
            else:
                cursor.execute("INSERT INTO wishlist (user_id, product_id) VALUES (%s, %s)", (current_user['id'], pid))
                action = "added"
            
        return jsonify({"message": f"Product {action} wishlist", "action": action})
    except Exception as e:
        return jsonify({"message": f"Error toggling wishlist: {str(e)}"}), 500

@app.route("/api/orders", methods=["GET"])
@token_required
def get_orders(current_user):
    # This one is special because we need to fetch items after paginating orders
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 10)), 100)
        offset = (page - 1) * per_page
    except:
        return jsonify({"message": "Invalid pagination params"}), 400

    try:
        with get_db() as (conn, cursor):
            # 1. Count total orders
            cursor.execute("SELECT COUNT(*) FROM orders WHERE user_id = %s", (current_user['id'],))
            total_items = cursor.fetchone()[0]
            
            # 2. Get paginated orders
            cursor.execute("""
                SELECT * FROM orders WHERE user_id = %s 
                ORDER BY created_at DESC 
                LIMIT %s OFFSET %s
            """, (current_user['id'], per_page, offset))
            orders = format_rows(cursor, cursor.fetchall())
            
            if not orders:
                return jsonify({"data": [], "meta": {"page": page, "total_items": total_items, "total_pages": 0}})

            # 3. Get all line items for the returned page
            order_ids = [o['id'] for o in orders]
            format_strings = ','.join(['%s'] * len(order_ids))
            cursor.execute(f"""
                SELECT oi.*, p.name, p.image 
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id IN ({format_strings})
            """, tuple(order_ids))
            all_items = format_rows(cursor, cursor.fetchall())

        # Group items
        for o in orders:
            o['items'] = [i for i in all_items if i['order_id'] == o['id']]
            for i in o['items']:
                i['subtotal'] = float(i['quantity'] * i['unit_price'])

        total_pages = (total_items + per_page - 1) // per_page
        return jsonify({
            "data": orders,
            "meta": {
                "page": page,
                "per_page": per_page,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        })
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route("/api/orders", methods=["POST"])
@token_required
@limiter.limit("10 per minute")
@validate_payload(OrderSchema)
def place_order(data, current_user):
    items = data.get('items', [])
    
    try:
        with get_db() as (conn, cursor):
            # 1. Create the Order header
            items_json = json.dumps(items)
            cursor.execute("""
                INSERT INTO orders (user_id, items, total, shipping_name, shipping_address, shipping_phone, shipping_method)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                current_user['id'],
                items_json,
                data.get('total', 0),
                data.get('shipping', {}).get('name', ''),
                data.get('shipping', {}).get('address', ''),
                data.get('shipping', {}).get('phone', ''),
                data.get('shipping', {}).get('method', '')
            ))
            order_id = cursor.lastrowid

            # 2. Create the line items (Snapshotting current prices)
            for item in items:
                cursor.execute("SELECT price FROM products WHERE id = %s", (item['product_id'],))
                res = cursor.fetchone()
                unit_price = res[0] if res else item.get('price', 0)
                
                cursor.execute("""
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                    VALUES (%s, %s, %s, %s)
                """, (order_id, item['product_id'], item.get('qty', 1), unit_price))
            
        app.logger.info(f"ORDER PLACED: ID {order_id} | User {current_user['id']} | Items: {len(items)}")
        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Error placing order: {str(e)}"}), 500

@app.route("/api/orders/<order_id>/cancel", methods=["DELETE", "PUT"])
@token_required
def cancel_order(current_user, order_id):
    try:
        with get_db() as (conn, cursor):
            # Permanently remove the order from the database
            cursor.execute("DELETE FROM orders WHERE id = %s AND user_id = %s", (order_id, current_user['id']))
        return jsonify({"message": "Order removed from database permanently"})
    except Exception as e:
        return jsonify({"message": f"Error cancelling order: {str(e)}"}), 500

# --- CLI COMMANDS (Server Side Only) ---
@app.cli.command("seed-db")
@click.option('--force', is_flag=True, help="Skip confirmation prompt")
def seed_db_command(force):
    """Seeds the database with initial products (Terminal only)"""
    init_db()
    if not force:
        if not click.confirm("This will DELETE all existing products. Continue?"):
            logger.info("Database seed aborted by user.")
            return

    try:
        with get_db() as (conn, cursor):
            for p in INITIAL_PRODUCTS:
                cursor.execute("SELECT id FROM products WHERE name = %s", (p['name'],))
                existing = cursor.fetchone()
                if not existing:
                    cursor.execute("""
                        INSERT INTO products (name, price, category, image, rating, description, original_price, discount_tag, images, colors, sizes, related_products, review_count)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        p['name'], p['price'], p['category'], p['image'], p.get('rating', 4.5),
                        p.get('description'), p.get('original_price'), p.get('discount_tag'),
                        json.dumps(p.get('images', [])), json.dumps(p.get('colors', [])),
                        json.dumps(p.get('sizes', [])), json.dumps(p.get('related_products', [])),
                        p.get('review_count', 451)
                    ))
                else:
                    cursor.execute("""
                        UPDATE products SET 
                            price=%s, category=%s, image=%s, rating=%s, description=%s, 
                            original_price=%s, discount_tag=%s, images=%s, colors=%s, 
                            sizes=%s, related_products=%s, review_count=%s
                        WHERE name=%s
                    """, (
                        p['price'], p['category'], p['image'], p.get('rating', 4.5),
                        p.get('description'), p.get('original_price'), p.get('discount_tag'),
                        json.dumps(p.get('images', [])), json.dumps(p.get('colors', [])),
                        json.dumps(p.get('sizes', [])), json.dumps(p.get('related_products', [])),
                        p.get('review_count', 451), p['name']
                    ))
        logger.info("Database seeded successfully! [OK]")
    except Exception as e:
        logger.error(f"Seeding error: {e}")

@app.errorhandler(429)
def ratelimit_handler(e):
    import re
    seconds = re.search(r'\d+', str(e.description))
    seconds = seconds.group() if seconds else "60"
    resp = jsonify({
        "error": "Too Many Requests",
        "message": "You have exceeded the rate limit. Please slow down.",
        "retry_after": int(seconds),
        "limit": str(e.description)
    })
    return make_response(resp, 429)

from werkzeug.exceptions import HTTPException

@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return jsonify({"message": str(e)}), e.code
    return jsonify({"message": str(e)}), 500

@app.route("/api/sync", methods=["GET"])
def sync_data():
    """Incremental sync endpoint for products"""
    since = request.args.get('since')
    try:
        with get_db() as (conn, cursor):
            query = "SELECT * FROM products"
            params = ()
            if since:
                query += " WHERE updated_at > %s"
                params = (since,)
            
            cursor.execute(query, params)
            rows = format_rows(cursor, cursor.fetchall())
            
        return jsonify({
            "data": rows,
            "meta": {
                "count": len(rows),
                "since": since
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health/db")
def health_db():
    from db_config import get_pool_stats
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        stats = get_pool_stats()
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "pool": stats
        }), 200
    except Exception as e:
        app.logger.error(f"Database health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 503

@app.route("/")
def index_page():
    """Serve the main index page"""
    return send_from_directory('.', 'index.html')

# --- STATIC FILE SERVING (MUST BE LAST) ---
@app.route('/<path:path>')
def serve_static(path):
    # Guard: Don't let the static server catch intended API routes
    if path.startswith('api/'):
        return jsonify({"message": f"API route not found: /{path}"}), 404
    return send_from_directory('.', path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)