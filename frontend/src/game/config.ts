import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

/**
 * Returns a Phaser GameConfig sized to the provided container element.
 * pixelArt mode is enabled globally so all textures stay crisp.
 */
export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width:  parent.clientWidth  || window.innerWidth,
    height: parent.clientHeight || window.innerHeight,
    parent,
    backgroundColor: '#1a6b8a',
    pixelArt:        true,
    roundPixels:     true,
    scene: [BootScene, GameScene],
    scale: {
      mode:       Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias:   false,
      antialiasGL: false,
      pixelArt:    true,
    },
  };
}
