from pymongo import MongoClient
from dotenv import load_dotenv
import certifi
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URL"), tlsCAFile=certifi.where())
db = client["gdg_hacks_3"]

# Collections
users_collection = db["users"]
coin_ledger_collection = db["coin_ledger"]
rooms_collection = db["rooms"]
interactions_collection = db["interactions"]
island_state_collection = db["island_state"]
shop_items_collection = db["shop_items"]

def get_db():
    return db

def check_connection():
    try:
        client.admin.command("ping")
        print("✅ MongoDB connected successfully!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
