import Phaser from '../lib/phaser.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const fill = document.getElementById('boot-fill');
    const text = document.getElementById('boot-text');
    this.load.on('progress', (value) => {
      const pct = Math.floor(value * 100);
      if (fill) fill.style.width = `${pct}%`;
      if (text) text.textContent = `${pct}%`;
    });

    this.load.atlas('player-dark', 'assets/player_dark_atlas.png', 'assets/player_dark_atlas.json');
    this.load.atlas('boss-eclipse', 'assets/boss_eclipse_atlas.png', 'assets/boss_eclipse_atlas.json');
    this.load.atlas('boss-wraith', 'assets/boss_wraith_atlas.png', 'assets/boss_wraith_atlas.json');

    this.load.spritesheet('arena-tiles', 'assets/arena_tileset.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.audio('attack', 'assets/attack.wav');
    this.load.audio('dash', 'assets/dash.wav');
    this.load.audio('telegraph', 'assets/telegraph.wav');
    this.load.audio('boss-slash', 'assets/boss_slash.wav');
    this.load.audio('boss-charge', 'assets/boss_charge.wav');
    this.load.audio('boss-nova', 'assets/boss_nova.wav');
    this.load.audio('boss-sickle', 'assets/boss_sickle.wav');
    this.load.audio('boss-rift', 'assets/boss_rift.wav');
    this.load.audio('boss-shade', 'assets/boss_shade.wav');
    this.load.audio('hit', 'assets/hit.wav');
    this.load.audio('victory', 'assets/victory.wav');
    this.load.audio('defeat', 'assets/defeat.wav');
    this.load.audio('enrage', 'assets/enrage.wav');
    this.load.audio('music-eclipse', 'assets/music_eclipse.wav');
    this.load.audio('music-wraith', 'assets/music_wraith.wav');
  }

  create() {
    this._createAnimations();

    const loading = document.getElementById('boot-loading');
    if (loading) loading.style.display = 'none';

    this.scene.start('MenuScene', {
      selectedBoss: 'eclipse',
      selectedArena: 'eclipseCourt',
      selectedDifficulty: 'hunter'
    });
  }

  _createAnimations() {
    const safeCreate = (key, config) => {
      if (!this.anims.exists(key)) this.anims.create({ key, ...config });
    };

    const atlasRange = (tex, prefix, start, end) => this.anims.generateFrameNames(tex, { prefix, start, end });

    safeCreate('player-idle', { frames: atlasRange('player-dark', 'idle_', 0, 3), frameRate: 6, repeat: -1 });
    safeCreate('player-move', { frames: atlasRange('player-dark', 'move_', 0, 5), frameRate: 12, repeat: -1 });
    safeCreate('player-attack', { frames: atlasRange('player-dark', 'attack_', 0, 3), frameRate: 15, repeat: 0 });
    safeCreate('player-dash', { frames: atlasRange('player-dark', 'dash_', 0, 2), frameRate: 18, repeat: -1 });
    safeCreate('player-hurt', { frames: atlasRange('player-dark', 'hurt_', 0, 1), frameRate: 9, repeat: -1 });
    safeCreate('player-dead', { frames: [{ key: 'player-dark', frame: 'dead_1' }], frameRate: 1, repeat: -1 });

    const bossSets = [
      ['eclipse', 'boss-eclipse'],
      ['wraith', 'boss-wraith']
    ];

    for (const [prefix, tex] of bossSets) {
      safeCreate(`${prefix}-idle`, { frames: atlasRange(tex, 'idle_', 0, 3), frameRate: 5, repeat: -1 });
      safeCreate(`${prefix}-move`, { frames: atlasRange(tex, 'move_', 0, 5), frameRate: 9, repeat: -1 });
      safeCreate(`${prefix}-telegraph`, { frames: atlasRange(tex, 'telegraph_', 0, 2), frameRate: 7, repeat: -1 });
      safeCreate(`${prefix}-attack`, { frames: atlasRange(tex, 'attack_', 0, 3), frameRate: 10, repeat: 0 });
      safeCreate(`${prefix}-charge`, { frames: atlasRange(tex, 'charge_', 0, 2), frameRate: 14, repeat: -1 });
      safeCreate(`${prefix}-hurt`, { frames: [{ key: tex, frame: 'hurt_0' }], frameRate: 1, repeat: -1 });
      safeCreate(`${prefix}-enraged`, { frames: atlasRange(tex, 'enraged_', 0, 1), frameRate: 7, repeat: -1 });
      safeCreate(`${prefix}-dead`, { frames: [{ key: tex, frame: 'dead_0' }], frameRate: 1, repeat: -1 });
    }
  }
}
