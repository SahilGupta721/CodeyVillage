from fastapi import FastAPI
from routes import user_routes, coin_routes, room_routes, island_routes, shop_routes
from database import database as db

app = FastAPI(title="GDG Hacks 3 API")

app.include_router(user_routes.router, prefix="/users", tags=["users"])
app.include_router(coin_routes.router, prefix="/coins", tags=["coins"])
app.include_router(room_routes.router, prefix="/rooms", tags=["rooms"])
app.include_router(island_routes.router, prefix="/island", tags=["island"])
app.include_router(shop_routes.router, prefix="/shop", tags=["shop"])

db.check_connection()
@app.get("/")
def root():
    return {"status": "GDG Hacks 3 API running"}