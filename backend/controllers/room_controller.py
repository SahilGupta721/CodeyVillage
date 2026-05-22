import random
import string
from datetime import datetime, timezone
from fastapi import HTTPException
from database.database import rooms_collection
from models.room_model import CreateRoomRequest, JoinRoomRequest
from bson import ObjectId
from datetime import datetime, timezone    


def generate_code(length=6):
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choices(chars, k=length))

def get_user_room(uid: str):
    room = rooms_collection.find_one({"members": uid})
    if not room:
        return None
    return {
        "room_id": str(room["_id"]),
        "name": room["name"],
        "host_id": room["host_id"],
        "code": room["code"],
        "members": room.get("members", []),
    }

def create_room(data: CreateRoomRequest):
    if rooms_collection.find_one({"members": data.host_id}):
        raise HTTPException(status_code=409, detail="You are already in a room. Leave it before creating a new one.")

    code = generate_code()
    while rooms_collection.find_one({"code": code}):
        code = generate_code()

    room = {
        "name": data.name,
        "host_id": data.host_id,
        "code": code,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "members": [data.host_id],
    }
    result = rooms_collection.insert_one(room)
    room_id = str(result.inserted_id)

    return {"room_id": room_id, "name": data.name, "code": code, "host_id": data.host_id}

def join_room(data: JoinRoomRequest):
    room = rooms_collection.find_one({"code": data.code.upper()})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    room_id = str(room["_id"])

    if data.user_id in room.get("members", []):
        return {"room_id": room_id, "name": room["name"], "code": room["code"], "already_member": True}

    if len(room.get("members", [])) >= 5:
        raise HTTPException(status_code=409, detail="Room is full (max 5 players).")

    existing = rooms_collection.find_one({"members": data.user_id})
    if existing:
        raise HTTPException(status_code=409, detail="You are already in a room. Leave it before joining another.")

    rooms_collection.update_one(
        {"_id": room["_id"]},
        {"$push": {"members": data.user_id}}
    )

    return {"room_id": room_id, "name": room["name"], "code": room["code"], "already_member": False}

def get_room(room_id: str):
    try:
        room = rooms_collection.find_one({"_id": ObjectId(room_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid room ID")

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    return {
        "room_id": str(room["_id"]),
        "name": room["name"],
        "host_id": room["host_id"],
        "code": room["code"],
        "created_at": room["created_at"],
        "members": room.get("members", []),
    }

def leave_room(room_id: str, user_id: str):
    
    try:
        room = rooms_collection.find_one({"_id": ObjectId(room_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid room ID")

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    rooms_collection.update_one(
        {"_id": room["_id"]},
        {"$pull": {"members": user_id}}
    )

    return {"message": "Left room successfully"}

def ping_room(room_id: str, user_id: str):
    try:
        oid = ObjectId(room_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid room ID")

    now = datetime.now(timezone.utc).timestamp()

    # Update this user's last ping
    rooms_collection.update_one(
        {"_id": oid},
        {"$set": {f"pings.{user_id}": now}}
    )

    # Get room and calculate who's active (pinged within last 30 seconds)
    room = rooms_collection.find_one({"_id": oid})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    pings = room.get("pings", {})
    active_members = [
        uid for uid in room.get("members", [])
        if now - pings.get(uid, 0) <= 30
    ]

    return {"active_members": active_members}

