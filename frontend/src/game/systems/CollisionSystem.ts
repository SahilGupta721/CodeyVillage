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

export class CollisionSystem {
  private grid: Uint8Array; // flat row-major: grid[y * MAP_WIDTH + x]

  constructor(tiles: TileType[][], buildings: BuildingData[]) {
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
      for (let ty = b.tileY; ty < b.tileY + b.tileH; ty++) {
        for (let tx = b.tileX; tx < b.tileX + b.tileW; tx++) {
          const isPerimeter =
            ty === b.tileY ||
            ty === b.tileY + b.tileH - 1 ||
            tx === b.tileX ||
            tx === b.tileX + b.tileW - 1;
          const isEntrance =
            ty === b.tileY + b.tileH - 1 &&
            (tx === doorC0 || tx === doorC1);
          if (isPerimeter && !isEntrance) {
            this.grid[ty * MAP_WIDTH + tx] = 0;
          }
        }
      }
    }
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
   */
  canMoveTo(wx: number, wy: number, halfSize = 10): boolean {
    const h = halfSize - 1;
    return (
      this.isWorldWalkable(wx - h, wy - h) &&
      this.isWorldWalkable(wx + h, wy - h) &&
      this.isWorldWalkable(wx - h, wy + h) &&
      this.isWorldWalkable(wx + h, wy + h)
    );
  }
}
