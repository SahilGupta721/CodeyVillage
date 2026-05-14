from fastapi import APIRouter, Request
from database.database import users_collection
from controllers.coin_controller import add_coins
from models.coin_model import AddCoinsRequest

router = APIRouter()

COINS_PER_COMMIT = 25


@router.post("/webhook/github")
async def github_webhook(request: Request):
    print("🔔 GitHub webhook received")
    payload = await request.json()

    pusher_name = payload.get("pusher", {}).get("name")
    commits = payload.get("commits", [])
    print(f"pusher='{pusher_name}' commits={len(commits)}")  # ADD

    if not pusher_name or not commits:
        return {"ok": True}

    user = users_collection.find_one({"github_username": pusher_name}, {"_id": 1})
    print(f"user lookup result: {user}")  # ADD
    if not user:
        return {"ok": True}