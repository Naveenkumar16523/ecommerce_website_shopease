from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt
import datetime
from functools import wraps
from db_config import get_db
from bson import ObjectId

import os

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your_secret_key_change_this')

db = get_db()
products_col = db.products
users_col = db.users
orders_col = db.orders

# Helper to format MongoDB objects for JSON
def format_doc(doc):
    if not doc: return None
    if isinstance(doc, list):
        return [format_doc(item) for item in doc]
    
    if isinstance(doc, dict):
        new_doc = {}
        for key, value in doc.items():
            if key == '_id' or isinstance(value, ObjectId):
                new_doc[key] = str(value)
            elif isinstance(value, datetime.datetime):
                new_doc[key] = value.isoformat()
            elif isinstance(value, dict) or isinstance(value, list):
                new_doc[key] = format_doc(value)
            else:
                new_doc[key] = value
        return new_doc
    return doc

@app.route("/")
def home():
    try:
        # Check if database is connected
        db.command('ping')
        return "<h1>SHOP EASE API is running! 🚀</h1><p>MongoDB Connection: <b>Connected ✅</b></p><p>Go to <a href='/api/seed'>/api/seed</a> to populate your data.</p>"
    except Exception as e:
        return f"<h1>SHOP EASE API is running! 🚀</h1><p>MongoDB Connection: <b>Failed ❌</b></p><p>Error: {str(e)}</p>"

# Authentication Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_col.find_one({"_id": ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(format_doc(current_user), *args, **kwargs)
    return decorated

# --- AUTH ROUTES ---

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    if not data.get('email') or not data.get('password'):
        return jsonify({"message": "Missing email or password"}), 400
    
    if users_col.find_one({"email": data['email']}):
        return jsonify({"message": "User already exists"}), 409
    
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = {
        "name": data.get('name', 'User'),
        "email": data['email'],
        "password": hashed_pw,
        "address": "",
        "phone": "",
        "created_at": datetime.datetime.utcnow()
    }
    result = users_col.insert_one(new_user)
    return jsonify({"message": "User created successfully", "user_id": str(result.inserted_id)}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    user = users_col.find_one({"email": data.get('email')})
    
    if user and bcrypt.check_password_hash(user['password'], data.get('password')):
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "name": user['name'],
                "email": user['email'],
                "address": user.get('address', ''),
                "phone": user.get('phone', '')
            }
        }), 200
    
    return jsonify({"message": "Invalid credentials"}), 401

@app.route("/api/me", methods=["GET"])
@token_required
def get_me(current_user):
    del current_user['password']
    return jsonify(current_user)

@app.route("/api/profile/update", methods=["POST"])
@token_required
def update_profile(current_user):
    data = request.json
    users_col.update_one(
        {"_id": ObjectId(current_user['_id'])},
        {"$set": {
            "address": data.get('address', current_user.get('address')),
            "phone": data.get('phone', current_user.get('phone')),
            "name": data.get('name', current_user.get('name'))
        }}
    )
    return jsonify({"message": "Profile updated successfully"})

# --- PRODUCT ROUTES ---

@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category")
    query = {"category": category} if category else {}
    products = list(products_col.find(query))
    return jsonify([format_doc(p) for p in products])

@app.route("/api/products/search", methods=["GET"])
def search_products():
    q = request.args.get("q", "").lower()
    query = {"name": {"$regex": q, "$options": "i"}}
    products = list(products_col.find(query))
    return jsonify([format_doc(p) for p in products])

# --- WISHLIST ROUTES ---

@app.route("/api/wishlist", methods=["GET"])
@token_required
def get_wishlist(current_user):
    user = users_col.find_one({"_id": ObjectId(current_user['_id'])})
    wishlist_ids = user.get('wishlist', [])
    # Convert string IDs back to ObjectIds for the products query
    obj_ids = [ObjectId(pid) for pid in wishlist_ids]
    products = list(products_col.find({"_id": {"$in": obj_ids}}))
    return jsonify([format_doc(p) for p in products])

@app.route("/api/wishlist/toggle", methods=["POST"])
@token_required
def toggle_wishlist(current_user):
    data = request.json
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({"message": "Product ID required"}), 400
    
    user = users_col.find_one({"_id": ObjectId(current_user['_id'])})
    wishlist = user.get('wishlist', [])
    
    if product_id in wishlist:
        wishlist.remove(product_id)
        action = "removed"
    else:
        wishlist.append(product_id)
        action = "added"
        
    users_col.update_one(
        {"_id": ObjectId(current_user['_id'])},
        {"$set": {"wishlist": wishlist}}
    )
    return jsonify({"message": f"Product {action} wishlist", "action": action})

# --- ORDER ROUTES ---

@app.route("/api/orders", methods=["GET"])
@token_required
def get_orders(current_user):
    try:
        user_id_str = current_user['_id']
        print(f"Fetching orders for user: {user_id_str}")
        
        user_id_obj = ObjectId(user_id_str)
        user_orders = list(orders_col.find({"user_id": user_id_obj}).sort("created_at", -1))
        
        formatted_orders = [format_doc(o) for o in user_orders]
        print(f"Found {len(formatted_orders)} orders.")
        return jsonify(formatted_orders)
    except Exception as e:
        print(f"ERROR in get_orders: {str(e)}")
        return jsonify({"message": str(e)}), 500

@app.route("/api/orders", methods=["POST"])
@token_required
def place_order(current_user):
    data = request.json
    new_order = {
        "user_id": ObjectId(current_user['_id']), # Store as ObjectId
        "items": data.get('items', []),
        "total": data.get('total', 0),
        "shipping": data.get('shipping', {}),
        "status": "Pending",
        "created_at": datetime.datetime.utcnow()
    }
    result = orders_col.insert_one(new_order)
    return jsonify({"message": "Order placed successfully", "order_id": str(result.inserted_id)}), 201

@app.route("/api/orders/<order_id>/cancel", methods=["PUT"])
@token_required
def cancel_order(current_user, order_id):
    try:
        # Verify order belongs to user
        order = orders_col.find_one({"_id": ObjectId(order_id), "user_id": ObjectId(current_user['_id'])})
        if not order:
            return jsonify({"message": "Order not found"}), 404
        
        # Optional: Only allow cancellation if status is 'Pending'
        if order.get('status') != 'Pending':
            return jsonify({"message": f"Cannot cancel order with status: {order.get('status')}"}), 400
            
        orders_col.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": "Cancelled"}}
        )
        return jsonify({"message": "Order cancelled successfully"})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# Seed database with initial products
@app.route("/api/seed", methods=["GET", "POST"])
def seed_db():
    products_col.delete_many({}) # Clear existing
    initial_products = [
        {"name": "T-shirt with Tape Details", "price": 120, "category": "casual", "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80"},
        {"name": "Skinny Fit Jeans", "price": 240, "category": "casual", "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80"},
        {"name": "Checkered Shirt", "price": 180, "category": "formal", "image": "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=400&q=80"},
        {"name": "Sleeve Striped T-Shirt", "price": 130, "category": "casual", "image": "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&q=80"},
        {"name": "Vertical Striped Shirt", "price": 212, "category": "formal", "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80"},
        {"name": "Courage Graphic T-Shirt", "price": 145, "category": "men", "image": "https://images.unsplash.com/photo-1576566582419-1738421c7e7b?w=400&q=80"},
        {"name": "Loose Fit Bermuda Shorts", "price": 80, "category": "men", "image": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80"},
        {"name": "Faded Skinny Jeans", "price": 210, "category": "women", "image": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80"},
        {"name": "Gym Stringer Tank", "price": 45, "category": "gym", "image": "https://images.unsplash.com/photo-1583454110551-21f2fa2ec617?w=400&q=80"},
        {"name": "Party Sparkle Dress", "price": 320, "category": "party", "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80"},
        {"name": "Kids Cartoon Tee", "price": 35, "category": "kids", "image": "https://images.unsplash.com/photo-1519235106638-30cc49daeb66?w=400&q=80"}
    ]
    products_col.insert_many(initial_products)
    return jsonify({"message": f"Database seeded with {len(initial_products)} products"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)