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
    callbacks: {
      preBoot: (game) => {
        game.registry.set('roomId', roomId);
        game.registry.set('uid', uid);
        game.registry.set('username', username);
      }
    }
  };
}