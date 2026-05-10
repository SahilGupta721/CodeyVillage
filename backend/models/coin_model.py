from pydantic import BaseModel
from typing import Optional, Dict, Any

class AddCoinsRequest(BaseModel):
    uid: str
    activity_type: str
    amount: int
    dedup_key: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
