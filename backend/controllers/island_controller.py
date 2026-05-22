from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from fastapi import HTTPException

from database.database import island_state_collection
from models.island_model import PlaceItemRequest


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "room_id": doc.get("room_id"),
        "item_id": doc.get("item_id"),
        "x": doc.get("x"),
        "y": doc.get("y"),
        "placed_by": doc.get("placed_by"),
        "price_paid": int(doc.get("price_paid", 0)),
        "placed_at": doc.get("placed_at"),
    }


def get_island_state(room_id: str) -> dict:
    cursor = island_state_collection.find({"room_id": room_id}).sort("placed_at", 1)
    items: List[dict] = [_serialize(d) for d in cursor]
    return {"room_id": room_id, "placed_items": items}


def place_item(room_id: str, data: PlaceItemRequest) -> dict:
    doc = {
        "room_id": room_id,
        "item_id": data.item_id,
        "x": float(data.x),
        "y": float(data.y),
        "placed_by": data.placed_by,
        "price_paid": int(data.price_paid),
        "placed_at": datetime.now(timezone.utc).isoformat(),
    }
    result = island_state_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


def delete_item(room_id: str, item_id: str, deleted_by: str | None = None) -> dict:
    try:
        oid = ObjectId(item_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid item ID") from exc

    doc = island_state_collection.find_one_and_delete({"_id": oid, "room_id": room_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Placed item not found")

    return {
        "deleted_id": item_id,
        "room_id": room_id,
        "item_id": doc.get("item_id"),
        "refund_amount": int(doc.get("price_paid", 0)),
        "deleted_by": deleted_by,
    }
