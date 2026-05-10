from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json

router = APIRouter()

MAX_PLAYERS = 5


class RoomManager:
    def __init__(self):
        # room_id → { uid → { ws, username, x, y } }
        self.rooms: Dict[str, Dict[str, dict]] = {}

    async def connect(self, room_id: str, uid: str, ws: WebSocket) -> bool:
        room = self.rooms.setdefault(room_id, {})
        # Allow reconnect from same uid; only block new uid when full
        if uid not in room and len(room) >= MAX_PLAYERS:
            await ws.send_json({"type": "error", "code": "room_full"})
            await ws.close()
            return False
        room[uid] = {"ws": ws, "username": uid[:6], "x": 400.0, "y": 400.0}
        return True

    def update(self, room_id: str, uid: str, x: float, y: float, username: str):
        player = self.rooms.get(room_id, {}).get(uid)
        if player:
            player["x"] = x
            player["y"] = y
            player["username"] = username

    def disconnect(self, room_id: str, uid: str):
        room = self.rooms.get(room_id)
        if room:
            room.pop(uid, None)
            if not room:
                del self.rooms[room_id]

    def snapshot(self, room_id: str, exclude: str) -> list:
        return [
            {"uid": uid, "username": p["username"], "x": p["x"], "y": p["y"]}
            for uid, p in self.rooms.get(room_id, {}).items()
            if uid != exclude
        ]

    async def broadcast(self, room_id: str, msg: dict, exclude: str = ""):
        dead = []
        for uid, p in list(self.rooms.get(room_id, {}).items()):
            if uid == exclude:
                continue
            try:
                await p["ws"].send_json(msg)
            except Exception:
                dead.append(uid)
        for uid in dead:
            self.rooms.get(room_id, {}).pop(uid, None)


manager = RoomManager()


@router.websocket("/ws/{room_id}/{uid}")
async def game_socket(ws: WebSocket, room_id: str, uid: str):
    await ws.accept()

    if not await manager.connect(room_id, uid, ws):
        return

    # Send existing players to the newcomer
    await ws.send_json({"type": "room_state", "players": manager.snapshot(room_id, uid)})

    # Tell everyone else the new player joined
    p = manager.rooms[room_id][uid]
    await manager.broadcast(room_id, {
        "type": "player_joined",
        "uid": uid,
        "username": p["username"],
        "x": p["x"],
        "y": p["y"],
    }, exclude=uid)

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if msg.get("type") == "move":
                x = float(msg.get("x", 0))
                y = float(msg.get("y", 0))
                username = str(msg.get("username", uid[:6]))
                manager.update(room_id, uid, x, y, username)
                await manager.broadcast(room_id, {
                    "type": "move",
                    "uid": uid,
                    "x": x,
                    "y": y,
                    "username": username,
                }, exclude=uid)

            elif msg.get("type") == "place_item":
                # Live relay so other players see the placement instantly.
                # Persistence happens via the HTTP POST /island/{room_id}/place,
                # so we only re-broadcast here.
                await manager.broadcast(room_id, {
                    "type": "place_item",
                    "id": msg.get("id"),
                    "item_id": msg.get("item_id"),
                    "x": float(msg.get("x", 0)),
                    "y": float(msg.get("y", 0)),
                    "placed_by": uid,
                }, exclude=uid)
            elif msg.get("type") == "remove_item":
                await manager.broadcast(room_id, {
                    "type": "remove_item",
                    "id": msg.get("id"),
                    "removed_by": uid,
                }, exclude=uid)

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(room_id, uid)
        await manager.broadcast(room_id, {"type": "leave", "uid": uid})
