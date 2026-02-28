import StorageSystem from '../systems/StorageSystem.js';
import { ARENA_DATA, BOSS_DATA, DIFFICULTY_DATA } from '../config/constants.js';

export default class Hud {
  constructor(scene, bossType, difficulty, arenaType, profile, bossLevel = 1) {
    this.scene = scene;
    this.bossType = bossType;
    this.difficulty = difficulty;
    this.arenaType = arenaType;
    this.profile = profile;
    this.bossLevel = bossLevel;

    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(800);

    const bg = scene.add.rectangle(scene.scale.width / 2, 34, scene.scale.width - 20, 72, 0x0f0d19, 0.74)
      .setStrokeStyle(1, 0x433160, 0.7);
    this.root.add(bg);

    this.playerBarBg = scene.add.rectangle(138, 30, 180, 14, 0x241729, 0.95).setOrigin(0, 0.5);
    this.playerBar = scene.add.rectangle(138, 30, 180, 14, 0xd14a66, 0.95).setOrigin(0, 0.5);
    this.bossBarBg = scene.add.rectangle(scene.scale.width - 318, 30, 180, 14, 0x241729, 0.95).setOrigin(0, 0.5);
    this.bossBar = scene.add.rectangle(scene.scale.width - 318, 30, 180, 14, 0x7b4fe6, 0.95).setOrigin(0, 0.5);

    this.playerLabel = scene.add.text(138, 8, `Lv ${profile.level} · ${profile.weapon.name}`, { fontFamily: 'Arial', fontSize: '13px', color: '#f3ecff' });
    this.bossLabel = scene.add.text(scene.scale.width - 318, 8, `${BOSS_DATA[bossType].name} · Lv ${bossLevel}`, { fontFamily: 'Arial', fontSize: '13px', color: '#f3ecff' });

    this.timerText = scene.add.text(scene.scale.width / 2, 6, '0:00.00', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#f3ecff'
    }).setOrigin(0.5, 0);

    const best = StorageSystem.getBestTime(bossType, difficulty, arenaType);
    this.bestText = scene.add.text(scene.scale.width / 2, 28, `Recorde ${DIFFICULTY_DATA[difficulty].name}: ${best ? StorageSystem.formatMs(best) : '--:--.--'}`, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#cdbde4'
    }).setOrigin(0.5, 0);

    this.metaText = scene.add.text(scene.scale.width / 2, 42, `${ARENA_DATA[arenaType].name} · ${DIFFICULTY_DATA[difficulty].name}`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#b9acd1'
    }).setOrigin(0.5, 0);

    this.skillText = scene.add.text(138, 46, 'Skills: --', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#d8caeb'
    });

    this.root.add([
      this.playerBarBg, this.playerBar,
      this.bossBarBg, this.bossBar,
      this.playerLabel, this.bossLabel,
      this.timerText, this.bestText, this.metaText,
      this.skillText
    ]);
  }

  update(player, boss, elapsedMs, now) {
    const pw = 180 * player.getHpRatio();
    const bw = 180 * boss.getHpRatio();
    this.playerBar.width = pw;
    this.bossBar.width = bw;
    this.timerText.setText(StorageSystem.formatMs(elapsedMs));

    const skillParts = player.getSkillState(now).map((entry) => {
      if (!entry.owned) return `${entry.inputLabel}: --`;
      if (entry.ready) return `${entry.inputLabel}: pronto`;
      return `${entry.inputLabel}: ${(entry.remainMs / 1000).toFixed(1)}s`;
    });
    this.skillText.setText(`Skills ${skillParts.join(' · ')}`);
  }

  destroy() {
    this.root.destroy(true);
  }
}
