import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

export function createGameConfig(
  parent: HTMLElement,
  roomId: string | null,
  uid: string | null,
  username: string | null,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: parent.clientWidth || window.innerWidth,
    height: parent.clientHeight || window.innerHeight,
    parent,
    backgroundColor: '#1a6b8a',
    pixelArt: true,
    roundPixels: true,
    scene: [BootScene, GameScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: false,
      antialiasGL: false,
      pixelArt: true,
    },
    // Disable Phaser's sound manager entirely. This game has no sounds, and
    // leaving WebAudio enabled produced noisy
    //   "InvalidStateError: Cannot suspend/resume a closed AudioContext"
    // unhandled rejections every time Fast Refresh / StrictMode tore the
    // game down and reran the effect.
    audio: { noAudio: true },
    callbacks: {
      preBoot: (game) => {
        game.registry.set('roomId', roomId);
        game.registry.set('uid', uid);
        game.registry.set('username', username);
      }
    }
  };
}