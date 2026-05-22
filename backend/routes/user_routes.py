from fastapi import APIRouter
from models.user_model import User, UserUpsertRequest, ConnectGithubRequest
from controllers.user_controller import (
    create_user, upsert_user, get_user, get_user_by_email,
    update_user, delete_user, connect_github, get_stats, update_username,
)
from database.database import users_collection
from services.github_service import create_webhooks_for_user

router = APIRouter()


@router.post("/")
def create_or_upsert_user(data: UserUpsertRequest):
    return upsert_user(data)


@router.post("/full")
def create_full_user(user: User, uid: str):
    return create_user(user, uid)


@router.get("/{uid}")
def fetch_user(uid: str):
    return get_user(uid)


@router.get("/email/{email}")
def fetch_by_email(email: str):
    return get_user_by_email(email)


@router.put("/{uid}")
def update(uid: str, user: User):
    return update_user(uid, user)


@router.delete("/{uid}")
def delete(uid: str):
    return delete_user(uid)


@router.get("/{uid}/stats")
def fetch_stats(uid: str):
    return get_stats(uid)


@router.post("/connect-github")
async def link_github(data: ConnectGithubRequest):
    return await connect_github(data)


@router.post("/{uid}/refresh-webhooks")
async def refresh_webhooks(uid: str):
    user = users_collection.find_one({"_id": uid}, {"github_token": 1})
    if not user or not user.get("github_token"):
        return {"ok": False, "error": "No GitHub token found — reconnect GitHub first"}
    updated = await create_webhooks_for_user(user["github_token"])
    return {"ok": True, "updated": updated}

@router.patch("/{uid}/username")
def update_username_route(uid: str, username: str):
    return update_username(uid, username)
