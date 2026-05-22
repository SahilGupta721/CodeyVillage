from pydantic import BaseModel
from typing import Optional


class PlaceItemRequest(BaseModel):
    item_id: str
    x: float
    y: float
    placed_by: Optional[str] = None
    price_paid: int = 0
