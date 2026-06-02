/**
 * GameScene — main playable scene, top-down RPG village style.
 *
 * Rendering layers (depth order):
 *   2  village RenderTexture  — all tiles drawn once
 *   3  pond TileSprite overlay — animated ripples on the water tiles
 *   4  rain ripples on water   — expanding circles on pond surface during rain
 *   5  building gBase         — floor, N/E/W walls, interior, furniture, step mat
 *  20  flowers / ground deco
 *  50  bushes
 *  60  trees
 * 100+ building gSouth        — south wall face, y-sorted
 * 100+ NPCs + player          — y-sorted each frame (100 + y * 0.01)
 * 190  night overlay RenderTexture
 * 191  firefly glow (additive blend)
 * 192  firefly bodies
 * 193  rain drops              — diagonal streaks, masked by building footprint indoors
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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

// Visual depth of placed shop items, y-sorted so taller props occlude correctly.
const PLACED_ITEM_DEPTH_BASE = 60;
// Items that emit light — world-space radius of the illuminated circle (px).
// buildingFill: when placed inside a building, expand the light to cover the full interior.
// buildingEraseAlpha: how completely the building darkness is erased (1 = fully lit, <1 = dimmer).
// buildingTintAlpha: strength of the warm tint when filling a building interior.
const LIGHT_SOURCES: Record<string, {
  worldRadius: number; yOffset: number; tint?: number; tintAlpha?: number;
  buildingFill?: boolean; buildingEraseAlpha?: number; buildingTintAlpha?: number;
}> = {
  'candle-set':    { worldRadius: 96,  yOffset: -10, buildingFill: true, buildingEraseAlpha: 0.82, buildingTintAlpha: 0.28 },
  'fairy-lantern': { worldRadius: 144, yOffset: -14, buildingFill: true, buildingEraseAlpha: 1.0,  buildingTintAlpha: 0.28 },
  'arcade-machine': { worldRadius: 40, yOffset: -7, tint: 0x4488ff, tintAlpha: 0.18 },
};

// Texture key per shop item — used by both the ghost preview and the
// permanent sprite that gets dropped on the map.
const SHOP_ITEM_TEXTURES: Record<string, string> = {
  tree: 'tree',
  'wooden-chair': 'wooden-chair',
  'cozy-sofa': 'cozy-sofa',
  'oak-dresser': 'oak-dresser',
  'feather-bed': 'feather-bed',
  'pine-table': 'pine-table',
  'rocking-chair': 'rocking-chair',
  'potted-fern': 'potted-fern',
  'candle-set': 'candle-set',
  'hanging-vine': 'hanging-vine',
  'woven-rug': 'woven-rug',
  'flower-basket': 'flower-basket',
  'carved-door': 'carved-door',
  'cobble-wall': 'cobble-wall',
  'wooden-arch': 'wooden-arch',
  'fence-post': 'fence-post',
  'garden-gate': 'garden-gate',
  'fairy-lantern': 'fairy-lantern',
  'moon-crystal': 'moon-crystal',
  'mystic-orb': 'mystic-orb',
  'enchanted-bonsai': 'enchanted-bonsai',
  'star-fragment': 'star-fragment',
  'spirit-bells': 'spirit-bells',
  'arcade-machine': 'arcade-machine',
  'chess-board': 'chess-board',
  'work-desk': 'work-desk',
  'office-chair': 'office-chair',
};

const TILE_COLORS = new Map<TileType, number>([
  [TileType.ROCK, 0xC8A45A],  // warm packed sand
  [TileType.WATER, 0x3898d8],
  [TileType.GRASS, 0x5DBB3F],  // Stardew bright mid-green
  [TileType.GRASS_DARK, 0x2D6B4A],  // deep teal-green shadow grass
  [TileType.DIRT_PATH, 0xBFA882],  // warm sandy earth path
  [TileType.GRAVEL, 0xD4B870],  // lighter golden sand
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

// ─── Rain ─────────────────────────────────────────────────────────────────────

interface RainDrop {
  x: number;     // world X
  y: number;     // world Y
  speed: number; // fall-speed multiplier 0.85–1.15
}

interface RainRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  age: number;
  maxAge: number;
}

// ─── Firefly ──────────────────────────────────────────────────────────────────

interface FireflyData {
  x: number; y: number;
  angle: number;          // heading in radians (Phaser coords: 0=right, π/2=down)
  speed: number;          // px / sec
  flashing: boolean;
  flashTimer: number;     // ms into the current on/off phase
  flashDuration: number;  // how long each flash lasts (ms)
  darkDuration: number;   // dark interval between flashes (ms)
  intensity: number;      // 0-1 glow brightness, sin-eased within the flash
  life: number;           // ms since spawned
  maxLife: number;        // total lifespan (ms)
}

// ─── Scene ────────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private refundHandler: ((amount: number) => void) | null = null;
  private island!: IslandData;
  private col!: CollisionSystem;
  private player!: Player;
  private npcs: NPC[] = [];
  private pondAnims: Phaser.GameObjects.TileSprite[] = [];
  private redFlowers: Phaser.GameObjects.Image[] = [];
  private leafEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
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
  private onlineHud: Phaser.GameObjects.Text | null = null;

  // ─── Shop placement ────────────────────────────────────────────────────────
  private placement: {
    itemId: string;
    pricePaid: number;
    ghost: Phaser.GameObjects.Image;
    valid: boolean;
  } | null = null;
  private eraseMode = false;
  private placedItems = new Map<string, { sprite: Phaser.GameObjects.Image; itemId: string; pricePaid: number }>();
  private carvedDoors = new Map<string, {
    sprite: Phaser.GameObjects.Image;
    entranceTiles: Array<{ tx: number; ty: number }>;
    baseScaleX: number;
    isOpen: boolean;
    tween: Phaser.Tweens.Tween | null;
  }>();
  // Tracks already-rendered placed items so we never double-spawn (e.g. when our
  // own HTTP POST response races with the WS broadcast echo).
  private placedItemIds: Set<string> = new Set();
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  private nightRT: Phaser.GameObjects.RenderTexture | null = null;
  private nightMaskImg: Phaser.GameObjects.Image | null = null;
  private lightSources: Map<string, {
    x: number; y: number; worldRadius: number; yOffset: number;
    tint?: number; tintAlpha?: number; eraseAlpha?: number;
    buildingRect?: { left: number; top: number; width: number; height: number };
    entranceLeak?: { x: number; y: number };
  }> = new Map();
  private buildingLightGfx: Phaser.GameObjects.Graphics | null = null;
  private arcadeScreens: Map<string, { gfx: Phaser.GameObjects.Graphics; timer: number }> = new Map();
  private lastNightCheck = 0;
  private currentNightAlpha = 0;

  // ─── Firefly system ────────────────────────────────────────────────────────
  private fireflyGfx: Phaser.GameObjects.Graphics | null = null;
  private fireflyGlowGfx: Phaser.GameObjects.Graphics | null = null;
  private fireflies: FireflyData[] = [];
  private fireflySpawnCooldown = 0;

  // ─── Rain system ───────────────────────────────────────────────────────────
  private rainGfx: Phaser.GameObjects.Graphics | null = null;
  private rainRippleGfx: Phaser.GameObjects.Graphics | null = null;
  private rainActive = false;
  private rainIntensity = 0;          // 0–1, lerped for smooth fade in/out
  private rainDrops: RainDrop[] = [];
  private rainRipples: RainRipple[] = [];
  private rainRippleTimer = 0;
  private lastRainCheck = -Infinity;
  private cachedWaterTiles: Array<{ x: number; y: number }> = [];

  constructor() { super({ key: 'GameScene' }); }

  // ─── create ───────────────────────────────────────────────────────────────

  create(): void {
    this.island = generateIsland(ISLAND_SEED);
    this.col = new CollisionSystem(this.island.tiles, this.island.buildings);

    this.buildTileLayer();
    this.addGrassDetailSprites();
    this.addFoliageSprites();
    this.addPondOverlay();
    this.placeDecorations();
    this.scheduleNextWind();
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

    this.addLeafParticles();
    this.setupNightCycle();
    this.initFireflies();
    this.initRain();

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

    this.onlineHud = this.add.text(12, 40, 'Online: connecting…', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(200);

    // Connect multiplayer after everything is ready
    this.connectMultiplayer();

    // Shop placement: ESC cancels, left-click confirms, right-click cancels.
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', this.handlePlacementClick, this);

    // Load any items already placed in this room and clean up listeners on shutdown.
    this.loadPlacedItems();
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.handlePlacementClick, this);
      this.cancelPlacement();
    });
  }

  // ─── update ───────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    for (const s of this.pondAnims) {
      s.tilePositionX += 0.25;
      s.tilePositionY += 0.10;
    }

    this.player.update(delta, this.cursors, this.wasd, this.col);
    for (const npc of this.npcs) npc.update(delta, this.col);

    if (this.leafEmitter) {
      const cam = this.cameras.main;
      const viewW = cam.width / cam.zoom;
      this.leafEmitter.setPosition(cam.scrollX + viewW * 0.5, cam.scrollY - 12);
      this.leafEmitter.forEachAlive((p: Phaser.GameObjects.Particles.Particle) => {
        const elapsed = p.life - p.lifeCurrent;
        p.velocityX = Math.sin(elapsed * 0.0015 + p.x * 0.003) * 12;
      }, this);
    }

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

    this.updatePlacementGhost();
    this.updateDoorAnimations();
    this.updateNightOverlay(time);
    this.updateFireflies(delta);
    this.updateRain(time, delta);
    this.updateArcadeScreens(delta);
    if (this.placement && this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.cancelPlacement();
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
      console.log('[multiplayer] WebSocket connected');
      this.refreshOnlineHud();
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'move') {
          this.updateRemotePlayer(msg.uid, msg.x, msg.y, msg.username);
        } else if (msg.type === 'leave') {
          this.removeRemotePlayer(msg.uid);
        } else if (msg.type === 'room_state') {
          console.log('[multiplayer] room_state:', msg.players);
          for (const p of (msg.players ?? [])) {
            if (p.uid !== this.myUid) this.updateRemotePlayer(p.uid, p.x, p.y, p.username);
          }
        } else if (msg.type === 'player_joined' && msg.uid !== this.myUid) {
          console.log('[multiplayer] player_joined:', msg.uid, msg.username);
          this.updateRemotePlayer(msg.uid, msg.x, msg.y, msg.username);
        } else if (msg.type === 'place_item') {
          this.spawnPlacedItem(msg.id, msg.item_id, msg.x, msg.y, msg.price_paid ?? 0, true);
        } else if (msg.type === 'remove_item') {
          this.removePlacedItemVisual(msg.id);
        }
      } catch (e) {
        console.warn('Bad WS message', event.data);
      }
    };

    this.socket.onclose = () => {
      console.log('[multiplayer] WebSocket disconnected');
      if (this.onlineHud?.active) this.onlineHud.setText('Online: disconnected');

    };

    this.socket.onerror = (e) => {
      console.error('[multiplayer] WebSocket error', e);
      if (this.onlineHud) this.onlineHud.setText('Online: error (is the backend running?)');
    }

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
      this.refreshOnlineHud();
    } else {
      const rp = this.remotePlayers.get(uid)!;
      rp.targetX = x;
      rp.targetY = y;
      // Update label if username changed or was missing
      if (username) {
        const label = rp.container.getAt(1) as Phaser.GameObjects.Text;
        if (label && label.setText) label.setText(username);
      }
    }
  }

  private removeRemotePlayer(uid: string): void {
    const rp = this.remotePlayers.get(uid);
    if (rp) {
      rp.container.destroy();
      this.remotePlayers.delete(uid);
      this.remoteColorMap.delete(uid);
      this.refreshOnlineHud();
    }
  }

  private refreshOnlineHud(): void {
    if (!this.onlineHud) return;
    const total = this.remotePlayers.size + 1;
    this.onlineHud.setText(`Online: ${total} player${total === 1 ? '' : 's'}`);
  }

  // ─── Tile layer ───────────────────────────────────────────────────────────

  private buildTileLayer(): void {
    console.log('RenderTexture size:', WORLD_WIDTH, WORLD_HEIGHT); // add this

    const rt = this.add.renderTexture(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
      .setOrigin(0, 0).setDepth(2);
    const gfx = this.add.graphics();

    // Non-grass tiles: single flat fill from TILE_COLORS
    for (const [type, color] of TILE_COLORS) {
      if (type === TileType.GRASS || type === TileType.GRASS_DARK) continue;
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

    // Grass: multi-variant fill then per-variant pixel details + edge shading
    this.drawGrassVariants(rt, gfx);
    this.detailGrass(rt, gfx);
    this.detailRock(rt, gfx);
    this.detailPath(rt, gfx);
    this.detailWaterEdge(rt, gfx);
    this.detailGravel(rt, gfx);

    gfx.destroy();
  }

  private detailGrass(rt: Phaser.GameObjects.RenderTexture, gfx: Phaser.GameObjects.Graphics): void {
    const TS = TILE_SIZE;

    // Variant B: dark blade ticks along the top pixel row of the tile
    gfx.clear();
    gfx.fillStyle(0x3A7A20, 1.0);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.GRASS) continue;
        if (this.grassVariant(x, y) !== 1) continue;
        const bx = x * TS, by = y * TS;
        const h = ((x * 7 + y * 13) ^ (x * 3)) % 4;
        if (h === 0) { gfx.fillRect(bx + 4, by, 1, 2); gfx.fillRect(bx + 14, by, 1, 3); gfx.fillRect(bx + 22, by, 1, 2); }
        if (h === 1) { gfx.fillRect(bx + 6, by, 1, 3); gfx.fillRect(bx + 16, by, 1, 2); gfx.fillRect(bx + 26, by, 1, 3); }
        if (h === 2) { gfx.fillRect(bx + 2, by, 1, 2); gfx.fillRect(bx + 12, by, 1, 3); gfx.fillRect(bx + 24, by, 1, 2); }
        if (h === 3) { gfx.fillRect(bx + 8, by, 1, 3); gfx.fillRect(bx + 18, by, 1, 2); gfx.fillRect(bx + 28, by, 1, 3); }
      }
    }
    rt.draw(gfx);

    // Variant C: bright highlight pixels in top-left corner
    gfx.clear();
    gfx.fillStyle(0xC8E86A, 0.75);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.GRASS) continue;
        if (this.grassVariant(x, y) !== 2) continue;
        const bx = x * TS, by = y * TS;
        gfx.fillRect(bx + 1, by + 1, 5, 1);
        gfx.fillRect(bx + 1, by + 2, 1, 4);
        gfx.fillRect(bx + 3, by + 3, 1, 1);
      }
    }
    rt.draw(gfx);

    // Variant D + GRASS_DARK: deep shadow band bottom-right
    gfx.clear();
    gfx.fillStyle(0x1A3D2A, 0.55);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const t = this.island.tiles[y][x];
        const isD = t === TileType.GRASS_DARK || (t === TileType.GRASS && this.grassVariant(x, y) === 3);
        if (!isD) continue;
        const bx = x * TS, by = y * TS;
        gfx.fillRect(bx, by + TS - 4, TS, 4);
        gfx.fillRect(bx + TS - 4, by, 4, TS - 4);
      }
    }
    rt.draw(gfx);

    // Edge shading: 2px dark border on grass side where it meets non-grass
    gfx.clear();
    gfx.fillStyle(0x3A7A20, 1.0);
    const isGrassTile = (ty: number, tx: number): boolean => {
      const t = this.island.tiles[ty]?.[tx];
      return t === TileType.GRASS || t === TileType.GRASS_DARK;
    };
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (!isGrassTile(y, x)) continue;
        const bx = x * TS, by = y * TS;
        if (!isGrassTile(y, x - 1)) gfx.fillRect(bx, by, 2, TS);
        if (!isGrassTile(y, x + 1)) gfx.fillRect(bx + TS - 2, by, 2, TS);
        if (!isGrassTile(y - 1, x)) gfx.fillRect(bx, by, TS, 2);
        if (!isGrassTile(y + 1, x)) gfx.fillRect(bx, by + TS - 2, TS, 2);
      }
    }
    rt.draw(gfx);
  }

  private detailRock(rt: Phaser.GameObjects.RenderTexture, gfx: Phaser.GameObjects.Graphics): void {
    const TS = TILE_SIZE;

    // Pass 1: lighter sand patch variation (#DDBF70) — ~60% of tiles
    gfx.clear();
    gfx.fillStyle(0xDDBF70, 0.35);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.ROCK) continue;
        const h = ((x * 7 + y * 13) ^ (x * 3)) % 5;
        const bx = x * TS, by = y * TS;
        if (h === 0) gfx.fillRect(bx + 2, by + 2, 14, 12);
        if (h === 1) gfx.fillRect(bx + 16, by + 16, 14, 12);
        if (h === 2) gfx.fillRect(bx + 6, by + 10, 18, 14);
      }
    }
    rt.draw(gfx);

    // Pass 2: darker sand patch variation (#A88040) — ~43% of tiles
    gfx.clear();
    gfx.fillStyle(0xA88040, 0.28);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.ROCK) continue;
        const h = ((x * 11 + y * 7) ^ (x * 5)) % 7;
        const bx = x * TS, by = y * TS;
        if (h === 0) gfx.fillRect(bx + 16, by + 2, 14, 12);
        if (h === 2) gfx.fillRect(bx + 2, by + 18, 12, 12);
        if (h === 4) gfx.fillRect(bx + 20, by + 18, 10, 10);
      }
    }
    rt.draw(gfx);

    // Pass 3: dark sand grain specks — 8 preset scatter patterns (#9A7838)
    gfx.clear();
    gfx.fillStyle(0x9A7838, 0.75);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.ROCK) continue;
        const h = ((x * 7 + y * 13) ^ (x * 3)) % 8;
        const bx = x * TS, by = y * TS;
        if (h === 0) { gfx.fillRect(bx + 5, by + 8, 2, 1); gfx.fillRect(bx + 19, by + 6, 1, 1); gfx.fillRect(bx + 11, by + 22, 2, 1); gfx.fillRect(bx + 25, by + 16, 1, 1); gfx.fillRect(bx + 7, by + 27, 1, 1); }
        if (h === 1) { gfx.fillRect(bx + 3, by + 14, 1, 1); gfx.fillRect(bx + 17, by + 9, 2, 1); gfx.fillRect(bx + 24, by + 24, 1, 1); gfx.fillRect(bx + 9, by + 19, 1, 2); gfx.fillRect(bx + 22, by + 4, 1, 1); }
        if (h === 2) { gfx.fillRect(bx + 8, by + 5, 2, 1); gfx.fillRect(bx + 22, by + 12, 1, 1); gfx.fillRect(bx + 14, by + 20, 1, 2); gfx.fillRect(bx + 4, by + 25, 2, 1); gfx.fillRect(bx + 27, by + 8, 1, 1); }
        if (h === 3) { gfx.fillRect(bx + 12, by + 3, 1, 1); gfx.fillRect(bx + 6, by + 16, 2, 1); gfx.fillRect(bx + 20, by + 20, 1, 1); gfx.fillRect(bx + 26, by + 26, 1, 1); gfx.fillRect(bx + 15, by + 11, 1, 2); }
        if (h === 4) { gfx.fillRect(bx + 4, by + 11, 1, 1); gfx.fillRect(bx + 18, by + 3, 2, 1); gfx.fillRect(bx + 10, by + 24, 1, 1); gfx.fillRect(bx + 24, by + 18, 1, 1); gfx.fillRect(bx + 7, by + 20, 1, 2); }
        if (h === 5) { gfx.fillRect(bx + 16, by + 14, 2, 1); gfx.fillRect(bx + 5, by + 4, 1, 1); gfx.fillRect(bx + 23, by + 7, 1, 1); gfx.fillRect(bx + 12, by + 26, 1, 1); gfx.fillRect(bx + 27, by + 22, 1, 1); }
        if (h === 6) { gfx.fillRect(bx + 9, by + 10, 1, 1); gfx.fillRect(bx + 21, by + 16, 2, 1); gfx.fillRect(bx + 3, by + 22, 1, 1); gfx.fillRect(bx + 25, by + 4, 1, 2); gfx.fillRect(bx + 14, by + 28, 1, 1); }
        if (h === 7) { gfx.fillRect(bx + 6, by + 18, 1, 1); gfx.fillRect(bx + 20, by + 12, 1, 1); gfx.fillRect(bx + 13, by + 5, 2, 1); gfx.fillRect(bx + 28, by + 20, 1, 1); gfx.fillRect(bx + 10, by + 28, 1, 2); }
      }
    }
    rt.draw(gfx);

    // Pass 4: light grain sparkles — sun-catching sand highlights (#EDD890)
    gfx.clear();
    gfx.fillStyle(0xEDD890, 0.70);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.ROCK) continue;
        const h = ((x * 11 + y * 5) ^ (y * 7)) % 8;
        const bx = x * TS, by = y * TS;
        if (h === 0) { gfx.fillRect(bx + 7, by + 6, 1, 1); gfx.fillRect(bx + 22, by + 18, 1, 1); }
        if (h === 1) { gfx.fillRect(bx + 15, by + 10, 1, 1); gfx.fillRect(bx + 5, by + 24, 1, 1); }
        if (h === 2) { gfx.fillRect(bx + 24, by + 5, 1, 1); gfx.fillRect(bx + 10, by + 19, 1, 1); }
        if (h === 3) { gfx.fillRect(bx + 3, by + 17, 1, 1); gfx.fillRect(bx + 20, by + 6, 1, 1); }
        if (h === 4) { gfx.fillRect(bx + 18, by + 24, 1, 1); gfx.fillRect(bx + 8, by + 11, 1, 1); }
        if (h === 5) { gfx.fillRect(bx + 12, by + 28, 1, 1); gfx.fillRect(bx + 26, by + 14, 1, 1); }
        if (h === 6) { gfx.fillRect(bx + 4, by + 7, 1, 1); gfx.fillRect(bx + 23, by + 23, 1, 1); }
        if (h === 7) { gfx.fillRect(bx + 17, by + 3, 1, 1); gfx.fillRect(bx + 9, by + 22, 1, 1); }
      }
    }
    rt.draw(gfx);
  }

  private detailPath(rt: Phaser.GameObjects.RenderTexture, gfx: Phaser.GameObjects.Graphics): void {
    const TS = TILE_SIZE;

    // Pass 1: lighter dry-earth patches
    gfx.clear();
    gfx.fillStyle(0xD4B87A, 0.42);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.DIRT_PATH) continue;
        const h = ((x * 7 + y * 13) ^ (x * 3)) % 5;
        const bx = x * TS, by = y * TS;
        if (h === 0) gfx.fillRect(bx + 4, by + 6, 10, 6);
        if (h === 1) gfx.fillRect(bx + 16, by + 18, 12, 8);
        if (h === 2) gfx.fillRect(bx + 8, by + 20, 14, 6);
      }
    }
    rt.draw(gfx);

    // Pass 2: darker rut/divot lines
    gfx.clear();
    gfx.fillStyle(0x907050, 0.50);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.DIRT_PATH) continue;
        const h = ((x * 11 + y * 7) ^ (x * 5)) % 6;
        const bx = x * TS, by = y * TS;
        if (h === 0) { gfx.fillRect(bx + 4, by + 14, TS - 8, 1); }
        if (h === 2) { gfx.fillRect(bx + 10, by + 8, 1, TS - 16); }
        if (h === 4) { gfx.fillRect(bx + 4, by + 20, TS - 8, 1); gfx.fillRect(bx + 16, by + 4, 1, 16); }
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

    // Pass 1: lighter sand patch variation (#EAD090) — ~60% of tiles
    gfx.clear();
    gfx.fillStyle(0xEAD090, 0.35);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.GRAVEL) continue;
        const h = ((x * 7 + y * 13) ^ (x * 3)) % 5;
        const bx = x * TS, by = y * TS;
        if (h === 0) gfx.fillRect(bx + 4, by + 4, 16, 10);
        if (h === 1) gfx.fillRect(bx + 14, by + 18, 16, 10);
        if (h === 2) gfx.fillRect(bx + 2, by + 12, 20, 12);
      }
    }
    rt.draw(gfx);

    // Pass 2: darker sand patch variation (#B09050) — ~43% of tiles
    gfx.clear();
    gfx.fillStyle(0xB09050, 0.28);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.GRAVEL) continue;
        const h = ((x * 11 + y * 7) ^ (x * 5)) % 7;
        const bx = x * TS, by = y * TS;
        if (h === 0) gfx.fillRect(bx + 18, by + 2, 12, 14);
        if (h === 2) gfx.fillRect(bx + 2, by + 16, 14, 12);
        if (h === 4) gfx.fillRect(bx + 18, by + 20, 10, 8);
      }
    }
    rt.draw(gfx);

    // Pass 3: dark grain specks — offset patterns from ROCK for variety (#A08840)
    gfx.clear();
    gfx.fillStyle(0xA08840, 0.70);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.GRAVEL) continue;
        const h = ((x * 13 + y * 7) ^ (x * 9)) % 8;
        const bx = x * TS, by = y * TS;
        if (h === 0) { gfx.fillRect(bx + 8, by + 4, 1, 1); gfx.fillRect(bx + 22, by + 10, 2, 1); gfx.fillRect(bx + 6, by + 20, 1, 1); gfx.fillRect(bx + 18, by + 26, 1, 1); gfx.fillRect(bx + 27, by + 14, 1, 1); }
        if (h === 1) { gfx.fillRect(bx + 4, by + 9, 2, 1); gfx.fillRect(bx + 14, by + 4, 1, 1); gfx.fillRect(bx + 26, by + 20, 1, 2); gfx.fillRect(bx + 10, by + 26, 1, 1); gfx.fillRect(bx + 20, by + 14, 1, 1); }
        if (h === 2) { gfx.fillRect(bx + 11, by + 18, 1, 1); gfx.fillRect(bx + 23, by + 4, 1, 1); gfx.fillRect(bx + 5, by + 13, 2, 1); gfx.fillRect(bx + 17, by + 24, 1, 1); gfx.fillRect(bx + 28, by + 9, 1, 1); }
        if (h === 3) { gfx.fillRect(bx + 16, by + 7, 1, 1); gfx.fillRect(bx + 3, by + 20, 1, 2); gfx.fillRect(bx + 24, by + 16, 2, 1); gfx.fillRect(bx + 9, by + 28, 1, 1); gfx.fillRect(bx + 21, by + 3, 1, 1); }
        if (h === 4) { gfx.fillRect(bx + 7, by + 15, 1, 1); gfx.fillRect(bx + 19, by + 8, 1, 1); gfx.fillRect(bx + 13, by + 23, 2, 1); gfx.fillRect(bx + 26, by + 28, 1, 1); gfx.fillRect(bx + 3, by + 5, 1, 1); }
        if (h === 5) { gfx.fillRect(bx + 22, by + 22, 1, 1); gfx.fillRect(bx + 9, by + 6, 1, 1); gfx.fillRect(bx + 15, by + 17, 2, 1); gfx.fillRect(bx + 28, by + 4, 1, 1); gfx.fillRect(bx + 5, by + 27, 1, 2); }
        if (h === 6) { gfx.fillRect(bx + 12, by + 12, 2, 1); gfx.fillRect(bx + 24, by + 22, 1, 1); gfx.fillRect(bx + 6, by + 3, 1, 1); gfx.fillRect(bx + 18, by + 18, 1, 1); gfx.fillRect(bx + 28, by + 16, 1, 1); }
        if (h === 7) { gfx.fillRect(bx + 4, by + 24, 1, 1); gfx.fillRect(bx + 16, by + 13, 1, 2); gfx.fillRect(bx + 25, by + 6, 2, 1); gfx.fillRect(bx + 10, by + 10, 1, 1); gfx.fillRect(bx + 22, by + 28, 1, 1); }
      }
    }
    rt.draw(gfx);

    // Pass 4: light grain sparkles (#F0E0A0)
    gfx.clear();
    gfx.fillStyle(0xF0E0A0, 0.65);
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] !== TileType.GRAVEL) continue;
        const h = ((x * 5 + y * 11) ^ (x * 9 + y * 3)) % 8;
        const bx = x * TS, by = y * TS;
        if (h === 0) { gfx.fillRect(bx + 9, by + 3, 1, 1); gfx.fillRect(bx + 21, by + 21, 1, 1); }
        if (h === 1) { gfx.fillRect(bx + 17, by + 13, 1, 1); gfx.fillRect(bx + 4, by + 22, 1, 1); }
        if (h === 2) { gfx.fillRect(bx + 26, by + 8, 1, 1); gfx.fillRect(bx + 11, by + 26, 1, 1); }
        if (h === 3) { gfx.fillRect(bx + 6, by + 18, 1, 1); gfx.fillRect(bx + 23, by + 5, 1, 1); }
        if (h === 4) { gfx.fillRect(bx + 20, by + 27, 1, 1); gfx.fillRect(bx + 7, by + 10, 1, 1); }
        if (h === 5) { gfx.fillRect(bx + 14, by + 22, 1, 1); gfx.fillRect(bx + 27, by + 12, 1, 1); }
        if (h === 6) { gfx.fillRect(bx + 3, by + 8, 1, 1); gfx.fillRect(bx + 24, by + 25, 1, 1); }
        if (h === 7) { gfx.fillRect(bx + 19, by + 4, 1, 1); gfx.fillRect(bx + 8, by + 20, 1, 1); }
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

  // ─── Grass geometry overlay ───────────────────────────────────────────────

  private grassVariant(tx: number, ty: number): number {
    const cx = Math.floor(tx / 3);
    const cy = Math.floor(ty / 3);
    const patch = ((cx * 7 + cy * 13) ^ (cx * 5 + cy * 3)) % 10;
    const base = patch < 5 ? 0 : patch < 7 ? 1 : patch < 9 ? 2 : 3;
    return ((tx * 11 + ty * 7) ^ tx) % 20 === 0 ? (base + 1) % 4 : base;
  }

  private drawGrassVariants(rt: Phaser.GameObjects.RenderTexture, gfx: Phaser.GameObjects.Graphics): void {
    const TS = TILE_SIZE;
    const colors: number[] = [0x5DBB3F, 0x4EA832, 0x72C94F, 0x2D6B4A];
    for (let v = 0; v < 4; v++) {
      gfx.clear();
      gfx.fillStyle(colors[v]);
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const t = this.island.tiles[y][x];
          if (t !== TileType.GRASS && t !== TileType.GRASS_DARK) continue;
          const vt = t === TileType.GRASS_DARK ? 3 : this.grassVariant(x, y);
          if (vt === v) gfx.fillRect(x * TS, y * TS, TS, TS);
        }
      }
      rt.draw(gfx);
    }
  }

  private buildingBlockedSet(): Set<string> {
    const blocked = new Set<string>();
    for (const b of this.island.buildings) {
      for (let dy = -2; dy < b.tileH + 3; dy++) {
        for (let dx = -2; dx < b.tileW + 2; dx++) {
          blocked.add(`${b.tileX + dx},${b.tileY + dy}`);
        }
      }
    }
    return blocked;
  }

  private addGrassDetailSprites(): void {
    const TS = TILE_SIZE;
    const blocked = this.buildingBlockedSet();
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const t = this.island.tiles[y][x];
        if (t !== TileType.GRASS && t !== TileType.GRASS_DARK) continue;
        if (blocked.has(`${x},${y}`)) continue;
        if (this.grassVariant(x, y) === 3) continue;
        const bx = x * TS, by = y * TS;
        const h1 = ((x * 17 + y * 11) ^ (x * 7 + y * 3)) % 9;
        if (h1 === 0) this.add.image(bx + 6, by + 8, 'grass-cross-a').setOrigin(0, 0).setDepth(20);
        if (h1 === 1) this.add.image(bx + 20, by + 14, 'grass-cross-b').setOrigin(0, 0).setDepth(20);
        if (h1 === 2) this.add.image(bx + 9, by + 22, 'grass-cross-a').setOrigin(0, 0).setDepth(20);
        if (h1 === 3) this.add.image(bx + 24, by + 5, 'grass-cross-b').setOrigin(0, 0).setDepth(20);
        const h2 = ((x * 5 + y * 19) ^ (y * 11)) % 12;
        if (h2 === 0) this.add.image(bx + 14, by + 5, 'grass-cross-a').setOrigin(0, 0).setDepth(20);
        if (h2 === 1) this.add.image(bx + 4, by + 20, 'grass-cross-b').setOrigin(0, 0).setDepth(20);
        if (h2 === 2) this.add.image(bx + 22, by + 22, 'grass-cross-a').setOrigin(0, 0).setDepth(20);
      }
    }
  }

  private addFoliageSprites(): void {
    const TS = TILE_SIZE;
    const blocked = this.buildingBlockedSet();
    const isGrass = (ty: number, tx: number): boolean => {
      const t = this.island.tiles[ty]?.[tx];
      return t === TileType.GRASS || t === TileType.GRASS_DARK;
    };
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        if (!isGrass(y, x)) continue;
        if (blocked.has(`${x},${y}`)) continue;
        const onEdge = !isGrass(y - 1, x) || !isGrass(y + 1, x) || !isGrass(y, x - 1) || !isGrass(y, x + 1);
        const h1 = ((x * 19 + y * 23) ^ (x * 5 + y * 7)) % 15;
        if (onEdge && h1 === 0) {
          this.add.image(x * TS + TS / 2, y * TS + TS / 2, 'foliage-cluster').setOrigin(0.5, 0.5).setDepth(48);
        }
        if (!onEdge) {
          const h2 = ((x * 13 + y * 17) ^ (x * 9 + y * 3)) % 35;
          if (h2 === 0) this.add.image(x * TS + TS / 2, y * TS + TS / 2, 'foliage-cluster').setOrigin(0.5, 0.5).setDepth(48);
        }
      }
    }
  }

  // ─── Decorations ──────────────────────────────────────────────────────────

  private placeDecorations(): void {
    const TS = TILE_SIZE;
    const blocked = this.buildingBlockedSet();
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const t = this.island.tiles[y][x];
        if ((t !== TileType.GRASS && t !== TileType.GRASS_DARK) || blocked.has(`${x},${y}`)) continue;
        const p = (((x * 1664525) ^ (y * 1013904223)) >>> 0) % 100;
        const wx = x * TS + 16;
        const wy = y * TS + 16;
        if (p < 6) this.add.image(wx, wy, 'bush').setOrigin(0.5, 0.50).setDepth(50 + wy * 0.001);
        else if (p < 10) this.redFlowers.push(this.add.image(wx, wy, 'flower_r').setOrigin(0.5, 1.00).setDepth(20));
        else if (p < 14) this.add.image(wx, wy, 'flower_y').setOrigin(0.5, 1.00).setDepth(20);
        else if (p < 18) {
          // Rock visual center is ~8px above the anchor; radius matches the stone mass (~10px).
          this.col.addRockObstacle(wx, wy - 8, 10);
          this.add.image(wx, wy, 'rock_sm').setOrigin(0.5, 0.78).setDepth(50 + wy * 0.001);
        }
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

  // ─── Wind effect ──────────────────────────────────────────────────────────

  private scheduleNextWind(): void {
    this.time.delayedCall(Phaser.Math.Between(3000, 9000), () => {
      this.triggerWind();
      this.scheduleNextWind();
    });
  }

  private triggerWind(): void {
    if (this.redFlowers.length === 0) return;

    const windRight = Math.random() > 0.5;
    const bendAngle = (windRight ? 1 : -1) * (0.07 + Math.random() * 0.06);

    const affected = this.redFlowers
      .filter(() => Math.random() < 0.55)
      .sort((a, b) => windRight ? a.x - b.x : b.x - a.x);

    affected.forEach((flower, i) => {
      this.time.delayedCall(i * 25, () => {
        const angle = bendAngle + (Math.random() - 0.5) * 0.03;
        this.tweens.chain({
          targets: flower,
          tweens: [
            { rotation: angle, duration: 180, ease: 'Sine.easeOut' },
            { rotation: angle * -0.35, duration: 140, ease: 'Sine.easeInOut' },
            { rotation: 0, duration: 220, ease: 'Sine.easeOut' },
          ],
        });
      });
    });
  }

  // ─── Leaf ambient particles ───────────────────────────────────────────────

  private addLeafParticles(): void {
    const cam = this.cameras.main;
    const viewW = cam.width / cam.zoom;

    this.leafEmitter = this.add.particles(
      cam.scrollX + viewW * 0.5,
      cam.scrollY - 12,
      'leaf',
      {
        x: { min: -viewW * 0.5 - 32, max: viewW * 0.5 + 32 },
        y: 0,
        speedX: { min: -8, max: 8 },
        speedY: { min: 18, max: 36 },
        lifespan: { min: 8000, max: 13000 },
        frequency: 1800,
        quantity: 1,
        alpha: 0.50,
        rotate: { min: 0, max: 360 },
        scale: { min: 0.6, max: 1.1 },
        tint: [0x70c840, 0x8cd040, 0xc8a820, 0xd07010],
      },
    ).setDepth(25);
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

  // ─── Shop placement: public API ───────────────────────────────────────────

  /**
   * Begin placement mode for a shop item. A semi-transparent ghost sprite
   * follows the cursor until the player either clicks a valid tile (which
   * "drops" the item permanently) or cancels with right-click / ESC.
   *
   * Called from React via the parent PhaserGame's onBuy handler.
   */
  enterPlacementMode(itemId: string, pricePaid: number): void {
    const tex = SHOP_ITEM_TEXTURES[itemId];
    if (!tex) {
      console.warn(`No placement sprite registered for shop item "${itemId}"`);
      return;
    }
    // If switching items mid-placement, clean up the previous ghost first.
    this.cancelPlacement();

    const ghost = this.add.image(-9999, -9999, tex)
      .setOrigin(0.5, 0.7)
      .setAlpha(0.65)
      .setDepth(9999); // always on top while previewing

    this.eraseMode = false;
    this.placement = { itemId, pricePaid, ghost, valid: false };
  }

  toggleEraseMode(): void {
    this.eraseMode = !this.eraseMode;
    if (this.eraseMode) this.cancelPlacement();
    this.add.text(12, 34, this.eraseMode ? 'ERASE MODE ON' : 'ERASE MODE OFF', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: this.eraseMode ? '#8a2020cc' : '#1f4f1fcc',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(210).setAlpha(0.9).setName('erase-toast');
    this.time.delayedCall(900, () => {
      const toast = this.children.getByName('erase-toast');
      toast?.destroy();
    });
  }

  setRefundHandler(handler: (amount: number) => void): void {
    this.refundHandler = handler;
  }

  // ─── Shop placement: internals ────────────────────────────────────────────

  private cancelPlacement(): void {
    if (!this.placement) return;
    this.placement.ghost.destroy();
    this.placement = null;
  }

  /** Snap a world coordinate to the centre of its containing tile. */
  private snapToTileCentre(wx: number, wy: number): { x: number; y: number; tx: number; ty: number } {
    const tx = Math.floor(wx / TILE_SIZE);
    const ty = Math.floor(wy / TILE_SIZE);
    return {
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      tx,
      ty,
    };
  }

  private updatePlacementGhost(): void {
    if (!this.placement) return;

    const pointer = this.input.activePointer;
    const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;

    if (this.placement.itemId === 'carved-door') {
      const entrance = this.findNearestEntrance(world.x, world.y);
      if (entrance) {
        this.placement.ghost.setPosition(entrance.x, entrance.y);
        // Mirror for right-half (baseScaleX -1) so knob preview faces inward.
        this.placement.ghost.setScale(entrance.baseScaleX, 14 / TILE_SIZE);
        this.placement.valid = true;
        this.placement.ghost.clearTint();
        this.placement.ghost.setAlpha(0.7);
      } else {
        this.placement.ghost.setPosition(world.x, world.y);
        this.placement.ghost.setScale(1, 14 / TILE_SIZE);
        this.placement.valid = false;
        this.placement.ghost.setTint(0xff5050);
        this.placement.ghost.setAlpha(0.45);
      }
      return;
    }

    const building = this.findBuildingAt(world.x, world.y);
    if (building) {
      // Inside a building: snap to a half-tile (16 px) grid for finer control,
      // then verify the sprite's pixel bounds stay inside the visible wall edges.
      const HALF = TILE_SIZE / 2;
      const sx = Math.round(world.x / HALF) * HALF;
      const sy = Math.round(world.y / HALF) * HALF;
      this.placement.ghost.setPosition(sx, sy);
      this.placement.ghost.setScale(1, 1);
      const valid = this.canPlaceInsideBuilding(sx, sy, building);
      this.placement.valid = valid;
      this.placement.ghost.setTint(valid ? 0xffffff : 0xff5050);
      this.placement.ghost.setAlpha(valid ? 0.7 : 0.45);
    } else {
      const snapped = this.snapToTileCentre(world.x, world.y);
      this.placement.ghost.setPosition(snapped.x, snapped.y);
      this.placement.ghost.setScale(1, 1);
      const valid = this.col.isTileWalkable(snapped.tx, snapped.ty);
      this.placement.valid = valid;
      this.placement.ghost.setTint(valid ? 0xffffff : 0xff5050);
      this.placement.ghost.setAlpha(valid ? 0.7 : 0.45);
    }
  }

  private handlePlacementClick(pointer: Phaser.Input.Pointer): void {
    if (!this.placement) return;

    // Right-click cancels — matches the Clash-of-Clans-style flow.
    if (pointer.rightButtonDown()) {
      this.cancelPlacement();
      return;
    }

    if (!this.placement.valid) return;

    let x: number, y: number;
    if (this.placement.itemId === 'carved-door') {
      const entrance = this.findNearestEntrance(pointer.worldX, pointer.worldY);
      if (!entrance) { this.cancelPlacement(); return; }
      x = entrance.x;
      y = entrance.y;
    } else {
      // Ghost is already snapped correctly (tile-centre outdoors, half-tile indoors).
      x = this.placement.ghost.x;
      y = this.placement.ghost.y;
    }
    const itemId = this.placement.itemId;
    const pricePaid = this.placement.pricePaid;

    // Render immediately for instant feedback, then persist + broadcast.
    // Use a temporary local id; the server will assign the canonical one.
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.spawnPlacedItem(tempId, itemId, x, y, pricePaid, true);

    this.cancelPlacement();
    void this.persistPlacedItem(tempId, itemId, x, y, pricePaid);
  }

  /** Brief sparkle burst + rising smoke puff at (x, y) when an item is placed. */
  private playPlacementEffects(x: number, y: number): void {
    const depth = PLACED_ITEM_DEPTH_BASE + y * 0.001 + 1;

    const sparkle = this.add.particles(x, y, 'sparkle', {
      emitting: false,
      quantity: 8,
      speed: { min: 30, max: 75 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.1, end: 0 },
      alpha: { start: 1.0, end: 0 },
      lifespan: 400,
      tint: [0xFFFFFF, 0xFFEE88, 0xFFDDFF, 0xAAEEFF],
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(depth);
    sparkle.explode(8);
    this.time.delayedCall(480, () => sparkle.destroy());

    const smoke = this.add.particles(x, y + 8, 'smoke-puff', {
      emitting: false,
      quantity: 5,
      speedX: { min: -14, max: 14 },
      speedY: { min: -32, max: -12 },
      scale: { start: 0.5, end: 1.5 },
      alpha: { start: 0.50, end: 0 },
      lifespan: 580,
      tint: [0xC8C8D8, 0xB8B8D0, 0xE0E0EC],
    }).setDepth(depth - 0.5);
    smoke.explode(5);
    this.time.delayedCall(660, () => smoke.destroy());
  }

  /** Spawn a placed item sprite. Idempotent — duplicate ids are ignored. */
  private spawnPlacedItem(id: string | undefined, itemId: string, x: number, y: number, pricePaid: number, showEffect = false): void {
    if (id && this.placedItemIds.has(id)) return;
    const tex = SHOP_ITEM_TEXTURES[itemId];
    if (!tex) return;

    const sprite = this.add.image(x, y, tex)
      .setOrigin(0.5, 0.7)
      .setDepth(PLACED_ITEM_DEPTH_BASE + y * 0.001);
    if (itemId === 'cobble-wall') {
      sprite.postFX.addShadow(1, 5, 0.005, 1.2, 0x000000, 10, 0.85);
    }
    if (itemId === 'carved-door') {
      // Determine which entrance half this door is on by checking whether its tile
      // is the right tile (c1) of any building entrance — if so, flip it so the
      // doorknob (at x=20 in the 32px sprite) faces inward toward the centre.
      const dtx = Math.floor(x / TILE_SIZE);
      const dty = Math.floor(y / TILE_SIZE);
      const eTiles = this.getEntranceTilesForDoor(dtx, dty);
      const isRight = eTiles.length >= 2 && dtx === eTiles[1].tx;
      const doorScaleX: 1 | -1 = isRight ? -1 : 1;
      // Each half covers one tile wide × 14px tall (WALL=6 + FACE=8).
      // Depth sits above gSouth so the door is visible in the opening.
      sprite.setScale(doorScaleX, 14 / TILE_SIZE);
      sprite.setDepth(100 + (y + 9) * 0.01);
    }
    if (id) sprite.setData('placedId', id);
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => {
      if (!this.eraseMode) return;
      const currentId = sprite.getData('placedId') as string | undefined;
      if (!currentId) return;
      void this.erasePlacedItem(currentId);
    });

    if (id) {
      this.placedItemIds.add(id);
      this.placedItems.set(id, { sprite, itemId, pricePaid });
      if (itemId === 'carved-door') {
        const dtx = Math.floor(x / TILE_SIZE);
        const dty = Math.floor(y / TILE_SIZE);
        const eTiles = this.getEntranceTilesForDoor(dtx, dty);
        const isRight = eTiles.length >= 2 && dtx === eTiles[1].tx;
        this.carvedDoors.set(id, {
          sprite,
          entranceTiles: eTiles,
          baseScaleX: isRight ? -1 : 1,
          isOpen: false,
          tween: null,
        });
      }
    }

    if (showEffect) this.playPlacementEffects(x, y);

    // Register light sources so updateNightOverlay can punch holes in the darkness.
    const lightCfg = LIGHT_SOURCES[itemId];
    if (lightCfg && id) {
      let eraseAlpha = 1.0;
      let tintAlpha = lightCfg.tintAlpha;
      let buildingRect: { left: number; top: number; width: number; height: number } | undefined;
      let entranceLeak: { x: number; y: number } | undefined;

      if (lightCfg.buildingFill) {
        const b = this.findBuildingAt(x, y);
        if (b) {
          // When indoors, store the building's interior rect so updateNightOverlay
          // can erase exactly that rectangle — no circular spill through walls.
          const WALL = 6;
          buildingRect = {
            left:   b.tileX * TILE_SIZE + WALL,
            top:    b.tileY * TILE_SIZE + WALL,
            width:  b.tileW * TILE_SIZE - WALL * 2,
            height: b.tileH * TILE_SIZE - WALL * 2,
          };
          eraseAlpha = lightCfg.buildingEraseAlpha ?? 1.0;
          tintAlpha  = lightCfg.buildingTintAlpha  ?? tintAlpha;
          // Leak point: centre of the 2-tile entrance, at the south wall edge.
          // The circular gradient is centred here so it fans outward naturally —
          // its bright core overlaps the already-lit interior (no effect there)
          // and the fade zone spills onto the ground just outside the doorway.
          entranceLeak = {
            x: (b.tileX + b.doorOffset + 1) * TILE_SIZE,
            y: (b.tileY + b.tileH) * TILE_SIZE,
          };
        }
      }

      this.lightSources.set(id, {
        x, y, worldRadius: lightCfg.worldRadius, yOffset: lightCfg.yOffset,
        tint: lightCfg.tint, tintAlpha, eraseAlpha, buildingRect, entranceLeak,
      });
    }
    if (itemId === 'arcade-machine' && id) {
      const depth = PLACED_ITEM_DEPTH_BASE + y * 0.001 + 0.5;
      const gfx = this.add.graphics().setPosition(x, y).setDepth(depth);
      this.arcadeScreens.set(id, { gfx, timer: 0 });
    }
  }

  private async loadPlacedItems(): Promise<void> {
    const roomId = this.game.registry.get('roomId') as string | null;
    if (!roomId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/island/${encodeURIComponent(roomId)}`);
      if (!res.ok) return;
      const data = await res.json();
      for (const item of (data.placed_items ?? [])) {
        this.spawnPlacedItem(item.id, item.item_id, item.x, item.y, item.price_paid ?? 0);
      }
    } catch (e) {
      console.warn('Failed to load placed items', e);
    }
  }

  private async persistPlacedItem(
    tempId: string,
    itemId: string,
    x: number,
    y: number,
    pricePaid: number,
  ): Promise<void> {
    const roomId = this.game.registry.get('roomId') as string | null;
    if (!roomId) return;
    const uid = this.game.registry.get('uid') as string | null;

    let serverId: string | null = null;
    try {
      const res = await fetch(`${BACKEND_URL}/island/${encodeURIComponent(roomId)}/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, x, y, placed_by: uid, price_paid: pricePaid }),
      });
      if (res.ok) {
        const saved = await res.json();
        serverId = saved.id ?? null;
        // Re-key the local sprite under the canonical server id so any later
        // WS echo (or a refresh) doesn't try to render it a second time.
        if (serverId) {
          this.placedItemIds.delete(tempId);
          this.placedItemIds.add(serverId);
          const local = this.placedItems.get(tempId);
          if (local) {
            local.sprite.setData('placedId', serverId);
            this.placedItems.delete(tempId);
            this.placedItems.set(serverId, local);
          }
          const door = this.carvedDoors.get(tempId);
          if (door) {
            this.carvedDoors.delete(tempId);
            this.carvedDoors.set(serverId, door);
          }
          const light = this.lightSources.get(tempId);
          if (light) {
            this.lightSources.delete(tempId);
            this.lightSources.set(serverId, light);
          }
          const screen = this.arcadeScreens.get(tempId);
          if (screen) {
            this.arcadeScreens.delete(tempId);
            this.arcadeScreens.set(serverId, screen);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to persist placed item', e);
    }

    // Live-broadcast to others currently in the room.
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'place_item',
        id: serverId ?? tempId,
        item_id: itemId,
        x,
        y,
        price_paid: pricePaid,
      }));
    }
  }

  private removePlacedItemVisual(id: string): void {
    const item = this.placedItems.get(id);
    if (!item) return;
    item.sprite.destroy();
    this.placedItems.delete(id);
    this.placedItemIds.delete(id);
    this.carvedDoors.delete(id);
    this.lightSources.delete(id);
    const screen = this.arcadeScreens.get(id);
    if (screen) { screen.gfx.destroy(); this.arcadeScreens.delete(id); }
  }

  private async erasePlacedItem(id: string): Promise<void> {
    const roomId = this.game.registry.get('roomId') as string | null;
    const uid = this.game.registry.get('uid') as string | null;
    if (!roomId) return;

    try {
      const res = await fetch(
        `${BACKEND_URL}/island/${encodeURIComponent(roomId)}/items/${encodeURIComponent(id)}?user_id=${encodeURIComponent(uid ?? '')}`,
        { method: 'DELETE' },
      );
      if (!res.ok) return;
      const data = await res.json();
      this.removePlacedItemVisual(id);
      const refund = Number(data.refund_amount ?? 0);
      if (refund > 0) this.refundHandler?.(refund);

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'remove_item', id }));
      }
    } catch (e) {
      console.warn('Failed to erase placed item', e);
    }
  }

  // ─── Building placement helpers ──────────────────────────────────────────

  /** Returns the building whose tile footprint contains (wx, wy), or null. */
  private findBuildingAt(wx: number, wy: number): BuildingData | null {
    for (const b of this.island.buildings) {
      if (
        wx >= b.tileX * TILE_SIZE && wx < (b.tileX + b.tileW) * TILE_SIZE &&
        wy >= b.tileY * TILE_SIZE && wy < (b.tileY + b.tileH) * TILE_SIZE
      ) return b;
    }
    return null;
  }

  /**
   * Returns true when a 32×32 sprite (origin 0.5, 0.7) centred at (wx, wy)
   * fits entirely within the building's interior — i.e. no pixel of the sprite
   * overlaps the visible wall frame (WALL = 6 px on each side).
   */
  private canPlaceInsideBuilding(wx: number, wy: number, b: BuildingData): boolean {
    const WALL = 6;
    const intLeft = b.tileX * TILE_SIZE + WALL;
    const intRight = (b.tileX + b.tileW) * TILE_SIZE - WALL;
    const intTop = b.tileY * TILE_SIZE + WALL;
    // South visual wall starts at (tileY+tileH)*TS - WALL; sprite bottom must not reach it.
    const intBottom = (b.tileY + b.tileH) * TILE_SIZE - WALL;
    const halfW = TILE_SIZE / 2;       // 16 px — sprite half-width
    const above = Math.round(TILE_SIZE * 0.7); // 22 px above anchor
    const below = TILE_SIZE - above;          // 10 px below anchor
    return (
      wx - halfW >= intLeft &&
      wx + halfW <= intRight &&
      wy - above >= intTop &&
      wy + below <= intBottom
    );
  }

  // ─── Carved door animation ────────────────────────────────────────────────

  /**
   * Finds the building entrance whose 2-tile center is within 1.5 tiles of (wx, wy).
   * Returns the world-space snap point and entrance tiles, or null if none found.
   */
  /**
   * Finds the nearest entrance half-tile within 1.5 tiles of (wx, wy).
   * Each entrance has a LEFT half (tile c0, normal knob-right orientation) and a
   * RIGHT half (tile c1, knob-left = flipped with baseScaleX -1).
   * Returns the snap position, the flip sign, and both entrance tiles for animation.
   */
  private findNearestEntrance(wx: number, wy: number): {
    x: number; y: number;   // tile-centre x stored in DB; visual y
    hingeX: number;         // world x of the hinge edge (where origin is pinned)
    originX: 0 | 1;         // sprite origin x: 0 = left hinge, 1 = right hinge
    baseScaleX: 1 | -1;
    entranceTiles: Array<{ tx: number; ty: number }>;
  } | null {
    const SNAP_DIST = TILE_SIZE * 1.5;
    let best: {
      dist: number; x: number; y: number;
      hingeX: number; originX: 0 | 1;
      baseScaleX: 1 | -1;
      entranceTiles: Array<{ tx: number; ty: number }>;
    } | null = null;

    for (const b of this.island.buildings) {
      const c0 = b.tileX + b.doorOffset;
      const c1 = c0 + 1;
      const row = b.tileY + b.tileH - 1;
      const ey = (b.tileY + b.tileH) * TILE_SIZE + 3.8;
      const entranceTiles = [{ tx: c0, ty: row }, { tx: c1, ty: row }];

      // Left half — hinge on left wall edge, knob on right faces centre
      const lx = c0 * TILE_SIZE + TILE_SIZE / 2;
      const ld = Math.hypot(wx - lx, wy - ey);
      if (ld <= SNAP_DIST && (!best || ld < best.dist)) {
        best = {
          dist: ld, x: lx, y: ey,
          hingeX: c0 * TILE_SIZE,   // left edge of tile c0
          originX: 0,
          baseScaleX: 1, entranceTiles,
        };
      }

      // Right half — hinge on right wall edge, knob on left faces centre
      const rx = c1 * TILE_SIZE + TILE_SIZE / 2;
      const rd = Math.hypot(wx - rx, wy - ey);
      if (rd <= SNAP_DIST && (!best || rd < best.dist)) {
        best = {
          dist: rd, x: rx, y: ey,
          hingeX: c1 * TILE_SIZE + TILE_SIZE, // right edge of tile c1
          originX: 1,
          baseScaleX: -1, entranceTiles,
        };
      }
    }

    return best;
  }

  /** Returns the two entrance tiles for the building whose doorway contains (doorTx, doorTy). */
  private getEntranceTilesForDoor(doorTx: number, doorTy: number): Array<{ tx: number; ty: number }> {
    for (const b of this.island.buildings) {
      const c0 = b.tileX + b.doorOffset;
      const c1 = c0 + 1;
      const row = b.tileY + b.tileH - 1;
      // doorTy may be row (entrance tile) or row+1 (visual anchor is below the tile boundary)
      if ((doorTy === row || doorTy === row + 1) && (doorTx === c0 || doorTx === c1)) {
        return [{ tx: c0, ty: row }, { tx: c1, ty: row }];
      }
    }
    return [{ tx: doorTx, ty: doorTy }];
  }

  /**
   * Each frame: if any character (player or NPC) occupies a carved door's entrance
   * tiles, tween the door sprite open (scaleX → 0.12); close it when they leave.
   */
  private updateDoorAnimations(): void {
    if (this.carvedDoors.size === 0) return;

    const playerTx = Math.floor(this.player.x / TILE_SIZE);
    const playerTy = Math.floor(this.player.y / TILE_SIZE);
    const charTiles: Array<{ tx: number; ty: number }> = [{ tx: playerTx, ty: playerTy }];
    for (const npc of this.npcs) {
      charTiles.push({ tx: Math.floor(npc.x / TILE_SIZE), ty: Math.floor(npc.y / TILE_SIZE) });
    }

    for (const door of this.carvedDoors.values()) {
      const occupied = charTiles.some(ct =>
        door.entranceTiles.some(et => et.tx === ct.tx && et.ty === ct.ty),
      );

      if (occupied && !door.isOpen) {
        door.isOpen = true;
        door.tween?.stop();
        door.tween = this.tweens.add({
          targets: door.sprite,
          scaleX: door.baseScaleX * 0.06,
          duration: 150,
          ease: 'Quad.Out',
        });
      } else if (!occupied && door.isOpen) {
        door.isOpen = false;
        door.tween?.stop();
        door.tween = this.tweens.add({
          targets: door.sprite,
          scaleX: door.baseScaleX,
          duration: 200,
          ease: 'Quad.Out',
        });
      }
    }
  }

  // ─── Day / night cycle ────────────────────────────────────────────────────

  private setupNightCycle(): void {
    this.currentNightAlpha = this.getNightAlpha();
    // World-sized RT sitting at (0,0) — rendered through the scene camera so
    // fill/erase coordinates are plain world pixels.  No scrollFactor tricks.
    this.nightRT = this.add.renderTexture(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
      .setOrigin(0, 0)
      .setDepth(190);
    this.nightMaskImg = this.make.image({ key: 'light-mask', add: false })
      .setOrigin(0.5, 0.5);
    // Reusable Graphics object for erasing/drawing sharp rectangular building interiors.
    // Sits at (0,0) so fillRect coordinates map directly to world pixels.
    this.buildingLightGfx = this.add.graphics().setVisible(false);

    this.time.addEvent({
      delay: 30_000,
      loop: true,
      callback: () => { this.currentNightAlpha = this.getNightAlpha(); },
    });
  }

  private updateNightOverlay(time: number): void {
    if (!this.nightRT || !this.nightMaskImg) return;
    if (time - this.lastNightCheck > 1000) {
      this.currentNightAlpha = this.getNightAlpha();
      this.lastNightCheck = time;
    }
    this.nightRT.clear();
    if (this.currentNightAlpha <= 0) return;
    // Fill the entire world with darkness, then punch holes at each light source.
    // The RT lives in world space so all coordinates are raw world pixels.
    this.nightRT.fill(0x080c24, this.currentNightAlpha);
    const MASK_SIZE = 256;
    for (const light of this.lightSources.values()) {
      if (light.buildingRect && this.buildingLightGfx) {
        // Indoor building-fill: erase and tint a sharp rectangle aligned to the
        // interior walls so no light bleeds through them to the outside.
        const { left, top, width, height } = light.buildingRect;
        this.buildingLightGfx.clear();
        this.buildingLightGfx.fillStyle(0xffffff, light.eraseAlpha ?? 1);
        this.buildingLightGfx.fillRect(left, top, width, height);
        this.nightRT.erase(this.buildingLightGfx);
        this.buildingLightGfx.clear();
        this.buildingLightGfx.fillStyle(light.tint ?? 0xffb347, light.tintAlpha ?? 0.28);
        this.buildingLightGfx.fillRect(left, top, width, height);
        this.nightRT.draw(this.buildingLightGfx);

        // Entrance light leak: a soft radial gradient centred on the doorway.
        // Radius ~1.5 tiles so it fans a natural wedge onto the ground outside.
        // eraseAlpha and tintAlpha are scaled down to keep the leak subtle.
        if (light.entranceLeak) {
          const LEAK_RADIUS = 52;
          const leakScale = (LEAK_RADIUS * 2) / MASK_SIZE;
          this.nightMaskImg
            .setPosition(light.entranceLeak.x, light.entranceLeak.y)
            .setScale(leakScale)
            .setAlpha((light.eraseAlpha ?? 1) * 0.70)
            .clearTint();
          this.nightRT.erase(this.nightMaskImg);
          this.nightMaskImg
            .setTint(light.tint ?? 0xffb347)
            .setAlpha((light.tintAlpha ?? 0.28) * 0.75);
          this.nightRT.draw(this.nightMaskImg);
        }
      } else {
        // Outdoor / non-building-fill: standard radial gradient mask.
        const imgScale = (light.worldRadius * 2) / MASK_SIZE;
        this.nightMaskImg
          .setPosition(light.x, light.y + light.yOffset)
          .setScale(imgScale)
          .setAlpha(light.eraseAlpha ?? 1)
          .clearTint();
        this.nightRT.erase(this.nightMaskImg);
        this.nightMaskImg.setTint(light.tint ?? 0xffb347).setAlpha(light.tintAlpha ?? 0.28);
        this.nightRT.draw(this.nightMaskImg);
      }
    }
  }

  /**
   * Returns the overlay alpha for the current EST clock time.
   *   0          = full day  (7:30 am – 6:30 pm)
   *   NIGHT_ALPHA = full night (7:30 pm – 6:30 am)
   * A 30-minute linear fade is applied around each threshold.
   */
  private getNightAlpha(): number {
    const NIGHT_ALPHA = 0.74;
    const TRANS = 0.5; // half-hour fade window

    const now = new Date();
    const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const t = est.getHours() + est.getMinutes() / 60; // 0 – 24

    // Full day
    if (t >= 7 + TRANS && t < 19 - TRANS) return 0;
    // Full night
    if (t < 7 - TRANS || t >= 19 + TRANS) return NIGHT_ALPHA;
    // Sunrise: fade night → day
    if (t < 7 + TRANS) return NIGHT_ALPHA * (1 - (t - (7 - TRANS)) / (TRANS * 2));
    // Sunset: fade day → night
    return NIGHT_ALPHA * ((t - (19 - TRANS)) / (TRANS * 2));
  }

  // ─── Firefly system ───────────────────────────────────────────────────────

  private initFireflies(): void {
    // Additive-blend layer renders the bioluminescent glow on top of darkness
    this.fireflyGlowGfx = this.add.graphics()
      .setDepth(191)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.fireflyGfx = this.add.graphics().setDepth(192);
  }

  private spawnFirefly(): void {
    const m = 80;
    this.fireflies.push({
      x: m + Math.random() * (WORLD_WIDTH - m * 2),
      y: m + Math.random() * (WORLD_HEIGHT - m * 2),
      angle: Math.random() * Math.PI * 2,
      speed: 18 + Math.random() * 16,          // 18 – 34 px / sec
      flashing: false,
      flashTimer: Math.random() * 4500,         // stagger so they don't all sync
      flashDuration: 2000 + Math.random() * 2500,// 2 – 4.5 s lit
      darkDuration: 1000 + Math.random() * 1500, // 1 – 2.5 s dark interval
      intensity: 0,
      life: 0,
      maxLife: 28000 + Math.random() * 20000,   // 28 – 48 s lifespan
    });
  }

  private updateFireflies(delta: number): void {
    if (!this.fireflyGfx || !this.fireflyGlowGfx) return;

    // No fireflies until it's properly dark
    if (this.currentNightAlpha <= 0.15) {
      if (this.fireflies.length > 0) this.fireflies = [];
      this.fireflyGfx.clear();
      this.fireflyGlowGfx.clear();
      return;
    }

    // Scale max population (0 → 5) as night deepens from α=0.15 to α=0.55
    const nightRamp = Phaser.Math.Clamp((this.currentNightAlpha - 0.15) / 0.4, 0, 1);
    const maxNow = Math.round(nightRamp * 5);

    this.fireflySpawnCooldown -= delta;
    if (this.fireflySpawnCooldown <= 0 && this.fireflies.length < maxNow) {
      this.spawnFirefly();
      this.fireflySpawnCooldown = 1800 + Math.random() * 2000;
    }

    this.fireflyGfx.clear();
    this.fireflyGlowGfx.clear();

    this.fireflies = this.fireflies.filter(f => {
      f.life += delta;
      if (f.life >= f.maxLife) return false;

      // Fade in/out over the first and last 2.5 s of each firefly's life
      const FADE = 2500;
      const fadeAlpha = Math.min(f.life / FADE, 1, (f.maxLife - f.life) / FADE);
      const globalAlpha = fadeAlpha * nightRamp;

      // Flash cycle — transition between dark and lit phases
      f.flashTimer += delta;
      const phaseLen = f.flashing ? f.flashDuration : f.darkDuration;
      if (f.flashTimer >= phaseLen) {
        f.flashing = !f.flashing;
        f.flashTimer -= phaseLen;
      }
      // Smooth bell-curve brightness: 0 → 1 → 0 over the flash window
      f.intensity = f.flashing
        ? Math.sin((f.flashTimer / f.flashDuration) * Math.PI)
        : 0;

      // Wander: gentle random angle drift (≈ 1.5 rad / sec max turn rate)
      f.angle += (Math.random() - 0.5) * 1.5 * delta / 1000;
      f.x += Math.cos(f.angle) * f.speed * delta / 1000;
      // Classic "J" ascent at flash peak — slight upward drift while lit
      const upBias = f.flashing ? 15 * f.intensity * delta / 1000 : 0;
      f.y += Math.sin(f.angle) * f.speed * delta / 1000 - upBias;

      // Reflect off world edges
      if (f.x < 48 || f.x > WORLD_WIDTH - 48) f.angle = Math.PI - f.angle;
      if (f.y < 48 || f.y > WORLD_HEIGHT - 48) f.angle = -f.angle;
      f.x = Phaser.Math.Clamp(f.x, 48, WORLD_WIDTH - 48);
      f.y = Phaser.Math.Clamp(f.y, 48, WORLD_HEIGHT - 48);

      const bx = Math.round(f.x);
      const by = Math.round(f.y);

      if (f.intensity > 0) {
        const gi = f.intensity * globalAlpha;
        // Concentric additive glow rings — yellow-green bloom, white core
        this.fireflyGlowGfx!.fillStyle(0xddee22, gi * 0.18);
        this.fireflyGlowGfx!.fillCircle(bx, by, 6);
        this.fireflyGlowGfx!.fillStyle(0xeeff44, gi * 0.38);
        this.fireflyGlowGfx!.fillCircle(bx, by, 4);
        this.fireflyGlowGfx!.fillStyle(0xfff880, gi * 0.68);
        this.fireflyGlowGfx!.fillCircle(bx, by, 2.5);
        this.fireflyGlowGfx!.fillStyle(0xffffff, gi * 0.90);
        this.fireflyGlowGfx!.fillRect(bx - 1, by - 1, 2, 2);
        // Crisp 2 × 2 pixel abdomen on the normal-blend layer
        this.fireflyGfx!.fillStyle(0xf8ff60, gi);
        this.fireflyGfx!.fillRect(bx - 1, by - 1, 2, 2);
      } else {
        // Dark period: barely-visible amber speck so the eye can loosely track it
        this.fireflyGfx!.fillStyle(0xaa6600, globalAlpha * 0.07);
        this.fireflyGfx!.fillRect(bx - 1, by - 1, 2, 2);
      }

      return true;
    });
  }

  // ─── Arcade machine screen animation ─────────────────────────────────────

  // Bright arcade palette — cycles every ~130 ms per machine
  private static readonly ARCADE_COLORS = [
    0x00ffff, 0xffff00, 0xff44aa, 0x00ff88, 0xff8800, 0xffffff, 0x8844ff,
  ];

  private updateArcadeScreens(delta: number): void {
    for (const [id, screen] of this.arcadeScreens) {
      screen.timer += delta;
      if (screen.timer < 400) continue;
      screen.timer -= 400;

      const color = GameScene.ARCADE_COLORS[
        Math.floor(Math.random() * GameScene.ARCADE_COLORS.length)
      ];

      screen.gfx.clear();

      // Screen face — sprite-local (9,13,14,7) offset by origin (16, 22.4)
      // → local coords: fillRect(-7, -9, 14, 7)
      screen.gfx.fillStyle(color, 0.88);
      screen.gfx.fillRect(-7, -9, 14, 7);

      // Scanlines
      screen.gfx.fillStyle(0x000000, 0.18);
      for (let row = -9; row < -2; row += 2) {
        screen.gfx.fillRect(-7, row, 14, 1);
      }

      // A few bright "game sprite" pixels for depth
      screen.gfx.fillStyle(0xffffff, 0.80);
      screen.gfx.fillRect(-5, -8, 2, 2);
      screen.gfx.fillRect(2, -5, 2, 2);
      screen.gfx.fillRect(-1, -7, 1, 1);

      // Sync the night-overlay light pool tint to the current screen color
      const light = this.lightSources.get(id);
      if (light) light.tint = color;
    }
  }

  // ─── Rain system ─────────────────────────────────────────────────────────

  private initRain(): void {
    // Rain drops at depth 193 (above fireflies), ripples at depth 4 (above water tiles)
    this.rainGfx = this.add.graphics().setDepth(193);
    this.rainRippleGfx = this.add.graphics().setDepth(4);

    // Pre-compute world-space centers of every water tile for ripple spawning
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.island.tiles[y][x] === TileType.WATER) {
          this.cachedWaterTiles.push({
            x: x * TILE_SIZE + TILE_SIZE / 2,
            y: y * TILE_SIZE + TILE_SIZE / 2,
          });
        }
      }
    }

    // Seed 140 drops randomly across the world; the update loop will
    // immediately migrate any that are outside the viewport to the top.
    for (let i = 0; i < 140; i++) {
      this.rainDrops.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        speed: 0.85 + Math.random() * 0.3,
      });
    }

    this.rainActive = this.checkRainActive();
    if (this.rainActive) this.rainIntensity = 1;
  }

  /**
   * Returns two deterministic rain events for the given ISO week key.
   * Both the day-of-week (0 = Sunday … 6 = Saturday) and whether the rain
   * falls during the day or at night are derived from a seeded LCG so that
   * every connected client sees the same schedule without a backend call.
   */
  private getRainWeekSchedule(weekKey: number): Array<{ day: number; isNight: boolean }> {
    const lcg = (s: number): number => ((s * 1664525 + 1013904223) >>> 0);
    let s = lcg(weekKey ^ 0xdeadbeef);

    const day1 = s % 7;
    s = lcg(s);
    const night1 = (s % 2) === 0;
    s = lcg(s);
    // Guarantee the two rain days are different
    let day2 = s % 7;
    if (day2 === day1) day2 = (day1 + 3) % 7;
    s = lcg(s);
    const night2 = (s % 2) === 0;

    return [
      { day: day1, isNight: night1 },
      { day: day2, isNight: night2 },
    ];
  }

  /** Returns true when the current EST time falls in a scheduled rain period. */
  private checkRainActive(): boolean {
    const now = new Date();
    const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const dayOfWeek = est.getDay();
    const h = est.getHours() + est.getMinutes() / 60;
    // Mirror the game's own day/night boundary: 7:30 am – 7:30 pm = daytime
    const isDaytime = h >= 7.5 && h < 19.5;
    const weekKey = Math.floor(Date.now() / (7 * 24 * 3_600_000));
    return this.getRainWeekSchedule(weekKey).some(
      s => s.day === dayOfWeek && (s.isNight ? !isDaytime : isDaytime),
    );
  }

  private updateRain(time: number, delta: number): void {
    if (!this.rainGfx || !this.rainRippleGfx) return;

    // Re-evaluate the schedule every 30 s (cheap string formatting, not every frame)
    if (time - this.lastRainCheck > 30_000) {
      this.rainActive = this.checkRainActive();
      this.lastRainCheck = time;
    }

    // Smoothly fade intensity in/out over ~2 seconds
    const target = this.rainActive ? 1 : 0;
    this.rainIntensity = Phaser.Math.Linear(this.rainIntensity, target, delta * 0.0005);

    if (this.rainIntensity < 0.01) {
      this.rainGfx.clear();
      this.rainRippleGfx.clear();
      this.rainRipples = [];
      return;
    }

    const cam = this.cameras.main;
    const vx = cam.scrollX;
    const vy = cam.scrollY;
    const vw = cam.width / cam.zoom;
    const vh = cam.height / cam.zoom;
    const MARGIN = 64;

    // Is the player currently sheltered inside a building?
    const building = this.findBuildingAt(this.player.x, this.player.y);
    const bLeft   = building ? building.tileX * TILE_SIZE : -1;
    const bRight  = building ? (building.tileX + building.tileW) * TILE_SIZE : -1;
    const bTop    = building ? building.tileY * TILE_SIZE : -1;
    const bBottom = building ? (building.tileY + building.tileH) * TILE_SIZE : -1;

    // ── Rain drop streaks ────────────────────────────────────────────────────
    const DROP_VX = 55;   // px / sec rightward drift
    const DROP_VY = 310;  // px / sec downward fall

    this.rainGfx.clear();

    for (const drop of this.rainDrops) {
      drop.x += DROP_VX * drop.speed * delta / 1000;
      drop.y += DROP_VY * drop.speed * delta / 1000;

      // Wrap: respawn above the viewport when a drop exits the bottom or right
      if (drop.y > vy + vh + MARGIN || drop.x > vx + vw + MARGIN) {
        drop.x = vx + (Math.random() * (vw + MARGIN * 2)) - MARGIN;
        drop.y = vy - Math.random() * MARGIN;
        continue;
      }

      // Cull drops outside the visible viewport (can happen on first frames)
      if (drop.x < vx - MARGIN || drop.y < vy - MARGIN) continue;

      // If the player is indoors, skip any drop whose tip falls within the
      // building footprint — the player is sheltered from that rain.
      if (building && drop.x >= bLeft && drop.x <= bRight &&
          drop.y >= bTop && drop.y <= bBottom) continue;

      // Two 1-px columns offset by (1, 3) to suggest a diagonal streak
      const alpha = this.rainIntensity * 0.55;
      const dx = Math.round(drop.x);
      const dy = Math.round(drop.y);
      this.rainGfx.fillStyle(0xaad4f0, alpha);
      this.rainGfx.fillRect(dx, dy, 1, 7);
      this.rainGfx.fillStyle(0xc8e8ff, alpha * 0.55);
      this.rainGfx.fillRect(dx + 1, dy + 3, 1, 5);
    }

    // ── Water ripples on the pond ────────────────────────────────────────────
    this.rainRippleTimer -= delta;
    if (this.rainActive && this.rainRippleTimer <= 0 && this.cachedWaterTiles.length > 0) {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const wt = this.cachedWaterTiles[Math.floor(Math.random() * this.cachedWaterTiles.length)];
        // Only spawn ripples that are actually on-screen
        if (wt.x < vx - TILE_SIZE || wt.x > vx + vw + TILE_SIZE) continue;
        if (wt.y < vy - TILE_SIZE || wt.y > vy + vh + TILE_SIZE) continue;
        this.rainRipples.push({
          x: wt.x + (Math.random() - 0.5) * TILE_SIZE * 0.5,
          y: wt.y + (Math.random() - 0.5) * TILE_SIZE * 0.5,
          radius: 0,
          maxRadius: 5 + Math.random() * 4,
          age: 0,
          maxAge: 480 + Math.random() * 280,
        });
      }
      this.rainRippleTimer = 90 + Math.random() * 110;
    }

    this.rainRippleGfx.clear();
    this.rainRipples = this.rainRipples.filter(r => {
      r.age += delta;
      if (r.age >= r.maxAge) return false;
      const t = r.age / r.maxAge;
      r.radius = r.maxRadius * t;
      const alpha = (1 - t) * this.rainIntensity * 0.65;
      this.rainRippleGfx!.lineStyle(1, 0x88c4e0, alpha);
      this.rainRippleGfx!.strokeCircle(r.x, r.y, r.radius);
      return true;
    });
  }
}