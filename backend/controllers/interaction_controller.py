from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException
from database.database import interactions_collection
from models.interaction_model import SendTrollRequest


def send_troll(data: SendTrollRequest):
    doc = {
        "targetUserId": data.target_user_id,
        "senderUsername": data.sender_username,
        "trollType": data.troll_type,
        "status": "pending",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    result = interactions_collection.insert_one(doc)
    return {"id": str(result.inserted_id), "status": "pending"}


def get_pending(target_user_id: str):
    docs = interactions_collection.find(
        {"targetUserId": target_user_id, "status": "pending"},
        {"_id": 1, "senderUsername": 1, "trollType": 1, "timestamp": 1},
    )
    results = []
    for doc in docs:
        doc["id"] = str(doc.pop("_id"))
        results.append(doc)
    return results


def complete_interaction(interaction_id: str):
    try:
        oid = ObjectId(interaction_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid interaction ID")

    result = interactions_collection.update_one(
        {"_id": oid, "status": "pending"},
        {"$set": {"status": "completed"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Interaction not found or already completed")
    return {"message": "Completed"}
