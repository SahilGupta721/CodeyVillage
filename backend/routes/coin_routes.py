from fastapi import APIRouter, Query
from controllers.coin_controller import add_coins, get_coins
from models.coin_model import AddCoinsRequest
from database.database import coin_ledger_collection

router = APIRouter()

@router.post("/add")
def credit_coins(data: AddCoinsRequest):
    return add_coins(data)

@router.get("/{uid}/recent")
def recent_activity(uid: str, limit: int = Query(default=20, le=50)):
    entries = list(
        coin_ledger_collection.find(
            {"uid": uid},
            {"_id": 0, "uid": 0}
        ).sort("timestamp", -1).limit(limit)
    )
    return entries

@router.get("/{uid}")
def fetch_coins(uid: str):
    return get_coins(uid)
