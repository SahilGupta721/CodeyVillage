from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URL"))
db = client["gdg_hacks_3"]

# Collections
users_collection = db["users"]
coin_ledger_collection = db["coin_ledger"]
rooms_collection = db["rooms"]
room_members_collection = db["room_members"]
island_state_collection = db["island_state"]
shop_items_collection = db["shop_items"]

def get_db():
    return {"Connected to MongoDB",db}