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
    this.makeCherryBlossom();
    this.makeBush();
    this.makeFlower('flower_r', '#e03030', '#ffcc00');
    this.makeFlower('flower_y', '#f0c010', '#ff9900');
    this.makeRock();
    this.makeLeaf();
    this.makeBlossomPetal();
    this.makeSparkle();
    this.makeSmokePuff();
    this.makeLightMask();
    this.makeGrassDetailSprites();
    this.makeFoliageSprite();
    this.makeShopItemTextures();
    this.scene.start('GameScene');
  }

  // ─── Pond water tile (32 × 32) ──────────────────────────────────────────────

  private makeWaterTile(): void {
    const c = this.textures.createCanvas('water', 32, 32)!;
    const ctx = c.getContext();

    ctx.fillStyle = '#3898d8';
    ctx.fillRect(0, 0, 32, 32);

    // Lighter wave crests
    ctx.fillStyle = '#54b0f0';
    ctx.fillRect(0, 2, 32, 2);
    ctx.fillRect(0, 10, 32, 2);
    ctx.fillRect(0, 18, 32, 2);
    ctx.fillRect(0, 26, 32, 2);

    // Darker wave troughs
    ctx.fillStyle = '#2878b8';
    ctx.fillRect(0, 6, 32, 2);
    ctx.fillRect(0, 14, 32, 2);
    ctx.fillRect(0, 22, 32, 2);
    ctx.fillRect(0, 30, 32, 2);

    // Foam sparkle flecks
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillRect(5, 3, 4, 1);
    ctx.fillRect(20, 11, 4, 1);
    ctx.fillRect(10, 19, 4, 1);
    ctx.fillRect(24, 27, 4, 1);

    c.refresh();
  }

  // ─── Tree — oak (32 × 52) ────────────────────────────────────────────────────
  //
  // Side/¾-view oak: broad spreading canopy (y 0-30) + visible trunk (y 28-51).
  // Five green shades build depth; lobe-edge shadows suggest the irregular
  // bumpy oak silhouette. Anchor via setOrigin(0.5, 0.7) lands mid-trunk.

  private makeTree(): void {
    const c = this.textures.createCanvas('tree', 32, 52)!;
    const ctx = c.getContext();

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(8, 47, 16, 4);
    ctx.fillRect(6, 48, 20, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(4, 49, 24, 2);

    // Trunk — drawn first so the canopy overlaps the top of it naturally
    ctx.fillStyle = '#3d1e0a';  // dark outline
    ctx.fillRect(12, 28, 8, 24);
    ctx.fillStyle = '#6b3d1e';  // bark
    ctx.fillRect(13, 29, 6, 22);
    ctx.fillStyle = '#8b5530';  // lit left face
    ctx.fillRect(13, 29, 3, 20);
    ctx.fillStyle = '#2a1006';  // deep-shadow right edge
    ctx.fillRect(18, 29, 2, 22);
    ctx.fillStyle = '#4a2912';  // vertical bark fissures
    ctx.fillRect(15, 34, 1, 15);
    ctx.fillRect(17, 39, 1, 9);

    // Canopy — broad rounded shape (~30 px wide, 30 px tall)
    // 1. Outermost dark ring (silhouette definition)
    ctx.fillStyle = '#193e08';
    ctx.fillRect(8, 0, 16, 1);
    ctx.fillRect(5, 1, 22, 2);
    ctx.fillRect(3, 3, 26, 3);
    ctx.fillRect(1, 5, 30, 22);
    ctx.fillRect(3, 26, 26, 3);
    ctx.fillRect(5, 28, 22, 2);
    ctx.fillRect(8, 29, 16, 1);
    // 2. Main mid-green fill
    ctx.fillStyle = '#367e14';
    ctx.fillRect(9, 1, 14, 1);
    ctx.fillRect(6, 2, 20, 2);
    ctx.fillRect(4, 4, 24, 2);
    ctx.fillRect(2, 6, 28, 20);
    ctx.fillRect(4, 25, 24, 2);
    ctx.fillRect(6, 27, 20, 1);
    ctx.fillRect(9, 28, 14, 1);
    // 3. Upper highlight band (ambient light from above-left)
    ctx.fillStyle = '#54b028';
    ctx.fillRect(4, 3, 16, 11);
    ctx.fillRect(3, 5, 17, 9);
    ctx.fillRect(5, 2, 15, 12);
    // 4. Bright cluster (direct sunlight, top-left)
    ctx.fillStyle = '#78d040';
    ctx.fillRect(5, 3, 10, 7);
    ctx.fillRect(4, 6, 12, 5);
    ctx.fillRect(6, 4, 11, 8);
    // 5. Specular hotspot
    ctx.fillStyle = '#9ce050';
    ctx.fillRect(6, 5, 6, 5);
    ctx.fillRect(7, 7, 5, 4);
    // Oak lobe-edge shadows — dark patches on both sides suggest irregular lobing
    ctx.fillStyle = '#1a4e0a';
    ctx.fillRect(2, 7, 2, 4);
    ctx.fillRect(2, 14, 2, 4);
    ctx.fillRect(2, 20, 2, 3);
    ctx.fillRect(28, 7, 2, 4);
    ctx.fillRect(28, 14, 2, 4);
    ctx.fillRect(28, 20, 2, 3);

    c.refresh();
  }

  // ─── Bush — top-down (24 × 20) ──────────────────────────────────────────────

  private makeBush(): void {
    const c = this.textures.createCanvas('bush', 24, 24)!;  // +4 rows for shadow
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
    ctx.fillRect(4, 0, 16, 20);
    ctx.fillRect(0, 4, 24, 12);
    ctx.fillRect(2, 2, 20, 16);
    // Main green fill
    ctx.fillStyle = '#368a14';
    ctx.fillRect(5, 1, 14, 18);
    ctx.fillRect(1, 5, 22, 10);
    ctx.fillRect(3, 3, 18, 14);
    // Highlight
    ctx.fillStyle = '#54b42a';
    ctx.fillRect(3, 2, 11, 8);
    ctx.fillRect(2, 3, 12, 5);

    // ── Red berry dots ────────────────────────────────────────────────────────
    ctx.fillStyle = '#d42020';
    ctx.fillRect(14, 5, 3, 3);
    ctx.fillRect(8, 12, 3, 3);
    ctx.fillRect(17, 10, 3, 3);  // third berry
    // Berry specular highlights
    ctx.fillStyle = '#ff6868';
    ctx.fillRect(15, 6, 1, 1);
    ctx.fillRect(9, 13, 1, 1);
    ctx.fillRect(18, 11, 1, 1);

    c.refresh();
  }

  // ─── Flower — top-down chunky (16 × 16) ─────────────────────────────────────

  private makeFlower(key: string, petalColor: string, centreColor: string): void {
    const c = this.textures.createCanvas(key, 16, 16)!;
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
    const c = this.textures.createCanvas('rock_sm', 28, 26)!;
    const ctx = c.getContext();

    // ── Ground shadow (flat ellipse beneath rock) ────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(4, 20, 20, 6);
    ctx.fillRect(2, 21, 24, 4);

    // ── Dark outline / entire silhouette ────────────────────────────────────
    ctx.fillStyle = '#3a4844';
    ctx.fillRect(5, 4, 18, 17);   // centre column
    ctx.fillRect(3, 8, 22, 13);   // wide middle band
    ctx.fillRect(4, 5, 20, 15);   // main bounds
    ctx.fillRect(3, 12, 7, 8);   // secondary lobe (lower-left)

    // ── Front face — heavy shadow on lower third ─────────────────────────────
    ctx.fillStyle = '#5f6e69';
    ctx.fillRect(5, 13, 18, 7);
    ctx.fillRect(4, 14, 20, 6);
    ctx.fillRect(3, 15, 22, 4);
    ctx.fillRect(4, 8, 4, 11);   // left shadow side
    ctx.fillRect(8, 14, 2, 6);   // crevice between lobes

    // ── Mid-tone body ────────────────────────────────────────────────────────
    ctx.fillStyle = '#8da09a';
    ctx.fillRect(6, 10, 16, 5);
    ctx.fillRect(4, 12, 20, 4);
    ctx.fillRect(5, 11, 18, 4);
    ctx.fillRect(4, 13, 6, 5);   // secondary lobe body

    // ── Upper lit surfaces ───────────────────────────────────────────────────
    ctx.fillStyle = '#b8ccc7';
    ctx.fillRect(7, 6, 14, 7);
    ctx.fillRect(5, 9, 16, 4);
    ctx.fillRect(6, 7, 12, 5);
    ctx.fillRect(4, 11, 5, 3);   // secondary lobe top

    // ── Bright top highlight ─────────────────────────────────────────────────
    ctx.fillStyle = '#d4e6e2';
    ctx.fillRect(8, 5, 10, 5);
    ctx.fillRect(7, 7, 10, 4);
    ctx.fillRect(6, 6, 8, 4);

    // ── Specular peaks ───────────────────────────────────────────────────────
    ctx.fillStyle = '#eaf6f2';
    ctx.fillRect(10, 5, 4, 2);
    ctx.fillRect(9, 6, 3, 2);
    ctx.fillRect(14, 7, 3, 2);

    // ── Crevice lines (dark seams between stone faces) ───────────────────────
    ctx.fillStyle = '#2e3c38';
    ctx.fillRect(15, 9, 1, 10);  // main vertical seam
    ctx.fillRect(16, 15, 5, 1);  // horizontal crack right
    ctx.fillRect(8, 12, 1, 2);  // small nick left of crevice

    c.refresh();
  }

  // ─── Leaf particle texture (8 × 8) ─────────────────────────────────────────

  private makeLeaf(): void {
    const c = this.textures.createCanvas('leaf', 8, 8)!;
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

  // ─── Blossom petal particle texture (6 × 6) ────────────────────────────────
  // White body so tint fully controls the colour; rounded diamond silhouette.

  private makeBlossomPetal(): void {
    const c = this.textures.createCanvas('blossom-petal', 6, 6)!;
    const ctx = c.getContext();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 0, 2, 1);
    ctx.fillRect(1, 1, 4, 1);
    ctx.fillRect(0, 2, 6, 2);
    ctx.fillRect(1, 4, 4, 1);
    ctx.fillRect(2, 5, 2, 1);
    // Centre crease
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(2, 0, 2, 6);
    c.refresh();
  }

  // ─── Cherry blossom tree (32 × 52) ─────────────────────────────────────────
  // Same canvas proportions as the oak tree; pink canopy with distributed
  // blossom clusters instead of a single upper-left green highlight.

  private makeCherryBlossom(): void {
    const c = this.textures.createCanvas('cherry-blossom', 32, 52)!;
    const ctx = c.getContext();

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(8, 47, 16, 4);
    ctx.fillRect(6, 48, 20, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(4, 49, 24, 2);

    // Trunk — grey-brown cherry bark
    ctx.fillStyle = '#3A1A08';
    ctx.fillRect(12, 28, 8, 24);
    ctx.fillStyle = '#7A3A18';
    ctx.fillRect(13, 29, 6, 22);
    ctx.fillStyle = '#9A5028';
    ctx.fillRect(13, 29, 3, 20);
    ctx.fillStyle = '#220C04';
    ctx.fillRect(18, 29, 2, 22);
    ctx.fillStyle = '#541E0C';
    ctx.fillRect(15, 34, 1, 15);

    // Branch stubs visible at canopy edges
    ctx.fillStyle = '#6A3018';
    ctx.fillRect(11, 22, 5, 7);
    ctx.fillRect(17, 20, 5, 9);

    // Canopy — 1. deep rose outer silhouette ring
    ctx.fillStyle = '#6A0E2C';
    ctx.fillRect(8, 0, 16, 1);
    ctx.fillRect(5, 1, 22, 2);
    ctx.fillRect(3, 3, 26, 3);
    ctx.fillRect(1, 5, 30, 22);
    ctx.fillRect(3, 26, 26, 3);
    ctx.fillRect(5, 28, 22, 2);
    ctx.fillRect(8, 29, 16, 1);

    // Canopy — 2. main medium-dark pink fill
    ctx.fillStyle = '#D4507A';
    ctx.fillRect(9, 1, 14, 1);
    ctx.fillRect(6, 2, 20, 2);
    ctx.fillRect(4, 4, 24, 2);
    ctx.fillRect(2, 6, 28, 20);
    ctx.fillRect(4, 25, 24, 2);
    ctx.fillRect(6, 27, 20, 1);
    ctx.fillRect(9, 28, 14, 1);

    // Canopy — 3. lighter pink distributed across the canopy
    ctx.fillStyle = '#F07898';
    ctx.fillRect(3, 4, 18, 12);   // upper-left sweep
    ctx.fillRect(14, 14, 12, 10); // mid-right patch
    ctx.fillRect(5, 19, 10, 7);   // lower-left patch

    // Canopy — 4. bright blossom clusters scattered throughout
    ctx.fillStyle = '#FFC0D8';
    ctx.fillRect(5, 3, 10, 8);    // top-left
    ctx.fillRect(16, 5, 9, 7);    // top-right
    ctx.fillRect(3, 16, 8, 6);    // mid-left
    ctx.fillRect(18, 15, 8, 8);   // mid-right
    ctx.fillRect(9, 21, 10, 5);   // bottom-centre

    // Canopy — 5. near-white centres (full-bloom flower faces)
    ctx.fillStyle = '#FFE8F4';
    ctx.fillRect(6, 4, 6, 5);     // top-left hot spot
    ctx.fillRect(18, 6, 5, 4);    // top-right hot spot
    ctx.fillRect(4, 17, 5, 4);    // mid-left hot spot
    ctx.fillRect(20, 17, 4, 5);   // mid-right hot spot
    ctx.fillRect(11, 22, 5, 3);   // bottom hot spot

    // Canopy — 6. rose-pink accent dots for depth between clusters
    ctx.fillStyle = '#B03060';
    ctx.fillRect(12, 3, 3, 2);
    ctx.fillRect(23, 10, 3, 2);
    ctx.fillRect(3, 10, 3, 2);
    ctx.fillRect(14, 15, 3, 2);
    ctx.fillRect(6, 24, 3, 2);
    ctx.fillRect(22, 22, 3, 2);

    // Canopy — 7. deep rose lobe-edge shadows (bumpy blossom-cluster silhouette)
    ctx.fillStyle = '#8C1840';
    ctx.fillRect(2, 7, 2, 4);
    ctx.fillRect(2, 14, 2, 4);
    ctx.fillRect(2, 20, 2, 3);
    ctx.fillRect(28, 7, 2, 4);
    ctx.fillRect(28, 14, 2, 4);
    ctx.fillRect(28, 20, 2, 3);

    c.refresh();
  }

  // ─── Light mask texture (256 × 256) ─────────────────────────────────────────
  // Used with RenderTexture.erase() to punch holes in the night overlay.
  // Opaque white in the centre = fully remove darkness.
  // Transparent at the edge   = leave darkness intact.

  private makeLightMask(): void {
    const SIZE = 256;
    const c = this.textures.createCanvas('light-mask', SIZE, SIZE)!;
    const ctx = c.getContext();
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, SIZE / 2);
    grad.addColorStop(0.00, 'rgba(255, 255, 255, 1.00)'); // fully removes darkness
    grad.addColorStop(0.60, 'rgba(255, 255, 255, 1.00)'); // flat top — stays fully lit
    grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.50)'); // gradual edge fade
    grad.addColorStop(0.95, 'rgba(255, 255, 255, 0.10)');
    grad.addColorStop(1.00, 'rgba(255, 255, 255, 0.00)'); // darkness fully restored

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);
    c.refresh();
  }

  // ─── Sparkle particle texture (5 × 5) ──────────────────────────────────────

  private makeSparkle(): void {
    const c = this.textures.createCanvas('sparkle', 14, 14)!;
    const ctx = c.getContext();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(6, 0, 2, 14); // vertical arm
    ctx.fillRect(0, 6, 14, 2); // horizontal arm
    ctx.fillRect(4, 4, 2, 2);  // diagonal NW nub
    ctx.fillRect(8, 4, 2, 2);  // diagonal NE nub
    ctx.fillRect(4, 8, 2, 2);  // diagonal SW nub
    ctx.fillRect(8, 8, 2, 2);  // diagonal SE nub
    c.refresh();
  }

  // ─── Smoke-puff particle texture (6 × 6) ────────────────────────────────────

  private makeSmokePuff(): void {
    const c = this.textures.createCanvas('smoke-puff', 16, 16)!;
    const ctx = c.getContext();
    // soft circular puff: dark outer ring, mid layer, bright center
    ctx.fillStyle = '#A0A0B8';
    ctx.fillRect(3, 0, 10, 16);
    ctx.fillRect(0, 3, 16, 10);
    ctx.fillStyle = '#C8C8D8';
    ctx.fillRect(2, 1, 12, 14);
    ctx.fillRect(1, 2, 14, 12);
    ctx.fillStyle = '#E8E8F4';
    ctx.fillRect(4, 4, 8, 8);
    ctx.fillStyle = '#F4F4FC';
    ctx.fillRect(6, 6, 4, 4);
    c.refresh();
  }

  // ─── Grass detail sprites ────────────────────────────────────────────────────

  private makeGrassDetailSprites(): void {
    // grass-cross-a: "+" cross, 6×6 px, light yellow-green
    const a = this.textures.createCanvas('grass-cross-a', 6, 6)!;
    const ac = a.getContext();
    ac.fillStyle = '#C8E86A';
    ac.fillRect(2, 0, 2, 6); // vertical bar
    ac.fillRect(0, 2, 6, 2); // horizontal bar
    ac.fillStyle = '#D4F07A'; // brighter centre pixel
    ac.fillRect(2, 2, 2, 2);
    a.refresh();

    // grass-cross-b: "×" X shape, 5×5 px
    const b = this.textures.createCanvas('grass-cross-b', 5, 5)!;
    const bc = b.getContext();
    bc.fillStyle = '#C8E86A';
    bc.fillRect(0, 0, 2, 2); // TL arm
    bc.fillRect(3, 0, 2, 2); // TR arm
    bc.fillRect(0, 3, 2, 2); // BL arm
    bc.fillRect(3, 3, 2, 2); // BR arm
    bc.fillStyle = '#D4F07A';
    bc.fillRect(2, 2, 1, 1); // centre
    b.refresh();
  }

  // ─── Foliage cluster sprite ───────────────────────────────────────────────────

  private makeFoliageSprite(): void {
    // 12×10 px bush/fern cluster — teal-blue-green palette, top-left lit
    const c = this.textures.createCanvas('foliage-cluster', 12, 10)!;
    const ctx = c.getContext();
    // Darkest shadow base
    ctx.fillStyle = '#1A3D2A';
    ctx.fillRect(2, 7, 8, 3);
    ctx.fillRect(0, 8, 12, 2);
    // Dark body
    ctx.fillStyle = '#2E6B5A';
    ctx.fillRect(1, 5, 10, 4);
    ctx.fillRect(3, 2, 6, 4);
    ctx.fillRect(4, 1, 4, 2);
    // Mid tone
    ctx.fillStyle = '#3A7D6B';
    ctx.fillRect(2, 5, 8, 3);
    ctx.fillRect(4, 3, 5, 2);
    ctx.fillRect(5, 1, 3, 2);
    // Bright highlight — top-left lit
    ctx.fillStyle = '#5DBB3F';
    ctx.fillRect(3, 4, 3, 2);
    ctx.fillRect(4, 2, 2, 2);
    ctx.fillRect(5, 1, 2, 1);
    // Lightest tip
    ctx.fillStyle = '#72C94F';
    ctx.fillRect(5, 1, 1, 1);
    ctx.fillRect(3, 4, 1, 1);
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
    this.makeChessBoard();
    this.makePoolTable();
    this.makePottedFern();
    this.makeCandleSet();
    this.makeWovenRug();
    this.makeFlowerBasket();
    this.makeBasketball();

    // Structures
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

    // Beach
    this.makeSandcastle();

    // Tech
    this.makeArcadeMachine();
    this.makeWorkDesk();
    this.makeOfficeChair();

    // Pets
    this.makePetCat();
    this.makePetDog();
    this.makePetBunny();
    this.makePetBed();
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

    // Soft warm-beige leather palette
    const D = '#2A1C10'; // darkest — outline, deep seams
    const K = '#7A5C3C'; // dark — shaded sides, welt lines
    const M = '#AA8458'; // mid — shadow body
    const L = '#D0A870'; // light — main surface
    const H = '#E8C090'; // highlight — lit face
    const B = '#F8E0C0'; // brightest — specular

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(3, 29, 26, 3);

    // Base plinth
    ctx.fillStyle = D; ctx.fillRect(3, 26, 26, 3);
    ctx.fillStyle = K; ctx.fillRect(4, 27, 24, 1);

    // LEFT ARMREST — side face
    ctx.fillStyle = D; ctx.fillRect(0, 8, 5, 18);
    ctx.fillStyle = K; ctx.fillRect(1, 9, 3, 16);
    ctx.fillStyle = M; ctx.fillRect(1, 9, 2, 10);
    // Left armrest — top cap
    ctx.fillStyle = D; ctx.fillRect(0, 5, 6, 4);
    ctx.fillStyle = L; ctx.fillRect(1, 6, 4, 2);
    ctx.fillStyle = B; ctx.fillRect(1, 6, 3, 1);

    // RIGHT ARMREST — side face
    ctx.fillStyle = D; ctx.fillRect(27, 8, 5, 18);
    ctx.fillStyle = K; ctx.fillRect(28, 9, 3, 16);
    ctx.fillStyle = M; ctx.fillRect(29, 9, 2, 10);
    // Right armrest — top cap
    ctx.fillStyle = D; ctx.fillRect(26, 5, 6, 4);
    ctx.fillStyle = L; ctx.fillRect(27, 6, 4, 2);
    ctx.fillStyle = B; ctx.fillRect(28, 6, 3, 1);

    // BACK CUSHIONS — 3 × 6 px, symmetric (x=5-26)
    ctx.fillStyle = D;
    ctx.fillRect(5, 2, 22, 13);  // outer block
    ctx.fillRect(12, 2, 1, 13);  // left seam
    ctx.fillRect(19, 2, 1, 13);  // right seam

    // Headrest top roll — bright top edge + dark fold
    ctx.fillStyle = H;
    ctx.fillRect(6, 2, 6, 1); ctx.fillRect(13, 2, 6, 1); ctx.fillRect(20, 2, 6, 1);
    ctx.fillStyle = K;
    ctx.fillRect(6, 3, 6, 1); ctx.fillRect(13, 3, 6, 1); ctx.fillRect(20, 3, 6, 1);

    // Left back cushion
    ctx.fillStyle = L; ctx.fillRect(6, 4, 6, 9);
    ctx.fillStyle = H; ctx.fillRect(6, 4, 5, 5);
    ctx.fillStyle = B; ctx.fillRect(6, 4, 4, 2);
    ctx.fillStyle = M; ctx.fillRect(6, 12, 6, 2);  // bottom shadow

    // Center back cushion
    ctx.fillStyle = L; ctx.fillRect(13, 4, 6, 9);
    ctx.fillStyle = H; ctx.fillRect(13, 4, 5, 5);
    ctx.fillStyle = B; ctx.fillRect(13, 4, 4, 2);
    ctx.fillStyle = M; ctx.fillRect(13, 12, 6, 2);

    // Right back cushion
    ctx.fillStyle = L; ctx.fillRect(20, 4, 6, 9);
    ctx.fillStyle = H; ctx.fillRect(20, 4, 5, 5);
    ctx.fillStyle = B; ctx.fillRect(20, 4, 4, 2);
    ctx.fillStyle = M; ctx.fillRect(20, 12, 6, 2);

    // Back-seat welt seam
    ctx.fillStyle = K; ctx.fillRect(6, 14, 20, 1);

    // SEAT CUSHIONS — 3 × 6 px
    ctx.fillStyle = D;
    ctx.fillRect(5, 15, 22, 8);
    ctx.fillRect(12, 15, 1, 8);
    ctx.fillRect(19, 15, 1, 8);

    // Left seat
    ctx.fillStyle = L; ctx.fillRect(6, 16, 6, 6);
    ctx.fillStyle = H; ctx.fillRect(6, 16, 5, 3);
    ctx.fillStyle = B; ctx.fillRect(6, 16, 4, 1);
    ctx.fillStyle = M; ctx.fillRect(6, 21, 6, 2);

    // Center seat
    ctx.fillStyle = L; ctx.fillRect(13, 16, 6, 6);
    ctx.fillStyle = H; ctx.fillRect(13, 16, 5, 3);
    ctx.fillStyle = B; ctx.fillRect(13, 16, 4, 1);
    ctx.fillStyle = M; ctx.fillRect(13, 21, 6, 2);

    // Right seat
    ctx.fillStyle = L; ctx.fillRect(20, 16, 6, 6);
    ctx.fillStyle = H; ctx.fillRect(20, 16, 5, 3);
    ctx.fillStyle = B; ctx.fillRect(20, 16, 4, 1);
    ctx.fillStyle = M; ctx.fillRect(20, 21, 6, 2);

    // Seat front welt
    ctx.fillStyle = K; ctx.fillRect(6, 22, 20, 1);

    // LOWER RECLINER PANELS (footrest area)
    ctx.fillStyle = D;
    ctx.fillRect(5, 23, 22, 3);
    ctx.fillRect(12, 23, 1, 3);
    ctx.fillRect(19, 23, 1, 3);
    ctx.fillStyle = M;
    ctx.fillRect(6, 23, 6, 3); ctx.fillRect(13, 23, 6, 3); ctx.fillRect(20, 23, 6, 3);
    ctx.fillStyle = L;
    ctx.fillRect(6, 23, 5, 2); ctx.fillRect(13, 23, 5, 2); ctx.fillRect(20, 23, 5, 2);

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
    // Pine palette: light golden-yellow wood, clearly distinct from dark hardwoods.
    const c = this.textures.createCanvas('pine-table', 32, 32)!;
    const ctx = c.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(4, 28, 24, 4);

    // Legs — drawn before tabletop so apron overlaps their tops
    ctx.fillStyle = '#4A3010';          // pine dark outline
    ctx.fillRect(4, 16, 6, 12);
    ctx.fillRect(22, 16, 6, 12);
    ctx.fillStyle = '#B08828';          // pine mid
    ctx.fillRect(5, 17, 4, 10);
    ctx.fillRect(23, 17, 4, 10);
    ctx.fillStyle = '#DEB84C';          // pine light
    ctx.fillRect(5, 17, 2, 6);
    ctx.fillRect(23, 17, 2, 6);

    // Cross stretcher
    ctx.fillStyle = '#4A3010';
    ctx.fillRect(9, 22, 14, 4);
    ctx.fillStyle = '#B08828';
    ctx.fillRect(10, 23, 12, 2);
    ctx.fillStyle = '#DEB84C';
    ctx.fillRect(11, 23, 5, 1);

    // Apron — front face visible below the tabletop edge
    ctx.fillStyle = '#2A1C08';
    ctx.fillRect(2, 13, 28, 4);
    ctx.fillStyle = '#6A4C18';
    ctx.fillRect(3, 14, 26, 3);
    ctx.fillStyle = '#A07828';
    ctx.fillRect(4, 14, 14, 1);

    // Tabletop dark border
    ctx.fillStyle = '#2A1C08';
    ctx.fillRect(1, 6, 30, 8);

    // Tabletop pine surface (golden honey tone)
    ctx.fillStyle = '#C49038';
    ctx.fillRect(2, 7, 28, 6);

    // Lighter lit area (top-left light source)
    ctx.fillStyle = '#DEB84C';
    ctx.fillRect(3, 7, 22, 5);

    // Highlight band
    ctx.fillStyle = '#EED068';
    ctx.fillRect(4, 7, 12, 3);

    // Horizontal wood grain lines
    ctx.fillStyle = '#9A7228';
    ctx.fillRect(4, 9, 24, 1);
    ctx.fillRect(6, 11, 20, 1);

    // Pine knot
    ctx.fillStyle = '#7A5018';
    ctx.fillRect(21, 8, 3, 2);
    ctx.fillRect(22, 9, 1, 1);

    // Brightest top edge
    ctx.fillStyle = '#F4DC80';
    ctx.fillRect(2, 7, 28, 1);

    c.refresh();
  }

  private makeRockingChair(): void {
    const c = this.textures.createCanvas('rocking-chair', 32, 32)!;
    const ctx = c.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(3, 28, 26, 3);

    // ROCKERS — arched U-shapes, the defining feature of the chair.
    // Each rocker has two raised ends connected by a bottom bar.
    // The open arch between the ends makes the curve legible.
    // Left rocker (under left leg, extends outward to the left)
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(2, 22, 3, 6);     // left raised end
    ctx.fillRect(2, 26, 13, 2);    // bottom bar spanning full rocker width
    ctx.fillRect(12, 22, 3, 6);    // right raised end (sits under the leg)
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(3, 23, 1, 4);     // lit face — left end
    ctx.fillRect(3, 27, 10, 1);    // lit face — bottom bar
    ctx.fillRect(13, 23, 1, 4);    // lit face — right end

    // Right rocker (under right leg, extends outward to the right)
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(17, 22, 3, 6);    // left raised end (sits under the leg)
    ctx.fillRect(17, 26, 13, 2);   // bottom bar
    ctx.fillRect(27, 22, 3, 6);    // right raised end
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(18, 23, 1, 4);
    ctx.fillRect(18, 27, 10, 1);
    ctx.fillRect(28, 23, 1, 4);

    // LEGS — connect seat base to the rockers
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(8, 18, 4, 9);     // left leg
    ctx.fillRect(20, 18, 4, 9);    // right leg
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(9, 19, 2, 7);
    ctx.fillRect(21, 19, 2, 7);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(9, 19, 1, 3);
    ctx.fillRect(21, 19, 1, 3);

    // SEAT
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(5, 13, 22, 7);    // seat frame
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(6, 13, 20, 5);    // seat top surface
    ctx.fillStyle = '#B07040';
    ctx.fillRect(7, 14, 9, 2);     // seat highlight
    ctx.fillStyle = '#5C3C20';
    ctx.fillRect(5, 17, 22, 3);    // seat front edge

    // ARMRESTS — short horizontal boards on each side
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(4, 11, 5, 5);
    ctx.fillRect(23, 11, 5, 5);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(5, 11, 3, 3);
    ctx.fillRect(24, 11, 3, 3);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(5, 11, 2, 1);
    ctx.fillRect(24, 11, 2, 1);

    // BACKREST — tall frame with three vertical slats
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(7, 2, 18, 12);    // outer frame
    ctx.fillStyle = '#4A2A14';
    ctx.fillRect(8, 3, 16, 9);     // dark space between slats

    // Three slats
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(10, 4, 3, 8);
    ctx.fillRect(15, 4, 3, 8);
    ctx.fillRect(20, 4, 3, 8);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(11, 4, 1, 8);
    ctx.fillRect(16, 4, 1, 8);
    ctx.fillRect(21, 4, 1, 8);

    // Top rail
    ctx.fillStyle = '#3D2010';
    ctx.fillRect(7, 2, 18, 3);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(8, 2, 16, 2);
    ctx.fillStyle = '#B07040';
    ctx.fillRect(9, 2, 9, 1);

    c.refresh();
  }

  // ── Decor ─────────────────────────────────────────────────────────────────────

  private makeChessBoard(): void {
    const c = this.textures.createCanvas('chess-board', 32, 32)!;
    const ctx = c.getContext();
    // shadow — flush with canvas bottom like other decor items
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(4, 28, 24, 3);
    // frame outer
    ctx.fillStyle = '#5C3310';
    ctx.fillRect(5, 6, 22, 22);
    // frame inner (wood)
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(6, 7, 20, 20);
    // frame highlight
    ctx.fillStyle = '#B07040';
    ctx.fillRect(6, 7, 10, 1);
    // light squares background — board starts at (8,9), 8×8 at 2×2 px = 16×16
    ctx.fillStyle = '#F0D9B5';
    ctx.fillRect(8, 9, 16, 16);
    // dark squares
    ctx.fillStyle = '#B58863';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((col + row) % 2 === 1) ctx.fillRect(8 + col * 2, 9 + row * 2, 2, 2);
      }
    }
    // white pieces (on dark squares)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(10, 9, 2, 2); // col 1, row 0
    ctx.fillRect(14, 13, 2, 2); // col 3, row 2
    ctx.fillRect(18, 17, 2, 2); // col 5, row 4
    ctx.fillRect(22, 21, 2, 2); // col 7, row 6
    ctx.fillRect(10, 21, 2, 2); // col 1, row 6
    // black pieces (on light squares)
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(16, 9, 2, 2); // col 4, row 0
    ctx.fillRect(20, 13, 2, 2); // col 6, row 2
    ctx.fillRect(12, 13, 2, 2); // col 2, row 2
    ctx.fillRect(16, 17, 2, 2); // col 4, row 4
    ctx.fillRect(20, 21, 2, 2); // col 6, row 6
    c.refresh();
  }

  private makePoolTable(): void {
    // 36 × 64 px — slightly wider, 2 × longer than a standard 32 × 32 item.
    // Origin will be (0.5, 0.7) → pivot at (18, 44.8).
    // Felt surface: x:6–30 (24 px wide), y:8–56 (48 px tall) → 1 : 2 ratio.
    const c = this.textures.createCanvas('pool-table', 36, 64)!;
    const ctx = c.getContext();
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(3, 60, 30, 4);
    // outer wood rail
    ctx.fillStyle = '#5C3310';
    ctx.fillRect(2, 4, 32, 56);
    // inner wood rail
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(3, 5, 30, 54);
    // rail highlight (top-left corner shine)
    ctx.fillStyle = '#B07040';
    ctx.fillRect(3, 5, 15, 1);
    ctx.fillRect(3, 5, 1, 10);
    // felt surface
    ctx.fillStyle = '#1B7A2A';
    ctx.fillRect(6, 8, 24, 48);
    // felt highlight (slightly lighter centre band)
    ctx.fillStyle = '#238C31';
    ctx.fillRect(7, 9, 22, 46);
    // foot spot (where rack apex sits — 1/4 from foot end)
    ctx.fillStyle = '#4AAD60';
    ctx.fillRect(17, 19, 2, 2);
    // center spot
    ctx.fillStyle = '#4AAD60';
    ctx.fillRect(17, 31, 2, 1);
    // head string line (1/4 from head end) — dashed look via two segments
    ctx.fillStyle = '#3A9A4A';
    ctx.fillRect(7, 47, 8, 1);
    ctx.fillRect(17, 47, 4, 1);
    ctx.fillRect(23, 47, 6, 1);
    // corner pockets (3 × 3)
    ctx.fillStyle = '#111111';
    ctx.fillRect(6, 8, 3, 3);    // TL
    ctx.fillRect(27, 8, 3, 3);   // TR
    ctx.fillRect(6, 53, 3, 3);   // BL
    ctx.fillRect(27, 53, 3, 3);  // BR
    // side pockets (3 × 4, centred on felt midpoint y=32)
    ctx.fillRect(6, 29, 3, 4);   // L
    ctx.fillRect(27, 29, 3, 4);  // R
    // cushion dots — bright green just inside each pocket opening
    ctx.fillStyle = '#3A8A3A';
    ctx.fillRect(9, 8, 1, 1);    // TL inner
    ctx.fillRect(26, 8, 1, 1);   // TR inner
    ctx.fillRect(9, 55, 1, 1);   // BL inner
    ctx.fillRect(26, 55, 1, 1);  // BR inner
    ctx.fillRect(9, 29, 1, 1);   // L inner top
    ctx.fillRect(9, 32, 1, 1);   // L inner bot
    ctx.fillRect(26, 29, 1, 1);  // R inner top
    ctx.fillRect(26, 32, 1, 1);  // R inner bot
    c.refresh();
  }

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
    // Three pillar shadows — start right at holder bottom (y=25).
    // Heights reflect candle heights: left=4, center=6 (tallest), right=3.
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(9, 25, 2, 4);  // left candle shadow
    ctx.fillRect(15, 25, 2, 6);  // center candle shadow (longest)
    ctx.fillRect(21, 25, 2, 3);  // right candle shadow
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

  private makeBasketball(): void {
    const c = this.textures.createCanvas('basketball', 32, 32)!;
    const ctx = c.getContext();

    // Oval contact shadow (ball sitting on ground)
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillRect(13, 26, 6,  1);
    ctx.fillRect(11, 27, 10, 1);
    ctx.fillRect(12, 28, 8,  1);
    ctx.fillRect(13, 29, 6,  1);

    // ── Ball body: circle r=9, center (16,16), drawn row-by-row ──────────────
    // [y, xStart, width]
    const rows: [number, number, number][] = [
      [ 7, 16,  1],
      [ 8, 12,  9],
      [ 9, 10, 13],
      [10,  9, 15],
      [11,  8, 17],
      [12,  8, 17],
      [13,  7, 19],
      [14,  7, 19],
      [15,  7, 19],
      [16,  7, 19],
      [17,  7, 19],
      [18,  7, 19],
      [19,  7, 19],
      [20,  8, 17],
      [21,  8, 17],
      [22,  9, 15],
      [23, 10, 13],
      [24, 12,  9],
      [25, 16,  1],
    ];

    // Base mid-orange
    ctx.fillStyle = '#E06010';
    for (const [y, x, w] of rows) ctx.fillRect(x, y, w, 1);

    // Lit zone: upper-left
    ctx.fillStyle = '#F07A28';
    ctx.fillRect(12,  8,  6, 1);
    ctx.fillRect(10,  9,  9, 1);
    ctx.fillRect( 9, 10,  9, 1);
    ctx.fillRect( 8, 11,  9, 1);
    ctx.fillRect( 8, 12,  8, 1);
    ctx.fillRect( 7, 13,  8, 1);
    ctx.fillRect( 7, 14,  7, 1);
    ctx.fillRect( 7, 15,  6, 1);
    ctx.fillRect( 7, 16,  5, 1);

    // Specular highlight
    ctx.fillStyle = '#FFC878';
    ctx.fillRect(12,  8,  3, 1);
    ctx.fillRect(10,  9,  4, 1);
    ctx.fillRect( 9, 10,  4, 1);
    ctx.fillRect( 9, 11,  3, 1);

    // Shadow zone: lower-right
    ctx.fillStyle = '#B03A08';
    ctx.fillRect(17, 17,  8, 1);
    ctx.fillRect(17, 18,  8, 1);
    ctx.fillRect(17, 19,  8, 1);
    ctx.fillRect(18, 20,  7, 1);
    ctx.fillRect(18, 21,  7, 1);
    ctx.fillRect(19, 22,  5, 1);
    ctx.fillRect(20, 23,  3, 1);

    // Deep shadow: bottom rim (grounded look)
    ctx.fillStyle = '#7A2800';
    ctx.fillRect(21, 22,  2, 1);
    ctx.fillRect(20, 23,  2, 1);
    ctx.fillRect(16, 24,  4, 1);

    // ── Seams ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = '#2A1400';

    // Vertical centre seam (x=15–16, y=8–24)
    ctx.fillRect(15, 8, 2, 17);

    // Horizontal equator seam (y=15–16, full ball width)
    ctx.fillRect( 7, 15, 19, 1);
    ctx.fillRect( 7, 16, 19, 1);

    // Left curved seam: arcs from top-centre → leftmost bulge at y=14–18 → bottom-centre
    ctx.fillRect(13,  8, 1, 1);
    ctx.fillRect(12,  9, 1, 1);
    ctx.fillRect(11, 10, 1, 1);
    ctx.fillRect(10, 11, 1, 1);
    ctx.fillRect( 9, 12, 1, 2);
    ctx.fillRect( 8, 14, 1, 5);  // leftmost — y=14–18
    ctx.fillRect( 9, 19, 1, 1);
    ctx.fillRect(10, 20, 1, 1);
    ctx.fillRect(11, 21, 1, 1);
    ctx.fillRect(12, 22, 1, 1);
    ctx.fillRect(13, 23, 1, 1);
    ctx.fillRect(14, 24, 1, 1);

    // Right curved seam (mirror)
    ctx.fillRect(19,  8, 1, 1);
    ctx.fillRect(20,  9, 1, 1);
    ctx.fillRect(21, 10, 1, 1);
    ctx.fillRect(22, 11, 1, 1);
    ctx.fillRect(23, 12, 1, 2);
    ctx.fillRect(24, 14, 1, 5);  // rightmost — y=14–18
    ctx.fillRect(23, 19, 1, 1);
    ctx.fillRect(22, 20, 1, 1);
    ctx.fillRect(21, 21, 1, 1);
    ctx.fillRect(20, 22, 1, 1);
    ctx.fillRect(19, 23, 1, 1);
    ctx.fillRect(18, 24, 1, 1);

    c.refresh();
  }

  // ── Structures ───────────────────────────────────────────────────────────────

  private makeCarvedDoor(): void {
    // Each door covers exactly one entrance half-tile (32 px wide).
    // The frame must fill the full 32 px — no transparent side margins — so that
    // left (scaleX 1) and right (scaleX -1) doors tile together with zero gap.
    // Doorknob is on the RIGHT side of the sprite so that:
    //   left door  (scaleX  1) → knob on right, faces the entrance centre ✓
    //   right door (scaleX -1) → knob mirrors to left, faces the entrance centre ✓
    const c = this.textures.createCanvas('carved-door', 32, 32)!;
    const ctx = c.getContext();
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 29, 32, 3);
    // Outer frame — full width, no side gaps
    ctx.fillStyle = '#2A1408';
    ctx.fillRect(0, 1, 32, 30);
    // Inner frame
    ctx.fillStyle = '#5A3018';
    ctx.fillRect(1, 2, 30, 27);
    // Door face
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(2, 3, 28, 25);
    // Horizontal wood grain
    ctx.fillStyle = '#5A3018';
    ctx.fillRect(2, 9, 28, 1);
    ctx.fillRect(2, 16, 28, 1);
    ctx.fillRect(2, 23, 28, 1);
    // Upper inset panel
    ctx.fillStyle = '#5A3018';
    ctx.fillRect(3, 4, 26, 10);
    ctx.fillStyle = '#8A5A2A';
    ctx.fillRect(4, 5, 24, 8);
    // Lower inset panel
    ctx.fillStyle = '#5A3018';
    ctx.fillRect(3, 17, 26, 10);
    ctx.fillStyle = '#8A5A2A';
    ctx.fillRect(4, 18, 24, 8);
    // Left edge hinge highlight (stays on left for both orientations after flip)
    ctx.fillStyle = '#B07840';
    ctx.fillRect(2, 3, 2, 25);
    // Doorknob on right side
    ctx.fillStyle = '#E8C040';
    ctx.fillRect(25, 14, 3, 3);
    ctx.fillStyle = '#FFF090';
    ctx.fillRect(26, 14, 2, 2);
    c.refresh();
  }

  private makeCobbleWall(): void {
    const c = this.textures.createCanvas('cobble-wall', 32, 32)!;
    const ctx = c.getContext();

    // Full grout fill — covers every edge pixel so adjacent walls leave no gap.
    // Grout lines between stones are implicit (background shows through the 1 px
    // margins left on each side of every stone).
    ctx.fillStyle = '#5A5450';
    ctx.fillRect(0, 0, 32, 32);

    // Row 1  (y = 0 .. 9)  — two stones, 1 px left/right edge + 1 px seam at x=15
    ctx.fillStyle = '#8A8078';
    ctx.fillRect(1, 0, 14, 10);  // left stone  x=1..14
    ctx.fillRect(16, 0, 15, 10);  // right stone x=16..30
    ctx.fillStyle = '#A09890';
    ctx.fillRect(2, 1, 12, 8);
    ctx.fillRect(17, 1, 13, 8);
    ctx.fillStyle = '#C0B8B0';
    ctx.fillRect(2, 1, 4, 2);
    ctx.fillRect(17, 1, 4, 2);

    // y=10 is the horizontal mortar course between rows 1 and 2.

    // Row 2  (y = 11 .. 20)  — offset: left-half + centre + right-half
    ctx.fillStyle = '#8A8078';
    ctx.fillRect(1, 11, 7, 10); // left half   x=1..7
    ctx.fillRect(9, 11, 14, 10); // centre      x=9..22
    ctx.fillRect(24, 11, 7, 10); // right half  x=24..30
    ctx.fillStyle = '#A09890';
    ctx.fillRect(2, 12, 5, 8);
    ctx.fillRect(10, 12, 12, 8);
    ctx.fillRect(25, 12, 5, 8);
    ctx.fillStyle = '#C0B8B0';
    ctx.fillRect(2, 12, 3, 2);
    ctx.fillRect(10, 12, 4, 2);
    ctx.fillRect(25, 12, 3, 2);

    // y=21 is the horizontal mortar course between rows 2 and 3.

    // Row 3  (y = 22 .. 31)  — same pattern as row 1
    ctx.fillStyle = '#8A8078';
    ctx.fillRect(1, 22, 14, 10);
    ctx.fillRect(16, 22, 15, 10);
    ctx.fillStyle = '#A09890';
    ctx.fillRect(2, 23, 12, 8);
    ctx.fillRect(17, 23, 13, 8);
    ctx.fillStyle = '#C0B8B0';
    ctx.fillRect(2, 23, 4, 2);
    ctx.fillRect(17, 23, 4, 2);

    // South-face shadow — bottom 6 px progressively darkened to give the wall
    // visible depth. Applied as solid colours so it survives pixelArt rendering.
    ctx.fillStyle = '#3A3836';
    ctx.fillRect(0, 26, 32, 2);
    ctx.fillStyle = '#2E2C2A';
    ctx.fillRect(0, 28, 32, 2);
    ctx.fillStyle = '#222020';
    ctx.fillRect(0, 30, 32, 1);
    ctx.fillStyle = '#141212';
    ctx.fillRect(0, 31, 32, 1);

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
    // Shadow — thin rail line + five post pillars directly below each picket
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(2, 26, 28, 1);
    for (let i = 0; i < 5; i++) ctx.fillRect(4 + i * 6, 26, 4, 4);
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

  // ── Tech ─────────────────────────────────────────────────────────────────────

  // ── Beach ────────────────────────────────────────────────────────────────────

  private makeSandcastle(): void {
    // 32 × 32 px.  Only valid on GRAVEL (sandy shore) tiles.
    // Origin (0.5, 0.7) → pivot at (16, 22.4).
    const c = this.textures.createCanvas('sandcastle', 32, 32)!;
    const ctx = c.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(6, 28, 20, 3);

    // Sandy base mound
    ctx.fillStyle = '#9A7220';
    ctx.fillRect(3, 18, 26, 12);
    ctx.fillStyle = '#C49A30';
    ctx.fillRect(4, 19, 24, 10);
    ctx.fillStyle = '#D8B04A';
    ctx.fillRect(5, 20, 22, 8);
    ctx.fillStyle = '#ECC860';
    ctx.fillRect(8, 21, 16, 6);

    // Tower outer (dark outline)
    ctx.fillStyle = '#9A7220';
    ctx.fillRect(10, 5, 12, 15);

    // Tower main body
    ctx.fillStyle = '#C49A30';
    ctx.fillRect(11, 6, 10, 13);

    // Tower lit front face
    ctx.fillStyle = '#D8B04A';
    ctx.fillRect(11, 6, 8, 10);

    // Tower highlight
    ctx.fillStyle = '#ECC860';
    ctx.fillRect(12, 7, 5, 7);

    // Battlements — three merlons across the tower top
    ctx.fillStyle = '#9A7220';
    ctx.fillRect(10, 1, 4, 6);   // left merlon
    ctx.fillRect(14, 2, 4, 5);   // centre merlon (slightly lower)
    ctx.fillRect(18, 1, 4, 6);   // right merlon

    // Merlon lit faces
    ctx.fillStyle = '#D8B04A';
    ctx.fillRect(11, 2, 2, 5);   // left merlon lit
    ctx.fillRect(15, 3, 2, 4);   // centre merlon lit
    ctx.fillRect(19, 2, 2, 5);   // right merlon lit

    // Gate/door arch
    ctx.fillStyle = '#6A4810';
    ctx.fillRect(13, 14, 6, 6);
    ctx.fillStyle = '#8A6018';
    ctx.fillRect(14, 15, 4, 4);

    // ── Seashells scattered on the mound ──────────────────────────────────────

    // Pink fan shell (left)
    ctx.fillStyle = '#ECA090';
    ctx.fillRect(5, 21, 3, 2);
    ctx.fillStyle = '#D08070';
    ctx.fillRect(5, 23, 3, 1);

    // White spiral shell (right)
    ctx.fillStyle = '#F0E8D0';
    ctx.fillRect(22, 20, 4, 3);
    ctx.fillStyle = '#C8B898';
    ctx.fillRect(23, 21, 2, 1);

    // Small orange conch (lower left)
    ctx.fillStyle = '#D07840';
    ctx.fillRect(7, 24, 3, 2);
    ctx.fillStyle = '#E89860';
    ctx.fillRect(8, 24, 2, 1);

    // Tiny white shell (lower right)
    ctx.fillStyle = '#F0E8D0';
    ctx.fillRect(21, 24, 3, 2);

    // Small pink shell near centre
    ctx.fillStyle = '#F4B0A0';
    ctx.fillRect(14, 25, 4, 2);
    ctx.fillStyle = '#E89080';
    ctx.fillRect(15, 26, 2, 1);

    c.refresh();
  }

  private makeArcadeMachine(): void {
    const c = this.textures.createCanvas('arcade-machine', 32, 32)!;
    const ctx = c.getContext();
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(5, 29, 22, 3);
    // cabinet body
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(6, 2, 20, 27);
    ctx.fillStyle = '#22223A';
    ctx.fillRect(7, 3, 18, 25);
    // marquee area
    ctx.fillStyle = '#2A1F4E';
    ctx.fillRect(7, 3, 18, 7);
    ctx.fillStyle = '#3A2A6A';
    ctx.fillRect(8, 4, 16, 5);
    // marquee neon strips
    ctx.fillStyle = '#FF44AA';
    ctx.fillRect(9, 5, 5, 1);
    ctx.fillStyle = '#44FFCC';
    ctx.fillRect(15, 5, 4, 1);
    ctx.fillStyle = '#AA44FF';
    ctx.fillRect(9, 7, 9, 1);
    ctx.fillStyle = '#FF8800';
    ctx.fillRect(19, 7, 4, 1);
    // screen bezel
    ctx.fillStyle = '#111122';
    ctx.fillRect(7, 11, 18, 11);
    // screen
    ctx.fillStyle = '#002244';
    ctx.fillRect(8, 12, 16, 9);
    ctx.fillStyle = '#003366';
    ctx.fillRect(9, 13, 14, 7);
    ctx.fillStyle = '#1155CC';
    ctx.fillRect(10, 13, 9, 3);
    // game pixels on screen
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(10, 14, 2, 2);
    ctx.fillStyle = '#00FF88';
    ctx.fillRect(14, 13, 4, 1);
    ctx.fillStyle = '#FF4400';
    ctx.fillRect(20, 15, 2, 2);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(12, 16, 3, 2);
    ctx.fillStyle = '#FF44AA';
    ctx.fillRect(17, 14, 2, 3);
    // control panel
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(6, 23, 20, 6);
    ctx.fillStyle = '#252540';
    ctx.fillRect(7, 24, 18, 4);
    // joystick base
    ctx.fillStyle = '#444466';
    ctx.fillRect(9, 25, 3, 2);
    // joystick stick
    ctx.fillStyle = '#9999BB';
    ctx.fillRect(10, 24, 1, 4);
    ctx.fillStyle = '#6666AA';
    ctx.fillRect(9, 24, 3, 1);
    // action buttons
    ctx.fillStyle = '#DD1133';
    ctx.fillRect(15, 25, 2, 2);
    ctx.fillStyle = '#1133DD';
    ctx.fillRect(18, 25, 2, 2);
    ctx.fillStyle = '#11CC44';
    ctx.fillRect(21, 25, 2, 2);
    // coin slot
    ctx.fillStyle = '#333355';
    ctx.fillRect(12, 28, 8, 1);
    // base
    ctx.fillStyle = '#111122';
    ctx.fillRect(7, 28, 18, 2);
    c.refresh();
  }

  // ─── Work Desk (32 × 32) — modern office desk, top-down 3/4 view ────────────
  //
  // White laminate surface, slim brushed-steel frame and legs, keyboard + mouse.

  private makeWorkDesk(): void {
    const c = this.textures.createCanvas('work-desk', 32, 32)!;
    const ctx = c.getContext();

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(3, 28, 26, 4);

    // Legs — brushed dark steel, drawn before desktop so surface overlaps their tops
    ctx.fillStyle = '#171B1F';
    ctx.fillRect(3, 15, 5, 12);
    ctx.fillRect(24, 15, 5, 12);
    ctx.fillStyle = '#262E36';
    ctx.fillRect(4, 16, 3, 10);
    ctx.fillRect(25, 16, 3, 10);
    ctx.fillStyle = '#36404A';
    ctx.fillRect(4, 16, 1, 8);    // lit left face, left leg
    ctx.fillRect(25, 16, 1, 8);   // lit left face, right leg

    // Under-desk cable tray / cross-bar
    ctx.fillStyle = '#1A1E22';
    ctx.fillRect(8, 22, 16, 3);
    ctx.fillStyle = '#262E36';
    ctx.fillRect(9, 23, 14, 1);

    // Front apron — slim dark-steel face visible below the surface
    ctx.fillStyle = '#141618';
    ctx.fillRect(2, 13, 28, 4);
    ctx.fillStyle = '#22282E';
    ctx.fillRect(3, 14, 26, 2);
    ctx.fillStyle = '#323A42';
    ctx.fillRect(3, 14, 12, 1);   // highlight strip on apron top edge

    // Desktop outer border
    ctx.fillStyle = '#141618';
    ctx.fillRect(1, 4, 30, 10);

    // Main laminate surface — clean white
    ctx.fillStyle = '#F2F2F2';
    ctx.fillRect(2, 5, 28, 8);

    // Upper-left lit zone (overhead lighting)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(3, 5, 18, 4);

    // Front-edge shadow (depth)
    ctx.fillStyle = '#D4D4D4';
    ctx.fillRect(2, 11, 28, 2);

    // ── Keyboard (chiclet style) ──────────────────────────────────────────────
    ctx.fillStyle = '#B8BCC8';
    ctx.fillRect(5, 6, 14, 4);
    ctx.fillStyle = '#CDD0DA';
    ctx.fillRect(6, 6, 12, 3);
    // Keycap rows
    ctx.fillStyle = '#A4A8B6';
    ctx.fillRect(6, 6, 2, 1);
    ctx.fillRect(9, 6, 2, 1);
    ctx.fillRect(12, 6, 2, 1);
    ctx.fillRect(15, 6, 2, 1);
    ctx.fillRect(7, 8, 3, 1);
    ctx.fillRect(11, 8, 3, 1);
    ctx.fillRect(15, 8, 2, 1);
    // Space bar
    ctx.fillStyle = '#B4B8C4';
    ctx.fillRect(8, 9, 8, 1);

    // ── Mouse ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = '#C4C8D0';
    ctx.fillRect(22, 6, 5, 6);
    ctx.fillStyle = '#D8DCE4';
    ctx.fillRect(23, 6, 3, 3);    // lit top
    ctx.fillStyle = '#9EA2AE';
    ctx.fillRect(23, 9, 3, 1);    // click-line separator

    c.refresh();
  }

  // ─── Office Chair (32 × 32) — ergonomic mesh chair, top-down 3/4 view ───────
  //
  // Tall mesh backrest, padded seat, T-armrests, 5-spoke caster base.

  private makeOfficeChair(): void {
    const c = this.textures.createCanvas('office-chair', 32, 32)!;
    const ctx = c.getContext();

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(9, 29, 14, 3);

    // ── 5-spoke caster base ───────────────────────────────────────────────────
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(14, 19, 4, 9);   // N–S spoke
    ctx.fillRect(7,  22, 18, 4);  // E–W spoke (also forms hub)
    ctx.fillRect(10, 19, 3, 4);   // NW spoke
    ctx.fillRect(19, 19, 3, 4);   // NE spoke

    // Caster wheels at spoke tips
    ctx.fillStyle = '#2E2E2E';
    ctx.fillRect(14, 17, 4, 2);   // N
    ctx.fillRect(5,  22, 3, 4);   // W
    ctx.fillRect(24, 22, 3, 4);   // E
    ctx.fillRect(8,  17, 3, 2);   // NW
    ctx.fillRect(21, 17, 3, 2);   // NE

    // Center hub
    ctx.fillStyle = '#282828';
    ctx.fillRect(13, 21, 6, 5);
    ctx.fillStyle = '#3C3C3C';
    ctx.fillRect(14, 22, 4, 3);

    // Gas-lift cylinder
    ctx.fillStyle = '#222222';
    ctx.fillRect(14, 16, 4, 6);
    ctx.fillStyle = '#484848';
    ctx.fillRect(15, 17, 2, 4);   // polished shaft highlight

    // ── Armrests ──────────────────────────────────────────────────────────────
    ctx.fillStyle = '#181818';
    ctx.fillRect(4, 15, 5, 7);
    ctx.fillRect(23, 15, 5, 7);
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(5, 16, 3, 5);
    ctx.fillRect(24, 16, 3, 5);

    // ── Seat cushion ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#181818';
    ctx.fillRect(8, 13, 16, 9);
    ctx.fillStyle = '#282828';
    ctx.fillRect(9, 14, 14, 7);
    ctx.fillStyle = '#383838';
    ctx.fillRect(10, 14, 8, 5);   // lit upper-left area
    ctx.fillStyle = '#404040';
    ctx.fillRect(10, 14, 7, 1);   // brightest top edge

    // ── Backrest (tall mesh panel) ────────────────────────────────────────────
    ctx.fillStyle = '#141414';
    ctx.fillRect(9, 1, 14, 14);   // outer frame
    ctx.fillStyle = '#202020';
    ctx.fillRect(10, 2, 12, 12);  // mesh panel body
    // Mesh grid — horizontal rails
    ctx.fillStyle = '#141414';
    ctx.fillRect(10, 5,  12, 1);
    ctx.fillRect(10, 8,  12, 1);
    ctx.fillRect(10, 11, 12, 1);
    // Mesh grid — vertical dividers
    ctx.fillRect(14, 2, 1, 12);
    ctx.fillRect(18, 2, 1, 12);
    // Lit upper-left zone (ambient overhead light)
    ctx.fillStyle = '#303030';
    ctx.fillRect(11, 3, 6, 4);
    // Lumbar support bulge (lower third)
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(10, 9, 12, 4);
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(11, 10, 10, 2);
    // Headrest cap
    ctx.fillStyle = '#181818';
    ctx.fillRect(11, 1, 10, 2);
    ctx.fillStyle = '#363636';
    ctx.fillRect(12, 1, 7, 1);    // cap highlight

    c.refresh();
  }

  // ─── Pet ghost preview textures (32 × 32 each) ──────────────────────────────
  //
  // Each mirrors the NPC's sitting pose; used as the semi-transparent ghost
  // sprite while the player is deciding where to place the pet.

  private makePetDog(): void {
    const c = this.textures.createCanvas('pet-dog', 32, 32)!;
    const ctx = c.getContext();
    const ox = 16, oy = 20;  // container origin offset (foot point)

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(ox - 6, oy + 7, 12, 3);

    // Tail
    ctx.fillStyle = '#A86820';
    ctx.fillRect(ox + 5, oy - 1, 4, 8);
    ctx.fillStyle = '#C88838';
    ctx.fillRect(ox + 6, oy + 0, 3, 6);

    // Floppy left ear
    ctx.fillStyle = '#A86820';
    ctx.fillRect(ox - 8, oy - 7, 5, 9);
    ctx.fillStyle = '#C88838';
    ctx.fillRect(ox - 7, oy - 6, 3, 7);

    // Floppy right ear
    ctx.fillStyle = '#A86820';
    ctx.fillRect(ox + 4, oy - 7, 5, 9);
    ctx.fillStyle = '#C88838';
    ctx.fillRect(ox + 5, oy - 6, 3, 7);

    // Body
    ctx.fillStyle = '#A86820';
    ctx.fillRect(ox - 6, oy - 2, 12, 10);
    ctx.fillStyle = '#C88838';
    ctx.fillRect(ox - 5, oy - 1, 10, 8);
    ctx.fillStyle = '#D8A048';
    ctx.fillRect(ox - 5, oy - 1, 6, 4);

    // Head
    ctx.fillStyle = '#A86820';
    ctx.fillRect(ox - 6, oy - 12, 12, 11);
    ctx.fillStyle = '#C88838';
    ctx.fillRect(ox - 5, oy - 11, 10, 9);
    ctx.fillStyle = '#D8A048';
    ctx.fillRect(ox - 5, oy - 11, 6, 4);

    // Snout
    ctx.fillStyle = '#E0B060';
    ctx.fillRect(ox - 4, oy - 6, 8, 5);
    ctx.fillStyle = '#ECDBA8';
    ctx.fillRect(ox - 3, oy - 5, 6, 3);

    // Nose
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(ox - 2, oy - 6, 4, 2);

    // Eyes
    ctx.fillStyle = '#2A1408';
    ctx.fillRect(ox - 4, oy - 9, 3, 3);
    ctx.fillRect(ox + 2, oy - 9, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(ox - 3, oy - 9, 1, 1);
    ctx.fillRect(ox + 3, oy - 9, 1, 1);

    // Eyebrows
    ctx.fillStyle = '#8A5018';
    ctx.fillRect(ox - 4, oy - 10, 3, 1);
    ctx.fillRect(ox + 2, oy - 10, 3, 1);

    // Front paws
    ctx.fillStyle = '#A86820';
    ctx.fillRect(ox - 5, oy + 7, 4, 3);
    ctx.fillRect(ox + 2, oy + 7, 4, 3);
    ctx.fillStyle = '#C88838';
    ctx.fillRect(ox - 4, oy + 8, 3, 2);
    ctx.fillRect(ox + 3, oy + 8, 3, 2);

    c.refresh();
  }

  private makePetBunny(): void {
    const c = this.textures.createCanvas('pet-bunny', 32, 32)!;
    const ctx = c.getContext();
    const ox = 16, oy = 22;  // lower origin to fit long ears

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(ox - 5, oy + 8, 10, 3);

    // Long ears (upright)
    ctx.fillStyle = '#D0CCCA';
    ctx.fillRect(ox - 4, oy - 19, 3, 12);
    ctx.fillRect(ox + 2, oy - 19, 3, 12);
    ctx.fillStyle = '#F4A0A0';
    ctx.fillRect(ox - 3, oy - 18, 1, 9);
    ctx.fillRect(ox + 3, oy - 18, 1, 9);

    // Body
    ctx.fillStyle = '#D0CCCA';
    ctx.fillRect(ox - 5, oy - 3, 10, 11);
    ctx.fillStyle = '#EEEAE8';
    ctx.fillRect(ox - 4, oy - 2, 8, 9);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(ox - 4, oy - 2, 5, 5);

    // Fluffy tail
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(ox + 4, oy + 1, 4, 4);
    ctx.fillStyle = '#F0EEEC';
    ctx.fillRect(ox + 5, oy + 2, 3, 3);

    // Head
    ctx.fillStyle = '#D0CCCA';
    ctx.fillRect(ox - 5, oy - 12, 10, 10);
    ctx.fillStyle = '#EEEAE8';
    ctx.fillRect(ox - 4, oy - 11, 8, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(ox - 4, oy - 11, 5, 5);

    // Eyes (pink)
    ctx.fillStyle = '#E02080';
    ctx.fillRect(ox - 3, oy - 8, 2, 2);
    ctx.fillRect(ox + 2, oy - 8, 2, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(ox - 2, oy - 8, 1, 1);
    ctx.fillRect(ox + 3, oy - 8, 1, 1);

    // Nose
    ctx.fillStyle = '#FF80B0';
    ctx.fillRect(ox - 1, oy - 5, 2, 1);

    // Front paws
    ctx.fillStyle = '#EEEAE8';
    ctx.fillRect(ox - 4, oy + 7, 3, 3);
    ctx.fillRect(ox + 2, oy + 7, 3, 3);

    c.refresh();
  }

  // ─── Pet: cat ghost preview texture (32 × 32) ────────────────────────────────
  //
  // Shown as the semi-transparent placement ghost when the player is about to
  // drop a cat. Matches the sitting pose drawn by CatNPC.drawSitting().

  // ─── Pet bed (32 × 32) ───────────────────────────────────────────────────────
  //
  // Small wicker basket with a soft cushion inside — placed on the island as a
  // resting spot for pet NPCs.  The headboard (pillow end) is drawn at the top
  // of the canvas so the perspective reads correctly with origin (0.5, 0.7).

  private makePetBed(): void {
    const c = this.textures.createCanvas('pet-bed', 32, 32)!;
    const ctx = c.getContext();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(5, 25, 22, 4);

    // Wicker basket outer ring — dark
    ctx.fillStyle = '#7A5020';
    ctx.fillRect(6, 11, 20, 15);

    // Basket inner — warm mid-brown
    ctx.fillStyle = '#A87030';
    ctx.fillRect(7, 12, 18, 13);

    // Top-left highlight on rim
    ctx.fillStyle = '#C89040';
    ctx.fillRect(8, 12, 10, 2);

    // Woven texture lines across the rim
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(7, 16, 18, 1);
    ctx.fillRect(7, 19, 18, 1);
    ctx.fillRect(7, 22, 18, 1);

    // Cushion inside basket
    ctx.fillStyle = '#E8B080';
    ctx.fillRect(9, 14, 14, 10);
    ctx.fillStyle = '#F4C898';
    ctx.fillRect(10, 15, 12, 8);
    ctx.fillStyle = '#FEE0C0';
    ctx.fillRect(11, 16, 7, 4);

    // Pillow at the head end (top of basket)
    ctx.fillStyle = '#F0C0A8';
    ctx.fillRect(9, 11, 14, 5);
    ctx.fillStyle = '#FAD8C8';
    ctx.fillRect(10, 12, 12, 3);

    // Front low rim edge for depth
    ctx.fillStyle = '#5A3810';
    ctx.fillRect(6, 24, 20, 2);
    ctx.fillStyle = '#8A6028';
    ctx.fillRect(7, 25, 18, 1);

    c.refresh();
  }

  // ─── Pet: cat ghost preview texture (32 × 32) ────────────────────────────────
  //
  // Shown as the semi-transparent placement ghost when the player is about to
  // drop a cat. Matches the sitting pose drawn by CatNPC.drawSitting().

  private makePetCat(): void {
    const c = this.textures.createCanvas('pet-cat', 32, 32)!;
    const ctx = c.getContext();

    // Coordinates are world-space (origin at top-left of the 32×32 tile).
    // The NPC's Graphics origin is at the centre of its feet, so we offset
    // everything by (16, 22) to centre the sitting cat within the tile.
    const ox = 16, oy = 22;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(ox - 5, oy + 7, 10, 3);

    // Tail
    ctx.fillStyle = '#C86020';
    ctx.fillRect(ox - 7, oy + 0, 3, 8);
    ctx.fillStyle = '#E07830';
    ctx.fillRect(ox - 6, oy + 1, 2, 6);
    ctx.fillStyle = '#F8E8D0';
    ctx.fillRect(ox - 6, oy + 5, 2, 2);

    // Body
    ctx.fillStyle = '#C86020';
    ctx.fillRect(ox - 5, oy - 2, 10, 10);
    ctx.fillStyle = '#E07830';
    ctx.fillRect(ox - 4, oy - 1, 8, 8);
    ctx.fillStyle = '#F09040';
    ctx.fillRect(ox - 4, oy - 1, 5, 3);
    ctx.fillStyle = '#F8E8D0';
    ctx.fillRect(ox - 3, oy + 2, 6, 5);

    // Head
    ctx.fillStyle = '#C86020';
    ctx.fillRect(ox - 5, oy - 11, 10, 10);
    ctx.fillStyle = '#E07830';
    ctx.fillRect(ox - 4, oy - 10, 8, 8);
    ctx.fillStyle = '#F09040';
    ctx.fillRect(ox - 4, oy - 10, 5, 4);

    // Ears
    ctx.fillStyle = '#C86020';
    ctx.fillRect(ox - 5, oy - 14, 3, 4);
    ctx.fillRect(ox + 3, oy - 14, 3, 4);
    ctx.fillStyle = '#FF9090';
    ctx.fillRect(ox - 4, oy - 13, 1, 2);
    ctx.fillRect(ox + 4, oy - 13, 1, 2);

    // Eyes
    ctx.fillStyle = '#205810';
    ctx.fillRect(ox - 3, oy - 8, 2, 2);
    ctx.fillRect(ox + 2, oy - 8, 2, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(ox - 2, oy - 8, 1, 1);
    ctx.fillRect(ox + 3, oy - 8, 1, 1);
    ctx.fillStyle = '#0A1A08';
    ctx.fillRect(ox - 2, oy - 7, 1, 1);
    ctx.fillRect(ox + 3, oy - 7, 1, 1);

    // Nose
    ctx.fillStyle = '#FF6080';
    ctx.fillRect(ox - 1, oy - 5, 2, 1);

    // Whiskers
    ctx.fillStyle = 'rgba(138,96,64,0.35)';
    ctx.fillRect(ox - 5, oy - 5, 4, 1);
    ctx.fillRect(ox + 2, oy - 5, 4, 1);

    // Front paws
    ctx.fillStyle = '#E07830';
    ctx.fillRect(ox - 4, oy + 7, 3, 3);
    ctx.fillRect(ox + 2, oy + 7, 3, 3);
    ctx.fillStyle = '#F8E8D0';
    ctx.fillRect(ox - 4, oy + 8, 2, 2);
    ctx.fillRect(ox + 2, oy + 8, 2, 2);

    c.refresh();
  }
}
