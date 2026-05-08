import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Replace this with your actual MongoDB Atlas connection string
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/shop_ease")

def get_db():
    client = MongoClient(MONGO_URI)
    return client.get_database()
