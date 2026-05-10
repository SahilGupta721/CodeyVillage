from fastapi import APIRouter
from models.room_model import CreateRoomRequest, JoinRoomRequest
from controllers.room_controller import create_room, join_room, get_room, leave_room

router = APIRouter()

@router.post("/")
def create_room_route(data: CreateRoomRequest):
    return create_room(data)

@router.post("/join")
def join_room_route(data: JoinRoomRequest):
    return join_room(data)

@router.get("/{room_id}")
def get_room_route(room_id: str):
    return get_room(room_id)

@router.delete("/{room_id}/leave")
def leave_room_route(room_id: str, user_id: str):
    return leave_room(room_id, user_id)
