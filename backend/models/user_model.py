from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: Optional[str] = None
    coins: int = 0
    total_coins_earned: int = 0
    streak_days: int = 0
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None


class UserUpsertRequest(BaseModel):
    uid: str
    username: str


class ConnectGithubRequest(BaseModel):
    uid: str
    github_token: str
