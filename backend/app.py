import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, current_dir)
sys.path.insert(0, parent_dir)

import decimal
from flask import Flask, request, jsonify, send_from_directory, make_response, render_template, g
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt
import datetime
from functools import wraps
from marshmallow import ValidationError
from backend.schemas import (
    SignupSchema, LoginSchema, ProfileUpdateSchema, 
    OrderSchema, WishlistToggleSchema
)
from backend.db_config import get_db
from backend.seeds.products import INITIAL_PRODUCTS
from backend.config import get_config
import json
import os
import click
import time
from backend.logger import setup_logger
from slugify import slugify

logger = setup_logger(__name__)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__, static_folder='../frontend/static', template_folder='templates')
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
                    is_admin INT DEFAULT 0,
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
                    image LONGTEXT,
                    rating DECIMAL(3, 2) DEFAULT 4.5,
                    slug VARCHAR(255) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX ix_products_category (category),
                    INDEX ix_products_price (price),
                    INDEX ix_products_slug (slug),
                    INDEX ix_products_updated (updated_at)
                )
            """)
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

    # Backward compatibility column addition
    try:
        with get_db() as (conn, cursor):
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin INT DEFAULT 0")
    except Exception as e:
        pass

    try:
        with get_db() as (conn, cursor):
            cursor.execute("ALTER TABLE products ADD COLUMN stock INT DEFAULT 50")
    except Exception as e:
        pass

    # Seed default administrator if not present
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT id FROM users WHERE email = %s", ("admin@shopease.com",))
            if not cursor.fetchone():
                admin_pass_hash = bcrypt.generate_password_hash("Admin123!").decode('utf-8')
                cursor.execute("""
                    INSERT INTO users (name, email, password, is_admin)
                    VALUES (%s, %s, %s, 1)
                """, ("System Administrator", "admin@shopease.com", admin_pass_hash))
                logger.info("Default admin user (admin@shopease.com / Admin123!) seeded.")
    except Exception as e:
        logger.error(f"Error seeding default admin: {e}")

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

# Administrator Authorization Decorator
def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if not current_user.get('is_admin'):
            return jsonify({'message': 'Admin privileges required!'}), 403
        return f(current_user, *args, **kwargs)
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
            
            if row and row['locked_until']:
                locked_until_val = row['locked_until']
                if isinstance(locked_until_val, str):
                    locked_until_val = locked_until_val.replace('T', ' ')
                    try:
                        locked_until_val = datetime.datetime.strptime(locked_until_val.split('.')[0], '%Y-%m-%d %H:%M:%S')
                    except Exception:
                        pass
                
                if isinstance(locked_until_val, datetime.datetime) and locked_until_val > datetime.datetime.utcnow():
                    wait_seconds = int((locked_until_val - datetime.datetime.utcnow()).total_seconds())
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
                cursor.execute("SELECT attempts FROM login_attempts WHERE email = %s", (email,))
                if cursor.fetchone():
                    cursor.execute("UPDATE login_attempts SET attempts = 0, locked_until = NULL WHERE email = %s", (email,))
                else:
                    cursor.execute("INSERT INTO login_attempts (email, attempts, last_attempt, locked_until) VALUES (%s, 0, CURRENT_TIMESTAMP, NULL)", (email,))
                
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
                cursor.execute("SELECT attempts FROM login_attempts WHERE email = %s", (email,))
                attempt_row = format_row(cursor, cursor.fetchone())
                if attempt_row:
                    new_attempts = int(attempt_row['attempts']) + 1
                    if new_attempts >= 10:
                        # Lock for 30 minutes
                        locked_until = (datetime.datetime.utcnow() + datetime.timedelta(minutes=30)).strftime('%Y-%m-%d %H:%M:%S')
                    else:
                        locked_until = None
                    cursor.execute("UPDATE login_attempts SET attempts = %s, last_attempt = CURRENT_TIMESTAMP, locked_until = %s WHERE email = %s", (new_attempts, locked_until, email))
                else:
                    cursor.execute("INSERT INTO login_attempts (email, attempts, last_attempt, locked_until) VALUES (%s, 1, CURRENT_TIMESTAMP, NULL)", (email,))
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

# Removed product detail page routes as per user request

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
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO products (name, price, category, image, rating)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (p['name'], p['price'], p['category'], p['image'], p.get('rating', 4.5)))
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

# --- ADMINISTRATOR ROUTES ---

@app.route("/admin.html")
def admin_page():
    token = request.cookies.get('auth_token')
    is_admin = False
    if token:
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            with get_db() as (conn, cursor):
                cursor.execute("SELECT is_admin FROM users WHERE id = %s", (data['user_id'],))
                res = cursor.fetchone()
                if res and res[0]:
                    is_admin = True
        except:
            pass
            
    if not is_admin:
        return make_response("Unauthorized. Admin access required.", 302, {"Location": "/index.html"})
        
    return send_from_directory('../frontend', 'admin.html')

@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def get_admin_stats(current_user):
    try:
        with get_db() as (conn, cursor):
            # 1. Basic metrics
            cursor.execute("SELECT SUM(total) FROM orders WHERE status != 'Cancelled'")
            total_revenue = cursor.fetchone()[0] or 0.0
            
            cursor.execute("SELECT COUNT(*) FROM orders")
            total_orders = cursor.fetchone()[0] or 0
            
            cursor.execute("SELECT AVG(total) FROM orders WHERE status != 'Cancelled'")
            aov = cursor.fetchone()[0] or 0.0
            
            cursor.execute("SELECT COUNT(*) FROM users")
            total_users = cursor.fetchone()[0] or 0
            
            # Conversion rate logic
            conversion_rate = 0.0
            if total_users > 0:
                conversion_rate = min(100.0, round((total_orders / total_users) * 100, 2))
            else:
                conversion_rate = 5.4

            # 2. Daily Sales Performance (standard DATE function works in both SQLite and TiDB)
            cursor.execute("""
                SELECT DATE(created_at) as order_date, SUM(total) as revenue, COUNT(*) as count 
                FROM orders 
                WHERE status != 'Cancelled'
                GROUP BY DATE(created_at) 
                ORDER BY order_date ASC 
                LIMIT 30
            """)
            daily_sales_raw = cursor.fetchall()
            daily_sales = []
            for row in daily_sales_raw:
                daily_sales.append({
                    "date": str(row[0]),
                    "revenue": float(row[1]) if row[1] is not None else 0.0,
                    "orders": int(row[2])
                })

            # 3. Category performance
            cursor.execute("""
                SELECT p.category, SUM(oi.quantity) as sales_qty, SUM(oi.quantity * oi.unit_price) as revenue
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status != 'Cancelled'
                GROUP BY p.category
            """)
            category_perf_raw = cursor.fetchall()
            category_perf = []
            for row in category_perf_raw:
                category_perf.append({
                    "category": row[0],
                    "sales": int(row[1]) if row[1] is not None else 0,
                    "revenue": float(row[2]) if row[2] is not None else 0.0
                })

            # 4. Recent activity
            cursor.execute("""
                SELECT o.id, o.total, o.status, o.created_at, u.name as user_name
                FROM orders o
                JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
                LIMIT 5
            """)
            recent_orders_raw = cursor.fetchall()
            recent_orders = []
            for row in recent_orders_raw:
                recent_orders.append({
                    "id": row[0],
                    "total": float(row[1]),
                    "status": row[2],
                    "created_at": row[3].isoformat() if hasattr(row[3], 'isoformat') else str(row[3]),
                    "user_name": row[4]
                })

            cursor.execute("""
                SELECT id, name, email, created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT 5
            """)
            recent_users_raw = cursor.fetchall()
            recent_users = []
            for row in recent_users_raw:
                recent_users.append({
                    "id": row[0],
                    "name": row[1],
                    "email": row[2],
                    "created_at": row[3].isoformat() if hasattr(row[3], 'isoformat') else str(row[3])
                })

        return jsonify({
            "metrics": {
                "total_revenue": float(total_revenue),
                "total_orders": int(total_orders),
                "aov": float(aov),
                "conversion_rate": float(conversion_rate),
                "total_users": int(total_users)
            },
            "daily_sales": daily_sales,
            "category_performance": category_perf,
            "recent_orders": recent_orders,
            "recent_users": recent_users
        })
    except Exception as e:
        logger.error(f"Error loading admin stats: {e}")
        return jsonify({"message": f"Error loading admin stats: {str(e)}"}), 500

@app.route("/api/admin/products", methods=["GET"])
@admin_required
def admin_get_products(current_user):
    category = request.args.get("category")
    search = request.args.get("search")
    
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    if category:
        query += " AND category = %s"
        params.append(category)
    if search:
        query += " AND (name LIKE %s OR category LIKE %s)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")
        
    return paginate_collection(
        base_query=query,
        count_query=f"SELECT COUNT(*) FROM ({query}) AS q",
        params=tuple(params),
        order_by="id DESC"
    )

@app.route("/api/admin/products", methods=["POST"])
@admin_required
def admin_create_product(current_user):
    data = request.json or {}
    name = data.get("name")
    price = data.get("price")
    category = data.get("category")
    image = data.get("image")
    rating = data.get("rating", 4.5)
    stock = data.get("stock", 50)
    
    if not name or price is None or not category or not image:
        return jsonify({"message": "Name, price, category, and image are required"}), 400
        
    try:
        slug = slugify(name)
        with get_db() as (conn, cursor):
            cursor.execute("SELECT id FROM products WHERE slug = %s", (slug,))
            if cursor.fetchone():
                slug = f"{slug}-{int(time.time())}"
            
            cursor.execute("""
                INSERT INTO products (name, price, category, image, rating, slug, stock)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (name, price, category, image, rating, slug, stock))
            product_id = cursor.lastrowid
        return jsonify({"message": "Product created successfully", "product_id": product_id}), 201
    except Exception as e:
        return jsonify({"message": f"Error creating product: {str(e)}"}), 500

@app.route("/api/admin/products/<int:product_id>", methods=["PUT"])
@admin_required
def admin_update_product(current_user, product_id):
    data = request.json or {}
    name = data.get("name")
    price = data.get("price")
    category = data.get("category")
    image = data.get("image")
    rating = data.get("rating", 4.5)
    stock = data.get("stock", 50)
    
    if not name or price is None or not category or not image:
        return jsonify({"message": "Name, price, category, and image are required"}), 400
        
    try:
        slug = slugify(name)
        with get_db() as (conn, cursor):
            cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cursor.fetchone():
                return jsonify({"message": "Product not found"}), 404
                
            cursor.execute("SELECT id FROM products WHERE slug = %s AND id != %s", (slug, product_id))
            if cursor.fetchone():
                slug = f"{slug}-{product_id}"
                
            cursor.execute("""
                UPDATE products 
                SET name = %s, price = %s, category = %s, image = %s, rating = %s, slug = %s, stock = %s
                WHERE id = %s
            """, (name, price, category, image, rating, slug, stock, product_id))
        return jsonify({"message": "Product updated successfully"})
    except Exception as e:
        return jsonify({"message": f"Error updating product: {str(e)}"}), 500

@app.route("/api/admin/products/bulk", methods=["POST"])
@admin_required
def admin_bulk_create_products(current_user):
    data = request.json or {}
    products_list = data.get("products", [])
    if not products_list:
        return jsonify({"message": "No product listings provided"}), 400
    
    inserted_count = 0
    try:
        with get_db() as (conn, cursor):
            for item in products_list:
                name = item.get("name")
                price = item.get("price")
                category = item.get("category")
                image = item.get("image", "default_product.png")
                rating = item.get("rating", 4.5)
                stock = item.get("stock", 50)
                
                if not name or price is None or not category:
                    continue
                
                slug = slugify(name)
                cursor.execute("SELECT id FROM products WHERE slug = %s", (slug,))
                if cursor.fetchone():
                    slug = f"{slug}-{int(time.time())}"
                
                cursor.execute("""
                    INSERT INTO products (name, price, category, image, rating, slug, stock)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (name, price, category, image, rating, slug, stock))
                inserted_count += 1
        return jsonify({"message": f"Successfully bulk uploaded {inserted_count} products!"}), 201
    except Exception as e:
        return jsonify({"message": f"Error in bulk upload: {str(e)}"}), 500

from werkzeug.utils import secure_filename
@app.route("/api/admin/products/upload-image", methods=["POST"])
@admin_required
def admin_upload_image(current_user):
    if 'image' not in request.files:
        return jsonify({"message": "No image file provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    if file:
        filename = secure_filename(file.filename)
        filename = f"{int(time.time())}_{filename}"
        
        target_dir = os.path.abspath(os.path.join(app.root_path, '../frontend/static/images'))
        os.makedirs(target_dir, exist_ok=True)
        
        filepath = os.path.join(target_dir, filename)
        file.save(filepath)
        
        image_url = f"/static/images/{filename}"
        return jsonify({
            "message": "Image uploaded successfully!",
            "image_url": image_url
        }), 200

@app.route("/api/admin/products/<int:product_id>/restock", methods=["POST"])
@admin_required
def admin_restock_product(current_user, product_id):
    data = request.json or {}
    quantity = data.get("quantity", 50)
    
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT stock FROM products WHERE id = %s", (product_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"message": "Product not found"}), 404
            
            current_stock = row[0] if row[0] is not None else 0
            new_stock = current_stock + quantity
            
            cursor.execute("""
                UPDATE products 
                SET stock = %s
                WHERE id = %s
            """, (new_stock, product_id))
        return jsonify({
            "message": "Restocked successfully!",
            "new_stock": new_stock
        }), 200
    except Exception as e:
        return jsonify({"message": f"Error restocking: {str(e)}"}), 500

@app.route("/api/admin/products/<int:product_id>", methods=["DELETE"])
@admin_required
def admin_delete_product(current_user, product_id):
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cursor.fetchone():
                return jsonify({"message": "Product not found"}), 404
            
            cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        return jsonify({"message": "Product deleted successfully"})
    except Exception as e:
        return jsonify({"message": f"Error deleting product: {str(e)}"}), 500

@app.route("/api/admin/orders", methods=["GET"])
@admin_required
def admin_get_orders(current_user):
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        offset = (page - 1) * per_page
    except:
        return jsonify({"message": "Invalid pagination params"}), 400

    status = request.args.get('status')
    email = request.args.get('email')
    order_id = request.args.get('order_id')

    try:
        where_clauses = ["1=1"]
        params = []

        if status:
            where_clauses.append("o.status = %s")
            params.append(status)
        if email:
            where_clauses.append("u.email LIKE %s")
            params.append(f"%{email}%")
        if order_id:
            where_clauses.append("o.id = %s")
            params.append(order_id)

        where_str = " AND ".join(where_clauses)

        with get_db() as (conn, cursor):
            cursor.execute(f"""
                SELECT COUNT(*) 
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE {where_str}
            """, tuple(params))
            total_items = cursor.fetchone()[0]
            
            cursor.execute(f"""
                SELECT o.*, u.name as user_name, u.email as user_email
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE {where_str}
                ORDER BY o.created_at DESC
                LIMIT %s OFFSET %s
            """, tuple(params + [per_page, offset]))
            orders = format_rows(cursor, cursor.fetchall())
            
            if orders:
                order_ids = [o['id'] for o in orders]
                format_strings = ','.join(['%s'] * len(order_ids))
                cursor.execute(f"""
                    SELECT oi.*, p.name, p.image 
                    FROM order_items oi
                    LEFT JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id IN ({format_strings})
                """, tuple(order_ids))
                all_items = format_rows(cursor, cursor.fetchall())
                
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
        return jsonify({"message": f"Error loading orders: {str(e)}"}), 500

@app.route("/api/admin/orders/<int:order_id>/status", methods=["PUT"])
@admin_required
def admin_update_order_status(current_user, order_id):
    data = request.json or {}
    status = data.get("status")
    
    valid_statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
    if status not in valid_statuses:
        return jsonify({"message": f"Invalid status. Must be one of {valid_statuses}"}), 400
        
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT id FROM orders WHERE id = %s", (order_id,))
            if not cursor.fetchone():
                return jsonify({"message": "Order not found"}), 404
                
            cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (status, order_id))
        return jsonify({"message": "Order status updated successfully", "status": status})
    except Exception as e:
        return jsonify({"message": f"Error updating order status: {str(e)}"}), 500

@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_get_users(current_user):
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        offset = (page - 1) * per_page
    except:
        return jsonify({"message": "Invalid pagination params"}), 400

    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT COUNT(*) FROM users")
            total_items = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT u.id, u.name, u.email, u.address, u.phone, u.is_admin, u.created_at,
                       COUNT(o.id) as order_count, SUM(o.total) as total_spent
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'Cancelled'
                GROUP BY u.id
                ORDER BY u.created_at DESC
                LIMIT %s OFFSET %s
            """, (per_page, offset))
            users = format_rows(cursor, cursor.fetchall())
            
        total_pages = (total_items + per_page - 1) // per_page
        return jsonify({
            "data": users,
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
        return jsonify({"message": f"Error loading users: {str(e)}"}), 500

@app.route("/api/admin/users/<int:user_id>/toggle-admin", methods=["PUT"])
@admin_required
def admin_toggle_user_admin(current_user, user_id):
    if current_user['id'] == user_id:
        return jsonify({"message": "You cannot toggle your own admin status"}), 400
        
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"message": "User not found"}), 404
            new_val = 0 if row[0] else 1
            cursor.execute("UPDATE users SET is_admin = %s WHERE id = %s", (new_val, user_id))
        return jsonify({"message": "User admin status updated successfully", "is_admin": bool(new_val)})
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route("/api/admin/system/health", methods=["GET"])
@admin_required
def admin_system_health(current_user):
    from db_config import get_pool_stats
    start_time = time.time()
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT 1")
            cursor.fetchone()
            
            counts = {}
            for table in ['users', 'products', 'wishlist', 'orders', 'order_items']:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    counts[table] = cursor.fetchone()[0]
                except:
                    counts[table] = -1
                      
        latency = round((time.time() - start_time) * 1000, 2)
        stats = get_pool_stats()
        
        return jsonify({
            "database": {
                "status": "Healthy",
                "latency_ms": latency,
                "engine": stats.get("engine", "Unknown"),
                "details": stats
            },
            "table_counts": counts,
            "environment": {
                "flask_env": os.getenv("FLASK_ENV", "production"),
                "uptime": round(time.time() - start_time, 2)
            }
        })
    except Exception as e:
        return jsonify({
            "database": {
                "status": "Unhealthy",
                "error": str(e)
            }
        }), 500

@app.route("/api/admin/system/seed", methods=["POST"])
@admin_required
def admin_system_seed(current_user):
    try:
        with get_db() as (conn, cursor):
            cursor.execute("DELETE FROM products")
            for p in INITIAL_PRODUCTS:
                slug = slugify(p['name'])
                cursor.execute("SELECT id FROM products WHERE slug = %s", (slug,))
                if cursor.fetchone():
                    slug = f"{slug}-{int(time.time())}"
                
                cursor.execute("""
                    INSERT INTO products (name, price, category, image, rating, slug)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (p['name'], p['price'], p['category'], p['image'], p.get('rating', 4.5), slug))
        return jsonify({"message": "Database wiped and re-seeded successfully!"})
    except Exception as e:
        return jsonify({"message": f"Seeding error: {str(e)}"}), 500

@app.route("/api/admin/system/wipe-orders", methods=["POST"])
@admin_required
def admin_system_wipe_orders(current_user):
    try:
        with get_db() as (conn, cursor):
            cursor.execute("DELETE FROM order_items")
            cursor.execute("DELETE FROM orders")
        return jsonify({"message": "All orders and transaction history wiped successfully!"})
    except Exception as e:
        return jsonify({"message": f"Wipe error: {str(e)}"}), 500

@app.route("/api/admin/export/revenue", methods=["GET"])
@admin_required
def admin_export_revenue(current_user):
    import io
    import csv
    try:
        with get_db() as (conn, cursor):
            cursor.execute("""
                SELECT DATE(created_at) as order_date, SUM(total) as revenue, COUNT(*) as count 
                FROM orders 
                WHERE status != 'Cancelled'
                GROUP BY DATE(created_at) 
                ORDER BY order_date ASC
            """)
            rows = cursor.fetchall()
            
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Date", "Gross Revenue ($)", "Orders Count"])
            for row in rows:
                writer.writerow([str(row[0]), float(row[1]) if row[1] is not None else 0.0, int(row[2])])
                
            response = make_response(output.getvalue())
            response.headers["Content-Disposition"] = "attachment; filename=shopease_revenue_report.csv"
            response.headers["Content-type"] = "text/csv"
            return response
    except Exception as e:
        return jsonify({"message": f"Export error: {str(e)}"}), 500

@app.route("/api/admin/export/products", methods=["GET"])
@admin_required
def admin_export_products(current_user):
    import io
    import csv
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT id, name, price, category, rating, slug, created_at FROM products ORDER BY id ASC")
            rows = cursor.fetchall()
            
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["ID", "Name", "Price ($)", "Category", "Rating", "Slug", "Created At"])
            for row in rows:
                writer.writerow([row[0], row[1], float(row[2]), row[3], float(row[4]), row[5], str(row[6])])
                
            response = make_response(output.getvalue())
            response.headers["Content-Disposition"] = "attachment; filename=shopease_products_catalog.csv"
            response.headers["Content-type"] = "text/csv"
            return response
    except Exception as e:
        return jsonify({"message": f"Export error: {str(e)}"}), 500

@app.route("/api/admin/export/orders", methods=["GET"])
@admin_required
def admin_export_orders(current_user):
    import io
    import csv
    try:
        with get_db() as (conn, cursor):
            cursor.execute("""
                SELECT o.id, o.total, o.status, o.shipping_name, o.shipping_address, 
                       o.shipping_phone, o.shipping_method, o.created_at, u.name, u.email
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
            """)
            rows = cursor.fetchall()
            
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow([
                "Order ID", "Total Amount ($)", "Fulfillment Status", "Shipping Name", 
                "Shipping Address", "Shipping Phone", "Shipping Method", "Date Placed", 
                "Customer Name", "Customer Email"
            ])
            for r in rows:
                writer.writerow([
                    r[0], float(r[1]), r[2], r[3], r[4], r[5], r[6], str(r[7]), r[8] or "Anonymous", r[9] or "N/A"
                ])
                
            response = make_response(output.getvalue())
            response.headers["Content-Disposition"] = "attachment; filename=shopease_orders_queue.csv"
            response.headers["Content-type"] = "text/csv"
            return response
    except Exception as e:
        return jsonify({"message": f"Export error: {str(e)}"}), 500

@app.route("/api/admin/export/users", methods=["GET"])
@admin_required
def admin_export_users(current_user):
    import io
    import csv
    try:
        with get_db() as (conn, cursor):
            cursor.execute("""
                SELECT u.id, u.name, u.email, u.address, u.phone, u.is_admin, u.created_at,
                       COUNT(o.id) as order_count, SUM(o.total) as total_spent
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'Cancelled'
                GROUP BY u.id
                ORDER BY u.created_at DESC
            """)
            rows = cursor.fetchall()
            
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["User ID", "Name", "Email", "Address", "Phone", "Is Admin", "Date Joined", "Orders Placed", "Total Spent ($)"])
            for r in rows:
                writer.writerow([
                    r[0], r[1], r[2], r[3] or "N/A", r[4] or "N/A", "Yes" if r[5] else "No", str(r[6]), r[7], float(r[8]) if r[8] is not None else 0.0
                ])
                
            response = make_response(output.getvalue())
            response.headers["Content-Disposition"] = "attachment; filename=shopease_users_registry.csv"
            response.headers["Content-type"] = "text/csv"
            return response
    except Exception as e:
        return jsonify({"message": f"Export error: {str(e)}"}), 500

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

@app.route("/api/health", methods=["GET"])
def api_health():
    return jsonify({"status": "healthy", "service": "ShopEase API Control Centre"}), 200

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

# ─── CUSTOMER MANAGEMENT: REVIEWS & LIVE SUPPORT CHAT APIS ────────────
import random

_mock_reviews = {}
_mock_conversations = {}

@app.route("/api/admin/reviews", methods=["GET"])
@admin_required
def admin_get_reviews(current_user):
    global _mock_reviews
    
    # Lazy populate mock reviews from active database products
    if not _mock_reviews:
        try:
            with get_db() as (conn, cursor):
                cursor.execute("SELECT id, name, image FROM products LIMIT 6")
                products = cursor.fetchall()
        except Exception:
            products = []
            
        if not products:
            products = [
                {"id": 1, "name": "Vapor Max Sneakers", "image": "https://picsum.photos/200"},
                {"id": 2, "name": "Hyperion Smart Watch", "image": "https://picsum.photos/200"}
            ]
            
        reviewers = [
            {"name": "Liam Sterling", "email": "liam@cosmos.com"},
            {"name": "Sarah Jenkins", "email": "sarah.j@outlook.com"},
            {"name": "Alex Rivera", "email": "arivera@gmail.com"},
            {"name": "Elena Rostova", "email": "elena.r@yandex.com"},
            {"name": "David Patel", "email": "david.patel@gmail.com"},
            {"name": "Chloe Chen", "email": "chloe.c@terminal.com"}
        ]
        
        comments = [
            "Absolutely premium quality! The glassmorphic design and colors are stunning.",
            "Fast dispatch to my terminal. Fits perfectly and looks very futuristic.",
            "The packaging box was slightly scuffed, but the actual product is clean and gorgeous.",
            "Incredible utility! The design feels extremely state-of-the-art.",
            "Exceeded my expectations! Will order the secondary color layer soon.",
            "Decent value, though the cosmic lighting could be slightly brighter."
        ]
        
        for idx, p in enumerate(products):
            pid = p[0] if isinstance(p, tuple) else p["id"]
            pname = p[1] if isinstance(p, tuple) else p["name"]
            pimg = p[2] if isinstance(p, tuple) else p["image"]
            
            rev_id = 2001 + idx
            reviewer = reviewers[idx % len(reviewers)]
            rating = random.choice([4.0, 4.5, 5.0])
            status = "Pending" if idx % 3 == 0 else "Approved"
            
            _mock_reviews[rev_id] = {
                "id": rev_id,
                "product_id": pid,
                "product_name": pname,
                "product_image": pimg,
                "reviewer_name": reviewer["name"],
                "reviewer_email": reviewer["email"],
                "rating": rating,
                "comment": comments[idx % len(comments)],
                "status": status,
                "created_at": (datetime.datetime.utcnow() - datetime.timedelta(days=idx)).isoformat()
            }
            
    return jsonify({
        "data": list(_mock_reviews.values()),
        "meta": {
            "page": 1,
            "per_page": 100,
            "total_pages": 1,
            "total_items": len(_mock_reviews),
            "has_prev": False,
            "has_next": False
        }
    }), 200

@app.route("/api/admin/reviews/<int:review_id>/status", methods=["PUT"])
@admin_required
def admin_update_review_status(current_user, review_id):
    global _mock_reviews
    data = request.json or {}
    status = data.get("status", "Approved")
    
    if review_id in _mock_reviews:
        _mock_reviews[review_id]["status"] = status
        return jsonify({"message": f"Review status marked as {status}"}), 200
    return jsonify({"message": "Review record not found"}), 404

@app.route("/api/admin/reviews/<int:review_id>", methods=["DELETE"])
@admin_required
def admin_delete_review(current_user, review_id):
    global _mock_reviews
    if review_id in _mock_reviews:
        del _mock_reviews[review_id]
        return jsonify({"message": "Review deleted successfully"}), 200
    return jsonify({"message": "Review record not found"}), 404

@app.route("/api/admin/messages", methods=["GET"])
@admin_required
def admin_get_messages(current_user):
    global _mock_conversations
    
    if not _mock_conversations:
        # Fetch actual users
        try:
            with get_db() as (conn, cursor):
                cursor.execute("SELECT id, name, email FROM users WHERE is_admin = 0 LIMIT 4")
                db_users = cursor.fetchall()
        except Exception:
            db_users = []
            
        buyers = []
        for u in db_users:
            buyers.append({"id": u[0], "name": u[1], "email": u[2]})
            
        # Fallbacks for premium visual preview
        if len(buyers) < 3:
            buyers.extend([
                {"id": 901, "name": "Sarah Jenkins", "email": "sarah.j@outlook.com"},
                {"id": 902, "name": "Alex Rivera", "email": "alex.rivera@gmail.com"},
                {"id": 903, "name": "Elena Rostova", "email": "elena.r@yandex.com"},
                {"id": 904, "name": "David Patel", "email": "david.patel@gmail.com"}
            ])
            
        histories = [
            [
                {"sender": "customer", "text": "Hi, I have a query regarding my shipping schedule.", "time": "10:14 AM"},
                {"sender": "admin", "text": "Hello! Sure, let me look into that. What is your Order ID?", "time": "10:16 AM"},
                {"sender": "customer", "text": "It is Order #10085. I checked out yesterday.", "time": "10:18 AM"}
            ],
            [
                {"sender": "customer", "text": "Are the Cyber Sneakers true to standard sizing dimensions?", "time": "Yesterday"},
                {"sender": "admin", "text": "Yes! They run perfectly true to US size standards.", "time": "Yesterday"},
                {"sender": "customer", "text": "Stellar! Adding to my wishlist now.", "time": "Yesterday"}
            ],
            [
                {"sender": "customer", "text": "I received my order, but need to exchange the secondary color layer.", "time": "2 days ago"},
                {"sender": "admin", "text": "Certainly! Please initiate a return request in the refund console.", "time": "2 days ago"},
                {"sender": "customer", "text": "Done! Thank you for the quick support.", "time": "2 days ago"}
            ],
            [
                {"sender": "customer", "text": "Do you accept international checkout cards from European terminals?", "time": "3 days ago"},
                {"sender": "admin", "text": "Yes, we fully support Stripe and PayPal worldwide checkouts.", "time": "3 days ago"}
            ]
        ]
        
        for idx, buyer in enumerate(buyers):
            bid = buyer["id"]
            history = histories[idx % len(histories)]
            _mock_conversations[bid] = {
                "user_id": bid,
                "user_name": buyer["name"],
                "user_email": buyer["email"],
                "avatar_color": ["#00F0FF", "#A020F0", "#39FF14", "#FF007F"][idx % 4],
                "messages": list(history)
            }
            
    return jsonify({"conversations": list(_mock_conversations.values())}), 200

@app.route("/api/admin/messages/reply", methods=["POST"])
@admin_required
def admin_post_message_reply(current_user):
    global _mock_conversations
    data = request.json or {}
    user_id = data.get("user_id")
    text = data.get("message")
    
    if not user_id or not text:
        return jsonify({"message": "User ID and reply text are required"}), 400
        
    user_key = int(user_id)
    if user_key in _mock_conversations:
        # Append Admin reply
        _mock_conversations[user_key]["messages"].append({
            "sender": "admin",
            "text": text,
            "time": "Just Now"
        })
        
        # Pre-calculate realistic simulated customer responses
        responses = [
            "Excellent support! That answers all my queries.",
            "Stellar speed! Let me proceed with that now.",
            "Understood, thank you for checking the database index for me.",
            "That works perfectly. I appreciate the fantastic help!",
            "Got it! Thanks for looking after this so quickly.",
            "Perfect. I will monitor my shipping tracking code."
        ]
        simulated_reply = random.choice(responses)
        
        # Save customer reply to active state so it persists on subsequent loads
        _mock_conversations[user_key]["messages"].append({
            "sender": "customer",
            "text": simulated_reply,
            "time": "Just Now"
        })
        
        return jsonify({
            "status": "success",
            "simulated_reply": simulated_reply
        }), 200
        
    return jsonify({"message": "Conversation channel not found"}), 404

@app.route("/")
def index_page():
    """Serve the main index page"""
    return send_from_directory('../frontend', 'index.html')

# --- STATIC FILE SERVING (MUST BE LAST) ---
@app.route('/<path:path>')
def serve_static(path):
    # Guard: Don't let the static server catch intended API routes
    if path.startswith('api/'):
        return jsonify({"message": f"API route not found: /{path}"}), 404
    return send_from_directory('../frontend', path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)