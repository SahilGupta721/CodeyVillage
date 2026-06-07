/**
 * BunnyNPC — a white rabbit that hops around the island.
 *
 * State machine: SITTING ↔ HOPPING
 *  - SITTING: idles 2–7 s between bursts of movement.
 *  - HOPPING: moves in discrete hops, each with a parabolic arc so the body
 *    visibly rises off the ground and the shadow shrinks beneath it.
 *
 * Three Graphics children inside the root Container:
 *   gSit      — full sitting pose (shadow included), shown when idle.
 *   gHopShadow — just the ground shadow, animated in scale+alpha while airborne.
 *   gHopBody  — body + ears + legs, Y-offset follows the parabolic arc.
 *
 * The container itself moves along the ground for both hop phases, keeping the
 * shadow in the right place. Only gHopBody.y moves up/down for the arc.
 */

import Phaser from 'phaser';
import { CollisionSystem } from '../systems/CollisionSystem';

// ── White rabbit palette ──────────────────────────────────────────────────────
const C_OUTER  = 0xD0CCCA;  // grey-white fur outline
const C_MID    = 0xEEEAE8;  // main body
const C_BRIGHT = 0xFFFFFF;  // brightest highlight
const C_EAR    = 0xF4A0A0;  // inner ear pink
const C_EYE    = 0xE02080;  // pink iris
const C_NOSE   = 0xFF80B0;  // pink nose
const C_TAIL   = 0xF0EEEC;  // off-white tail

const BUNNY_RADIUS  = 6;
const HOP_DURATION  = 270;   // ms per full hop arc
const HOP_PAUSE     = 85;    // ms between hops (on the ground)
const HOP_DISTANCE  = 13;    // world-px per hop
const HOP_HEIGHT    = 10;    // max px off ground at arc peak

const enum BunnyState { Sitting = 0, Hopping = 1 }

export class BunnyNPC {
  private root:        Phaser.GameObjects.Container;
  private gSit:        Phaser.GameObjects.Graphics;
  private gHopShadow:  Phaser.GameObjects.Graphics;
  private gHopBody:    Phaser.GameObjects.Graphics;

  private state:     BunnyState = BunnyState.Sitting;
  private timer:     number;           // ms remaining in sit
  private walkTimer: number  = 0;     // total ms spent hopping toward target
  private tx:        number;
  private ty:        number;

  // Hop sub-state
  private isAirborne:   boolean = false;
  private hopTimer:     number  = 0;   // ms into current arc
  private hopPauseLeft: number  = 0;   // ms of ground pause remaining
  private hopStartX:    number  = 0;
  private hopStartY:    number  = 0;
  private hopEndX:      number  = 0;
  private hopEndY:      number  = 0;

  get x() { return this.root.x; }
  get y() { return this.root.y; }
  getContainer() { return this.root; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.tx    = x;
    this.ty    = y;
    this.timer = 800 + Math.random() * 1500;

    this.gSit       = scene.add.graphics();
    this.gHopShadow = scene.add.graphics();
    this.gHopBody   = scene.add.graphics();

    this.drawSitting();
    this.drawHopShadow();
    this.drawHopBody();

    this.gHopShadow.setVisible(false);
    this.gHopBody.setVisible(false);

    // Shadow behind body in draw order
    this.root = scene.add.container(x, y, [this.gHopShadow, this.gSit, this.gHopBody]);
  }

  update(delta: number, col: CollisionSystem): void {
    if (this.state === BunnyState.Sitting) {
      this.timer -= delta;
      if (this.timer <= 0) this.pickTarget(col);
    } else {
      this.walkTimer += delta;
      if (this.walkTimer > 10_000) { this.sit(); return; }
      this.updateHop(delta, col);
    }
    this.root.setDepth(100 + this.root.y * 0.01);
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private sit(): void {
    this.state      = BunnyState.Sitting;
    this.timer      = 2000 + Math.random() * 5000;
    this.isAirborne = false;
    this.gHopBody.y = 0;
    this.gHopShadow.setScale(1, 1).setAlpha(1);
    this.gSit.setVisible(true);
    this.gHopShadow.setVisible(false);
    this.gHopBody.setVisible(false);
  }

  private pickTarget(col: CollisionSystem): void {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 24 + Math.random() * 96;
      const ntx   = this.root.x + Math.cos(angle) * dist;
      const nty   = this.root.y + Math.sin(angle) * dist;
      if (col.canMoveTo(ntx, nty, BUNNY_RADIUS)) {
        this.tx           = ntx;
        this.ty           = nty;
        this.state        = BunnyState.Hopping;
        this.walkTimer    = 0;
        this.isAirborne   = false;
        this.hopPauseLeft = 0;
        this.gSit.setVisible(false);
        this.gHopShadow.setVisible(true);
        this.gHopBody.setVisible(true);
        return;
      }
    }
    this.timer = 1200 + Math.random() * 2000;
  }

  private updateHop(delta: number, col: CollisionSystem): void {
    if (this.isAirborne) {
      this.hopTimer += delta;
      const t    = Math.min(this.hopTimer / HOP_DURATION, 1);
      const sinT = Math.sin(t * Math.PI);

      // Slide the container along the ground during the arc
      this.root.x = Phaser.Math.Linear(this.hopStartX, this.hopEndX, t);
      this.root.y = Phaser.Math.Linear(this.hopStartY, this.hopEndY, t);

      // Lift the body graphic along the parabolic arc
      this.gHopBody.y = -HOP_HEIGHT * sinT;

      // Shadow shrinks and fades as the bunny rises
      this.gHopShadow.setScale(1 - 0.45 * sinT, 1);
      this.gHopShadow.setAlpha(1 - 0.6 * sinT);

      if (t >= 1) {
        this.isAirborne    = false;
        this.hopTimer      = 0;
        this.hopPauseLeft  = HOP_PAUSE;
        this.gHopBody.y    = 0;
        this.gHopShadow.setScale(1, 1).setAlpha(1);
        if (Math.hypot(this.tx - this.root.x, this.ty - this.root.y) < HOP_DISTANCE * 1.5) {
          this.sit();
        }
      }
    } else {
      // Pausing on the ground between hops
      this.hopPauseLeft -= delta;
      if (this.hopPauseLeft > 0) return;

      const dx   = this.tx - this.root.x;
      const dy   = this.ty - this.root.y;
      const dist = Math.hypot(dx, dy);
      if (dist < HOP_DISTANCE * 0.75) { this.sit(); return; }

      const step = Math.min(HOP_DISTANCE, dist);
      const nx   = this.root.x + (dx / dist) * step;
      const ny   = this.root.y + (dy / dist) * step;

      if (col.canMoveTo(nx, ny, BUNNY_RADIUS)) {
        this.hopStartX  = this.root.x;
        this.hopStartY  = this.root.y;
        this.hopEndX    = nx;
        this.hopEndY    = ny;
        this.isAirborne = true;
        this.hopTimer   = 0;
        // Flip to face direction of travel
        const dir = dx < 0 ? 1 : -1;
        this.gHopBody.scaleX   = dir;
        this.gHopShadow.scaleX = dir;
      } else {
        this.sit();
      }
    }
  }

  // ── Pixel-art drawing ─────────────────────────────────────────────────────────

  /** Sitting pose — long upright ears, round body, front paws visible. */
  private drawSitting(): void {
    const g = this.gSit;

    // Shadow
    g.fillStyle(0x000000, 0.26);
    g.fillRect(-5, 8, 10, 3);

    // Long ears (upright)
    g.fillStyle(C_OUTER);
    g.fillRect(-4, -19, 3, 12);
    g.fillRect( 2, -19, 3, 12);
    g.fillStyle(C_EAR);
    g.fillRect(-3, -18, 1, 9);
    g.fillRect( 3, -18, 1, 9);

    // Body (round)
    g.fillStyle(C_OUTER);
    g.fillRect(-5, -3, 10, 11);
    g.fillStyle(C_MID);
    g.fillRect(-4, -2, 8, 9);
    g.fillStyle(C_BRIGHT);
    g.fillRect(-4, -2, 5, 5);

    // Fluffy tail (right side)
    g.fillStyle(C_BRIGHT);
    g.fillRect(4, 1, 4, 4);
    g.fillStyle(C_TAIL);
    g.fillRect(5, 2, 3, 3);

    // Head
    g.fillStyle(C_OUTER);
    g.fillRect(-5, -12, 10, 10);
    g.fillStyle(C_MID);
    g.fillRect(-4, -11, 8, 8);
    g.fillStyle(C_BRIGHT);
    g.fillRect(-4, -11, 5, 5);

    // Eyes (pink)
    g.fillStyle(C_EYE);
    g.fillRect(-3, -8, 2, 2);
    g.fillRect( 2, -8, 2, 2);
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillRect(-2, -8, 1, 1);
    g.fillRect( 3, -8, 1, 1);

    // Nose
    g.fillStyle(C_NOSE);
    g.fillRect(-1, -5, 2, 1);

    // Front paws
    g.fillStyle(C_MID);
    g.fillRect(-4, 7, 3, 3);
    g.fillRect( 2, 7, 3, 3);
  }

  /** Ground shadow only — kept separate so it can animate independently. */
  private drawHopShadow(): void {
    this.gHopShadow.fillStyle(0x000000, 0.26);
    this.gHopShadow.fillRect(-5, 8, 10, 3);
  }

  /**
   * Airborne pose (faces LEFT by default; scaleX flipped when moving right).
   * Ears angled back, body slightly elongated, hind legs kicked back for thrust,
   * front legs tucked under — captures the classic rabbit mid-hop silhouette.
   */
  private drawHopBody(): void {
    const g = this.gHopBody;

    // Ears swept back during jump
    g.fillStyle(C_OUTER);
    g.fillRect(-4, -17, 3, 10);
    g.fillRect( 2, -17, 3, 10);
    g.fillStyle(C_EAR);
    g.fillRect(-3, -16, 1, 7);
    g.fillRect( 3, -16, 1, 7);

    // Body (slightly elongated — "stretch" phase of hop)
    g.fillStyle(C_OUTER);
    g.fillRect(-5, -4, 10, 12);
    g.fillStyle(C_MID);
    g.fillRect(-4, -3, 8, 10);
    g.fillStyle(C_BRIGHT);
    g.fillRect(-4, -3, 5, 6);

    // Fluffy tail
    g.fillStyle(C_BRIGHT);
    g.fillRect(4, 2, 4, 4);
    g.fillStyle(C_TAIL);
    g.fillRect(5, 3, 3, 3);

    // Head
    g.fillStyle(C_OUTER);
    g.fillRect(-5, -13, 10, 10);
    g.fillStyle(C_MID);
    g.fillRect(-4, -12, 8, 8);
    g.fillStyle(C_BRIGHT);
    g.fillRect(-4, -12, 5, 5);

    // Eyes wide open (alert while airborne)
    g.fillStyle(C_EYE);
    g.fillRect(-3, -9, 2, 3);
    g.fillRect( 2, -9, 2, 3);
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillRect(-2, -9, 1, 1);
    g.fillRect( 3, -9, 1, 1);

    // Nose
    g.fillStyle(C_NOSE);
    g.fillRect(-1, -5, 2, 1);

    // Hind legs kicked back (propulsion)
    g.fillStyle(C_OUTER);
    g.fillRect(-7, 5, 5, 3);   // left hind
    g.fillRect( 4, 5, 5, 3);   // right hind
    g.fillStyle(C_MID);
    g.fillRect(-6, 6, 3, 2);
    g.fillRect( 5, 6, 3, 2);

    // Front legs tucked under body
    g.fillStyle(C_OUTER);
    g.fillRect(-3, 6, 3, 2);
    g.fillRect( 1, 6, 3, 2);
    g.fillStyle(C_MID);
    g.fillRect(-2, 7, 2, 1);
    g.fillRect( 2, 7, 2, 1);
  }
}
