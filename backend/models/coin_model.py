from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class AddCoinsRequest(BaseModel):
    uid: str
    activity_type: str
    amount: int
    dedup_key: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class LeaderboardRequest(BaseModel):
    uids: List[str]

class SpendCoinsRequest(BaseModel):
    uid: str
    amount: int
    item: Optional[str] = None