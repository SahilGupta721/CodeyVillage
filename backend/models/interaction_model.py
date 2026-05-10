from pydantic import BaseModel
from typing import Literal


class SendTrollRequest(BaseModel):
    target_user_id: str
    sender_username: str
    troll_type: Literal["screen_shake", "confetti", "jumpscare"] = "screen_shake"
