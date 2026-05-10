from fastapi import APIRouter
from models.user_model import User
from controllers.user_controller import (
    create_user, get_user, get_user_by_email, update_user, delete_user
)

router = APIRouter()

@router.post("/")
def create(user: User):
    return create_user(user)

@router.get("/{user_id}")
def get(user_id: str):
    return get_user(user_id)

@router.get("/email/{email}")
def get_by_email(email: str):
    return get_user_by_email(email)

@router.put("/{user_id}")
def update(user_id: str, user: User):
    return update_user(user_id, user)

@router.delete("/{user_id}")
def delete(user_id: str):
    return delete_user(user_id)