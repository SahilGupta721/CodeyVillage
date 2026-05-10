/**
 * BootScene — creates every texture used by the game via the canvas API.
 *
 * All art uses only fillRect / strokeRect so it renders as chunky pixel art.
 * No external image files are required.
 *
 * Palette: warm earthy greens, muted stone grays, earthy tan paths.
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create(): void {
    this.makeWaterTile();
    this.makeTree();
    this.makeBush();
    this.makeFlower('flower_r', '#e03030', '#ffcc00');
    this.makeFlower('flower_y', '#f0c010', '#ff9900');
    this.makeShopItemTextures();
    this.scene.start('GameScene');
  }

  // ─── Pond water tile (32 × 32) ──────────────────────────────────────────────

  private makeWaterTile(): void {
    const c   = this.textures.createCanvas('water', 32, 32)!;
    const ctx = c.getContext();

    ctx.fillStyle = '#3898d8';
    ctx.fillRect(0, 0, 32, 32);

    // Lighter wave crests
    ctx.fillStyle = '#54b0f0';
    ctx.fillRect(0,  2, 32, 2);
    ctx.fillRect(0, 10, 32, 2);
    ctx.fillRect(0, 18, 32, 2);
    ctx.fillRect(0, 26, 32, 2);

    // Darker wave troughs
    ctx.fillStyle = '#2878b8';
    ctx.fillRect(0,  6, 32, 2);
    ctx.fillRect(0, 14, 32, 2);
    ctx.fillRect(0, 22, 32, 2);
    ctx.fillRect(0, 30, 32, 2);

    // Foam sparkle flecks
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillRect( 5,  3, 4, 1);
    ctx.fillRect(20, 11, 4, 1);
    ctx.fillRect(10, 19, 4, 1);
    ctx.fillRect(24, 27, 4, 1);

    c.refresh();
  }

  // ─── Tree — top-down canopy (32 × 32) ───────────────────────────────────────
  //
  // Drawn as overlapping rectangles to create a chunky octagonal silhouette.
  // Bright highlight in the top-left corner implies overhead lighting.

  private makeTree(): void {
    const c   = this.textures.createCanvas('tree', 32, 32)!;
    const ctx = c.getContext();

    // Outer dark shadow edge (octagonal frame)
    ctx.fillStyle = '#1a4a08';
    ctx.fillRect(6,  0, 20, 32);
    ctx.fillRect(0,  6, 32, 20);
    ctx.fillRect(3,  2, 26, 28);

    // Main mid-green canopy
    ctx.fillStyle = '#3a8c18';
    ctx.fillRect(7,  1, 18, 30);
    ctx.fillRect(1,  7, 30, 18);
    ctx.fillRect(4,  3, 24, 26);

    // Highlight band (top-left lit)
    ctx.fillStyle = '#5ab830';
    ctx.fillRect(5,  2, 16, 14);
    ctx.fillRect(2,  5, 18, 10);

    // Bright highlight cluster
    ctx.fillStyle = '#7ad448';
    ctx.fillRect(6,  4,  8,  8);
    ctx.fillRect(4,  6, 10,  4);

    // Trunk near bottom of canopy (brown wood)
    ctx.fillStyle = '#4a2f18';
    ctx.fillRect(13, 24, 6, 8);
    ctx.fillStyle = '#6a4222';
    ctx.fillRect(14, 25, 4, 6);

    c.refresh();
  }

  // ─── Bush — top-down (24 × 20) ──────────────────────────────────────────────

  private makeBush(): void {
    const c   = this.textures.createCanvas('bush', 24, 20)!;
    const ctx = c.getContext();

    // Dark outer edge
    ctx.fillStyle = '#1a5008';
    ctx.fillRect(4,  0, 16, 20);
    ctx.fillRect(0,  4, 24, 12);
    ctx.fillRect(2,  2, 20, 16);

    // Main green fill
    ctx.fillStyle = '#368a14';
    ctx.fillRect(5,  1, 14, 18);
    ctx.fillRect(1,  5, 22, 10);
    ctx.fillRect(3,  3, 18, 14);

    // Highlight
    ctx.fillStyle = '#54b42a';
    ctx.fillRect(3,  2, 11,  8);
    ctx.fillRect(2,  3, 12,  5);

    // Red berries
    ctx.fillStyle = '#cc2a2a';
    ctx.fillRect(14,  5, 3, 3);
    ctx.fillRect( 8, 12, 3, 3);

    // Berry highlights
    ctx.fillStyle = '#ff5050';
    ctx.fillRect(15,  6, 1, 1);
    ctx.fillRect( 9, 13, 1, 1);

    c.refresh();
  }

  // ─── Flower — top-down chunky (16 × 16) ─────────────────────────────────────

  private makeFlower(key: string, petalColor: string, centreColor: string): void {
    const c   = this.textures.createCanvas(key, 16, 16)!;
    const ctx = c.getContext();

    // Stem
    ctx.fillStyle = '#4a9018';
    ctx.fillRect(7, 9, 2, 7);

    // Four chunky petals
    ctx.fillStyle = petalColor;
    ctx.fillRect(3, 2, 4, 4);  // top-left
    ctx.fillRect(9, 2, 4, 4);  // top-right
    ctx.fillRect(3, 6, 4, 4);  // bottom-left
    ctx.fillRect(9, 6, 4, 4);  // bottom-right

    // Centre
    ctx.fillStyle = centreColor;
    ctx.fillRect(6, 4, 4, 4);

    // Centre highlight
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.fillRect(6, 4, 2, 2);

    c.refresh();
  }

  // ─── Shop prop textures (32 × 32) ───────────────────────────────────────────

  private makeShopItemTextures(): void {
    // Furniture
    this.makeRectProp('wooden-chair', '#8a5a2a', '#6a3e18', '#c88a48');
    this.makeRectProp('cozy-sofa', '#5468b8', '#2c3e7a', '#7e90d8');
    this.makeRectProp('oak-dresser', '#9a6a3a', '#6e4522', '#c09058');
    this.makeRectProp('feather-bed', '#ddd8c8', '#9a8f7a', '#ffffff');
    this.makeRectProp('pine-table', '#9a7a44', '#6f5430', '#c8a268');
    this.makeRectProp('rocking-chair', '#8a5a2a', '#5f3818', '#b67a40');

    // Decor
    this.makePlantProp('potted-fern', '#4a8c2a', '#6cb840', '#8a5a2a');
    this.makeCandleProp('candle-set');
    this.makePlantProp('hanging-vine', '#3a7a20', '#66b840', '#704830');
    this.makeFrameProp('landscape-print', '#8a6a48', '#3058a8', '#6aa858');
    this.makeRectProp('woven-rug', '#b05030', '#803820', '#d07848');
    this.makeFlowerProp('flower-basket', '#a06028', '#f06060', '#ffd060');

    // Structures
    this.makeFrameProp('stone-window', '#8a8a92', '#70b8ff', '#b8d8ff');
    this.makeDoorProp('carved-door', '#7a4a22', '#4e2c12');
    this.makeRectProp('cobble-wall', '#8a827a', '#66605a', '#b0a8a0');
    this.makeArchProp('wooden-arch', '#8a5a2a', '#5f3818');
    this.makeRectProp('fence-post', '#8a5a2a', '#6a3e18', '#b67a40');
    this.makeGateProp('garden-gate', '#7a4a22', '#4e2c12');

    // Special
    this.makeLanternProp('fairy-lantern', '#ffcc66', '#8a5a2a');
    this.makeCrystalProp('moon-crystal', '#9ab8ff', '#d8e6ff');
    this.makeOrbProp('mystic-orb', '#8c58d8', '#d8b0ff');
    this.makePlantProp('enchanted-bonsai', '#2f7f2a', '#7fd860', '#8a5a2a');
    this.makeStarProp('star-fragment', '#ffd048', '#fff0a0');
    this.makeBellProp('spirit-bells', '#d8b060', '#8a5a2a');
  }

  private makeRectProp(key: string, base: string, dark: string, light: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = dark;
    ctx.fillRect(6, 8, 20, 16);
    ctx.fillStyle = base;
    ctx.fillRect(7, 9, 18, 14);
    ctx.fillStyle = light;
    ctx.fillRect(8, 10, 7, 4);
    ctx.fillStyle = '#00000055';
    ctx.fillRect(8, 24, 16, 3);
    c.refresh();
  }

  private makePlantProp(key: string, leaf: string, leafHi: string, pot: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = pot;
    ctx.fillRect(10, 18, 12, 8);
    ctx.fillStyle = '#5f3818';
    ctx.fillRect(11, 24, 10, 2);
    ctx.fillStyle = leaf;
    ctx.fillRect(8, 8, 4, 10);
    ctx.fillRect(14, 6, 4, 12);
    ctx.fillRect(20, 9, 4, 9);
    ctx.fillStyle = leafHi;
    ctx.fillRect(9, 9, 2, 3);
    ctx.fillRect(15, 7, 2, 3);
    ctx.fillRect(21, 10, 2, 3);
    c.refresh();
  }

  private makeCandleProp(key: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(8, 20, 16, 4);
    ctx.fillStyle = '#f0ead8';
    ctx.fillRect(10, 13, 3, 7);
    ctx.fillRect(15, 11, 3, 9);
    ctx.fillRect(20, 14, 3, 6);
    ctx.fillStyle = '#ffcc44';
    ctx.fillRect(11, 11, 1, 2);
    ctx.fillRect(16, 9, 1, 2);
    ctx.fillRect(21, 12, 1, 2);
    c.refresh();
  }

  private makeFrameProp(key: string, frame: string, artA: string, artB: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = frame;
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = artA;
    ctx.fillRect(9, 9, 14, 7);
    ctx.fillStyle = artB;
    ctx.fillRect(9, 16, 14, 7);
    c.refresh();
  }

  private makeFlowerProp(key: string, basket: string, petal: string, center: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = basket;
    ctx.fillRect(10, 18, 12, 7);
    ctx.fillStyle = petal;
    ctx.fillRect(8, 12, 4, 4);
    ctx.fillRect(14, 10, 4, 4);
    ctx.fillRect(20, 12, 4, 4);
    ctx.fillStyle = center;
    ctx.fillRect(9, 13, 2, 2);
    ctx.fillRect(15, 11, 2, 2);
    ctx.fillRect(21, 13, 2, 2);
    c.refresh();
  }

  private makeDoorProp(key: string, wood: string, dark: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = dark;
    ctx.fillRect(9, 5, 14, 22);
    ctx.fillStyle = wood;
    ctx.fillRect(10, 6, 12, 20);
    ctx.fillStyle = '#00000033';
    ctx.fillRect(15, 6, 1, 20);
    ctx.fillStyle = '#c8a050';
    ctx.fillRect(19, 16, 2, 2);
    c.refresh();
  }

  private makeArchProp(key: string, wood: string, dark: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = dark;
    ctx.fillRect(6, 8, 4, 18);
    ctx.fillRect(22, 8, 4, 18);
    ctx.fillRect(10, 6, 12, 4);
    ctx.fillStyle = wood;
    ctx.fillRect(7, 9, 2, 16);
    ctx.fillRect(23, 9, 2, 16);
    ctx.fillRect(11, 7, 10, 2);
    c.refresh();
  }

  private makeGateProp(key: string, wood: string, dark: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = dark;
    ctx.fillRect(8, 9, 16, 15);
    ctx.fillStyle = wood;
    ctx.fillRect(9, 10, 14, 13);
    ctx.fillStyle = '#5f3818';
    for (let x = 10; x <= 20; x += 3) ctx.fillRect(x, 10, 1, 13);
    c.refresh();
  }

  private makeLanternProp(key: string, glow: string, frame: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = frame;
    ctx.fillRect(11, 9, 10, 14);
    ctx.fillStyle = glow;
    ctx.fillRect(12, 10, 8, 10);
    ctx.fillStyle = '#fff2aa';
    ctx.fillRect(14, 12, 4, 3);
    ctx.fillStyle = frame;
    ctx.fillRect(14, 6, 4, 3);
    c.refresh();
  }

  private makeCrystalProp(key: string, base: string, hi: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = base;
    ctx.fillRect(14, 7, 4, 18);
    ctx.fillRect(12, 10, 8, 12);
    ctx.fillStyle = hi;
    ctx.fillRect(14, 10, 2, 8);
    c.refresh();
  }

  private makeOrbProp(key: string, base: string, hi: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(12, 21, 8, 4);
    ctx.fillStyle = base;
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillStyle = hi;
    ctx.fillRect(12, 12, 4, 4);
    c.refresh();
  }

  private makeStarProp(key: string, base: string, hi: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = base;
    ctx.fillRect(14, 8, 4, 16);
    ctx.fillRect(8, 14, 16, 4);
    ctx.fillRect(11, 11, 10, 10);
    ctx.fillStyle = hi;
    ctx.fillRect(15, 10, 2, 2);
    c.refresh();
  }

  private makeBellProp(key: string, base: string, dark: string): void {
    const c = this.textures.createCanvas(key, 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = dark;
    ctx.fillRect(10, 11, 12, 11);
    ctx.fillStyle = base;
    ctx.fillRect(11, 12, 10, 9);
    ctx.fillStyle = '#f5da8e';
    ctx.fillRect(15, 8, 2, 3);
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(15, 22, 2, 2);
    c.refresh();
  }
}
