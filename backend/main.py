from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import user_routes, coin_routes, room_routes, island_routes, shop_routes, interaction_routes, ws_routes, webhook_routes
from database import database as db

app = FastAPI(title="GDG Hacks 3 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://codey-village-six.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
      
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_routes.router, prefix="/users", tags=["users"])
app.include_router(coin_routes.router, prefix="/coins", tags=["coins"])
app.include_router(room_routes.router, prefix="/rooms", tags=["rooms"])
app.include_router(island_routes.router, prefix="/island", tags=["island"])
app.include_router(shop_routes.router, prefix="/shop", tags=["shop"])
app.include_router(interaction_routes.router, prefix="/interactions", tags=["interactions"])
app.include_router(ws_routes.router, tags=["websocket"])
app.include_router(webhook_routes.router, tags=["webhooks"])

db.check_connection()

@app.get("/")
def root():
    return {"status": "CodeyVillage backend API running"}