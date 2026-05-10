from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: EmailStr
    coins: int = 0
    total_coins_earned: int = 0
    streak_days: int = 0
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None