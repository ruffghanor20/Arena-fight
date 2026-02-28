import Phaser from '../lib/phaser.js';
import StorageSystem from '../systems/StorageSystem.js';
import ProgressionSystem from '../systems/ProgressionSystem.js';
import AchievementSystem from '../systems/AchievementSystem.js';
import { ARENA_DATA, BOSS_DATA, DIFFICULTY_DATA } from '../config/constants.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
    this.result = {
      victory: false,
      bossType: 'eclipse',
      difficulty: 'hunter',
      arenaType: 'eclipseCourt',
      timeMs: 0,
      bossLevel: 1,
      reward: null
    };
  }

  init(data) {
    this.result = {
      victory: !!data?.victory,
      bossType: data?.bossType || 'eclipse',
      difficulty: data?.difficulty || 'hunter',
      arenaType: data?.arenaType || 'eclipseCourt',
      timeMs: data?.timeMs || 0,
      bossLevel: data?.bossLevel || 1,
      reward: data?.reward || null
    };
  }

  create() {
    const { victory, bossType, timeMs, difficulty, arenaType, reward, bossLevel } = this.result;
    this.add.rectangle(480, 320, 960, 640, 0x090711, 0.94);

    this.add.text(480, 82, victory ? 'Vitória' : 'Derrota', {
      fontFamily: 'Arial',
      fontSize: '42px',
      fontStyle: 'bold',
      color: victory ? '#f6e8ff' : '#ffd3dc'
    }).setOrigin(0.5);

    this.add.text(480, 122, `${BOSS_DATA[bossType].name} · Lv ${bossLevel} · ${ARENA_DATA[arenaType].name}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#d4c7e7'
    }).setOrigin(0.5);

    this.add.text(480, 144, `Dificuldade: ${DIFFICULTY_DATA[difficulty].name}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#c4b5dd'
    }).setOrigin(0.5);

    const timeLabel = StorageSystem.formatMs(timeMs);
    this.add.text(480, 176, `Tempo: ${timeLabel}`, {
      fontFamily: 'Consolas, monospace',
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5);

    let savedList = StorageSystem.getTopRuns({ bossType, difficulty, arenaType, limit: 5 });
    let newRecord = false;
    let achievementResult = { newlyUnlocked: [] };
    if (victory) {
      const before = savedList[0]?.timeMs ?? Infinity;
      savedList = StorageSystem.saveWin(bossType, difficulty, arenaType, timeMs);
      newRecord = timeMs <= (savedList[0]?.timeMs ?? Infinity) && timeMs <= before;
      achievementResult = AchievementSystem.recompute(reward?.profile || ProgressionSystem.load());
    }

    const recordText = savedList.length
      ? savedList.slice(0, 5).map((item, index) => `${index + 1}. ${StorageSystem.formatMs(item.timeMs)}`).join('\n')
      : 'Sem registros';

    const rewardY = 226;
    if (victory && reward) {
      const profile = ProgressionSystem.getSummary(reward.profile);
      const rewardLines = [
        `+${reward.coins} moedas   ·   +${reward.xp} XP`,
        reward.levelUps > 0 ? `Subiu ${reward.levelUps} nível(is)! Agora Lv ${reward.newLevel}` : `Sem level up. Lv atual ${reward.newLevel}`,
        `Carteira: ${profile.coins} moedas   ·   Arma: ${profile.weapon.name}`
      ];

      this.add.rectangle(480, rewardY + 22, 470, 82, 0x171127, 0.92).setStrokeStyle(2, 0x6c4ca0, 0.78);
      this.add.text(480, rewardY, 'Recompensas da caçada', {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#f8ecff'
      }).setOrigin(0.5);
      this.add.text(480, rewardY + 18, rewardLines.join('\n'), {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#dfd0f4',
        align: 'center'
      }).setOrigin(0.5, 0);
    }

    if (victory && achievementResult.newlyUnlocked.length) {
      const names = achievementResult.newlyUnlocked.slice(0, 3).map((a) => a.name).join(' • ');
      const extra = achievementResult.newlyUnlocked.length > 3 ? ` +${achievementResult.newlyUnlocked.length - 3}` : '';
      this.add.rectangle(480, 286, 520, 36, 0x20162f, 0.92).setStrokeStyle(1, 0xcba5ff, 0.6);
      this.add.text(480, 286, `Conquistas: ${names}${extra}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#f6e8ff'
      }).setOrigin(0.5);
    }

    this.add.text(480, 320, victory && newRecord ? 'Novo recorde local!' : 'Top 5 do confronto atual', {
      fontFamily: 'Arial',
      fontSize: '16px',
      fontStyle: 'bold',
      color: victory && newRecord ? '#ffd6f4' : '#f0e4ff'
    }).setOrigin(0.5);

    this.add.text(480, 350, recordText, {
      fontFamily: 'Consolas, monospace',
      fontSize: '15px',
      color: '#e2d7f0',
      align: 'center'
    }).setOrigin(0.5, 0);

    const restart = this._button(480, 500, 320, 58, victory ? 'Enfrentar novamente' : 'Tentar de novo', () => {
      this.scene.start('GameScene', { bossType, difficulty, arenaType });
    }, 0x6c2c93);

    this._button(480, 574, 320, 50, 'Voltar ao menu', () => {
      this.scene.start('MenuScene', { selectedBoss: bossType, selectedArena: arenaType, selectedDifficulty: difficulty });
    }, 0x3b2e5e);

    this.input.keyboard.on('keydown-ENTER', () => restart.emit('pointerdown'));
  }

  _button(x, y, w, h, label, action, fill) {
    const rect = this.add.rectangle(x, y, w, h, fill, 0.92)
      .setStrokeStyle(2, 0xf0ceff, 0.72)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    rect.on('pointerdown', action);
    rect.on('pointerover', () => rect.setScale(1.02));
    rect.on('pointerout', () => rect.setScale(1));
    return rect;
  }
}
