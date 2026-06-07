/**
 * CatNPC — an orange tabby that wanders the island after being purchased.
 *
 * State machine: SITTING ↔ WALKING
 *  - SITTING: idles for 3–9 s, then picks a nearby reachable spot.
 *  - WALKING: moves toward the spot at cat speed; slides along walls on
 *    collision, then gives up and sits again.
 *
 * Two pre-drawn Graphics objects (gSit / gWalk) are swapped on state change.
 * A sinusoidal bob is applied to the visible graphic while walking, exactly
 * as the human NPC does, giving the same organic "alive" feeling.
 */

import Phaser from 'phaser';
import { CollisionSystem } from '../systems/CollisionSystem';

// ── Palette ───────────────────────────────────────────────────────────────────
const C_DARK   = 0xC86020;  // dark fur / outline
const C_MID    = 0xE07830;  // main fur
const C_LIGHT  = 0xF09040;  // lit highlight
const C_BELLY  = 0xF8E8D0;  // cream belly / paw pads / tail tip
const C_EAR    = 0xFF9090;  // inner ear pink
const C_EYE    = 0x205810;  // iris green
const C_PUPIL  = 0x0A1A08;  // pupil
const C_NOSE   = 0xFF6080;  // nose
const C_WHISK  = 0x8A6040;  // whisker colour

const CAT_RADIUS    = 7;    // collision radius (px) — smaller than human NPCs
const BOB_AMPLITUDE = 1.2;
const BOB_SPEED     = 0.008;

const enum CatState { Sitting = 0, Walking = 1 }

export class CatNPC {
  private root:  Phaser.GameObjects.Container;
  private gSit:  Phaser.GameObjects.Graphics;
  private gWalk: Phaser.GameObjects.Graphics;

  private state:     CatState = CatState.Sitting;
  private timer:     number;          // ms remaining in SITTING idle
  private walkTimer: number   = 0;   // ms spent in current WALKING attempt
  private tx:        number;
  private ty:        number;
  private speed:     number;
  private bobPhase:  number;

  get x() { return this.root.x; }
  get y() { return this.root.y; }
  getContainer() { return this.root; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.tx       = x;
    this.ty       = y;
    this.speed    = 42 + Math.random() * 28;        // 42–70 px/s
    this.timer    = 1000 + Math.random() * 2000;    // stagger first sit
    this.bobPhase = Math.random() * Math.PI * 2;    // stagger bob phase

    this.gSit  = scene.add.graphics();
    this.gWalk = scene.add.graphics();
    this.drawSitting();
    this.drawWalking();
    this.gWalk.setVisible(false);

    this.root = scene.add.container(x, y, [this.gSit, this.gWalk]);
  }

  update(delta: number, col: CollisionSystem): void {
    if (this.state === CatState.Sitting) {
      this.timer -= delta;
      if (this.timer <= 0) this.pickTarget(col);
      this.gSit.y *= 0.85; // settle bob back to zero while idle
    } else {
      this.walkTimer += delta;
      if (this.walkTimer > 8_000) {
        this.sit();
      } else {
        this.walk(delta, col);
        this.bobPhase += delta * BOB_SPEED;
        this.gWalk.y = Math.sin(this.bobPhase) * BOB_AMPLITUDE;
      }
    }

    this.root.setDepth(100 + this.root.y * 0.01);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private sit(): void {
    this.state = CatState.Sitting;
    this.timer = 3000 + Math.random() * 6000; // sit 3–9 s
    this.gSit.setVisible(true);
    this.gWalk.setVisible(false);
  }

  private pickTarget(col: CollisionSystem): void {
    // Cats roam a shorter radius than human NPCs (20–80 px vs 32–160 px).
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 20 + Math.random() * 80;
      const ntx   = this.root.x + Math.cos(angle) * dist;
      const nty   = this.root.y + Math.sin(angle) * dist;

      if (col.canMoveTo(ntx, nty, CAT_RADIUS)) {
        this.tx        = ntx;
        this.ty        = nty;
        this.state     = CatState.Walking;
        this.walkTimer = 0;
        this.gSit.setVisible(false);
        this.gWalk.setVisible(true);
        return;
      }
    }
    // No reachable spot — stay seated a little longer.
    this.timer = 1500 + Math.random() * 2000;
  }

  private walk(delta: number, col: CollisionSystem): void {
    const dx   = this.tx - this.root.x;
    const dy   = this.ty - this.root.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) { this.sit(); return; }

    const step = (this.speed * delta) / 1000;
    const nx   = this.root.x + (dx / dist) * step;
    const ny   = this.root.y + (dy / dist) * step;

    if      (col.canMoveTo(nx, ny, CAT_RADIUS))            { this.root.x = nx; this.root.y = ny; }
    else if (col.canMoveTo(nx, this.root.y, CAT_RADIUS))   { this.root.x = nx; }
    else if (col.canMoveTo(this.root.x, ny, CAT_RADIUS))   { this.root.y = ny; }
    else    { this.sit(); return; }

    // Flip horizontally so the cat faces the direction it's walking.
    this.gWalk.scaleX = dx < 0 ? 1 : -1;
  }

  // ── Pixel-art sprite drawing ─────────────────────────────────────────────────

  /** Sitting pose: upright oval body, curled tail, front paws tucked. */
  private drawSitting(): void {
    const g = this.gSit;

    // Shadow
    g.fillStyle(0x000000, 0.26);
    g.fillRect(-5, 7, 10, 3);

    // Tail (curls around left side of body)
    g.fillStyle(C_DARK);
    g.fillRect(-7, 0, 3, 8);
    g.fillStyle(C_MID);
    g.fillRect(-6, 1, 2, 6);
    g.fillStyle(C_BELLY);        // cream tip
    g.fillRect(-6, 5, 2, 2);

    // Body
    g.fillStyle(C_DARK);
    g.fillRect(-5, -2, 10, 10);
    g.fillStyle(C_MID);
    g.fillRect(-4, -1, 8, 8);
    g.fillStyle(C_LIGHT);
    g.fillRect(-4, -1, 5, 3);
    g.fillStyle(C_BELLY);        // cream belly
    g.fillRect(-3, 2, 6, 5);

    // Head
    g.fillStyle(C_DARK);
    g.fillRect(-5, -11, 10, 10);
    g.fillStyle(C_MID);
    g.fillRect(-4, -10, 8, 8);
    g.fillStyle(C_LIGHT);
    g.fillRect(-4, -10, 5, 4);

    // Ears
    g.fillStyle(C_DARK);
    g.fillRect(-5, -14, 3, 4);
    g.fillRect( 3, -14, 3, 4);
    g.fillStyle(C_EAR);
    g.fillRect(-4, -13, 1, 2);
    g.fillRect( 4, -13, 1, 2);

    // Eyes (green iris + vertical pupil slit — relaxed cat)
    g.fillStyle(C_EYE);
    g.fillRect(-3, -8, 2, 2);
    g.fillRect( 2, -8, 2, 2);
    g.fillStyle(0xFFFFFF, 0.8);  // shine
    g.fillRect(-2, -8, 1, 1);
    g.fillRect( 3, -8, 1, 1);
    g.fillStyle(C_PUPIL);
    g.fillRect(-2, -7, 1, 1);
    g.fillRect( 3, -7, 1, 1);

    // Nose
    g.fillStyle(C_NOSE);
    g.fillRect(-1, -5, 2, 1);

    // Whiskers
    g.fillStyle(C_WHISK, 0.35);
    g.fillRect(-5, -5, 4, 1);
    g.fillRect( 2, -5, 4, 1);

    // Front paws (tucked under body)
    g.fillStyle(C_MID);
    g.fillRect(-4, 7, 3, 3);
    g.fillRect( 2, 7, 3, 3);
    g.fillStyle(C_BELLY);        // lighter paw pads
    g.fillRect(-4, 8, 2, 2);
    g.fillRect( 2, 8, 2, 2);
  }

  /**
   * Walking pose: elongated horizontal body, tail raised, four visible legs.
   * The cat faces LEFT by default; scaleX is flipped to -1 when moving right.
   */
  private drawWalking(): void {
    const g = this.gWalk;

    // Shadow (longer than sit)
    g.fillStyle(0x000000, 0.26);
    g.fillRect(-8, 7, 14, 3);

    // Tail (raised upright at the back / right side)
    g.fillStyle(C_DARK);
    g.fillRect(5, -9, 3, 10);
    g.fillStyle(C_MID);
    g.fillRect(6, -8, 2, 8);
    g.fillStyle(C_BELLY);        // cream tip at top of tail
    g.fillRect(6, -8, 2, 3);

    // Body (elongated, low-slung)
    g.fillStyle(C_DARK);
    g.fillRect(-8, -2, 14, 7);
    g.fillStyle(C_MID);
    g.fillRect(-7, -1, 12, 5);
    g.fillStyle(C_LIGHT);
    g.fillRect(-7, -1, 7, 2);
    g.fillStyle(C_BELLY);        // belly stripe
    g.fillRect(-4, 1, 7, 3);

    // Head (front / left)
    g.fillStyle(C_DARK);
    g.fillRect(-9, -10, 9, 8);
    g.fillStyle(C_MID);
    g.fillRect(-8, -9, 7, 6);
    g.fillStyle(C_LIGHT);
    g.fillRect(-8, -9, 4, 3);

    // Ears
    g.fillStyle(C_DARK);
    g.fillRect(-9, -13, 3, 4);
    g.fillRect(-5, -13, 3, 4);
    g.fillStyle(C_EAR);
    g.fillRect(-8, -12, 1, 2);
    g.fillRect(-4, -12, 1, 2);

    // Eye (cat is facing left — one visible eye)
    g.fillStyle(C_EYE);
    g.fillRect(-7, -7, 2, 2);
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillRect(-6, -7, 1, 1);
    g.fillStyle(C_PUPIL);
    g.fillRect(-6, -6, 1, 1);

    // Nose
    g.fillStyle(C_NOSE);
    g.fillRect(-3, -5, 1, 1);

    // Legs — staggered diagonal gait: front-left & back-right are down,
    // front-right & back-left are up, matching a natural trot pattern.
    g.fillStyle(C_DARK);
    g.fillRect(-6, 4, 2, 4);   // front-left  (down)
    g.fillRect(-3, 3, 2, 3);   // front-right (up)
    g.fillRect( 2, 3, 2, 3);   // back-left   (up)
    g.fillRect( 5, 4, 2, 4);   // back-right  (down)
    g.fillStyle(C_MID);
    g.fillRect(-5, 5, 1, 2);
    g.fillRect(-2, 4, 1, 1);
    g.fillRect( 3, 4, 1, 1);
    g.fillRect( 6, 5, 1, 2);
    // Paw tips (cream)
    g.fillStyle(C_BELLY);
    g.fillRect(-6, 7, 2, 1);
    g.fillRect( 5, 7, 2, 1);
  }
}
