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
    this.makeRock();
    this.makeLeaf();
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
    const c   = this.textures.createCanvas('bush', 24, 24)!;  // +4 rows for shadow
    const ctx = c.getContext();

    // ── Soft drop shadow — three concentric rectangles fade to transparent ────
    ctx.fillStyle = 'rgba(0,0,0,0.11)';
    ctx.fillRect(1, 17, 22, 6);
    ctx.fillRect(0, 18, 24, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(3, 18, 18, 5);
    ctx.fillRect(2, 19, 20, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(5, 19, 14, 4);
    ctx.fillRect(4, 20, 16, 3);

    // ── Bush body (identical shape, same y-offsets as before) ─────────────────
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

    // ── Red berry dots ────────────────────────────────────────────────────────
    ctx.fillStyle = '#d42020';
    ctx.fillRect(14,  5, 3, 3);
    ctx.fillRect( 8, 12, 3, 3);
    ctx.fillRect(17, 10, 3, 3);  // third berry
    // Berry specular highlights
    ctx.fillStyle = '#ff6868';
    ctx.fillRect(15,  6, 1, 1);
    ctx.fillRect( 9, 13, 1, 1);
    ctx.fillRect(18, 11, 1, 1);

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

  // ─── Boulder (28 × 26) — reference-style pixel rock ─────────────────────────
  //
  // Palette: grey-green (matches the reference pixel rock sheet)
  //   #3a4844  darkest — outline, deep crevice, base shadow
  //   #5f6e69  dark    — front face, left shadow side
  //   #8da09a  mid     — main body mass
  //   #b8ccc7  light   — upper lit surfaces
  //   #d4e6e2  bright  — top highlight plane
  //   #eaf6f2  specular— brightest peaks

  private makeRock(): void {
    const c   = this.textures.createCanvas('rock_sm', 28, 26)!;
    const ctx = c.getContext();

    // ── Ground shadow (flat ellipse beneath rock) ────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(4, 20, 20, 6);
    ctx.fillRect(2, 21, 24, 4);

    // ── Dark outline / entire silhouette ────────────────────────────────────
    ctx.fillStyle = '#3a4844';
    ctx.fillRect(5,  4, 18, 17);   // centre column
    ctx.fillRect(3,  8, 22, 13);   // wide middle band
    ctx.fillRect(4,  5, 20, 15);   // main bounds
    ctx.fillRect(3, 12,  7,  8);   // secondary lobe (lower-left)

    // ── Front face — heavy shadow on lower third ─────────────────────────────
    ctx.fillStyle = '#5f6e69';
    ctx.fillRect(5, 13, 18,  7);
    ctx.fillRect(4, 14, 20,  6);
    ctx.fillRect(3, 15, 22,  4);
    ctx.fillRect(4,  8,  4, 11);   // left shadow side
    ctx.fillRect(8, 14,  2,  6);   // crevice between lobes

    // ── Mid-tone body ────────────────────────────────────────────────────────
    ctx.fillStyle = '#8da09a';
    ctx.fillRect(6, 10, 16,  5);
    ctx.fillRect(4, 12, 20,  4);
    ctx.fillRect(5, 11, 18,  4);
    ctx.fillRect(4, 13,  6,  5);   // secondary lobe body

    // ── Upper lit surfaces ───────────────────────────────────────────────────
    ctx.fillStyle = '#b8ccc7';
    ctx.fillRect(7,  6, 14,  7);
    ctx.fillRect(5,  9, 16,  4);
    ctx.fillRect(6,  7, 12,  5);
    ctx.fillRect(4, 11,  5,  3);   // secondary lobe top

    // ── Bright top highlight ─────────────────────────────────────────────────
    ctx.fillStyle = '#d4e6e2';
    ctx.fillRect(8,  5, 10,  5);
    ctx.fillRect(7,  7, 10,  4);
    ctx.fillRect(6,  6,  8,  4);

    // ── Specular peaks ───────────────────────────────────────────────────────
    ctx.fillStyle = '#eaf6f2';
    ctx.fillRect(10,  5,  4,  2);
    ctx.fillRect( 9,  6,  3,  2);
    ctx.fillRect(14,  7,  3,  2);

    // ── Crevice lines (dark seams between stone faces) ───────────────────────
    ctx.fillStyle = '#2e3c38';
    ctx.fillRect(15,  9,  1, 10);  // main vertical seam
    ctx.fillRect(16, 15,  5,  1);  // horizontal crack right
    ctx.fillRect( 8, 12,  1,  2);  // small nick left of crevice

    c.refresh();
  }

  // ─── Leaf particle texture (8 × 8) ─────────────────────────────────────────

  private makeLeaf(): void {
    const c   = this.textures.createCanvas('leaf', 8, 8)!;
    const ctx = c.getContext();
    // White body so tint fully controls the leaf colour
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 0, 3, 1);
    ctx.fillRect(1, 1, 5, 1);
    ctx.fillRect(0, 2, 7, 2);
    ctx.fillRect(1, 4, 5, 1);
    ctx.fillRect(2, 5, 3, 1);
    // Stem
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(3, 6, 1, 2);
    // Centre vein (subtle darkening)
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(3, 0, 1, 6);
    c.refresh();
  }

  // ─── Shop prop textures (32 × 32) ───────────────────────────────────────────

  private makeShopItemTextures(): void {
    // Furniture
    this.makeWoodenChair();
    this.makeCozySofa();
    this.makeOakDresser();
    this.makeFeatherBed();
    this.makePineTable();
    this.makeRockingChair();

    // Decor
    this.makePottedFern();
    this.makeCandleSet();
    this.makeHangingVine();
    this.makeLandscapePrint();
    this.makeWovenRug();
    this.makeFlowerBasket();

    // Structures
    this.makeStoneWindow();
    this.makeCarvedDoor();
    this.makeCobbleWall();
    this.makeWoodenArch();
    this.makeFencePost();
    this.makeGardenGate();

    // Special
    this.makeFairyLantern();
    this.makeMoonCrystal();
    this.makeMysticOrb();
    this.makeEnchantedBonsai();
    this.makeStarFragment();
    this.makeSpiritBells();
  }

  // ── Furniture ────────────────────────────────────────────────────────────────

  private makeWoodenChair(): void {
    const c = this.textures.createCanvas('wooden-chair', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(7, 28, 18, 3);
    // Back legs (behind backrest)
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(8, 6, 3, 10);
    ctx.fillRect(21, 6, 3, 10);
    // Backrest frame
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(7, 4, 18, 13);
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(8, 5, 16, 11);
    // Backrest horizontal rail
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(9, 9, 14, 2);
    ctx.fillRect(9, 14, 14, 1);
    // Backrest highlight
    ctx.fillStyle = '#B07040';
    ctx.fillRect(9, 6, 7, 2);
    // Seat
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(6, 16, 20, 9);
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(7, 17, 18, 7);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(8, 18, 9, 2);
    ctx.fillStyle = '#5A3018';
    ctx.fillRect(7, 22, 18, 2);
    // Front legs
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(7, 24, 4, 5);
    ctx.fillRect(21, 24, 4, 5);
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(8, 25, 2, 4);
    ctx.fillRect(22, 25, 2, 4);
    c.refresh();
  }

  private makeCozySofa(): void {
    const c = this.textures.createCanvas('cozy-sofa', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(3, 29, 26, 3);
    // Sofa back
    ctx.fillStyle = '#1E2F6A';
    ctx.fillRect(3, 4, 26, 16);
    ctx.fillStyle = '#3558A0';
    ctx.fillRect(4, 5, 24, 14);
    ctx.fillStyle = '#6890D8';
    ctx.fillRect(5, 6, 12, 5);
    // Armrests
    ctx.fillStyle = '#1E2F6A';
    ctx.fillRect(3, 18, 6, 9);
    ctx.fillRect(23, 18, 6, 9);
    ctx.fillStyle = '#3558A0';
    ctx.fillRect(4, 19, 4, 7);
    ctx.fillRect(24, 19, 4, 7);
    ctx.fillStyle = '#6890D8';
    ctx.fillRect(5, 19, 2, 3);
    ctx.fillRect(25, 19, 2, 3);
    // Seat cushions
    ctx.fillStyle = '#1E2F6A';
    ctx.fillRect(9, 20, 14, 7);
    ctx.fillStyle = '#3558A0';
    ctx.fillRect(9, 20, 6, 7);
    ctx.fillRect(17, 20, 6, 7);
    ctx.fillStyle = '#1E2F6A';
    ctx.fillRect(15, 20, 2, 7);
    ctx.fillStyle = '#6890D8';
    ctx.fillRect(10, 21, 3, 2);
    ctx.fillRect(18, 21, 3, 2);
    // Base
    ctx.fillStyle = '#152248';
    ctx.fillRect(9, 27, 14, 2);
    c.refresh();
  }

  private makeOakDresser(): void {
    const c = this.textures.createCanvas('oak-dresser', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(4, 28, 24, 4);
    // Body
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#9A6A3A';
    ctx.fillRect(5, 5, 22, 22);
    ctx.fillStyle = '#C09058';
    ctx.fillRect(6, 5, 12, 3);
    // Drawers (3 rows)
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(7, 9, 18, 5);
    ctx.fillRect(7, 15, 18, 5);
    ctx.fillRect(7, 21, 18, 5);
    ctx.fillStyle = '#8A5A2A';
    ctx.fillRect(8, 10, 16, 3);
    ctx.fillRect(8, 16, 16, 3);
    ctx.fillRect(8, 22, 16, 3);
    ctx.fillStyle = '#C09058';
    ctx.fillRect(9, 10, 6, 1);
    ctx.fillRect(9, 16, 6, 1);
    ctx.fillRect(9, 22, 6, 1);
    // Drawer handles
    ctx.fillStyle = '#E8C060';
    ctx.fillRect(14, 11, 5, 2);
    ctx.fillRect(14, 17, 5, 2);
    ctx.fillRect(14, 23, 5, 2);
    ctx.fillStyle = '#FFF0A0';
    ctx.fillRect(15, 11, 3, 1);
    ctx.fillRect(15, 17, 3, 1);
    ctx.fillRect(15, 23, 3, 1);
    c.refresh();
  }

  private makeFeatherBed(): void {
    const c = this.textures.createCanvas('feather-bed', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(2, 29, 28, 3);
    // Headboard
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(3, 3, 26, 10);
    ctx.fillStyle = '#9A6A3A';
    ctx.fillRect(4, 4, 24, 8);
    ctx.fillStyle = '#C09058';
    ctx.fillRect(5, 5, 12, 3);
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(8, 5, 2, 6);
    ctx.fillRect(22, 5, 2, 6);
    // Bed frame sides
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(3, 12, 4, 16);
    ctx.fillRect(25, 12, 4, 16);
    ctx.fillStyle = '#9A6A3A';
    ctx.fillRect(4, 13, 2, 14);
    ctx.fillRect(26, 13, 2, 14);
    // Mattress
    ctx.fillStyle = '#D8D0C0';
    ctx.fillRect(5, 13, 22, 14);
    ctx.fillStyle = '#B09080';
    ctx.fillRect(5, 13, 22, 2);
    // Pillow
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(8, 14, 16, 5);
    ctx.fillStyle = '#EEE8E0';
    ctx.fillRect(9, 15, 14, 3);
    ctx.fillStyle = '#D8D0C8';
    ctx.fillRect(8, 18, 16, 1);
    // Blanket
    ctx.fillStyle = '#C8C0B0';
    ctx.fillRect(5, 20, 22, 7);
    ctx.fillStyle = '#B0A898';
    ctx.fillRect(5, 22, 22, 1);
    ctx.fillRect(5, 25, 22, 1);
    ctx.fillRect(13, 20, 1, 7);
    ctx.fillRect(19, 20, 1, 7);
    // Footboard
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(3, 26, 26, 4);
    ctx.fillStyle = '#9A6A3A';
    ctx.fillRect(4, 27, 24, 2);
    c.refresh();
  }

  private makePineTable(): void {
    const c = this.textures.createCanvas('pine-table', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(4, 28, 24, 4);
    // Tabletop (wider than legs)
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(2, 8, 28, 5);
    ctx.fillStyle = '#9A7040';
    ctx.fillRect(2, 5, 28, 8);
    ctx.fillStyle = '#C8A060';
    ctx.fillRect(3, 6, 14, 3);
    // Front lip
    ctx.fillStyle = '#7A5530';
    ctx.fillRect(3, 12, 26, 2);
    // Legs
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(5, 14, 6, 13);
    ctx.fillRect(21, 14, 6, 13);
    ctx.fillStyle = '#9A7040';
    ctx.fillRect(6, 15, 4, 11);
    ctx.fillRect(22, 15, 4, 11);
    ctx.fillStyle = '#C8A060';
    ctx.fillRect(7, 15, 2, 5);
    ctx.fillRect(23, 15, 2, 5);
    // Cross stretcher
    ctx.fillStyle = '#7A5530';
    ctx.fillRect(9, 22, 14, 3);
    ctx.fillStyle = '#9A7040';
    ctx.fillRect(10, 23, 12, 1);
    c.refresh();
  }

  private makeRockingChair(): void {
    const c = this.textures.createCanvas('rocking-chair', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(4, 28, 24, 3);
    // Backrest
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(8, 4, 16, 13);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(9, 5, 14, 11);
    // Vertical slats
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(11, 6, 2, 9);
    ctx.fillRect(16, 6, 2, 9);
    ctx.fillRect(21, 6, 2, 9);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(9, 6, 5, 2);
    // Seat
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(6, 16, 20, 8);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(7, 17, 18, 6);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(8, 18, 8, 2);
    // Legs
    ctx.fillStyle = '#5C3C20';
    ctx.fillRect(8, 23, 3, 4);
    ctx.fillRect(21, 23, 3, 4);
    // Rockers (curved base)
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(3, 27, 12, 2);
    ctx.fillRect(17, 27, 12, 2);
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(4, 27, 10, 1);
    ctx.fillRect(18, 27, 10, 1);
    c.refresh();
  }

  // ── Decor ─────────────────────────────────────────────────────────────────────

  private makePottedFern(): void {
    const c = this.textures.createCanvas('potted-fern', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(9, 29, 14, 3);
    // Pot
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(10, 21, 12, 8);
    ctx.fillStyle = '#C06030';
    ctx.fillRect(11, 22, 10, 6);
    ctx.fillStyle = '#E08050';
    ctx.fillRect(12, 22, 4, 2);
    // Rim
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(9, 19, 14, 3);
    ctx.fillStyle = '#C06030';
    ctx.fillRect(10, 20, 12, 2);
    // Stems & leaf fronds
    ctx.fillStyle = '#1A5008';
    ctx.fillRect(10, 7, 3, 13);
    ctx.fillRect(19, 5, 3, 15);
    ctx.fillRect(15, 9, 2, 11);
    ctx.fillStyle = '#368A14';
    ctx.fillRect(5, 9, 7, 3);
    ctx.fillRect(3, 13, 9, 3);
    ctx.fillRect(5, 17, 6, 3);
    ctx.fillRect(21, 7, 7, 3);
    ctx.fillRect(21, 11, 8, 3);
    ctx.fillRect(22, 15, 6, 3);
    ctx.fillRect(12, 4, 8, 4);
    // Leaf highlights
    ctx.fillStyle = '#54B42A';
    ctx.fillRect(6, 10, 3, 1);
    ctx.fillRect(4, 14, 4, 1);
    ctx.fillRect(22, 8, 3, 1);
    ctx.fillRect(22, 12, 4, 1);
    ctx.fillRect(13, 5, 5, 1);
    c.refresh();
  }

  private makeCandleSet(): void {
    const c = this.textures.createCanvas('candle-set', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(6, 28, 20, 3);
    // Holder plate
    ctx.fillStyle = '#8A6A30';
    ctx.fillRect(6, 22, 20, 4);
    ctx.fillStyle = '#C89A50';
    ctx.fillRect(7, 23, 18, 2);
    // Tall center candle (cream)
    ctx.fillStyle = '#E8E0D0';
    ctx.fillRect(14, 8, 4, 14);
    ctx.fillStyle = '#F8F0E0';
    ctx.fillRect(15, 9, 2, 12);
    // Short left candle (sage)
    ctx.fillStyle = '#D0E8E0';
    ctx.fillRect(8, 13, 4, 9);
    ctx.fillStyle = '#E8F8F0';
    ctx.fillRect(9, 14, 2, 7);
    // Short right candle (rose)
    ctx.fillStyle = '#E8D0D0';
    ctx.fillRect(20, 15, 4, 7);
    ctx.fillStyle = '#F8E8E8';
    ctx.fillRect(21, 16, 2, 5);
    // Flames
    ctx.fillStyle = '#FF8820';
    ctx.fillRect(15, 5, 2, 3);
    ctx.fillRect(9, 10, 2, 3);
    ctx.fillRect(21, 12, 2, 3);
    ctx.fillStyle = '#FFCC00';
    ctx.fillRect(15, 5, 2, 2);
    ctx.fillRect(9, 10, 2, 2);
    ctx.fillRect(21, 12, 2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(15, 5, 2, 1);
    ctx.fillRect(9, 10, 2, 1);
    ctx.fillRect(21, 12, 2, 1);
    // Wicks
    ctx.fillStyle = '#3A2010';
    ctx.fillRect(15, 8, 2, 1);
    ctx.fillRect(9, 13, 2, 1);
    ctx.fillRect(21, 15, 2, 1);
    c.refresh();
  }

  private makeHangingVine(): void {
    const c = this.textures.createCanvas('hanging-vine', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(10, 29, 12, 3);
    // Ceiling hook
    ctx.fillStyle = '#6A4820';
    ctx.fillRect(14, 2, 4, 3);
    // Main stem
    ctx.fillStyle = '#3A7A20';
    ctx.fillRect(15, 4, 2, 22);
    // Branch stems
    ctx.fillStyle = '#3A7A20';
    ctx.fillRect(10, 9, 6, 2);
    ctx.fillRect(17, 14, 6, 2);
    ctx.fillRect(9, 20, 7, 2);
    ctx.fillRect(17, 24, 6, 2);
    // Leaf clusters
    ctx.fillStyle = '#4AAA28';
    ctx.fillRect(5, 8, 6, 4);
    ctx.fillRect(21, 13, 6, 4);
    ctx.fillRect(4, 19, 6, 4);
    ctx.fillRect(21, 23, 6, 4);
    ctx.fillRect(13, 25, 6, 4);
    // Highlights
    ctx.fillStyle = '#70CC40';
    ctx.fillRect(6, 9, 2, 2);
    ctx.fillRect(22, 14, 2, 2);
    ctx.fillRect(5, 20, 2, 2);
    ctx.fillRect(22, 24, 2, 2);
    ctx.fillRect(14, 26, 2, 2);
    // Node bumps on stem
    ctx.fillStyle = '#2A6018';
    ctx.fillRect(14, 11, 4, 2);
    ctx.fillRect(14, 17, 4, 2);
    ctx.fillRect(14, 23, 4, 2);
    c.refresh();
  }

  private makeLandscapePrint(): void {
    const c = this.textures.createCanvas('landscape-print', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(5, 29, 22, 3);
    // Outer frame
    ctx.fillStyle = '#6A4A28';
    ctx.fillRect(4, 3, 24, 26);
    ctx.fillStyle = '#9A6A40';
    ctx.fillRect(5, 4, 22, 24);
    // Inner matte
    ctx.fillStyle = '#F0E8D8';
    ctx.fillRect(7, 6, 18, 18);
    // Sky
    ctx.fillStyle = '#6090D8';
    ctx.fillRect(8, 7, 16, 8);
    // Clouds
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(9, 8, 6, 3);
    ctx.fillRect(17, 9, 5, 2);
    // Hills
    ctx.fillStyle = '#508030';
    ctx.fillRect(8, 14, 16, 4);
    ctx.fillStyle = '#6AAA40';
    ctx.fillRect(8, 13, 10, 2);
    ctx.fillRect(18, 12, 6, 3);
    // Small tree
    ctx.fillStyle = '#2A5010';
    ctx.fillRect(12, 10, 3, 4);
    ctx.fillStyle = '#408020';
    ctx.fillRect(11, 9, 5, 3);
    // Foreground
    ctx.fillStyle = '#4A7020';
    ctx.fillRect(8, 18, 16, 3);
    // Frame inner shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(7, 6, 18, 2);
    ctx.fillRect(7, 6, 2, 18);
    c.refresh();
  }

  private makeWovenRug(): void {
    const c = this.textures.createCanvas('woven-rug', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(2, 29, 28, 3);
    // Rug base
    ctx.fillStyle = '#C04820';
    ctx.fillRect(2, 6, 28, 22);
    // Border
    ctx.fillStyle = '#8A3010';
    ctx.fillRect(2, 6, 28, 3);
    ctx.fillRect(2, 25, 28, 3);
    ctx.fillRect(2, 6, 3, 22);
    ctx.fillRect(27, 6, 3, 22);
    // Gold inner stripe
    ctx.fillStyle = '#E8C040';
    ctx.fillRect(4, 9, 24, 2);
    ctx.fillRect(4, 23, 24, 2);
    ctx.fillRect(4, 9, 2, 16);
    ctx.fillRect(26, 9, 2, 16);
    // Center medallion
    ctx.fillStyle = '#8A3010';
    ctx.fillRect(12, 14, 8, 6);
    ctx.fillRect(10, 15, 12, 4);
    ctx.fillStyle = '#E8C040';
    ctx.fillRect(13, 15, 6, 4);
    ctx.fillRect(12, 16, 8, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(15, 16, 2, 2);
    // Fringe
    ctx.fillStyle = '#D06030';
    for (let x = 4; x < 28; x += 3) {
      ctx.fillRect(x, 5, 2, 2);
      ctx.fillRect(x, 28, 2, 2);
    }
    c.refresh();
  }

  private makeFlowerBasket(): void {
    const c = this.textures.createCanvas('flower-basket', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(8, 28, 16, 3);
    // Basket
    ctx.fillStyle = '#8B5E2A';
    ctx.fillRect(9, 18, 14, 10);
    ctx.fillStyle = '#C89048';
    ctx.fillRect(10, 19, 12, 8);
    // Weave lines
    ctx.fillStyle = '#A07030';
    ctx.fillRect(10, 21, 12, 2);
    ctx.fillRect(10, 24, 12, 2);
    ctx.fillRect(12, 19, 2, 8);
    ctx.fillRect(17, 19, 2, 8);
    // Rim
    ctx.fillStyle = '#8B5E2A';
    ctx.fillRect(9, 16, 14, 3);
    ctx.fillStyle = '#C89048';
    ctx.fillRect(10, 17, 12, 2);
    // Red flower
    ctx.fillStyle = '#E02020';
    ctx.fillRect(9, 10, 5, 5);
    ctx.fillStyle = '#FF5050';
    ctx.fillRect(10, 11, 3, 3);
    ctx.fillStyle = '#FFD040';
    ctx.fillRect(11, 12, 2, 2);
    // Pink flower
    ctx.fillStyle = '#D050A0';
    ctx.fillRect(14, 8, 5, 5);
    ctx.fillStyle = '#FF90C0';
    ctx.fillRect(15, 9, 3, 3);
    ctx.fillStyle = '#FFEE60';
    ctx.fillRect(16, 10, 2, 2);
    // Yellow flower
    ctx.fillStyle = '#D0B010';
    ctx.fillRect(19, 11, 5, 5);
    ctx.fillStyle = '#FFE060';
    ctx.fillRect(20, 12, 3, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(21, 13, 2, 2);
    // Green stems/leaves
    ctx.fillStyle = '#3A8A18';
    ctx.fillRect(11, 14, 2, 4);
    ctx.fillRect(16, 12, 2, 6);
    ctx.fillRect(21, 15, 2, 3);
    ctx.fillRect(8, 13, 4, 2);
    ctx.fillRect(22, 14, 5, 2);
    c.refresh();
  }

  // ── Structures ───────────────────────────────────────────────────────────────

  private makeStoneWindow(): void {
    const c = this.textures.createCanvas('stone-window', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(4, 29, 24, 3);
    // Frame
    ctx.fillStyle = '#5A6060';
    ctx.fillRect(4, 3, 24, 26);
    ctx.fillStyle = '#8A9090';
    ctx.fillRect(5, 4, 22, 24);
    ctx.fillStyle = '#B0BCBC';
    ctx.fillRect(5, 4, 12, 4);
    // Glass area
    ctx.fillStyle = '#2050A0';
    ctx.fillRect(8, 7, 16, 18);
    ctx.fillStyle = '#5888D8';
    ctx.fillRect(9, 8, 14, 16);
    // Pane dividers (cross)
    ctx.fillStyle = '#6A7878';
    ctx.fillRect(8, 15, 16, 3);
    ctx.fillRect(15, 7, 3, 18);
    ctx.fillStyle = '#8A9090';
    ctx.fillRect(9, 16, 14, 1);
    ctx.fillRect(16, 8, 1, 16);
    // Glass reflections (each pane)
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.fillRect(10, 9, 4, 5);
    ctx.fillRect(17, 9, 4, 5);
    ctx.fillRect(10, 19, 4, 4);
    ctx.fillRect(17, 19, 4, 4);
    // Sill
    ctx.fillStyle = '#6A7878';
    ctx.fillRect(5, 25, 22, 3);
    ctx.fillStyle = '#A0ACAC';
    ctx.fillRect(6, 25, 20, 2);
    c.refresh();
  }

  private makeCarvedDoor(): void {
    const c = this.textures.createCanvas('carved-door', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(5, 29, 22, 3);
    // Door frame
    ctx.fillStyle = '#2A1408';
    ctx.fillRect(6, 2, 20, 28);
    ctx.fillStyle = '#5A3018';
    ctx.fillRect(7, 3, 18, 26);
    // Door face
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(9, 5, 14, 22);
    // Wood grain lines
    ctx.fillStyle = '#5A3018';
    ctx.fillRect(9, 10, 14, 1);
    ctx.fillRect(9, 15, 14, 1);
    ctx.fillRect(9, 20, 14, 1);
    // Inset panels
    ctx.fillStyle = '#5A3018';
    ctx.fillRect(10, 7, 12, 8);
    ctx.fillRect(10, 17, 12, 9);
    ctx.fillStyle = '#8A5A2A';
    ctx.fillRect(11, 8, 10, 6);
    ctx.fillRect(11, 18, 10, 7);
    ctx.fillStyle = '#B07840';
    ctx.fillRect(12, 9, 4, 2);
    ctx.fillRect(12, 19, 4, 2);
    // Left edge highlight
    ctx.fillStyle = '#B07840';
    ctx.fillRect(9, 5, 2, 22);
    // Doorknob
    ctx.fillStyle = '#E8C040';
    ctx.fillRect(20, 15, 3, 3);
    ctx.fillStyle = '#FFF090';
    ctx.fillRect(21, 15, 2, 2);
    c.refresh();
  }

  private makeCobbleWall(): void {
    const c = this.textures.createCanvas('cobble-wall', 32, 32)!;
    const ctx = c.getContext();
    // Wall base (grout)
    ctx.fillStyle = '#5A5450';
    ctx.fillRect(2, 6, 28, 22);
    // Row 1 stones
    ctx.fillStyle = '#8A8078';
    ctx.fillRect(3, 7, 12, 6);
    ctx.fillRect(16, 7, 13, 6);
    ctx.fillStyle = '#A09890';
    ctx.fillRect(4, 8, 10, 4);
    ctx.fillRect(17, 8, 11, 4);
    // Row 2 (offset)
    ctx.fillStyle = '#8A8078';
    ctx.fillRect(3, 14, 7, 6);
    ctx.fillRect(11, 14, 11, 6);
    ctx.fillRect(23, 14, 6, 6);
    ctx.fillStyle = '#A09890';
    ctx.fillRect(4, 15, 5, 4);
    ctx.fillRect(12, 15, 9, 4);
    ctx.fillRect(24, 15, 4, 4);
    // Row 3
    ctx.fillStyle = '#8A8078';
    ctx.fillRect(3, 21, 12, 6);
    ctx.fillRect(16, 21, 13, 6);
    ctx.fillStyle = '#A09890';
    ctx.fillRect(4, 22, 10, 4);
    ctx.fillRect(17, 22, 11, 4);
    // Stone highlights
    ctx.fillStyle = '#C0B8B0';
    ctx.fillRect(4, 8, 4, 2);
    ctx.fillRect(17, 8, 4, 2);
    ctx.fillRect(4, 15, 3, 2);
    ctx.fillRect(12, 15, 4, 2);
    ctx.fillRect(24, 15, 3, 2);
    ctx.fillRect(4, 22, 4, 2);
    ctx.fillRect(17, 22, 4, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(2, 26, 28, 3);
    c.refresh();
  }

  private makeWoodenArch(): void {
    const c = this.textures.createCanvas('wooden-arch', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(3, 28, 26, 4);
    // Left post
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(4, 8, 7, 20);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(5, 9, 5, 18);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(6, 9, 2, 10);
    // Right post
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(21, 8, 7, 20);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(22, 9, 5, 18);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(23, 9, 2, 10);
    // Top crossbeam
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(4, 4, 24, 7);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(5, 5, 22, 5);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(6, 6, 12, 2);
    // Notch cuts at post tops
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(5, 11, 5, 2);
    ctx.fillRect(22, 11, 5, 2);
    // Lower tie beam
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(10, 19, 12, 5);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(11, 20, 10, 3);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(12, 20, 5, 1);
    c.refresh();
  }

  private makeFencePost(): void {
    const c = this.textures.createCanvas('fence-post', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(4, 28, 24, 4);
    // Horizontal rails
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(2, 12, 28, 4);
    ctx.fillRect(2, 20, 28, 4);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(3, 13, 26, 2);
    ctx.fillRect(3, 21, 26, 2);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(3, 13, 14, 1);
    ctx.fillRect(3, 21, 14, 1);
    // Vertical pickets (5)
    for (let i = 0; i < 5; i++) {
      const bx = 4 + i * 6;
      ctx.fillStyle = '#3D2010';
      ctx.fillRect(bx, 6, 4, 20);
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(bx + 1, 7, 2, 18);
      // Pointed tops
      ctx.fillStyle = '#3D2010';
      ctx.fillRect(bx + 1, 4, 2, 3);
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(bx + 1, 5, 2, 2);
    }
    c.refresh();
  }

  private makeGardenGate(): void {
    const c = this.textures.createCanvas('garden-gate', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(3, 28, 26, 4);
    // Gate posts
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(3, 4, 5, 24);
    ctx.fillRect(24, 4, 5, 24);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(4, 5, 3, 22);
    ctx.fillRect(25, 5, 3, 22);
    // Top crossbeam
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(3, 4, 26, 5);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(4, 5, 24, 3);
    // Gate bars (5 pickets)
    for (let x = 9; x <= 21; x += 3) {
      ctx.fillStyle = '#5A3018';
      ctx.fillRect(x, 9, 2, 18);
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(x, 9, 1, 18);
    }
    // Horizontal cross-brace
    ctx.fillStyle = '#5A3018';
    ctx.fillRect(8, 18, 16, 3);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(9, 19, 14, 1);
    // Hinge/latch
    ctx.fillStyle = '#D8A030';
    ctx.fillRect(22, 13, 3, 3);
    ctx.fillStyle = '#FFD060';
    ctx.fillRect(23, 14, 2, 1);
    c.refresh();
  }

  // ── Special ──────────────────────────────────────────────────────────────────

  private makeFairyLantern(): void {
    const c = this.textures.createCanvas('fairy-lantern', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(10, 28, 12, 3);
    // Hanging chain
    ctx.fillStyle = '#8A6A2A';
    ctx.fillRect(15, 2, 2, 5);
    // Cap
    ctx.fillStyle = '#5A3A10';
    ctx.fillRect(11, 6, 10, 3);
    ctx.fillStyle = '#9A6A2A';
    ctx.fillRect(12, 7, 8, 2);
    // Lantern body
    ctx.fillStyle = '#5A3A10';
    ctx.fillRect(10, 8, 12, 16);
    // Glow (amber layers)
    ctx.fillStyle = '#FF9020';
    ctx.fillRect(11, 9, 10, 14);
    ctx.fillStyle = '#FFCC60';
    ctx.fillRect(12, 10, 8, 10);
    ctx.fillStyle = '#FFEE90';
    ctx.fillRect(13, 12, 6, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(14, 13, 4, 4);
    // Frame bars over glow
    ctx.fillStyle = '#5A3A10';
    ctx.fillRect(10, 15, 12, 2);
    ctx.fillRect(15, 8, 2, 16);
    // Tassel
    ctx.fillStyle = '#5A3A10';
    ctx.fillRect(14, 24, 4, 2);
    ctx.fillStyle = '#FFCC60';
    ctx.fillRect(12, 26, 2, 2);
    ctx.fillRect(15, 26, 2, 2);
    ctx.fillRect(18, 26, 2, 2);
    // Soft glow halo
    ctx.fillStyle = 'rgba(255,160,32,0.22)';
    ctx.fillRect(8, 7, 16, 18);
    c.refresh();
  }

  private makeMoonCrystal(): void {
    const c = this.textures.createCanvas('moon-crystal', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(11, 28, 10, 3);
    // Pedestal
    ctx.fillStyle = '#6A6A7A';
    ctx.fillRect(10, 24, 12, 4);
    ctx.fillStyle = '#9090A8';
    ctx.fillRect(11, 25, 10, 2);
    // Crystal shaft
    ctx.fillStyle = '#6888D0';
    ctx.fillRect(12, 8, 8, 16);
    ctx.fillRect(10, 12, 12, 8);
    // Lit face
    ctx.fillStyle = '#9AB8F0';
    ctx.fillRect(13, 8, 5, 14);
    ctx.fillRect(10, 13, 5, 6);
    // Highlights
    ctx.fillStyle = '#D8E8FF';
    ctx.fillRect(13, 9, 3, 8);
    ctx.fillRect(11, 14, 2, 4);
    // Tip
    ctx.fillStyle = '#9AB8F0';
    ctx.fillRect(13, 5, 6, 4);
    ctx.fillStyle = '#D8E8FF';
    ctx.fillRect(14, 5, 3, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(15, 5, 2, 1);
    // Floating sparkles
    ctx.fillStyle = '#C0D8FF';
    ctx.fillRect(8, 10, 2, 2);
    ctx.fillRect(22, 12, 2, 2);
    ctx.fillRect(16, 3, 2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(8, 10, 1, 1);
    ctx.fillRect(22, 12, 1, 1);
    ctx.fillRect(17, 3, 1, 1);
    c.refresh();
  }

  private makeMysticOrb(): void {
    const c = this.textures.createCanvas('mystic-orb', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(9, 28, 14, 3);
    // Pedestal
    ctx.fillStyle = '#3A2810';
    ctx.fillRect(13, 23, 6, 4);
    ctx.fillRect(10, 26, 12, 3);
    ctx.fillStyle = '#6A4820';
    ctx.fillRect(14, 24, 4, 2);
    ctx.fillRect(11, 27, 10, 1);
    // Orb body (octagonal silhouette)
    ctx.fillStyle = '#4A2890';
    ctx.fillRect(10, 6, 12, 18);
    ctx.fillRect(8, 8, 16, 14);
    ctx.fillRect(9, 7, 14, 16);
    // Main orb fill
    ctx.fillStyle = '#7A40D8';
    ctx.fillRect(11, 7, 10, 16);
    ctx.fillRect(9, 9, 14, 12);
    // Highlight
    ctx.fillStyle = '#B080F0';
    ctx.fillRect(11, 8, 7, 8);
    ctx.fillRect(10, 10, 4, 6);
    ctx.fillStyle = '#D8B8FF';
    ctx.fillRect(12, 9, 4, 4);
    ctx.fillRect(11, 11, 2, 3);
    // Swirl details
    ctx.fillStyle = 'rgba(180,100,255,0.55)';
    ctx.fillRect(14, 16, 6, 2);
    ctx.fillRect(12, 19, 4, 2);
    // Sparkle
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(13, 10, 2, 2);
    ctx.fillRect(20, 14, 2, 2);
    c.refresh();
  }

  private makeEnchantedBonsai(): void {
    const c = this.textures.createCanvas('enchanted-bonsai', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(7, 28, 18, 3);
    // Pot (deep purple)
    ctx.fillStyle = '#3A3050';
    ctx.fillRect(11, 22, 10, 7);
    ctx.fillStyle = '#5A4880';
    ctx.fillRect(12, 23, 8, 5);
    ctx.fillStyle = '#7A68A8';
    ctx.fillRect(13, 23, 4, 2);
    // Pot rim
    ctx.fillStyle = '#3A3050';
    ctx.fillRect(10, 21, 12, 3);
    ctx.fillStyle = '#5A4880';
    ctx.fillRect(11, 22, 10, 2);
    // Trunk (magical twist)
    ctx.fillStyle = '#3A2818';
    ctx.fillRect(14, 12, 4, 10);
    ctx.fillRect(13, 15, 3, 5);
    ctx.fillRect(16, 13, 3, 7);
    ctx.fillStyle = '#6A4830';
    ctx.fillRect(15, 13, 2, 8);
    ctx.fillStyle = 'rgba(120,60,200,0.45)';
    ctx.fillRect(13, 14, 6, 6);
    // Canopy (glowing)
    ctx.fillStyle = '#185018';
    ctx.fillRect(6, 4, 20, 12);
    ctx.fillRect(4, 6, 24, 8);
    ctx.fillStyle = '#38A030';
    ctx.fillRect(8, 5, 16, 10);
    ctx.fillRect(6, 7, 20, 6);
    // Magical sparkles on leaves
    ctx.fillStyle = '#80FF60';
    ctx.fillRect(9, 6, 3, 2);
    ctx.fillRect(16, 5, 3, 2);
    ctx.fillRect(11, 10, 3, 2);
    ctx.fillRect(20, 8, 3, 2);
    // Purple magical stars
    ctx.fillStyle = '#D060FF';
    ctx.fillRect(8, 7, 2, 2);
    ctx.fillRect(20, 6, 2, 2);
    ctx.fillRect(13, 4, 2, 2);
    ctx.fillRect(22, 9, 2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(8, 7, 1, 1);
    ctx.fillRect(20, 6, 1, 1);
    ctx.fillRect(14, 4, 1, 1);
    c.refresh();
  }

  private makeStarFragment(): void {
    const c = this.textures.createCanvas('star-fragment', 32, 32)!;
    const ctx = c.getContext();
    // Glow aura
    ctx.fillStyle = 'rgba(255,220,80,0.22)';
    ctx.fillRect(6, 6, 20, 20);
    ctx.fillStyle = 'rgba(255,220,80,0.15)';
    ctx.fillRect(4, 8, 24, 16);
    // Star body (4-pointed cross shape)
    ctx.fillStyle = '#D0A020';
    ctx.fillRect(13, 4, 6, 24);
    ctx.fillRect(4, 13, 24, 6);
    ctx.fillRect(9, 9, 14, 14);
    // Bright face
    ctx.fillStyle = '#F0CC40';
    ctx.fillRect(14, 5, 4, 22);
    ctx.fillRect(5, 14, 22, 4);
    ctx.fillRect(10, 10, 12, 12);
    // Highlights
    ctx.fillStyle = '#FFEE90';
    ctx.fillRect(14, 6, 3, 10);
    ctx.fillRect(14, 14, 3, 10);
    ctx.fillRect(6, 14, 10, 3);
    ctx.fillRect(16, 14, 10, 3);
    // White center
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(14, 13, 4, 6);
    ctx.fillRect(13, 14, 6, 4);
    ctx.fillRect(15, 15, 2, 2);
    // Pointed tips
    ctx.fillStyle = '#FFE060';
    ctx.fillRect(14, 4, 4, 2);
    ctx.fillRect(14, 26, 4, 2);
    ctx.fillRect(4, 14, 2, 4);
    ctx.fillRect(26, 14, 2, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(15, 4, 2, 1);
    ctx.fillRect(15, 27, 2, 1);
    ctx.fillRect(4, 15, 1, 2);
    ctx.fillRect(27, 15, 1, 2);
    c.refresh();
  }

  private makeSpiritBells(): void {
    const c = this.textures.createCanvas('spirit-bells', 32, 32)!;
    const ctx = c.getContext();
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(6, 28, 20, 3);
    // Hanging cord
    ctx.fillStyle = '#7A5A2A';
    ctx.fillRect(15, 2, 2, 5);
    ctx.fillRect(10, 5, 12, 2);
    ctx.fillRect(10, 5, 2, 4);
    ctx.fillRect(20, 5, 2, 4);
    // Left bell
    ctx.fillStyle = '#8A6020';
    ctx.fillRect(7, 9, 8, 10);
    ctx.fillStyle = '#D8A030';
    ctx.fillRect(8, 10, 6, 8);
    ctx.fillStyle = '#F0C050';
    ctx.fillRect(9, 10, 3, 4);
    ctx.fillStyle = '#8A6020';
    ctx.fillRect(8, 18, 6, 2);
    ctx.fillRect(10, 8, 2, 2);
    ctx.fillStyle = '#6A4818';
    ctx.fillRect(10, 20, 2, 3);
    // Center bell (taller)
    ctx.fillStyle = '#8A6020';
    ctx.fillRect(12, 6, 8, 12);
    ctx.fillStyle = '#D8A030';
    ctx.fillRect(13, 7, 6, 10);
    ctx.fillStyle = '#F0C050';
    ctx.fillRect(14, 7, 3, 5);
    ctx.fillStyle = '#8A6020';
    ctx.fillRect(13, 17, 6, 2);
    ctx.fillRect(15, 5, 2, 2);
    ctx.fillStyle = '#6A4818';
    ctx.fillRect(15, 19, 2, 4);
    // Right bell
    ctx.fillStyle = '#8A6020';
    ctx.fillRect(17, 9, 8, 10);
    ctx.fillStyle = '#D8A030';
    ctx.fillRect(18, 10, 6, 8);
    ctx.fillStyle = '#F0C050';
    ctx.fillRect(19, 10, 3, 4);
    ctx.fillStyle = '#8A6020';
    ctx.fillRect(18, 18, 6, 2);
    ctx.fillRect(20, 8, 2, 2);
    ctx.fillStyle = '#6A4818';
    ctx.fillRect(20, 20, 2, 3);
    // Decorative rings
    ctx.fillStyle = '#F0C050';
    ctx.fillRect(8, 14, 6, 1);
    ctx.fillRect(13, 13, 6, 1);
    ctx.fillRect(18, 14, 6, 1);
    c.refresh();
  }
}
