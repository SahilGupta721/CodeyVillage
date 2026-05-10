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

        # If the same uid is already connected (e.g. user opened a second tab
        # or the previous socket didn't close cleanly), evict the old socket
        # so the new one becomes the canonical connection. Without this the
        # old ws stays in the dict but no broadcasts ever reach it again.
        existing = room.get(uid)
        if existing is not None:
            old_ws = existing.get("ws")
            if old_ws is not None and old_ws is not ws:
                try:
                    await old_ws.close()
                except Exception:
                    pass

        room[uid] = {"ws": ws, "username": uid[:6], "x": 400.0, "y": 400.0}
        return True

    def update(self, room_id: str, uid: str, x: float, y: float, username: str):
        player = self.rooms.get(room_id, {}).get(uid)
        if player:
            player["x"] = x
            player["y"] = y
            player["username"] = username

    def disconnect(self, room_id: str, uid: str, ws: WebSocket | None = None) -> bool:
        """
        Remove a player from the room.

        If `ws` is provided, only remove the entry when it currently belongs
        to that exact websocket. This prevents an evicted (older) socket from
        stomping on a newer reconnect from the same uid.

        Returns True iff an entry was actually removed (i.e. the caller
        should broadcast a "leave" event to the rest of the room).
        """
        room = self.rooms.get(room_id)
        if not room:
            return False
        entry = room.get(uid)
        if entry is None:
            return False
        if ws is not None and entry.get("ws") is not ws:
            # The current entry belongs to a newer connection — leave it alone.
            return False
        room.pop(uid, None)
        if not room:
            del self.rooms[room_id]
        return True

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
        # Only emit "leave" when this socket is actually the active one for
        # `uid`. Otherwise we'd tell everyone a player left every time a tab
        # reconnects, even though a newer socket has already taken over.
        removed = manager.disconnect(room_id, uid, ws)
        if removed:
            await manager.broadcast(room_id, {"type": "leave", "uid": uid})
