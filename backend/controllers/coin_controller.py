from datetime import datetime, timezone
from fastapi import HTTPException
from database.database import users_collection, coin_ledger_collection
from models.coin_model import AddCoinsRequest


def add_coins(data: AddCoinsRequest):
    if data.dedup_key:
        existing = coin_ledger_collection.find_one({
            "uid": data.uid,
            "activity_type": data.activity_type,
            "dedup_key": data.dedup_key,
        })
        if existing:
            user = users_collection.find_one({"_id": data.uid}, {"coins": 1})
            return {"coins": user["coins"] if user else 0, "earned": 0, "duplicate": True}

    result = users_collection.find_one_and_update(
        {"_id": data.uid},
        {"$inc": {"coins": data.amount, "total_coins_earned": data.amount}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found — create user first")

    coin_ledger_collection.insert_one({
        "uid": data.uid,
        "activity_type": data.activity_type,
        "amount": data.amount,
        "dedup_key": data.dedup_key,
        "balance_after": result["coins"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"coins": result["coins"], "earned": data.amount, "duplicate": False}


def get_coins(uid: str):
    user = users_collection.find_one({"_id": uid}, {"coins": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"uid": uid, "coins": user["coins"]}
