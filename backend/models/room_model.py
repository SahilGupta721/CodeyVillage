from pydantic import BaseModel
from typing import Optional

class CreateRoomRequest(BaseModel):
    name: str
    host_id: str

class JoinRoomRequest(BaseModel):
    code: str
    user_id: str
