from fastapi import APIRouter
from models.user_model import User, UserUpsertRequest, ConnectGithubRequest
from controllers.user_controller import (
    create_user, upsert_user, get_user, get_user_by_email,
    update_user, delete_user, connect_github,
)

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


@router.post("/connect-github")
async def link_github(data: ConnectGithubRequest):
    return await connect_github(data)
