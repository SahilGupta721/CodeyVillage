from pydantic import BaseModel

class AddCoinsRequest(BaseModel):
    uid: str
    activity_type: str
    amount: int
