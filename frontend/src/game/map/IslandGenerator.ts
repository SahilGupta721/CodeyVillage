/**
 * Village map generator — top-down RPG style.
 *
 * Layout:
 *  1. Fill entire map with GRASS
 *  2. Stamp a 2-tile ROCK border around every edge (impassable cliffs)
 *  3. ~28 % of interior grass becomes GRASS_DARK for visual variety
 *  4. Small pond of WATER tiles in the upper-right quadrant
 *  5. Place 5 buildings on grass, spread around the centre
 *  6. Carve DIRT_PATH from each building entrance to a central plaza
 *  7. Collect walkable spawn-points for NPCs / the player
 */

import {
  TileType, TILE_SIZE,
  MAP_WIDTH, MAP_HEIGHT,
  BuildingData, IslandData, WALKABLE_TILES,
} from './TileTypes';

const CX     = MAP_WIDTH  / 2; // 24
const CY     = MAP_HEIGHT / 2; // 24
const BORDER = 2;              // rock border thickness in tiles

// ─── tiny deterministic PRNG (linear congruential) ─────────────────────────

function makeLCG(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffff_ffff;
  };
}

// ─── Public entry point ─────────────────────────────────────────────────────

export function generateIsland(seed = 12345): IslandData {
  const rng = makeLCG(seed);

  // 1. Fill with grass
  const tiles: TileType[][] = Array.from({ length: MAP_HEIGHT }, () =>
    new Array<TileType>(MAP_WIDTH).fill(TileType.GRASS),
  );

  // 2. Water border + gravel beach ring just inside it
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x < BORDER || x >= MAP_WIDTH  - BORDER ||
          y < BORDER || y >= MAP_HEIGHT - BORDER) {
        tiles[y][x] = TileType.WATER;
      }
    }
  }
  for (let y = BORDER; y < MAP_HEIGHT - BORDER; y++) {
    for (let x = BORDER; x < MAP_WIDTH - BORDER; x++) {
      if (x === BORDER || x === MAP_WIDTH  - BORDER - 1 ||
          y === BORDER || y === MAP_HEIGHT - BORDER - 1) {
        tiles[y][x] = TileType.GRAVEL;
      }
    }
  }

  // 3. Grass variety
  for (let y = BORDER; y < MAP_HEIGHT - BORDER; y++) {
    for (let x = BORDER; x < MAP_WIDTH - BORDER; x++) {
      if (tiles[y][x] === TileType.GRASS && rng() < 0.28) {
        tiles[y][x] = TileType.GRASS_DARK;
      }
    }
  }

  // 4. Circular pond with gravel shore (upper-right quadrant)
  const pondCX = Math.floor(CX) + 7;
  const pondCY = Math.floor(CY) - 7;
  const pondR  = 3.2; // base water radius in tiles

  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const tx = pondCX + dx, ty = pondCY + dy;
      if (tx < BORDER || tx >= MAP_WIDTH - BORDER ||
          ty < BORDER || ty >= MAP_HEIGHT - BORDER) continue;

      const angle    = Math.atan2(dy, dx);
      const roughness = 0.45 * Math.sin(angle * 4.7 + 1.3)
                      + 0.25 * Math.cos(angle * 2.9 + 0.5);
      const dist     = Math.sqrt(dx * dx + dy * dy);
      const waterR   = pondR + roughness;

      if (dist < waterR) {
        tiles[ty][tx] = TileType.WATER;
      } else if (dist < waterR + 1.5) {
        tiles[ty][tx] = TileType.GRAVEL;
      }
    }
  }

  // 5–7. Buildings, paths, spawn-points
  const buildings   = placeBuildings(tiles, rng);
  addPaths(tiles, buildings);
  const spawnPoints = collectSpawnPoints(tiles, buildings);

  return { tiles, buildings, spawnPoints };
}

// ─── Building placement ─────────────────────────────────────────────────────

const BLDG_SIZES: Array<{ w: number; h: number }> = [
  { w: 7, h: 5 }, // medium house
  { w: 6, h: 5 }, // small cottage
  { w: 8, h: 5 }, // wide shop
  { w: 6, h: 5 }, // square house
  { w: 7, h: 4 }, // long hall
];

function placeBuildings(tiles: TileType[][], rng: () => number): BuildingData[] {
  const buildings: BuildingData[] = [];
  const EDGE = 4;
  const GAP  = 2;

  for (let i = 0; i < 5; i++) {
    const { w, h } = BLDG_SIZES[i];
    let placed = false;

    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
      const angle = rng() * Math.PI * 2;
      const dist  = 2 + rng() * 7;
      const cx    = Math.round(CX + Math.cos(angle) * dist);
      const cy    = Math.round(CY + Math.sin(angle) * dist);
      const bx    = cx - Math.floor(w / 2);
      const by    = cy - Math.floor(h / 2);

      if (isValidPlacement(tiles, buildings, bx, by, w, h, EDGE, GAP)) {
        buildings.push({ tileX: bx, tileY: by, tileW: w, tileH: h, style: i, doorOffset: Math.floor((w - 2) / 2) });
        placed = true;
      }
    }

    // Fallback exhaustive scan
    if (!placed) {
      outer:
      for (let fy = EDGE; fy < MAP_HEIGHT - EDGE - h; fy++) {
        for (let fx = EDGE; fx < MAP_WIDTH - EDGE - w; fx++) {
          if (isValidPlacement(tiles, buildings, fx, fy, w, h, EDGE, GAP)) {
            buildings.push({ tileX: fx, tileY: fy, tileW: w, tileH: h, style: i, doorOffset: Math.floor((w - 2) / 2) });
            placed = true;
            break outer;
          }
        }
      }
    }
  }

  return buildings;
}

function isValidPlacement(
  tiles: TileType[][], existing: BuildingData[],
  bx: number, by: number, bw: number, bh: number,
  edgeMargin: number, gap: number,
): boolean {
  if (bx < edgeMargin || by < edgeMargin ||
      bx + bw > MAP_WIDTH  - edgeMargin ||
      by + bh > MAP_HEIGHT - edgeMargin) return false;

  for (let ty = by - 1; ty <= by + bh; ty++) {
    for (let tx = bx - 1; tx <= bx + bw; tx++) {
      const t = tiles[ty]?.[tx];
      if (t !== TileType.GRASS && t !== TileType.GRASS_DARK) return false;
    }
  }

  for (const b of existing) {
    if (bx < b.tileX + b.tileW + gap &&
        bx + bw + gap > b.tileX       &&
        by < b.tileY + b.tileH + gap  &&
        by + bh + gap > b.tileY) return false;
  }

  return true;
}

// ─── Path generation ────────────────────────────────────────────────────────

function addPaths(tiles: TileType[][], buildings: BuildingData[]): void {
  // Central plaza
  for (let y = Math.floor(CY) - 2; y <= Math.floor(CY) + 2; y++) {
    for (let x = Math.floor(CX) - 2; x <= Math.floor(CX) + 2; x++) {
      if (isGrass(tiles, x, y)) tiles[y][x] = TileType.DIRT_PATH;
    }
  }

  if (buildings.length === 0) return;

  // Build blocked set: water + every building perimeter/interior tile
  // (entrance gap tiles are left passable so paths can reach the door)
  const blocked = new Set<number>();
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (tiles[y][x] === TileType.WATER) blocked.add(y * MAP_WIDTH + x);
    }
  }
  for (const b of buildings) {
    const doorC0 = b.tileX + b.doorOffset;
    const doorC1 = doorC0 + 1;
    for (let ty = b.tileY; ty < b.tileY + b.tileH; ty++) {
      for (let tx = b.tileX; tx < b.tileX + b.tileW; tx++) {
        const isEntrance = ty === b.tileY + b.tileH - 1 && (tx === doorC0 || tx === doorC1);
        if (!isEntrance) blocked.add(ty * MAP_WIDTH + tx);
      }
    }
  }

  // Nodes: center (0) + one entrance per building
  type Pt = { x: number; y: number };
  const nodes: Pt[] = [
    { x: Math.floor(CX), y: Math.floor(CY) },
    ...buildings.map(b => ({ x: b.tileX + b.doorOffset + 1, y: b.tileY + b.tileH })),
  ];

  // Prim's MST — connect the nearest unjoined node to the existing tree.
  const inTree = new Set<number>([0]);
  while (inTree.size < nodes.length) {
    let bestD = Infinity, bestFrom = -1, bestTo = -1;
    for (const i of inTree) {
      for (let j = 0; j < nodes.length; j++) {
        if (inTree.has(j)) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; bestFrom = i; bestTo = j; }
      }
    }
    if (bestTo === -1) break;
    bfsPath(tiles, blocked, nodes[bestFrom].x, nodes[bestFrom].y, nodes[bestTo].x, nodes[bestTo].y);
    inTree.add(bestTo);
  }
}

// BFS pathfinding — routes around blocked cells, stamps path as DIRT_PATH
function bfsPath(
  tiles  : TileType[][],
  blocked: Set<number>,
  x0: number, y0: number,
  x1: number, y1: number,
): void {
  const key = (x: number, y: number) => y * MAP_WIDTH + x;
  const inBounds = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT;

  const prev = new Map<number, number>(); // key → parent key
  const start = key(x0, y0);
  const goal  = key(x1, y1);
  prev.set(start, -1);
  const queue: number[] = [start];

  outer:
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    const cx  = cur % MAP_WIDTH;
    const cy  = Math.floor(cur / MAP_WIDTH);

    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!inBounds(nx, ny)) continue;
      const nk = key(nx, ny);
      if (prev.has(nk)) continue;
      if (blocked.has(nk)) continue;
      prev.set(nk, cur);
      if (nk === goal) break outer;
      queue.push(nk);
    }
  }

  // Trace back and stamp tiles
  if (!prev.has(goal)) return; // no path found — skip
  let cur = goal;
  while (cur !== start) {
    const x = cur % MAP_WIDTH, y = Math.floor(cur / MAP_WIDTH);
    const t = tiles[y][x];
    if (t === TileType.GRASS || t === TileType.GRASS_DARK || t === TileType.GRAVEL) {
      tiles[y][x] = TileType.DIRT_PATH;
    }
    cur = prev.get(cur)!;
  }
}

function isGrass(tiles: TileType[][], x: number, y: number): boolean {
  const t = tiles[y]?.[x];
  return t === TileType.GRASS || t === TileType.GRASS_DARK;
}

// ─── Spawn-point collection ─────────────────────────────────────────────────

function collectSpawnPoints(
  tiles    : TileType[][],
  buildings: BuildingData[],
): Array<{ x: number; y: number }> {
  const blocked = new Set<string>();
  for (const b of buildings) {
    for (let ty = b.tileY - 2; ty < b.tileY + b.tileH + 2; ty++) {
      for (let tx = b.tileX - 2; tx < b.tileX + b.tileW + 2; tx++) {
        blocked.add(`${tx},${ty}`);
      }
    }
  }

  const pts: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (WALKABLE_TILES.has(tiles[y][x]) && !blocked.has(`${x},${y}`)) {
        pts.push({ x: (x + 0.5) * TILE_SIZE, y: (y + 0.5) * TILE_SIZE });
      }
    }
  }
  return pts;
}
