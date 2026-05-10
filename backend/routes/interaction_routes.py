from fastapi import APIRouter
from models.interaction_model import SendTrollRequest
from controllers.interaction_controller import send_troll, get_pending, complete_interaction

router = APIRouter()


@router.post("/")
def troll(data: SendTrollRequest):
    return send_troll(data)


@router.get("/pending/{target_user_id}")
def pending(target_user_id: str):
    return get_pending(target_user_id)


@router.patch("/{interaction_id}/complete")
def complete(interaction_id: str):
    return complete_interaction(interaction_id)
