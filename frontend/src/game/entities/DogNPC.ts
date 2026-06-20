/**
 * DogNPC — a golden-retriever-coloured dog that roams the island.
 *
 * Same SITTING ↔ WALKING state machine as CatNPC, but dogs are faster and
 * more energetic: shorter idle times, higher speed, longer roam range.
 * Two pre-drawn Graphics (gSit / gWalk) are toggled on state change.
 */

import Phaser from 'phaser';
import { CollisionSystem } from '../systems/CollisionSystem';

// ── Golden retriever palette ───────────────────────────────────────────────────
const C_DARK    = 0xA86820;  // dark amber
const C_MID     = 0xC88838;  // main amber
const C_LIGHT   = 0xD8A048;  // highlight
const C_SNOUT   = 0xE0B060;  // lighter muzzle
const C_SNOUT_L = 0xECDBA8;  // palest muzzle
const C_NOSE    = 0x1A1A1A;  // black nose
const C_EYE     = 0x2A1408;  // dark brown eye
const C_BROW    = 0x8A5018;  // eyebrow

const DOG_RADIUS    = 9;    // slightly bigger than cats
const BOB_AMPLITUDE = 1.4;
const BOB_SPEED     = 0.010;

const enum DogState { Sitting = 0, Walking = 1, Sleeping = 2 }

export class DogNPC {
  private root:  Phaser.GameObjects.Container;
  private gSit:  Phaser.GameObjects.Graphics;
  private gWalk: Phaser.GameObjects.Graphics;
  private gSleep: Phaser.GameObjects.Graphics;

  private state:     DogState = DogState.Sitting;
  private timer:     number;
  private walkTimer: number  = 0;
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
    this.speed    = 60 + Math.random() * 30;        // 60–90 px/s — dogs move faster
    this.timer    = 500 + Math.random() * 1500;      // short initial sit
    this.bobPhase = Math.random() * Math.PI * 2;

    this.gSit   = scene.add.graphics();
    this.gWalk  = scene.add.graphics();
    this.gSleep = scene.add.graphics();
    this.drawSitting();
    this.drawWalking();
    this.drawSleeping();
    this.gWalk.setVisible(false);
    this.gSleep.setVisible(false);

    this.root = scene.add.container(x, y, [this.gSit, this.gWalk, this.gSleep]);
  }

  sleepInBed(bedX: number, bedY: number): void {
    this.state      = DogState.Sleeping;
    this.root.x     = bedX;
    this.root.y     = bedY;
    this.gSit.setVisible(false);
    this.gWalk.setVisible(false);
    this.gSleep.setVisible(true);
  }

  wakeUp(): void {
    if (this.state !== DogState.Sleeping) return;
    this.gSleep.setVisible(false);
    this.sit();
  }

  isSleeping(): boolean { return this.state === DogState.Sleeping; }

  update(delta: number, col: CollisionSystem): void {
    if (this.state === DogState.Sleeping) {
      this.root.setDepth(100 + this.root.y * 0.01);
      return;
    }
    if (this.state === DogState.Sitting) {
      this.timer -= delta;
      if (this.timer <= 0) this.pickTarget(col);
      this.gSit.y *= 0.85;
    } else {
      this.walkTimer += delta;
      if (this.walkTimer > 12_000) {
        this.sit();
      } else {
        this.walk(delta, col);
        this.bobPhase += delta * BOB_SPEED;
        this.gWalk.y = Math.sin(this.bobPhase) * BOB_AMPLITUDE;
      }
    }
    this.root.setDepth(100 + this.root.y * 0.01);
  }

  private sit(): void {
    this.state = DogState.Sitting;
    this.timer = 800 + Math.random() * 2500;   // dogs don't sit still long
    this.gSit.setVisible(true);
    this.gWalk.setVisible(false);
  }

  private pickTarget(col: CollisionSystem): void {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 40 + Math.random() * 160;  // wider range than cats
      const ntx   = this.root.x + Math.cos(angle) * dist;
      const nty   = this.root.y + Math.sin(angle) * dist;
      if (col.canMoveTo(ntx, nty, DOG_RADIUS)) {
        this.tx        = ntx;
        this.ty        = nty;
        this.state     = DogState.Walking;
        this.walkTimer = 0;
        this.gSit.setVisible(false);
        this.gWalk.setVisible(true);
        return;
      }
    }
    this.timer = 1000 + Math.random() * 1500;
  }

  private walk(delta: number, col: CollisionSystem): void {
    const dx   = this.tx - this.root.x;
    const dy   = this.ty - this.root.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) { this.sit(); return; }

    const step = (this.speed * delta) / 1000;
    const nx   = this.root.x + (dx / dist) * step;
    const ny   = this.root.y + (dy / dist) * step;

    if      (col.canMoveTo(nx, ny, DOG_RADIUS))            { this.root.x = nx; this.root.y = ny; }
    else if (col.canMoveTo(nx, this.root.y, DOG_RADIUS))   { this.root.x = nx; }
    else if (col.canMoveTo(this.root.x, ny, DOG_RADIUS))   { this.root.y = ny; }
    else    { this.sit(); return; }

    this.gWalk.scaleX = dx < 0 ? 1 : -1;
  }

  // ── Pixel-art drawing ─────────────────────────────────────────────────────────

  /**
   * Sleeping pose: dog lying on its side, head resting down, floppy ear draped,
   * tail curled at the back, paws tucked forward. Eyes are closed.
   */
  private drawSleeping(): void {
    const g = this.gSleep;

    // Shadow (elongated oval — dog lying flat)
    g.fillStyle(0x000000, 0.26);
    g.fillRect(-9, 5, 18, 3);

    // Tail curled at the back-right
    g.fillStyle(C_DARK);
    g.fillRect(6, -5, 4, 8);
    g.fillStyle(C_MID);
    g.fillRect(7, -4, 3, 6);
    g.fillStyle(C_LIGHT);
    g.fillRect(7, -4, 2, 3);

    // Floppy ear draped to the left
    g.fillStyle(C_DARK);
    g.fillRect(-12, -6, 5, 8);
    g.fillStyle(C_MID);
    g.fillRect(-11, -5, 3, 6);

    // Body (elongated horizontal)
    g.fillStyle(C_DARK);
    g.fillRect(-8, -2, 15, 8);
    g.fillStyle(C_MID);
    g.fillRect(-7, -1, 13, 6);
    g.fillStyle(C_LIGHT);
    g.fillRect(-7, -1, 8, 3);

    // Head resting on the front-left
    g.fillStyle(C_DARK);
    g.fillRect(-11, -8, 11, 8);
    g.fillStyle(C_MID);
    g.fillRect(-10, -7, 9, 6);
    g.fillStyle(C_LIGHT);
    g.fillRect(-10, -7, 5, 3);

    // Snout resting on the ground
    g.fillStyle(C_SNOUT);
    g.fillRect(-9, -4, 7, 5);
    g.fillStyle(C_SNOUT_L);
    g.fillRect(-8, -3, 5, 3);

    // Nose
    g.fillStyle(C_NOSE);
    g.fillRect(-7, -4, 3, 2);

    // Closed eye — a thin dark slit
    g.fillStyle(0x000000, 0.65);
    g.fillRect(-9, -6, 4, 1);

    // Front paws tucked forward
    g.fillStyle(C_DARK);
    g.fillRect(-8, 5, 5, 3);
    g.fillStyle(C_MID);
    g.fillRect(-7, 6, 4, 2);

    // Hind paws visible at the back
    g.fillStyle(C_DARK);
    g.fillRect(3, 5, 5, 3);
    g.fillStyle(C_MID);
    g.fillRect(4, 6, 4, 2);
  }

  /** Sitting dog: upright, floppy ears flanking the head, tail to the side. */
  private drawSitting(): void {
    const g = this.gSit;

    // Shadow
    g.fillStyle(0x000000, 0.26);
    g.fillRect(-6, 7, 12, 3);

    // Tail (curves out to the right)
    g.fillStyle(C_DARK);
    g.fillRect(5, -1, 4, 8);
    g.fillStyle(C_MID);
    g.fillRect(6, 0, 3, 6);
    g.fillStyle(C_LIGHT);
    g.fillRect(6, 0, 2, 3);

    // Floppy left ear
    g.fillStyle(C_DARK);
    g.fillRect(-8, -7, 5, 9);
    g.fillStyle(C_MID);
    g.fillRect(-7, -6, 3, 7);

    // Floppy right ear
    g.fillStyle(C_DARK);
    g.fillRect(4, -7, 5, 9);
    g.fillStyle(C_MID);
    g.fillRect(5, -6, 3, 7);

    // Body
    g.fillStyle(C_DARK);
    g.fillRect(-6, -2, 12, 10);
    g.fillStyle(C_MID);
    g.fillRect(-5, -1, 10, 8);
    g.fillStyle(C_LIGHT);
    g.fillRect(-5, -1, 6, 4);

    // Head
    g.fillStyle(C_DARK);
    g.fillRect(-6, -12, 12, 11);
    g.fillStyle(C_MID);
    g.fillRect(-5, -11, 10, 9);
    g.fillStyle(C_LIGHT);
    g.fillRect(-5, -11, 6, 4);

    // Snout
    g.fillStyle(C_SNOUT);
    g.fillRect(-4, -6, 8, 5);
    g.fillStyle(C_SNOUT_L);
    g.fillRect(-3, -5, 6, 3);

    // Nose
    g.fillStyle(C_NOSE);
    g.fillRect(-2, -6, 4, 2);
    g.fillStyle(0x333333);
    g.fillRect(-2, -6, 1, 1);   // nostril

    // Mouth
    g.fillStyle(0x7A5010);
    g.fillRect(0, -3, 1, 2);

    // Eyes
    g.fillStyle(C_EYE);
    g.fillRect(-4, -9, 3, 3);
    g.fillRect(2, -9, 3, 3);
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillRect(-3, -9, 1, 1);
    g.fillRect(3, -9, 1, 1);
    g.fillStyle(0x3A1A08);
    g.fillRect(-3, -8, 2, 2);
    g.fillRect(3, -8, 2, 2);

    // Eyebrows (expressive)
    g.fillStyle(C_BROW);
    g.fillRect(-4, -10, 3, 1);
    g.fillRect(2, -10, 3, 1);

    // Front paws
    g.fillStyle(C_DARK);
    g.fillRect(-5, 7, 4, 3);
    g.fillRect(2, 7, 4, 3);
    g.fillStyle(C_MID);
    g.fillRect(-4, 8, 3, 2);
    g.fillRect(3, 8, 3, 2);
  }

  /**
   * Walking pose (faces LEFT by default; scaleX = -1 when moving right).
   * Floppy ear swings, tail up, four legs staggered for a trot gait.
   */
  private drawWalking(): void {
    const g = this.gWalk;

    // Shadow (wider than sitting)
    g.fillStyle(0x000000, 0.26);
    g.fillRect(-9, 7, 16, 3);

    // Tail raised (at the back = right side)
    g.fillStyle(C_DARK);
    g.fillRect(4, -8, 4, 9);
    g.fillStyle(C_MID);
    g.fillRect(5, -7, 3, 7);
    g.fillStyle(C_LIGHT);
    g.fillRect(5, -7, 2, 4);

    // Floppy near ear (left side of head)
    g.fillStyle(C_DARK);
    g.fillRect(-12, -7, 5, 8);
    g.fillStyle(C_MID);
    g.fillRect(-11, -6, 3, 6);

    // Body (elongated)
    g.fillStyle(C_DARK);
    g.fillRect(-9, -2, 15, 8);
    g.fillStyle(C_MID);
    g.fillRect(-8, -1, 13, 6);
    g.fillStyle(C_LIGHT);
    g.fillRect(-8, -1, 8, 2);

    // Head
    g.fillStyle(C_DARK);
    g.fillRect(-12, -11, 11, 10);
    g.fillStyle(C_MID);
    g.fillRect(-11, -10, 9, 8);
    g.fillStyle(C_LIGHT);
    g.fillRect(-11, -10, 5, 3);

    // Snout
    g.fillStyle(C_SNOUT);
    g.fillRect(-9, -6, 7, 5);
    g.fillStyle(C_SNOUT_L);
    g.fillRect(-8, -5, 5, 3);

    // Nose
    g.fillStyle(C_NOSE);
    g.fillRect(-7, -6, 4, 2);

    // Mouth
    g.fillStyle(0x7A5010);
    g.fillRect(-5, -3, 1, 2);

    // Eye (one visible, facing left)
    g.fillStyle(C_EYE);
    g.fillRect(-10, -8, 3, 3);
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillRect(-9, -8, 1, 1);
    g.fillStyle(0x3A1A08);
    g.fillRect(-9, -7, 2, 2);

    // Eyebrow
    g.fillStyle(C_BROW);
    g.fillRect(-10, -9, 3, 1);

    // Legs — trotting gait: front-left & back-right down, others up
    g.fillStyle(C_DARK);
    g.fillRect(-7, 5, 3, 5);   // front-left  (down)
    g.fillRect(-3, 4, 3, 4);   // front-right (up)
    g.fillRect( 2, 4, 3, 4);   // back-left   (up)
    g.fillRect( 5, 5, 3, 5);   // back-right  (down)
    g.fillStyle(C_MID);
    g.fillRect(-6, 6, 2, 3);
    g.fillRect(-2, 5, 2, 2);
    g.fillRect( 3, 5, 2, 2);
    g.fillRect( 6, 6, 2, 3);
  }
}
