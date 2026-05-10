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

    // Dark centre (trunk peek-through)
    ctx.fillStyle = '#1a4a08';
    ctx.fillRect(12, 12,  8,  8);
    ctx.fillStyle = '#2a6814';
    ctx.fillRect(13, 13,  6,  6);

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
}
