import Phaser from '../lib/phaser.js';
import StorageSystem from '../systems/StorageSystem.js';
import SettingsSystem from '../systems/SettingsSystem.js';
import ProgressionSystem from '../systems/ProgressionSystem.js';
import AchievementSystem from '../systems/AchievementSystem.js';
import AchievementsOverlay from '../ui/AchievementsOverlay.js';
import {
  ARENA_DATA,
  ARENA_TYPES,
  BOSS_DATA,
  BOSS_TYPES,
  DIFFICULTY_DATA,
  DIFFICULTY_TYPES,
  SKILL_DATA
} from '../config/constants.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.selectedBoss = BOSS_TYPES.ECLIPSE;
    this.selectedArena = ARENA_TYPES.ECLIPSE_COURT;
    this.selectedDifficulty = DIFFICULTY_TYPES.HUNTER;
    this.settings = SettingsSystem.load();
    this.profile = ProgressionSystem.getSummary();
    AchievementSystem.recompute(this.profile);
    this.achievementsOverlay = window.__bossAchievementsOverlay || null;
    this.bgImages = [];
  }

  init(data) {
    if (data?.selectedBoss) this.selectedBoss = data.selectedBoss;
    if (data?.selectedArena) this.selectedArena = data.selectedArena;
    if (data?.selectedDifficulty) this.selectedDifficulty = data.selectedDifficulty;
    this.settings = SettingsSystem.load();
    this.profile = ProgressionSystem.getSummary();
    AchievementSystem.recompute(this.profile);
    this.achievementsOverlay = window.__bossAchievementsOverlay || this.achievementsOverlay;
  }

  create() {
    this._buildBackground();
    this._buildTitle();
    this._buildCards();
    this._buildArenaSelector();
    this._buildDifficultySelector();
    this._buildStartButton();
    this._buildSidePanel();
    this._buildShopModal();
    this._buildAchievementsButton();

    this.input.keyboard.on('keydown-ONE', () => this.selectBoss(BOSS_TYPES.ECLIPSE));
    this.input.keyboard.on('keydown-TWO', () => this.selectBoss(BOSS_TYPES.WRAITH));
    this.input.keyboard.on('keydown-Q', () => this.selectArena(ARENA_TYPES.ECLIPSE_COURT));
    this.input.keyboard.on('keydown-W', () => this.selectArena(ARENA_TYPES.ABYSS_HALL));
    this.input.keyboard.on('keydown-E', () => this.selectArena(ARENA_TYPES.CRIMSON_RUINS));
    this.input.keyboard.on('keydown-Z', () => this.selectDifficulty(DIFFICULTY_TYPES.STORY));
    this.input.keyboard.on('keydown-X', () => this.selectDifficulty(DIFFICULTY_TYPES.HUNTER));
    this.input.keyboard.on('keydown-C', () => this.selectDifficulty(DIFFICULTY_TYPES.NIGHTMARE));
    this.input.keyboard.on('keydown-ENTER', () => this.startFight());
    this.input.keyboard.on('keydown-L', () => this.toggleShop());
    this.input.keyboard.on('keydown-K', () => this.toggleAchievements());
    this.input.keyboard.on('keydown-ESC', () => this.shopModal?.setVisible(false));

    this.selectBoss(this.selectedBoss);
    this.selectArena(this.selectedArena);
    this.selectDifficulty(this.selectedDifficulty);
    this._refreshProgressionPanel();

    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        this.eclipsePreview?.play('eclipse-move', true);
        this.wraithPreview?.play('wraith-telegraph', true);
        this.time.delayedCall(260, () => this.eclipsePreview?.play('eclipse-idle', true));
        this.time.delayedCall(320, () => this.wraithPreview?.play('wraith-idle', true));
      }
    });
  }

  _buildBackground() {
    const cols = 30;
    const rows = 20;
    const themes = [ARENA_TYPES.ECLIPSE_COURT, ARENA_TYPES.ABYSS_HALL, ARENA_TYPES.CRIMSON_RUINS];

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const arenaKey = themes[Math.floor((x / 10))];
        const arena = ARENA_DATA[arenaKey];
        const frames = arena.frames;
        let frame = frames.floor[(x + y) % frames.floor.length];
        if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) frame = frames.wall;
        if ((x + y) % 9 === 0) frame = frames.accent[(x + y) % frames.accent.length];
        if ((x === 3 || x === 6 || x === 13 || x === 16 || x === 23 || x === 26) && (y === 5 || y === 14)) frame = frames.pillar;
        if ((x === 9 || x === 19) && y > 2 && y < 17 && frame !== frames.pillar) frame = frames.trim;
        if ((x === 4 || x === 14 || x === 24) && (y === 9 || y === 10)) frame = frames.sigil;
        const img = this.add.image(16 + x * 32, 16 + y * 32, 'arena-tiles', frame).setAlpha(0.86);
        this.bgImages.push(img);
      }
    }

    this.bgOverlay = this.add.rectangle(355, 320, 710, 640, 0x06050a, 0.2);
    this.bgPanel = this.add.rectangle(825, 320, 250, 640, 0x0b0914, 0.42);
  }

  _buildTitle() {
    this.titleText = this.add.text(355, 48, 'Boss Fight Dark Fantasy', {
      fontFamily: 'Arial',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#f6eeff'
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(355, 80, 'Escolha boss, arena, dificuldade e ajuste seu ritual.', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#d9cbe8'
    }).setOrigin(0.5);

    const hero = this.add.sprite(355, 136, 'player-dark').setScale(1.45).setDepth(100);
    hero.play('player-idle');
    this.tweens.add({
      targets: hero,
      y: 130,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  _buildCards() {
    this.cardA = this._createCard(175, 282, BOSS_TYPES.ECLIPSE, 'eclipse');
    this.cardB = this._createCard(535, 282, BOSS_TYPES.WRAITH, 'wraith');
  }

  _createCard(x, y, bossType, prefix) {
    const card = this.add.container(x, y);
    const panel = this.add.rectangle(0, 0, 300, 190, 0x120f1d, 0.9).setStrokeStyle(2, 0x3d2e5f, 0.8);
    const label = this.add.text(0, -68, BOSS_DATA[bossType].name, {
      fontFamily: 'Arial',
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#f6eeff'
    }).setOrigin(0.5);

    const hint = this.add.text(0, -44, bossType === 'eclipse' ? 'Golpes pesados e explosões' : 'Ritmo rápido e reposicionamento', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#d6c8ea'
    }).setOrigin(0.5);

    const preview = this.add.sprite(0, 6, bossType === 'eclipse' ? 'boss-eclipse' : 'boss-wraith').setScale(1.35);
    preview.play(`${prefix}-idle`);

    const chip = this.add.text(0, 66, bossType === 'eclipse' ? '1 · Pressão frontal' : '2 · Caçada móvel', {
      fontFamily: 'Arial',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f4d6e1'
    }).setOrigin(0.5);

    const bottom = this.add.text(0, 84, 'Toque para escolher', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#bbaed2'
    }).setOrigin(0.5);

    card.add([panel, label, hint, preview, chip, bottom]);

    const hitArea = this.add.rectangle(x, y, 300, 190, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.selectBoss(bossType));

    if (bossType === BOSS_TYPES.ECLIPSE) this.eclipsePreview = preview;
    else this.wraithPreview = preview;

    card.hitArea = hitArea;
    card.panel = panel;
    card.preview = preview;
    card.bossType = bossType;
    return card;
  }

  _buildArenaSelector() {
    this.add.text(355, 402, 'Arena', {
      fontFamily: 'Arial',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f0e4ff'
    }).setOrigin(0.5);

    this.arenaButtons = [
      this._createChip(170, 438, 138, 34, 'Q · Eclipse', () => this.selectArena(ARENA_TYPES.ECLIPSE_COURT)),
      this._createChip(355, 438, 138, 34, 'W · Abissal', () => this.selectArena(ARENA_TYPES.ABYSS_HALL)),
      this._createChip(540, 438, 138, 34, 'E · Ruínas', () => this.selectArena(ARENA_TYPES.CRIMSON_RUINS))
    ];

    this.arenaHint = this.add.text(355, 466, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#d2c5e8'
    }).setOrigin(0.5);
  }

  _buildDifficultySelector() {
    this.add.text(355, 500, 'Dificuldade', {
      fontFamily: 'Arial',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f0e4ff'
    }).setOrigin(0.5);

    this.difficultyButtons = [
      this._createChip(170, 536, 138, 34, 'Z · Story', () => this.selectDifficulty(DIFFICULTY_TYPES.STORY)),
      this._createChip(355, 536, 138, 34, 'X · Hunter', () => this.selectDifficulty(DIFFICULTY_TYPES.HUNTER)),
      this._createChip(540, 536, 138, 34, 'C · Nightmare', () => this.selectDifficulty(DIFFICULTY_TYPES.NIGHTMARE))
    ];

    this.diffHint = this.add.text(355, 564, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#d2c5e8'
    }).setOrigin(0.5);
  }

  _buildStartButton() {
    const btn = this.add.rectangle(355, 604, 290, 48, 0x6d2f8f, 0.92).setStrokeStyle(2, 0xefc5ff, 0.7)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(355, 604, 'Entrar na arena', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    btn.on('pointerdown', () => this.startFight());

    this.startButton = btn;
    this.startLabel = text;
  }

  _buildAchievementsButton() {
    const btn = this.add.rectangle(825, 594, 214, 40, 0x2a203d, 0.94)
      .setStrokeStyle(2, 0x8d6cc2, 0.72)
      .setInteractive({ useHandCursor: true });
    this.add.text(825, 594, 'Conquistas · K', {
      fontFamily: 'Arial',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#f7eeff'
    }).setOrigin(0.5);
    btn.on('pointerdown', () => this.toggleAchievements());
  }

  toggleAchievements() {
    if (!this.achievementsOverlay) {
      this.achievementsOverlay = window.__bossAchievementsOverlay || new AchievementsOverlay();
      window.__bossAchievementsOverlay = this.achievementsOverlay;
    }
    this.achievementsOverlay.toggle(this.profile);
  }

  _buildSidePanel() {
    this.add.text(825, 36, 'Painel de Preparação', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#f6eeff'
    }).setOrigin(0.5);

    this.profileRect = this.add.rectangle(825, 108, 214, 124, 0x171127, 0.92)
      .setStrokeStyle(2, 0x5d427e, 0.78);
    this.profileTitle = this.add.text(825, 62, 'Progressão persistente', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#d6caea'
    }).setOrigin(0.5);

    this.profileSummaryText = this.add.text(825, 84, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#efe6ff',
      align: 'center',
      lineSpacing: 3
    }).setOrigin(0.5, 0);

    this.shopButton = this._createLooseButton(825, 204, 164, 34, 'Loja · tecla L', () => this.toggleShop(), 0x4c2b72);
    this.shopHint = this.add.text(825, 228, 'Atributos, skills e armas com custo, tier e nível mínimo.', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#bcaed8',
      align: 'center',
      wordWrap: { width: 208 }
    }).setOrigin(0.5, 0);

    this.settingsButtons = [
      this._createSettingToggle(760, 286, 110, 34, 'Som', 'sfx'),
      this._createSettingToggle(890, 286, 110, 34, 'Música', 'music'),
      this._createSettingToggle(760, 328, 110, 34, 'Vibração', 'vibration'),
      this._createSettingToggle(890, 328, 110, 34, 'Touch', 'touch')
    ];

    this.rankTitle = this.add.text(825, 382, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f2e8ff',
      align: 'center',
      wordWrap: { width: 210 }
    }).setOrigin(0.5, 0);

    this.rankList = this.add.text(825, 430, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '11px',
      color: '#d8caeb',
      align: 'center'
    }).setOrigin(0.5, 0);

    this.overallTitle = this.add.text(825, 520, 'Ranking geral local', {
      fontFamily: 'Arial',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f2e8ff'
    }).setOrigin(0.5);

    this.overallList = this.add.text(825, 540, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '10px',
      color: '#d8caeb',
      align: 'center'
    }).setOrigin(0.5, 0);
  }

  _buildShopModal() {
    this.shopModal = this.add.container(0, 0).setDepth(600).setVisible(false);

    const shade = this.add.rectangle(480, 320, 960, 640, 0x040308, 0.7).setInteractive();
    shade.on('pointerdown', () => this.toggleShop(false));
    const panel = this.add.rectangle(480, 318, 560, 430, 0x130f1d, 0.97).setStrokeStyle(2, 0x8c63c6, 0.85);
    const title = this.add.text(480, 132, 'Loja do Caçador', {
      fontFamily: 'Arial',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#f7eeff'
    }).setOrigin(0.5);
    const subtitle = this.add.text(480, 160, 'Gaste moedas em atributos, skills e tiers de arma.', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#d6caea'
    }).setOrigin(0.5);

    this.shopStatusText = this.add.text(480, 188, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffe4b8'
    }).setOrigin(0.5);

    this.shopInfoText = this.add.text(480, 214, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ece0ff',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5, 0);

    this.shopButtons = {
      str: this._createModalButton(350, 316, 150, 40, '', () => this._buyShop('str')),
      vit: this._createModalButton(480, 316, 150, 40, '', () => this._buyShop('vit')),
      agi: this._createModalButton(610, 316, 150, 40, '', () => this._buyShop('agi')),
      weapon: this._createModalButton(480, 372, 320, 44, '', () => this._buyShop('weapon')),
      powerSlash: this._createModalButton(480, 430, 420, 40, '', () => this._buyShop('powerSlash')),
      arcaneBurst: this._createModalButton(480, 482, 420, 40, '', () => this._buyShop('arcaneBurst')),
      close: this._createModalButton(480, 540, 190, 42, 'Fechar loja', () => this.toggleShop(false), 0x3d3054)
    };

    this.shopModal.add([
      shade, panel, title, subtitle, this.shopStatusText, this.shopInfoText,
      this.shopButtons.str.rect, this.shopButtons.str.text,
      this.shopButtons.vit.rect, this.shopButtons.vit.text,
      this.shopButtons.agi.rect, this.shopButtons.agi.text,
      this.shopButtons.weapon.rect, this.shopButtons.weapon.text,
      this.shopButtons.powerSlash.rect, this.shopButtons.powerSlash.text,
      this.shopButtons.arcaneBurst.rect, this.shopButtons.arcaneBurst.text,
      this.shopButtons.close.rect, this.shopButtons.close.text
    ]);
  }

  _createChip(x, y, w, h, label, action) {
    const rect = this.add.rectangle(x, y, w, h, 0x2c203d, 0.92)
      .setStrokeStyle(2, 0x5a456f, 0.75)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    rect.on('pointerdown', action);
    return { rect, text };
  }

  _createLooseButton(x, y, w, h, label, action, fill) {
    const rect = this.add.rectangle(x, y, w, h, fill, 0.92)
      .setStrokeStyle(2, 0xe8c8ff, 0.7)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    rect.on('pointerdown', action);
    return { rect, text };
  }

  _createSettingToggle(x, y, w, h, label, key) {
    const rect = this.add.rectangle(x, y, w, h, 0x2c203d, 0.92)
      .setStrokeStyle(2, 0x5a456f, 0.75)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    rect.on('pointerdown', () => {
      this.settings = SettingsSystem.toggle(key);
      this._refreshSettings();
    });
    return { key, rect, text, label };
  }

  _createModalButton(x, y, w, h, label, action, fill = 0x4d356d) {
    const rect = this.add.rectangle(x, y, w, h, fill, 0.95)
      .setStrokeStyle(2, 0xe9cbff, 0.72)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: w - 14 }
    }).setOrigin(0.5);
    rect.on('pointerdown', action);
    rect.on('pointerover', () => rect.setScale(1.02));
    rect.on('pointerout', () => rect.setScale(1));
    return { rect, text };
  }

  _refreshSettings() {
    for (const item of this.settingsButtons) {
      const on = !!this.settings[item.key];
      item.rect.setFillStyle(on ? 0x5f338f : 0x271f34, 0.92);
      item.rect.setStrokeStyle(2, on ? 0xefc5ff : 0x5a456f, on ? 0.9 : 0.75);
      item.text.setText(`${item.label}: ${on ? 'ON' : 'OFF'}`);
    }
  }

  _refreshProgressionPanel(message = '') {
    this.profile = ProgressionSystem.getSummary();
    this.achievementsOverlay = null;
    const bossLevel = ProgressionSystem.getBossLevel(this.profile, this.selectedDifficulty);
    this.profileSummaryText.setText([
      `Lv ${this.profile.level} · XP ${this.profile.xp}/${this.profile.xpToNext}`,
      `Moedas: ${this.profile.coins}`,
      `Arma: ${this.profile.weapon.name}`,
      `FOR ${this.profile.stats.str} · VIT ${this.profile.stats.vit} · AGI ${this.profile.stats.agi}`,
      `Boss entra em Lv ${bossLevel} nesta dificuldade`
    ].join('\n'));

    this.shopHint.setText(message || 'Atributos, skills e armas com custo, tier e nível mínimo.');

    const overall = StorageSystem.getOverallTop(4);
    const lines = overall.length
      ? overall.map((item, index) => `${index + 1}. ${item.bossType.padEnd(7)} ${StorageSystem.formatMs(item.timeMs)}`)
      : ['Ainda sem tempos salvos', 'Seu navegador segue puro e vazio.'];
    this.overallList.setText(lines.join('\n'));

    this._refreshSettings();
    if (this.shopModal?.visible) this._refreshShopModal();
  }

  _refreshShopModal() {
    const p = this.profile;
    const strCost = ProgressionSystem.getStatCost('str', p);
    const vitCost = ProgressionSystem.getStatCost('vit', p);
    const agiCost = ProgressionSystem.getStatCost('agi', p);
    const nextWeapon = p.nextWeapon;
    const powerOwned = p.skillsOwned.includes('powerSlash');
    const burstOwned = p.skillsOwned.includes('arcaneBurst');

    this.shopInfoText.setText([
      `Carteira: ${p.coins} moedas · Nível ${p.level} · Arma ${p.weapon.name}`,
      `FOR ${p.stats.str} | VIT ${p.stats.vit} | AGI ${p.stats.agi}`,
      `Skills: ${p.skillsOwned.length ? p.skillsOwned.map((key) => SKILL_DATA[key].shortName).join(', ') : 'nenhuma'}`
    ].join('\n'));

    this.shopButtons.str.text.setText(`+FOR\n${strCost} moedas`);
    this.shopButtons.vit.text.setText(`+VIT\n${vitCost} moedas`);
    this.shopButtons.agi.text.setText(`+AGI\n${agiCost} moedas`);

    this.shopButtons.weapon.text.setText(nextWeapon
      ? `Arma ${nextWeapon.name} · ${nextWeapon.price} moedas · Lv ${nextWeapon.minLevel}`
      : 'Arma no tier máximo');
    this.shopButtons.weapon.rect.setAlpha(nextWeapon ? 1 : 0.45);

    const power = SKILL_DATA.powerSlash;
    const burst = SKILL_DATA.arcaneBurst;
    this.shopButtons.powerSlash.text.setText(powerOwned
      ? `${power.name} já desbloqueada`
      : `${power.inputLabel} · ${power.name} · ${power.price} moedas · Lv ${power.minLevel}`);
    this.shopButtons.powerSlash.rect.setAlpha(powerOwned ? 0.45 : 1);

    this.shopButtons.arcaneBurst.text.setText(burstOwned
      ? `${burst.name} já desbloqueada`
      : `${burst.inputLabel} · ${burst.name} · ${burst.price} moedas · Lv ${burst.minLevel}`);
    this.shopButtons.arcaneBurst.rect.setAlpha(burstOwned ? 0.45 : 1);
  }

  _buyShop(kind) {
    let result = null;
    if (kind === 'str' || kind === 'vit' || kind === 'agi') result = ProgressionSystem.buyStat(kind);
    else if (kind === 'weapon') result = ProgressionSystem.buyNextWeapon();
    else result = ProgressionSystem.buySkill(kind);

    this.profile = ProgressionSystem.getSummary();
    this.achievementsOverlay = null;
    this.shopStatusText.setText(result?.message || 'Nada aconteceu. Milagre raro.');
    this._refreshProgressionPanel(result?.message || '');
  }

  toggleShop(force = null) {
    const next = typeof force === 'boolean' ? force : !this.shopModal.visible;
    this.shopModal.setVisible(next);
    if (next) {
      this.shopStatusText.setText('');
      this._refreshShopModal();
    }
  }

  selectBoss(bossType) {
    this.selectedBoss = bossType;
    const activeStroke = 0xca8bf7;
    const inactive = 0x3d2e5f;
    for (const card of [this.cardA, this.cardB]) {
      const on = card.bossType === bossType;
      card.panel.setStrokeStyle(2, on ? activeStroke : inactive, on ? 1 : 0.8);
      card.preview.setScale(on ? 1.5 : 1.35);
    }
    this._refreshRanking();
  }

  selectArena(arenaType) {
    this.selectedArena = arenaType;
    const arena = ARENA_DATA[arenaType];
    this.arenaHint.setText(arena.subtitle);

    const buttons = [
      [this.arenaButtons[0], ARENA_TYPES.ECLIPSE_COURT],
      [this.arenaButtons[1], ARENA_TYPES.ABYSS_HALL],
      [this.arenaButtons[2], ARENA_TYPES.CRIMSON_RUINS]
    ];
    for (const [btn, key] of buttons) {
      const on = key === arenaType;
      btn.rect.setFillStyle(on ? arena.accentColor : 0x2c203d, 0.92);
      btn.rect.setStrokeStyle(2, on ? 0xf6e8ff : 0x5a456f, on ? 0.9 : 0.75);
    }

    this.bgOverlay.setFillStyle(arena.overlayColor, arena.overlayAlpha);
    this._refreshRanking();
  }

  selectDifficulty(difficulty) {
    this.selectedDifficulty = difficulty;
    const diff = DIFFICULTY_DATA[difficulty];
    this.diffHint.setText(diff.description);

    const buttons = [
      [this.difficultyButtons[0], DIFFICULTY_TYPES.STORY],
      [this.difficultyButtons[1], DIFFICULTY_TYPES.HUNTER],
      [this.difficultyButtons[2], DIFFICULTY_TYPES.NIGHTMARE]
    ];
    for (const [btn, key] of buttons) {
      const on = key === difficulty;
      btn.rect.setFillStyle(on ? diff.accentColor : 0x2c203d, on ? 0.88 : 0.92);
      btn.rect.setStrokeStyle(2, on ? 0xf6e8ff : 0x5a456f, on ? 0.9 : 0.75);
      btn.text.setColor(on && difficulty === DIFFICULTY_TYPES.STORY ? '#102820' : '#ffffff');
    }
    this._refreshRanking();
  }

  _refreshRanking() {
    const bossName = BOSS_DATA[this.selectedBoss].name;
    const diffName = DIFFICULTY_DATA[this.selectedDifficulty].name;
    const arenaName = ARENA_DATA[this.selectedArena].name;
    this.rankTitle.setText(`Top 5 · ${bossName}\n${diffName} · ${arenaName}`);

    const top = StorageSystem.getTopTimes(this.selectedBoss, this.selectedDifficulty, this.selectedArena);
    this.rankList.setText(
      top.length
        ? top.map((time, index) => `${index + 1}. ${StorageSystem.formatMs(time)}`).join('\n')
        : 'Nenhum registro ainda\nVença uma luta e grave o primeiro.'
    );

    this._refreshProgressionPanel();
  }

  startFight() {
    this.achievementsOverlay?.hide();
    this.scene.start('GameScene', {
      bossType: this.selectedBoss,
      arenaType: this.selectedArena,
      difficulty: this.selectedDifficulty,
      settings: this.settings,
      profile: this.profile
    });
  }
}
