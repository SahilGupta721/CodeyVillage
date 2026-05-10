import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routes import user_routes, coin_routes, room_routes, island_routes, shop_routes, interaction_routes
from database import database as db
from collections import defaultdict

app = FastAPI(title="GDG Hacks 3 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_routes.router, prefix="/users", tags=["users"])
app.include_router(coin_routes.router, prefix="/coins", tags=["coins"])
app.include_router(room_routes.router, prefix="/rooms", tags=["rooms"])
app.include_router(island_routes.router, prefix="/island", tags=["island"])
app.include_router(shop_routes.router, prefix="/shop", tags=["shop"])
app.include_router(interaction_routes.router, prefix="/interactions", tags=["interactions"])

db.check_connection()

# Room WebSocket connections: { room_id: { uid: WebSocket } }
room_connections: dict[str, dict[str, WebSocket]] = defaultdict(dict)

@app.websocket("/ws/{room_id}/{uid}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, uid: str):
    await websocket.accept()
    room_connections[room_id][uid] = websocket
    print(f"Player {uid} joined room {room_id}")
    try:
        while True:
            data = await websocket.receive_text()
            msg  = json.loads(data)
            msg["uid"] = uid  # stamp with sender uid

            # Broadcast to everyone else in the room
            for other_uid, ws in list(room_connections[room_id].items()):
                if other_uid != uid:
                    try:
                        await ws.send_text(json.dumps(msg))
                    except Exception:
                        pass

    except WebSocketDisconnect:
        room_connections[room_id].pop(uid, None)
        print(f"Player {uid} left room {room_id}")

        # Notify remaining players
        for ws in list(room_connections[room_id].values()):
            try:
                await ws.send_text(json.dumps({"type": "leave", "uid": uid}))
            except Exception:
                pass

        # Clean up empty rooms
        if not room_connections[room_id]:
            del room_connections[room_id]

@app.get("/")
def root():
    return {"status": "GDG Hacks 3 API running"}