from datetime import datetime, timezone
from fastapi import HTTPException
from database.database import users_collection, coin_ledger_collection
from models.user_model import User, UserUpsertRequest, ConnectGithubRequest
from services.github_service import get_github_user, create_webhooks_for_user


def create_user(user: User, uid: str):
    existing = users_collection.find_one({"_id": uid})
    if existing:
        existing["id"] = existing["_id"]
        del existing["_id"]
        return existing

    user_dict = user.model_dump(exclude={"id"})
    user_dict["_id"] = uid
    users_collection.insert_one(user_dict)
    return {"id": uid, "message": "User created successfully"}


def upsert_user(data: UserUpsertRequest):
    users_collection.update_one(
        {"_id": data.uid},
        {"$setOnInsert": {
            "_id": data.uid,
            "username": data.username,
            "email": getattr(data, "email", None),
            "coins": 100,
            "total_coins_earned": 100,
            "streak_days": 0,
            "github_username": None,
            "leetcode_username": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    user = users_collection.find_one({"_id": data.uid})
    user["id"] = user["_id"]
    del user["_id"]
    return user


def get_user(uid: str):
    user = users_collection.find_one({"_id": uid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["id"] = str(user["_id"])
    del user["_id"]
    return user


def get_user_by_email(email: str):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["id"] = str(user["_id"])
    del user["_id"]
    return user


def update_user(uid: str, user: User):
    result = users_collection.find_one_and_update(
        {"_id": uid},
        {"$set": user.model_dump(exclude={"id"}, exclude_none=True)},
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated successfully"}


def delete_user(uid: str):
    result = users_collection.delete_one({"_id": uid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


def get_stats(uid: str):
    pipeline = [
        {"$match": {"uid": uid}},
        {"$group": {"_id": "$activity_type", "count": {"$sum": 1}}},
    ]
    results = list(coin_ledger_collection.aggregate(pipeline))
    counts = {r["_id"]: r["count"] for r in results}
    return {
        "leetcode_solved": counts.get("leetcode_accepted", 0),
        "commits": counts.get("github_commit", 0),
        "jobs_applied": counts.get("job_application", 0),
    }


async def connect_github(data: ConnectGithubRequest):
    gh_user = await get_github_user(data.github_token)
    login = gh_user["login"]

    webhooks_created = await create_webhooks_for_user(data.github_token)

    users_collection.update_one(
        {"_id": data.uid},
        {"$set": {
            "github_username": login,
            "github_token": data.github_token,
            "github_connected_at": datetime.now(timezone.utc).isoformat(),
        }},
    )

    return {"github_login": login, "webhooks_created": webhooks_created}

def update_username(uid: str, username: str):
    result = users_collection.update_one(
        {"_id": uid},
        {"$set": {"username": username}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Username updated successfully"}