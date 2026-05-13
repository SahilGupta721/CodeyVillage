from datetime import datetime, timezone
from fastapi import HTTPException
from database.database import users_collection, coin_ledger_collection
from models.coin_model import AddCoinsRequest

ACTIVITY_COIN_VALUES = {
    "leetcode_accepted": 50,
    "github_commit": 25,
    "job_application": 25,
}


def add_coins(data: AddCoinsRequest):
    # Server is source of truth for coin values — ignore client-provided amount for known activity types
    amount = ACTIVITY_COIN_VALUES.get(data.activity_type, data.amount)
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
        {"$inc": {"coins": amount, "total_coins_earned": amount}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found — create user first")

    try:
        coin_ledger_collection.insert_one({
            "uid": data.uid,
            "activity_type": data.activity_type,
            "amount": amount,
            "dedup_key": data.dedup_key,
            "details": data.details or {},
            "balance_after": result["coins"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        users_collection.update_one(
            {"_id": data.uid},
            {"$inc": {"coins": -amount, "total_coins_earned": -amount}},
        )
        raise HTTPException(status_code=500, detail="Failed to record transaction")

    return {"coins": result["coins"], "earned": amount, "duplicate": False}


def get_coins(uid: str):
    user = users_collection.find_one({"_id": uid}, {"coins": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"uid": uid, "coins": user["coins"]}


def get_leaderboard(uids: list):
    users = list(users_collection.find(
        {"_id": {"$in": uids}},
        {"_id": 1, "username": 1, "coins": 1}
    ))
    result = [{"uid": u["_id"], "username": u.get("username", "?"), "coins": u.get("coins", 0)} for u in users]
    result.sort(key=lambda x: x["coins"], reverse=True)
    return result


def get_weekly_stats(uid: str):
    from datetime import timedelta
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    entries = list(coin_ledger_collection.find(
        {"uid": uid, "timestamp": {"$gte": week_ago}},
        {"_id": 0, "activity_type": 1, "amount": 1}
    ))
    total_coins = sum(e.get("amount", 0) for e in entries)
    counts = {}
    for e in entries:
        t = e["activity_type"]
        counts[t] = counts.get(t, 0) + 1
    return {
        "total_coins": total_coins,
        "leetcode": counts.get("leetcode_accepted", 0),
        "commits": counts.get("github_commit", 0),
        "jobs": counts.get("job_application", 0),
    }
