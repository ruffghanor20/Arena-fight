import Phaser from './lib/phaser.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0b0a14',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene]
};

try {
  new Phaser.Game(config);
} catch (err) {
  const text = document.getElementById('boot-text');
  const fill = document.getElementById('boot-fill');
  if (text) text.textContent = 'Erro ao iniciar o jogo. Abra o console.';
  if (fill) fill.style.width = '100%';
  console.error(err);
}
