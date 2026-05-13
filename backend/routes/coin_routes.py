from fastapi import APIRouter, Query
from controllers.coin_controller import add_coins, get_coins, get_leaderboard, get_weekly_stats
from models.coin_model import AddCoinsRequest, LeaderboardRequest
from database.database import coin_ledger_collection

router = APIRouter()

@router.post("/add")
def credit_coins(data: AddCoinsRequest):
    return add_coins(data)

@router.post("/leaderboard")
def leaderboard(data: LeaderboardRequest):
    return get_leaderboard(data.uids)

@router.get("/{uid}/weekly")
def weekly_stats(uid: str):
    return get_weekly_stats(uid)

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
