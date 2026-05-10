from fastapi import APIRouter

from controllers.island_controller import get_island_state, place_item, delete_item
from models.island_model import PlaceItemRequest

router = APIRouter()


@router.get("/{room_id}")
def fetch_island_state(room_id: str):
    return get_island_state(room_id)


@router.post("/{room_id}/place")
def post_place_item(room_id: str, data: PlaceItemRequest):
    return place_item(room_id, data)


@router.delete("/{room_id}/items/{item_id}")
def delete_placed_item(room_id: str, item_id: str, user_id: str | None = None):
    return delete_item(room_id, item_id, deleted_by=user_id)
