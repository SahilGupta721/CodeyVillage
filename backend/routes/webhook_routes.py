from fastapi import APIRouter, Request
from database.database import users_collection
from controllers.coin_controller import add_coins
from models.coin_model import AddCoinsRequest

router = APIRouter()

COINS_PER_COMMIT = 25


def _commits_from_payload(payload: dict) -> list[dict]:
    """GitHub often sends commits=[] but includes head_commit (web editor, large pushes, etc.)."""
    commits = list(payload.get("commits") or [])
    seen = {c.get("id") or c.get("sha") for c in commits if c.get("id") or c.get("sha")}

    head = payload.get("head_commit")
    if head:
        head_id = head.get("id") or head.get("sha")
        if head_id and head_id not in seen:
            commits.append(head)

    return commits


@router.post("/webhook/github")
async def github_webhook(request: Request):
    payload = await request.json()

    pusher_name = (payload.get("pusher") or {}).get("name") or (payload.get("sender") or {}).get("login")
    commits = _commits_from_payload(payload)
    repo_full_name = (payload.get("repository") or {}).get("full_name", "")

    if not pusher_name or not commits:
        return {"ok": True, "credited": 0, "reason": "no_pusher_or_commits"}

    user = users_collection.find_one(
        {"github_username": {"$regex": f"^{pusher_name}$", "$options": "i"}},
        {"_id": 1},
    )
    if not user:
        return {"ok": True, "credited": 0, "reason": "user_not_found"}

    uid = user["_id"]
    credited = 0
    duplicates = 0

    for commit in commits:
        commit_id = commit.get("id") or commit.get("sha")
        if not commit_id:
            continue
        result = add_coins(
            AddCoinsRequest(
                uid=uid,
                activity_type="github_commit",
                amount=COINS_PER_COMMIT,
                dedup_key=commit_id,
                details={
                    "repo": repo_full_name,
                    "commit_sha": commit_id,
                    "commit_message": (commit.get("message") or "")[:200],
                    "author": (commit.get("author") or {}).get("name") or pusher_name,
                },
            )
        )
        if result.get("duplicate"):
            duplicates += 1
        elif result.get("earned", 0) > 0:
            credited += 1

    return {"ok": True, "credited": credited, "duplicates": duplicates, "repo": repo_full_name}
