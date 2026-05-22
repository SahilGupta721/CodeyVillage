/**
 * Player entity.
 *
 * Rendered as a small avatar: coloured circle body + highlight + hat detail.
 * Movement is manual (no Arcade Physics): velocity is applied per-frame and
 * each axis is tested independently so the player can slide along walls.
 */

import Phaser from 'phaser';
import { CollisionSystem } from '../systems/CollisionSystem';

const SPEED         = 160;  // pixels / second
const RADIUS        = 10;
const BOB_AMPLITUDE = 1.5;  // px — max vertical offset while walking
const BOB_SPEED     = 0.009; // rad/ms — full cycle ≈ 700 ms

export class Player {
  private root    : Phaser.GameObjects.Container;
  private body    : Phaser.GameObjects.Graphics;
  private label   : Phaser.GameObjects.Text | null = null;
  private bobPhase = 0;

  get x() { return this.root.x; }
  get y() { return this.root.y; }
  getContainer() { return this.root; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const g = scene.add.graphics();

    // Shadow
    g.fillStyle(0x000000, 0.26);
    g.fillRect(-7, 4, 14, 5);

    // Legs (dark navy trousers)
    g.fillStyle(0x1e2860);
    g.fillRect(-5, 6, 4, 5);
    g.fillRect( 2, 6, 4, 5);

    // Blue shirt
    g.fillStyle(0x3a7fd5);
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

    // Hat (dark blue cap brim)
    g.fillStyle(0x1e3070);
    g.fillRect(-6, -9, 12, 3);

    // Hat highlight strip
    g.fillStyle(0x4060a8);
    g.fillRect(-6, -9, 12, 1);

    this.body = g;
    this.root = scene.add.container(x, y, [g]);
    this.updateDepth();
  }

  setLabel(scene: Phaser.Scene, text: string): void {
    if (this.label) {
      this.label.setText(text);
      return;
    }
    this.label = scene.add.text(0, -22, text, {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 3, y: 2 },
    }).setOrigin(0.5);
    this.root.add(this.label);
  }

  update(
    delta : number,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    wasd  : Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>,
    col   : CollisionSystem,
  ): void {
    let vx = 0, vy = 0;

    if (cursors.left.isDown  || wasd.left.isDown)  vx -= SPEED;
    if (cursors.right.isDown || wasd.right.isDown) vx += SPEED;
    if (cursors.up.isDown    || wasd.up.isDown)    vy -= SPEED;
    if (cursors.down.isDown  || wasd.down.isDown)  vy += SPEED;

    // Normalise diagonal movement
    if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

    const dt  = delta / 1000;
    const nx  = this.root.x + vx * dt;
    const ny  = this.root.y + vy * dt;

    const prevX = this.root.x, prevY = this.root.y;
    if (col.canMoveTo(nx, this.root.y, RADIUS)) this.root.x = nx;
    if (col.canMoveTo(this.root.x, ny, RADIUS)) this.root.y = ny;

    const moved = this.root.x !== prevX || this.root.y !== prevY;
    if (moved) {
      this.bobPhase   += delta * BOB_SPEED;
      this.body.y      = Math.sin(this.bobPhase) * BOB_AMPLITUDE;
    } else {
      this.body.y     *= 0.75; // settle back to rest
    }

    this.updateDepth();
  }

  private updateDepth(): void {
    // Y-sort: lower on screen = drawn in front
    this.root.setDepth(100 + this.root.y * 0.01);
  }
}
