export const TILE_SIZE    = 32;
export const MAP_WIDTH    = 36;
export const MAP_HEIGHT   = 36;
export const WORLD_WIDTH  = MAP_WIDTH  * TILE_SIZE;
export const WORLD_HEIGHT = MAP_HEIGHT * TILE_SIZE;

// NOTE: plain enum (not const enum) — Next.js SWC transpiles files in
// isolation and cannot inline cross-module const enums.
export enum TileType {
  ROCK       = 0,  // impassable rocky border
  WATER      = 1,  // impassable pond water
  GRASS      = 2,
  GRASS_DARK = 3,
  DIRT_PATH  = 4,
  GRAVEL     = 5,  // walkable pond shore
}

export const WALKABLE_TILES = new Set<TileType>([
  TileType.GRASS,
  TileType.GRASS_DARK,
  TileType.DIRT_PATH,
  TileType.GRAVEL,
]);

export interface BuildingData {
  tileX      : number;
  tileY      : number;
  tileW      : number;
  tileH      : number;
  style      : number;
  doorOffset : number; // tiles from building left where the 2-tile door gap starts
}

export interface IslandData {
  tiles       : TileType[][];
  buildings   : BuildingData[];
  spawnPoints : Array<{ x: number; y: number }>;
}
