import Phaser from '../lib/phaser.js';
import Player from '../entities/Player.js';
import Boss from '../entities/Boss.js';
import Hud from '../ui/Hud.js';
import InputSystem from '../systems/InputSystem.js';
import AudioSystem from '../systems/AudioSystem.js';
import FeedbackSystem from '../systems/FeedbackSystem.js';
import SettingsSystem from '../systems/SettingsSystem.js';
import ProgressionSystem from '../systems/ProgressionSystem.js';
import {
  ARENA_DATA,
  ARENA_TYPES,
  BOSS_DATA,
  DIFFICULTY_TYPES,
  GAME_WIDTH,
  GAME_HEIGHT,
  TILE_SIZE
} from '../config/constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.bossType = 'eclipse';
    this.arenaType = ARENA_TYPES.ECLIPSE_COURT;
    this.difficulty = DIFFICULTY_TYPES.HUNTER;
  }

  init(data) {
    if (data?.bossType) this.bossType = data.bossType;
    if (data?.arenaType) this.arenaType = data.arenaType;
    if (data?.difficulty) this.difficulty = data.difficulty;
    this.settings = data?.settings ? { ...SettingsSystem.load(), ...data.settings } : SettingsSystem.load();
    this.profile = ProgressionSystem.getSummary(data?.profile || ProgressionSystem.load());
  }

  create() {
    this._createArena();
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.audioSystem = new AudioSystem(this, this.settings);
    this.feedback = new FeedbackSystem(this, this.settings);
    this.feedback.init();

    const spawns = {
      [ARENA_TYPES.ECLIPSE_COURT]: { player: [220, 360], boss: [740, 320] },
      [ARENA_TYPES.ABYSS_HALL]: { player: [180, 330], boss: [780, 300] },
      [ARENA_TYPES.CRIMSON_RUINS]: { player: [210, 410], boss: [760, 250] }
    };
    const spawn = spawns[this.arenaType] || spawns[ARENA_TYPES.ECLIPSE_COURT];

    this.player = new Player(this, spawn.player[0], spawn.player[1], this.difficulty, this.profile);
    this.boss = new Boss(this, spawn.boss[0], spawn.boss[1], this.bossType, this.difficulty, this.profile.level);
    this.player.play('player-idle');
    this.boss.play(this.bossType === 'wraith' ? 'wraith-idle' : 'eclipse-idle');

    this.inputSystem = new InputSystem(this, this.settings);
    this.inputSystem.createTouchControls();

    this.hud = new Hud(this, this.bossType, this.difficulty, this.arenaType, this.profile, this.boss.level);
    this.matchStart = this.time.now;
    this.ended = false;

    this.audioSystem.startMusic(this.bossType);

    const arena = ARENA_DATA[this.arenaType];
    this.add.text(GAME_WIDTH / 2, 90, `${BOSS_DATA[this.bossType].name} · Lv ${this.boss.level} · ${arena.name}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: arena.textColor
    }).setOrigin(0.5).setDepth(140).setAlpha(0.92);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, 'WASD/Setas • Espaço • Shift • F • R', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#c5b8da'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(140).setAlpha(this.sys.game.device.input.touch ? 0 : 0.8);
  }

  update(time) {
    if (this.ended) return;

    this.player.update(time, this.inputSystem, this.audioSystem, this.feedback);
    this.player.tryHitBoss(this.boss, time, this.feedback, this.audioSystem);
    this.player.tryQueuedSkill(this.boss, time, this.feedback, this.audioSystem);
    this.boss.update(time, this.player, this.audioSystem, this.feedback);

    const elapsed = time - this.matchStart;
    this.hud.update(this.player, this.boss, elapsed, time);

    if (!this.ended && this.boss.isDead) {
      this.ended = true;
      this.audioSystem.stopMusic();
      this.audioSystem.play('victory', { volume: 0.55 });
      this.inputSystem.destroy();
      const reward = ProgressionSystem.addBossRewards({
        bossType: this.bossType,
        difficulty: this.difficulty,
        arenaType: this.arenaType,
        timeMs: elapsed,
        bossLevel: this.boss.level
      });
      this.time.delayedCall(420, () => {
        this.scene.start('GameOverScene', {
          victory: true,
          bossType: this.bossType,
          arenaType: this.arenaType,
          difficulty: this.difficulty,
          timeMs: elapsed,
          bossLevel: this.boss.level,
          reward
        });
      });
    } else if (!this.ended && this.player.isDead) {
      this.ended = true;
      this.audioSystem.stopMusic();
      this.audioSystem.play('defeat', { volume: 0.5 });
      this.inputSystem.destroy();
      this.time.delayedCall(420, () => {
        this.scene.start('GameOverScene', {
          victory: false,
          bossType: this.bossType,
          arenaType: this.arenaType,
          difficulty: this.difficulty,
          timeMs: elapsed,
          bossLevel: this.boss.level
        });
      });
    }
  }

  _createArena() {
    const cols = Math.ceil(GAME_WIDTH / TILE_SIZE);
    const rows = Math.ceil(GAME_HEIGHT / TILE_SIZE);
    const arena = ARENA_DATA[this.arenaType];
    const frames = arena.frames;

    const chooseFloor = (x, y) => frames.floor[(x + y + (this.arenaType === ARENA_TYPES.ABYSS_HALL ? 1 : 0)) % frames.floor.length];
    const chooseAccent = (x, y) => frames.accent[(x + y) % frames.accent.length];

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let frame = chooseFloor(x, y);

        if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) frame = frames.wall;
        else if (x === 1 || y === 1 || x === cols - 2 || y === rows - 2) frame = frames.trim;

        if (this.arenaType === ARENA_TYPES.ECLIPSE_COURT) {
          if ((x === 5 || x === cols - 6) && (y === 4 || y === rows - 5)) frame = frames.pillar;
          if ((x === 10 || x === cols - 11) && (y === 6 || y === rows - 7)) frame = chooseAccent(x, y);
          if ((x === Math.floor(cols / 2) || x === Math.floor(cols / 2) - 1) && (y === Math.floor(rows / 2) || y === Math.floor(rows / 2) - 1)) frame = frames.sigil;
          if (x > 7 && x < cols - 8 && y > 5 && y < rows - 6 && (x + y) % 11 === 0) frame = chooseAccent(x, y);
        } else if (this.arenaType === ARENA_TYPES.ABYSS_HALL) {
          if ((x === 6 || x === cols - 7) && y > 3 && y < rows - 4 && y % 3 === 0) frame = frames.pillar;
          if ((x + y) % 7 === 0 && x > 3 && x < cols - 4 && y > 3 && y < rows - 4) frame = chooseAccent(x, y);
          if ((x === Math.floor(cols / 2) || x === Math.floor(cols / 2) - 1) && y > 4 && y < rows - 5) frame = frames.trim;
          if ((x === Math.floor(cols / 2) || x === Math.floor(cols / 2) - 1) && (y === 8 || y === rows - 9)) frame = frames.sigil;
        } else {
          if ((x === 4 || x === cols - 5 || x === 9 || x === cols - 10) && (y === 4 || y === rows - 5)) frame = frames.pillar;
          if (x > 3 && x < cols - 4 && y > 3 && y < rows - 4 && (x * 3 + y * 5) % 14 === 0) frame = chooseAccent(x, y);
          if ((x === Math.floor(cols / 2) || x === Math.floor(cols / 2) - 1) && (y === Math.floor(rows / 2) || y === Math.floor(rows / 2) - 1)) frame = frames.sigil;
          if ((x === 7 || x === cols - 8) && y > 5 && y < rows - 6) frame = frames.trim;
        }

        this.add.image(x * TILE_SIZE + 16, y * TILE_SIZE + 16, 'arena-tiles', frame)
          .setDepth(10)
          .setAlpha(frame === frames.trim ? 0.92 : 1);
      }
    }

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 120, GAME_HEIGHT - 150, 0x000000, arena.overlayAlpha).setDepth(12);
    this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2, 340, 180, arena.ellipseColor, arena.ellipseAlpha).setDepth(12);
  }
}
