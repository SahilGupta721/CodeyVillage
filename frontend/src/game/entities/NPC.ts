/**
 * NPC entity with organic wandering behaviour.
 *
 * State machine: IDLE ↔ WALKING
 *  - IDLE: counts down a randomised timer, then picks a reachable target.
 *  - WALKING: moves toward the target; on collision tries to slide, then
 *    falls back to IDLE with a short penalty timer.
 *
 * Each NPC gets a slightly different speed and staggered initial timer so
 * the village feels alive rather than mechanically synchronised.
 */

import Phaser from 'phaser';
import { CollisionSystem } from '../systems/CollisionSystem';

// Shirt colours — one per NPC slot
const SHIRT_COLORS = [
  0xe05828, // orange
  0x30a840, // green
  0x9030c0, // purple
  0xd4a020, // yellow
  0xd02860, // pink
  0x1898c0, // teal
  0xb83020, // red
];

// Hat/cap colours — offset from shirt so they don't match
const HAT_COLORS = [
  0x1e3070, // dark navy (player default)
  0x2a1840, // dark purple
  0x0e3820, // dark green
  0x401808, // dark brown
  0x1e3858, // dark teal
  0x381818, // dark crimson
  0x383010, // dark olive
];

// Trouser colours — neutral darks
const LEG_COLORS = [
  0x1e2860, // navy (player default)
  0x281840, // dark purple
  0x0e2818, // dark green
  0x301808, // dark brown
  0x1e2848, // dark teal
  0x281010, // dark red
  0x282010, // dark olive
];

const RADIUS        = 9;
const BOB_AMPLITUDE = 1.5;
const BOB_SPEED     = 0.009;

const enum State { Idle = 0, Walking = 1 }

export class NPC {
  private root    : Phaser.GameObjects.Container;
  private body    : Phaser.GameObjects.Graphics;
  private state   : State  = State.Idle;
  private timer     : number = 0;   // ms remaining in IDLE
  private walkTimer : number = 0;   // ms spent in current WALKING attempt
  private tx        : number;       // walking target x (world space)
  private ty        : number;       // walking target y (world space)
  private speed     : number;
  private bobPhase  = 0;

  get x() { return this.root.x; }
  get y() { return this.root.y; }
  getContainer() { return this.root; }

  constructor(scene: Phaser.Scene, x: number, y: number, idx: number) {
    this.tx    = x;
    this.ty    = y;
    this.speed = 48 + (idx * 11) % 48; // 48–96 px/s — each NPC moves a bit differently

    const shirt = SHIRT_COLORS[idx % SHIRT_COLORS.length];
    const hat   = HAT_COLORS[idx % HAT_COLORS.length];
    const legs  = LEG_COLORS[idx % LEG_COLORS.length];
    const g = scene.add.graphics();

    // Shadow — identical to player
    g.fillStyle(0x000000, 0.26);
    g.fillRect(-7, 4, 14, 5);

    // Legs (trousers) — same offsets as player
    g.fillStyle(legs);
    g.fillRect(-5, 6, 4, 5);
    g.fillRect( 2, 6, 4, 5);

    // Shirt — same rect as player, randomised colour
    g.fillStyle(shirt);
    g.fillRect(-6, -2, 12, 8);

    // Shirt highlight
    g.fillStyle(0xffffff, 0.22);
    g.fillRect(-5, -2, 3, 8);

    // Head (skin)
    g.fillStyle(0xf0c890);
    g.fillRect(-5, -9, 10, 7);

    // Eyes
    g.fillStyle(0x080408);
    g.fillRect(-3, -5, 2, 2);
    g.fillRect( 2, -5, 2, 2);

    // Hat brim — same as player, randomised colour
    g.fillStyle(hat);
    g.fillRect(-6, -9, 12, 3);

    // Hat highlight strip
    g.fillStyle(0x4060a8);
    g.fillRect(-6, -9, 12, 1);

    this.body  = g;
    this.root  = scene.add.container(x, y, [g]);

    // Stagger idle timers so NPCs don't all start walking at frame 0
    this.timer = idx * 700 + 400;
  }

  update(delta: number, col: CollisionSystem): void {
    if (this.state === State.Idle) {
      this.timer -= delta;
      if (this.timer <= 0) this.pickTarget(col);
    } else {
      this.walkTimer += delta;
      if (this.walkTimer > 10_000) {
        this.walkTimer = 0;
        this.pickTarget(col); // stuck — immediately try a fresh direction
      } else {
        this.walk(delta, col);
      }
    }

    if (this.state === State.Walking) {
      this.bobPhase  += delta * BOB_SPEED;
      this.body.y     = Math.sin(this.bobPhase) * BOB_AMPLITUDE;
    } else {
      this.body.y    *= 0.75;
    }

    this.root.setDepth(100 + this.root.y * 0.01);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private pickTarget(col: CollisionSystem): void {
    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 32 + Math.random() * 128; // 1–4 tiles
      const ntx   = this.root.x + Math.cos(angle) * dist;
      const nty   = this.root.y + Math.sin(angle) * dist;

      if (col.canMoveTo(ntx, nty, RADIUS)) {
        this.tx        = ntx;
        this.ty        = nty;
        this.state     = State.Walking;
        this.walkTimer = 0;
        return;
      }
    }
    // No reachable spot found → stay idle a bit longer
    this.timer = 800 + Math.random() * 2000;
  }

  private walk(delta: number, col: CollisionSystem): void {
    const dx   = this.tx - this.root.x;
    const dy   = this.ty - this.root.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      // Arrived
      this.state = State.Idle;
      this.timer = 600 + Math.random() * 3200;
      return;
    }

    const step = (this.speed * delta) / 1000;
    const nx   = this.root.x + (dx / dist) * step;
    const ny   = this.root.y + (dy / dist) * step;

    if      (col.canMoveTo(nx, ny, RADIUS))            { this.root.x = nx; this.root.y = ny; }
    else if (col.canMoveTo(nx, this.root.y, RADIUS))   { this.root.x = nx; }
    else if (col.canMoveTo(this.root.x, ny, RADIUS))   { this.root.y = ny; }
    else {
      // Fully blocked → idle with short penalty
      this.state = State.Idle;
      this.timer = 500 + Math.random() * 1000;
    }
  }
}
