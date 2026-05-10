from fastapi import APIRouter, Request
from database.database import users_collection
from controllers.coin_controller import add_coins
from models.coin_model import AddCoinsRequest

router = APIRouter()

COINS_PER_COMMIT = 25


@router.post("/webhook/github")
async def github_webhook(request: Request):
    payload = await request.json()

    pusher_name = payload.get("pusher", {}).get("name")
    commits = payload.get("commits", [])

    if not pusher_name or not commits:
        return {"ok": True}

    user = users_collection.find_one({"github_username": pusher_name}, {"_id": 1})
    if not user:
        return {"ok": True}

    uid = str(user["_id"])
    repo_name = payload.get("repository", {}).get("name", "")
    awarded = 0
    for commit in commits:
        sha = commit.get("id")
        if not sha:
            continue
        result = add_coins(AddCoinsRequest(
            uid=uid,
            activity_type="github_commit",
            amount=COINS_PER_COMMIT,
            dedup_key=sha,
            details={"repo": repo_name, "message": commit.get("message", "")[:80]},
        ))
        if not result.get("duplicate"):
            awarded += COINS_PER_COMMIT

    return {"ok": True, "awarded": awarded}
