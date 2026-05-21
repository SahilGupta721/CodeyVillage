/**
 * CollisionSystem
 *
 * Maintains a flat Uint8Array walkability grid (1 = walkable, 0 = blocked).
 * Buildings stamp their footprints as blocked on top of the tile data.
 *
 * The main query is `canMoveTo(wx, wy, halfSize)` which checks four corners
 * of a small square around the entity centre — enabling smooth edge-sliding.
 */

import {
  TileType, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  WALKABLE_TILES, BuildingData,
} from '../map/TileTypes';

const WALL = 6; // visual wall thickness in pixels (matches drawBuilding)

export class CollisionSystem {
  private grid: Uint8Array; // flat row-major: grid[y * MAP_WIDTH + x]
  private entranceTiles: Set<number> = new Set(); // encoded as ty * MAP_WIDTH + tx
  private buildings: BuildingData[];

  constructor(tiles: TileType[][], buildings: BuildingData[]) {
    this.buildings = buildings;
    this.grid = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        this.grid[y * MAP_WIDTH + x] = WALKABLE_TILES.has(tiles[y][x]) ? 1 : 0;
      }
    }

    // Block only wall perimeter; interior tiles and entrance gap remain walkable
    for (const b of buildings) {
      const doorC0 = b.tileX + b.doorOffset;
      const doorC1 = doorC0 + 1;
      const doorRow = b.tileY + b.tileH - 1;
      for (let ty = b.tileY; ty < b.tileY + b.tileH; ty++) {
        for (let tx = b.tileX; tx < b.tileX + b.tileW; tx++) {
          const isPerimeter =
            ty === b.tileY ||
            ty === b.tileY + b.tileH - 1 ||
            tx === b.tileX ||
            tx === b.tileX + b.tileW - 1;
          const isEntrance =
            ty === doorRow &&
            (tx === doorC0 || tx === doorC1);
          if (isPerimeter && !isEntrance) {
            this.grid[ty * MAP_WIDTH + tx] = 0;
          }
        }
      }
      this.entranceTiles.add(doorRow * MAP_WIDTH + doorC0);
      this.entranceTiles.add(doorRow * MAP_WIDTH + doorC1);
    }
  }

  isEntranceTile(tx: number, ty: number): boolean {
    return this.entranceTiles.has(ty * MAP_WIDTH + tx);
  }

  blockTile(tx: number, ty: number): void {
    if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
      this.grid[ty * MAP_WIDTH + tx] = 0;
    }
  }

  isTileWalkable(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT) return false;
    return this.grid[ty * MAP_WIDTH + tx] === 1;
  }

  isWorldWalkable(wx: number, wy: number): boolean {
    return this.isTileWalkable(Math.floor(wx / TILE_SIZE), Math.floor(wy / TILE_SIZE));
  }

  /**
   * Returns true when an entity whose centre would be at (wx, wy)
   * fits entirely on walkable tiles.  halfSize is reduced by 1 px to
   * allow smooth sliding along walls without hard stops.
   *
   * Inside buildings the four hitbox corners are tested against the
   * pixel-level interior bounds instead of the tile grid, so characters
   * can reach the walls as closely as their sprite allows.
   */
  canMoveTo(wx: number, wy: number, halfSize = 10): boolean {
    const h = halfSize - 1;
    return (
      this.isWalkableAt(wx - h, wy - h) &&
      this.isWalkableAt(wx + h, wy - h) &&
      this.isWalkableAt(wx - h, wy + h) &&
      this.isWalkableAt(wx + h, wy + h)
    );
  }

  private isWalkableAt(cx: number, cy: number): boolean {
    const b = this.findBuildingContaining(cx, cy);
    return b ? this.isCornerAllowedInBuilding(cx, cy, b) : this.isWorldWalkable(cx, cy);
  }

  private findBuildingContaining(cx: number, cy: number): BuildingData | null {
    for (const b of this.buildings) {
      if (
        cx >= b.tileX * TILE_SIZE && cx < (b.tileX + b.tileW) * TILE_SIZE &&
        cy >= b.tileY * TILE_SIZE && cy < (b.tileY + b.tileH) * TILE_SIZE
      ) return b;
    }
    return null;
  }

  private isCornerAllowedInBuilding(cx: number, cy: number, b: BuildingData): boolean {
    const intLeft   = b.tileX * TILE_SIZE + WALL;
    const intRight  = (b.tileX + b.tileW) * TILE_SIZE - WALL;
    const intTop    = b.tileY * TILE_SIZE + WALL;
    const intBottom = (b.tileY + b.tileH) * TILE_SIZE - WALL;

    if (cx < intLeft || cx >= intRight) return false;
    if (cy < intTop) return false;
    if (cy >= intBottom) {
      // South wall area — only passable through the entrance gap
      const entranceLeft  = (b.tileX + b.doorOffset) * TILE_SIZE;
      const entranceRight = (b.tileX + b.doorOffset + 2) * TILE_SIZE;
      return cx >= entranceLeft && cx < entranceRight;
    }
    return true;
  }
}
