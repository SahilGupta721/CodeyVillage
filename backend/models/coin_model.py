from pydantic import BaseModel
from typing import Optional

class AddCoinsRequest(BaseModel):
    uid: str
    activity_type: str
    amount: int
    dedup_key: Optional[str] = None
