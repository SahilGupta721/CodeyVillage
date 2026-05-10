from fastapi import APIRouter
from controllers.coin_controller import add_coins, get_coins
from models.coin_model import AddCoinsRequest

router = APIRouter()

@router.post("/add")
def credit_coins(data: AddCoinsRequest):
    return add_coins(data)

@router.get("/{uid}")
def fetch_coins(uid: str):
    return get_coins(uid)
