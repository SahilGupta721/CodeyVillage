/**
 * GameScene — main playable scene, top-down RPG village style.
 *
 * Rendering layers (depth order):
 *   2  village RenderTexture  — all tiles drawn once
 *   3  pond TileSprite overlay — animated ripples on the water tiles
 *   5  building gBase         — floor, N/E/W walls, interior, furniture, step mat
 *  20  flowers / ground deco
 *  50  bushes
 *  60  trees
 * 100+ building gSouth        — south wall face, y-sorted
 * 100+ NPCs + player          — y-sorted each frame (100 + y * 0.01)
 * 200  UI overlay
 */

import Phaser from 'phaser';
import { generateIsland } from '../map/IslandGenerator';
import {
  TileType, TILE_SIZE,
  MAP_WIDTH, MAP_HEIGHT,
  WORLD_WIDTH, WORLD_HEIGHT,
  BuildingData, IslandData,
} from '../map/TileTypes';

import { CollisionSystem } from '../systems/CollisionSystem';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';

// ─── Constants ────────────────────────────────────────────────────────────────

const ZOOM = 1.8;
const CAMERA_LERP = 0.09;
const NPC_COUNT = 6;
const ISLAND_SEED = 42;
const WS_BROADCAST_INTERVAL = 50; // ms between position broadcasts

const TILE_COLORS = new Map<TileType, number>([
  [TileType.ROCK, 0x8a8462],
  [TileType.WATER, 0x3898d8],
  [TileType.GRASS, 0x8ec86a],
  [TileType.GRASS_DARK, 0x74ae50],
  [TileType.DIRT_PATH, 0xc09050],
  [TileType.GRAVEL, 0xb8a882],
]);

interface Palette { wall: number; wallDk: number; floor: number; door: number; accent: number; }
const PALETTES: Palette[] = [
  { wall: 0xd4aa74, wallDk: 0x9a7040, floor: 0xeee0c0, door: 0x2a1808, accent: 0xd03020 },
  { wall: 0xe0c090, wallDk: 0xa08050, floor: 0xf0e8d0, door: 0x1a1008, accent: 0x8040c0 },
  { wall: 0xc8b890, wallDk: 0x907860, floor: 0xddd0b8, door: 0x181010, accent: 0x3870c0 },
  { wall: 0xd0c0a0, wallDk: 0x968060, floor: 0xe8dcc8, door: 0x181008, accent: 0x508030 },
  { wall: 0xc8d0b0, wallDk: 0x8a9070, floor: 0xdcd8c0, door: 0x181008, accent: 0xb06030 },
];

// Remote player shirt colours — one per remote player slot
const REMOTE_COLORS = [
  0xe05828, 0x30a840, 0x9030c0, 0xd4a020, 0xd02860, 0x1898c0,
];

// ─── Scene ────────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private island!: IslandData;
  private col!: CollisionSystem;
  private player!: Player;
  private npcs: NPC[] = [];
  private pondAnims: Phaser.GameObjects.TileSprite[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private minZoom = 0.3;
  private readonly maxZoom = 4.0;
  private readonly zoomStep = 0.35;

  // ─── Multiplayer ───────────────────────────────────────────────────────────
  private socket: WebSocket | null = null;
  private remotePlayers: Map<string, { container: Phaser.GameObjects.Container; targetX: number; targetY: number }> = new Map();
  private remoteColorMap: Map<string, number> = new Map();
  private myUid: string | null = null;
  private lastBroadcast: number = 0;
  private lastSentX: number = 0;
  private lastSentY: number = 0;

  constructor() { super({ key: 'GameScene' }); }

  // ─── create ───────────────────────────────────────────────────────────────

  create(): void {
    this.island = generateIsland(ISLAND_SEED);
    this.col = new CollisionSystem(this.island.tiles, this.island.buildings);

    this.buildTileLayer();
    this.addPondOverlay();
    this.placeDecorations();
    this.island.buildings.forEach(b => this.drawBuilding(b));
    this.spawnNPCs();

    const sp = this.pickSpawn(Math.floor(this.island.spawnPoints.length * 0.45));
    this.player = new Player(this, sp.x, sp.y);

    // Show our own name above our character so other players (and we) can
    // identify who is who.
    const myUid = this.game.registry.get('uid') as string | null;
    const myName = (this.game.registry.get('username') as string | null)
      ?? myUid?.slice(0, 6)
      ?? 'You';
    this.player.setLabel(this, myName + ' (you)');

    this.minZoom = Math.min(
      this.scale.width / WORLD_WIDTH,
      this.scale.height / WORLD_HEIGHT,
    );

    this.cameras.main
      .setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
      .setZoom(Math.max(ZOOM, this.minZoom))
      .startFollow(this.player.getContainer(), true, CAMERA_LERP, CAMERA_LERP)
      .setBackgroundColor('#3898d8');

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.add.text(12, 12, 'WASD / Arrow Keys to move', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 8, y: 5 },
    }).setScrollFactor(0).setDepth(200);

    // Connect multiplayer after everything is ready
    this.connectMultiplayer();
  }

  // ─── update ───────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    for (const s of this.pondAnims) {
      s.tilePositionX += 0.25;
      s.tilePositionY += 0.10;
    }

    this.player.update(delta, this.cursors, this.wasd, this.col);
    for (const npc of this.npcs) npc.update(delta, this.col);

    // Lerp remote players toward their target position every frame for smooth movement
    for (const rp of this.remotePlayers.values()) {
      rp.container.x = Phaser.Math.Linear(rp.container.x, rp.targetX, 0.2);
      rp.container.y = Phaser.Math.Linear(rp.container.y, rp.targetY, 0.2);
      rp.container.setDepth(100 + rp.container.y * 0.01);
    }

    // Broadcast position at a throttled rate, only when moved
    if (time - this.lastBroadcast > WS_BROADCAST_INTERVAL) {
      this.broadcastPosition();
      this.lastBroadcast = time;
    }
  }

  // ─── Multiplayer ──────────────────────────────────────────────────────────

  private connectMultiplayer(): void {
    const roomId = this.game.registry.get('roomId') as string | null;
    const uid = this.game.registry.get('uid') as string | null;
    if (!roomId || !uid) {
      console.log('No roomId or uid — running in single-player mode');
      return;
    }

    this.myUid = uid;
    const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000';
    const wsUrl = `${wsBase}/ws/${roomId}/${uid}`;
    console.log('Connecting to', wsUrl);

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
<<<<<<< Updated upstream
        if (msg.type === 'move') this.updateRemotePlayer(msg.uid, msg.x, msg.y, msg.username);
        if (msg.type === 'leave') this.removeRemotePlayer(msg.uid);
        if (msg.type === 'room_state') {
          for (const p of (msg.players ?? [])) {
            if (p.uid !== this.myUid) this.updateRemotePlayer(p.uid, p.x, p.y, p.username);
          }
        }
        if (msg.type === 'player_joined' && msg.uid !== this.myUid) {
          this.updateRemotePlayer(msg.uid, msg.x, msg.y, msg.username);
=======
        if (msg.type === 'move') {
          this.updateRemotePlayer(msg.uid, msg.x, msg.y, msg.username);
        } else if (msg.type === 'presence' && Array.isArray(msg.players)) {
          // Snapshot of players already in the room when we joined.
          for (const p of msg.players) {
            this.updateRemotePlayer(p.uid, p.x, p.y, p.username);
          }
        } else if (msg.type === 'leave') {
          this.removeRemotePlayer(msg.uid);
>>>>>>> Stashed changes
        }
      } catch (e) {
        console.warn('Bad WS message', event.data);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    this.socket.onerror = (e) => {
      console.error('WebSocket error', e);
    };

    // Clean up on scene shutdown
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.socket?.close();
      this.socket = null;
    });
  }

  private broadcastPosition(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const x = this.player.x;
    const y = this.player.y;
    if (Math.abs(x - this.lastSentX) < 2 && Math.abs(y - this.lastSentY) < 2) return;
    this.lastSentX = x;
    this.lastSentY = y;
    const username = this.game.registry.get('username') as string | null;
    this.socket.send(JSON.stringify({
      type: 'move',
      x,
      y,
      username: username ?? this.myUid?.slice(0, 6) ?? '???',
    }));
  }

  private updateRemotePlayer(uid: string, x: number, y: number, username?: string): void {
    if (uid === this.myUid) return;

    if (!this.remotePlayers.has(uid)) {
      // Assign a stable colour per uid
      const colorIdx = this.remoteColorMap.size % REMOTE_COLORS.length;
      this.remoteColorMap.set(uid, REMOTE_COLORS[colorIdx]);
      const shirt = REMOTE_COLORS[colorIdx];

      // Draw a player-shaped avatar matching the local player art
      const g = this.add.graphics();

      // Shadow
      g.fillStyle(0x000000, 0.26);
      g.fillRect(-7, 4, 14, 5);

      // Legs
      g.fillStyle(0x1e2860);
      g.fillRect(-5, 6, 4, 5);
      g.fillRect(2, 6, 4, 5);

      // Shirt (unique colour per remote player)
      g.fillStyle(shirt);
      g.fillRect(-6, -2, 12, 8);

      // Shirt highlight
      g.fillStyle(0xffffff, 0.22);
      g.fillRect(-5, -2, 3, 8);

      // Head
      g.fillStyle(0xf0c890);
      g.fillRect(-5, -9, 10, 7);

      // Eyes
      g.fillStyle(0x080408);
      g.fillRect(-3, -5, 2, 2);
      g.fillRect(2, -5, 2, 2);

      // Hat
      g.fillStyle(0x1e3070);
      g.fillRect(-6, -9, 12, 3);
      g.fillStyle(0x4060a8);
      g.fillRect(-6, -9, 12, 1);

      // Username label above head
      const label = this.add.text(0, -22, username ?? uid.slice(0, 6), {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 3, y: 2 },
      }).setOrigin(0.5);

      const container = this.add.container(x, y, [g, label]);
      container.setDepth(100 + y * 0.01);
      this.remotePlayers.set(uid, { container, targetX: x, targetY: y });
    } else {
      const rp = this.remotePlayers.get(uid)!;
      rp.targetX = x;
      rp.targetY = y;
    }
  }

  private removeRemotePlayer(uid: string): void {
    const rp = this.remotePlayers.get(uid);
    if (rp) {
      rp.container.destroy();
      this.remotePlayers.delete(uid);
      this.remoteColorMap.delete(uid);
    }
  }

  // ─── Tile layer ───────────────────────────────────────────────────────────

  private buildTileLayer(): void {
    const rt = this.add.renderTexture(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
      .setOrigin(0, 0).setDepth(2);
    const gfx = this.add.graphics();

    for (const [type, color] of TILE_COLORS) {
      gfx.clear();
      gfx.fillStyle(color);
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          if (this.island.tiles[y][x] === type) {
            gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
      rt.draw(gfx);
    }

    this.detailGrass(rt, gfx);
    this.detailRock(rt, gfx);
    this.detailPath(rt, gfx);
    this.detailWaterEdge(rt, gfx);
    this.detailGravel(rt, gfx);

    gfx.destroy();
  }

  private detailGrass(rt: Phaser.GameObjects.RenderTexture, gfx: Phaser.GameObjects.Graphics): void {
    const TS = TILE_SIZE;
    gfx.clear();
    gfx.fillStyle(0x4a8a18, 0.40);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const t = this.island.tiles[y][x];
        if (t !== TileType.GRASS && t !== TileType.GRASS_DARK) continue;
        const h = ((x * 7 + y * 13) ^ (x * 3)) % 9;
        if (h === 0) { gfx.fillRect(x * TS + 4, y * TS + 4, 2, 2); gfx.fillRect(x * TS + 20, y * TS + 18, 2, 2); }
        if (h === 1) { gfx.fillRect(x * TS + 14, y * TS + 8, 2, 2); gfx.fillRect(x * TS + 6, y * TS + 22, 2, 2); }
        if (h === 2) { gfx.fillRect(x * TS + 26, y * TS + 6, 2, 2); gfx.fillRect(x * TS + 10, y * TS + 26, 2, 2); }
        if (h === 5) { gfx.fillRect(x * TS + 8, y * TS + 16, 2, 2); gfx.fillRect(x * TS + 22, y * TS + 10, 2, 2); }
      }
    }
    rt.draw(gfx);
  }

  private detailRock(rt: Phaser.GameObjects.RenderTexture, gfx: Phaser.GameObjects.Graphics): void {
    const TS = TILE_SIZE;
    gfx.clear();
    gfx.fillStyle(0x585840, 0.55);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.ROCK) continue;
        const h = ((x * 7 + y * 13) ^ (x * 3)) % 12;
        if (h === 0) gfx.fillRect(x * TS + 4, y * TS + 10, 10, 2);
        if (h === 1) gfx.fillRect(x * TS + 18, y * TS + 6, 2, 10);
        if (h === 2) gfx.fillRect(x * TS + 8, y * TS + 20, 8, 2);
        if (h === 3) gfx.fillRect(x * TS + 22, y * TS + 14, 2, 8);
        if (h === 4) gfx.fillRect(x * TS + 14, y * TS + 4, 6, 2);
      }
    }
    rt.draw(gfx);
    gfx.clear();
    gfx.fillStyle(0xb0a888, 0.40);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.ROCK) continue;
        const h = ((x * 11 + y * 5) ^ (y * 7)) % 11;
        if (h === 0) gfx.fillRect(x * TS + 6, y * TS + 4, 6, 3);
        if (h === 2) gfx.fillRect(x * TS + 20, y * TS + 16, 4, 3);
        if (h === 5) gfx.fillRect(x * TS + 10, y * TS + 24, 6, 3);
      }
    }
    rt.draw(gfx);
  }

  private detailPath(rt: Phaser.GameObjects.RenderTexture, gfx: Phaser.GameObjects.Graphics): void {
    const TS = TILE_SIZE;
    gfx.clear();
    gfx.fillStyle(0x9a7030, 0.38);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.DIRT_PATH) continue;
        gfx.fillRect(x * TS, y * TS, TS, 1);
        gfx.fillRect(x * TS, y * TS, 1, TS);
      }
    }
    rt.draw(gfx);
  }

  private detailWaterEdge(rt: Phaser.GameObjects.RenderTexture, gfx: Phaser.GameObjects.Graphics): void {
    const TS = TILE_SIZE;
    gfx.clear();
    gfx.fillStyle(0x000000, 0.14);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.WATER) continue;
        if (this.island.tiles[y - 1]?.[x] !== TileType.WATER) gfx.fillRect(x * TS, y * TS, TS, 3);
        if (this.island.tiles[y]?.[x - 1] !== TileType.WATER) gfx.fillRect(x * TS, y * TS, 3, TS);
        if (this.island.tiles[y + 1]?.[x] !== TileType.WATER) gfx.fillRect(x * TS, y * TS + TS - 3, TS, 3);
        if (this.island.tiles[y]?.[x + 1] !== TileType.WATER) gfx.fillRect(x * TS + TS - 3, y * TS, 3, TS);
      }
    }
    rt.draw(gfx);
  }

  private detailGravel(rt: Phaser.GameObjects.RenderTexture, gfx: Phaser.GameObjects.Graphics): void {
    const TS = TILE_SIZE;
    gfx.clear();
    gfx.fillStyle(0x8a7858, 0.55);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.GRAVEL) continue;
        const h = ((x * 7 + y * 13) ^ (x * 3)) % 8;
        if (h === 0) { gfx.fillRect(x * TS + 4, y * TS + 6, 4, 3); gfx.fillRect(x * TS + 18, y * TS + 20, 3, 3); }
        if (h === 1) { gfx.fillRect(x * TS + 14, y * TS + 10, 3, 3); gfx.fillRect(x * TS + 8, y * TS + 24, 4, 3); }
        if (h === 2) { gfx.fillRect(x * TS + 22, y * TS + 8, 3, 4); gfx.fillRect(x * TS + 6, y * TS + 18, 3, 3); }
        if (h === 3) { gfx.fillRect(x * TS + 10, y * TS + 4, 5, 3); gfx.fillRect(x * TS + 20, y * TS + 22, 3, 3); }
      }
    }
    rt.draw(gfx);
    gfx.clear();
    gfx.fillStyle(0xd8c8a8, 0.45);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.GRAVEL) continue;
        const h = ((x * 11 + y * 5) ^ (y * 7)) % 10;
        if (h === 0) { gfx.fillRect(x * TS + 6, y * TS + 4, 3, 2); gfx.fillRect(x * TS + 20, y * TS + 16, 3, 2); }
        if (h === 2) { gfx.fillRect(x * TS + 12, y * TS + 22, 4, 2); gfx.fillRect(x * TS + 24, y * TS + 8, 3, 2); }
        if (h === 5) { gfx.fillRect(x * TS + 8, y * TS + 14, 4, 2); gfx.fillRect(x * TS + 16, y * TS + 26, 3, 2); }
      }
    }
    rt.draw(gfx);
  }

  // ─── Animated pond overlay ────────────────────────────────────────────────

  private addPondOverlay(): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.WATER) continue;
        const s = this.add
          .tileSprite(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 'water')
          .setOrigin(0, 0).setDepth(3).setAlpha(0.55);
        this.pondAnims.push(s);
      }
    }
  }

  // ─── Decorations ──────────────────────────────────────────────────────────

  private placeDecorations(): void {
    const TS = TILE_SIZE;
    const blocked = new Set<string>();
    for (const b of this.island.buildings) {
      for (let dy = -2; dy < b.tileH + 3; dy++) {
        for (let dx = -2; dx < b.tileW + 2; dx++) {
          blocked.add(`${b.tileX + dx},${b.tileY + dy}`);
        }
      }
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const t = this.island.tiles[y][x];
        if ((t !== TileType.GRASS && t !== TileType.GRASS_DARK) || blocked.has(`${x},${y}`)) continue;
        const p = (((x * 1664525) ^ (y * 1013904223)) >>> 0) % 100;
        const wx = x * TS + 16;
        const wy = y * TS + 16;
        if (p < 6) this.add.image(wx, wy, 'bush').setOrigin(0.5, 0.60).setDepth(50 + wy * 0.001);
        else if (p < 10) this.add.image(wx, wy, 'flower_r').setOrigin(0.5, 1.00).setDepth(20);
        else if (p < 14) this.add.image(wx, wy, 'flower_y').setOrigin(0.5, 1.00).setDepth(20);
      }
    }
  }

  // ─── Building rendering ───────────────────────────────────────────────────

  private drawBuilding(b: BuildingData): void {
    const TS = TILE_SIZE;
    const px = b.tileX * TS;
    const py = b.tileY * TS;
    const pw = b.tileW * TS;
    const ph = b.tileH * TS;
    const WALL = 6;
    const FACE = 8;
    const pal = PALETTES[b.style];
    const doorW = TS * 2;
    const doorX = px + b.doorOffset * TS;

    const gBase = this.add.graphics();
    gBase.fillStyle(0x000000, 0.20);
    gBase.fillRect(px + 5, py + 6, pw, ph + FACE);
    gBase.fillStyle(pal.wall);
    gBase.fillRect(px, py, pw, ph);
    gBase.fillStyle(pal.accent);
    gBase.fillRect(px + WALL, py, pw - WALL * 2, 3);
    gBase.fillStyle(0xffffff, 0.10);
    gBase.fillRect(px + WALL, py, pw - WALL * 2, WALL);
    gBase.fillStyle(pal.floor);
    gBase.fillRect(px + WALL, py + WALL, pw - WALL * 2, ph - WALL * 2);
    gBase.fillStyle(0x000000, 0.07);
    const floorH = ph - WALL * 2;
    for (let row = 0; row * 8 < floorH; row++) {
      gBase.fillRect(px + WALL, py + WALL + row * 8 + 7, pw - WALL * 2, 1);
    }
    this.drawFurniture(gBase, b, px, py, pw, ph, WALL, pal);
    gBase.lineStyle(1, 0x000000, 0.50);
    gBase.strokeRect(px, py, pw, ph);
    gBase.lineStyle(1, 0x000000, 0.08);
    gBase.strokeRect(px + WALL, py + WALL, pw - WALL * 2, ph - WALL * 2);
    gBase.fillStyle(pal.accent, 0.55);
    gBase.fillRect(doorX + 4, py + ph + FACE, doorW - 8, 5);
    gBase.fillStyle(0x000000, 0.18);
    gBase.fillRect(doorX + 4, py + ph + FACE + 4, doorW - 8, 1);
    gBase.setDepth(5);

    const gSouth = this.add.graphics();
    const leftW = doorX - px;
    if (leftW > 0) {
      gSouth.fillStyle(pal.wallDk);
      gSouth.fillRect(px, py + ph - WALL, leftW, WALL + FACE);
    }
    const rightX = doorX + doorW;
    const rightW = (px + pw) - rightX;
    if (rightW > 0) {
      gSouth.fillStyle(pal.wallDk);
      gSouth.fillRect(rightX, py + ph - WALL, rightW, WALL + FACE);
    }
    gSouth.fillStyle(pal.floor);
    gSouth.fillRect(doorX, py + ph - WALL, doorW, WALL + FACE);
    gSouth.fillStyle(0x000000, 0.28);
    gSouth.fillRect(px, py + ph - WALL, pw, 2);
    gSouth.fillStyle(pal.accent);
    gSouth.fillRect(doorX - 3, py + ph - WALL - 3, 4, WALL + FACE + 3);
    gSouth.fillRect(doorX + doorW - 1, py + ph - WALL - 3, 4, WALL + FACE + 3);
    gSouth.fillStyle(pal.wallDk, 0.9);
    gSouth.fillRect(px, py + ph - WALL, 5, WALL + FACE);
    gSouth.fillRect(px + pw - 5, py + ph - WALL, 5, WALL + FACE);
    gSouth.lineStyle(1, 0x000000, 0.35);
    gSouth.strokeRect(px, py + ph - WALL, pw, WALL + FACE);
    gSouth.setDepth(100 + (py + ph + FACE) * 0.01);
  }

  private drawFurniture(
    g: Phaser.GameObjects.Graphics,
    b: BuildingData,
    px: number, py: number, pw: number, ph: number,
    WALL: number,
    pal: Palette,
  ): void {
    const ix = px + WALL + 4;
    const iy = py + WALL + 4;
    const iw = pw - WALL * 2 - 8;
    const ih = ph - WALL * 2 - 8;

    switch (b.style % 5) {
      case 0: {
        g.fillStyle(pal.accent, 0.30);
        g.fillRect(ix + Math.floor(iw * 0.20), iy + Math.floor(ih * 0.20), Math.floor(iw * 0.60), Math.floor(ih * 0.55));
        g.fillStyle(0x8a5c2a);
        g.fillRect(ix + Math.floor(iw * 0.28), iy + Math.floor(ih * 0.28), Math.floor(iw * 0.44), Math.floor(ih * 0.38));
        g.fillStyle(0x6a4a20);
        g.fillRect(ix + Math.floor(iw * 0.12), iy + Math.floor(ih * 0.35), 5, 5);
        g.fillRect(ix + Math.floor(iw * 0.78), iy + Math.floor(ih * 0.35), 5, 5);
        break;
      }
      case 1: {
        g.fillStyle(0x8090c0);
        g.fillRect(ix, iy, Math.floor(iw * 0.50), Math.floor(ih * 0.55));
        g.fillStyle(0xf0e8d8);
        g.fillRect(ix + 2, iy + 2, Math.floor(iw * 0.42), Math.floor(ih * 0.18));
        g.fillStyle(0x7a5030);
        g.fillRect(ix + Math.floor(iw * 0.60), iy, Math.floor(iw * 0.38), Math.floor(ih * 0.35));
        break;
      }
      case 2: {
        g.fillStyle(0x9a7040);
        g.fillRect(ix, iy, iw, Math.floor(ih * 0.28));
        g.fillStyle(0xc0a060);
        g.fillRect(ix, iy, iw, 3);
        const itemColors = [0xc03020, 0x208030, 0x2040c0, 0xa06020];
        for (let i = 0; i < 4; i++) {
          g.fillStyle(itemColors[i]);
          g.fillRect(ix + 5 + i * Math.floor(iw / 4.5), iy + 5, 8, 6);
        }
        break;
      }
      case 3: {
        g.fillStyle(0x6a4a20);
        g.fillRect(ix, iy, Math.floor(iw * 0.22), ih);
        const bookColors = [0xc03020, 0x2060a0, 0x208040, 0xa08020, 0x8020a0, 0xc06020];
        for (let i = 0; i < 6; i++) {
          g.fillStyle(bookColors[i % bookColors.length]);
          g.fillRect(ix + 2, iy + 2 + i * Math.floor(ih / 6.5), Math.floor(iw * 0.18), Math.max(4, Math.floor(ih / 7) - 1));
        }
        g.fillStyle(pal.accent, 0.80);
        g.fillRect(ix + Math.floor(iw * 0.50), iy + Math.floor(ih * 0.40), Math.floor(iw * 0.40), Math.floor(ih * 0.40));
        break;
      }
      case 4: {
        g.fillStyle(0x8a5c2a);
        g.fillRect(ix + Math.floor(iw * 0.15), iy + Math.floor(ih * 0.28), Math.floor(iw * 0.70), Math.floor(ih * 0.44));
        g.fillStyle(0x6a4a20);
        for (let i = 0; i < 3; i++) {
          const cx = ix + Math.floor(iw * 0.20) + i * Math.floor(iw * 0.22);
          g.fillRect(cx, iy + Math.floor(ih * 0.08), 5, 5);
          g.fillRect(cx, iy + Math.floor(ih * 0.78), 5, 5);
        }
        break;
      }
    }
  }

  // ─── NPC spawning ─────────────────────────────────────────────────────────

  private spawnNPCs(): void {
    const pts = this.island.spawnPoints;
    if (pts.length === 0) return;
    const step = Math.max(1, Math.floor(pts.length / NPC_COUNT));
    for (let i = 0; i < NPC_COUNT; i++) {
      const pt = pts[(i * step + Math.floor(step * 0.3)) % pts.length];
      this.npcs.push(new NPC(this, pt.x, pt.y, i));
    }
  }

  private pickSpawn(idx: number): { x: number; y: number } {
    const pts = this.island.spawnPoints;
    if (pts.length === 0) return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    return pts[Math.max(0, Math.min(idx, pts.length - 1))];
  }

  // ─── Public zoom API ──────────────────────────────────────────────────────

  zoomIn(): void {
    const cam = this.cameras.main;
    const newZoom = Math.min(cam.zoom + this.zoomStep, this.maxZoom);
    this.tweens.add({ targets: cam, zoom: newZoom, duration: 180, ease: 'Quad.Out' });
  }

  zoomOut(): void {
    const cam = this.cameras.main;
    const newZoom = Math.max(cam.zoom - this.zoomStep, this.minZoom);
    this.tweens.add({ targets: cam, zoom: newZoom, duration: 180, ease: 'Quad.Out' });
  }
}