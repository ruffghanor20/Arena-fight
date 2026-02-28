import Phaser from '../lib/phaser.js';

export default class InputSystem {
  constructor(scene, settings = {}) {
    this.scene = scene;
    this.settings = settings;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys('W,A,S,D,SPACE,SHIFT,ENTER,ONE,TWO,Q,E,Z,C,F,R');
    this.touch = { left: false, right: false, up: false, down: false };
    this.queue = { attack: false, dash: false, skill1: false, skill2: false };
    this.touchUi = [];
    this.touchButtons = {};
    this.active = !!(scene.sys.game.device.input.touch && settings.touch);
    this._resizeHandler = () => this.layoutTouchControls();
    this._windowResizeHandler = () => this.layoutTouchControls();
  }

  createTouchControls() {
    if (!this.active) return;

    this.scene.input.addPointer(3);

    this.touchButtons.left = this._makeHoldButton('left', '←');
    this.touchButtons.right = this._makeHoldButton('right', '→');
    this.touchButtons.up = this._makeHoldButton('up', '↑');
    this.touchButtons.down = this._makeHoldButton('down', '↓');

    this.touchButtons.skill1 = this._makeActionButton('skill1', 'F', 'skill1', 0x30518b);
    this.touchButtons.skill2 = this._makeActionButton('skill2', 'R', 'skill2', 0x4d3d91);
    this.touchButtons.attack = this._makeActionButton('attack', 'ATK', 'attack', 0x8b294f);
    this.touchButtons.dash = this._makeActionButton('dash', 'DASH', 'dash', 0x4c2e86);

    this.hint = this.scene.add.text(0, 0, 'Controles touch adaptativos', {
      fontFamily: 'Arial',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#e6dcf5'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(704).setAlpha(0.88);
    this.touchUi.push(this.hint);

    this.scene.scale.on('resize', this._resizeHandler, this);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._windowResizeHandler, { passive: true });
    }

    this.layoutTouchControls();
    this.scene.time.delayedCall(30, () => this.layoutTouchControls());
  }

  _makeHoldButton(key, label) {
    const visual = this.scene.add.circle(0, 0, 10, 0x21172f, 0.58)
      .setScrollFactor(0)
      .setDepth(700)
      .setStrokeStyle(2, 0x8e47bf, 0.7);

    const hit = this.scene.add.circle(0, 0, 14, 0xffffff, 0.001)
      .setScrollFactor(0)
      .setDepth(701)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#f7f2ff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(702);

    const setState = (value) => {
      this.touch[key] = value;
      visual.setAlpha(value ? 0.9 : 0.58);
      visual.setScale(value ? 0.96 : 1);
      text.setScale(value ? 0.96 : 1);
    };

    hit.on('pointerdown', () => setState(true));
    hit.on('pointerup', () => setState(false));
    hit.on('pointerout', () => setState(false));
    hit.on('pointerupoutside', () => setState(false));

    this.touchUi.push(visual, hit, text);
    return { visual, hit, text, setState };
  }

  _makeActionButton(name, label, queueKey, fill) {
    const visual = this.scene.add.circle(0, 0, 12, fill, 0.76)
      .setScrollFactor(0)
      .setDepth(700)
      .setStrokeStyle(2, 0xf0d6ff, 0.74);

    const hit = this.scene.add.circle(0, 0, 16, 0xffffff, 0.001)
      .setScrollFactor(0)
      .setDepth(701)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Arial',
      fontSize: label.length > 2 ? '14px' : '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(702);

    hit.on('pointerdown', () => {
      this.queue[queueKey] = true;
      visual.setScale(0.92);
      text.setScale(0.94);
      this.scene.time.delayedCall(110, () => {
        if (!visual.scene) return;
        visual.setScale(1);
        text.setScale(1);
      });
    });

    this.touchUi.push(visual, hit, text);
    return { name, label, visual, hit, text };
  }

  _getViewportMetrics() {
    const worldW = this.scene.scale.width || this.scene.game.config.width || 960;
    const worldH = this.scene.scale.height || this.scene.game.config.height || 640;
    const rect = this.scene.game.canvas?.getBoundingClientRect?.() || { width: worldW, height: worldH };
    const screenW = Math.max(1, rect.width || worldW);
    const screenH = Math.max(1, rect.height || worldH);
    const scale = Math.max(0.001, Math.min(screenW / worldW, screenH / worldH));
    const toWorld = (screenPx) => screenPx / scale;

    return {
      worldW,
      worldH,
      screenW,
      screenH,
      scale,
      toWorld,
      portrait: screenH >= screenW,
      minScreen: Math.min(screenW, screenH)
    };
  }

  layoutTouchControls() {
    if (!this.active || !this.touchButtons.attack) return;

    const { worldW, worldH, portrait, minScreen, toWorld } = this._getViewportMetrics();

    const marginPx = Phaser.Math.Clamp(minScreen * (portrait ? 0.042 : 0.032), 18, 36);
    const dirSizePx = Phaser.Math.Clamp(minScreen * (portrait ? 0.17 : 0.20), 78, 132);
    const actionSizePx = Phaser.Math.Clamp(minScreen * (portrait ? 0.21 : 0.24), 92, 152);
    const skillSizePx = Phaser.Math.Clamp(minScreen * (portrait ? 0.16 : 0.18), 72, 124);
    const hitBoostPx = Phaser.Math.Clamp(minScreen * 0.035, 18, 34);
    const gapPx = Phaser.Math.Clamp(minScreen * (portrait ? 0.03 : 0.024), 12, 24);

    const margin = toWorld(marginPx);
    const dirR = toWorld(dirSizePx / 2);
    const actionR = toWorld(actionSizePx / 2);
    const skillR = toWorld(skillSizePx / 2);
    const dirHitR = toWorld((dirSizePx + hitBoostPx * 2) / 2);
    const actionHitR = toWorld((actionSizePx + hitBoostPx * 2) / 2);
    const skillHitR = toWorld((skillSizePx + hitBoostPx * 2) / 2);
    const gap = toWorld(gapPx);

    const dpadCx = margin + dirR * 2.55;
    const dpadCy = worldH - margin - dirR * 2.35;
    const dirOffset = dirR * 1.34;

    this._placeCircleButton(this.touchButtons.left, dpadCx - dirOffset, dpadCy, dirR, dirHitR, 26);
    this._placeCircleButton(this.touchButtons.right, dpadCx + dirOffset, dpadCy, dirR, dirHitR, 26);
    this._placeCircleButton(this.touchButtons.up, dpadCx, dpadCy - dirOffset, dirR, dirHitR, 26);
    this._placeCircleButton(this.touchButtons.down, dpadCx, dpadCy + dirOffset, dirR, dirHitR, 26);

    if (portrait) {
      const attackX = worldW - margin - actionR * 1.35;
      const attackY = worldH - margin - actionR * 1.35;
      const dashX = attackX - (actionR + gap);
      const dashY = attackY - (actionR * 0.85 + gap);
      const skill1X = attackX - (actionR * 2.25 + gap * 1.5);
      const skill1Y = attackY - skillR * 0.1;
      const skill2X = attackX - actionR * 0.35;
      const skill2Y = attackY - (actionR * 2.05 + gap * 1.5);

      this._placeCircleButton(this.touchButtons.attack, attackX, attackY, actionR, actionHitR, 24);
      this._placeCircleButton(this.touchButtons.dash, dashX, dashY, actionR * 0.92, actionHitR, 19);
      this._placeCircleButton(this.touchButtons.skill1, skill1X, skill1Y, skillR, skillHitR, 20);
      this._placeCircleButton(this.touchButtons.skill2, skill2X, skill2Y, skillR, skillHitR, 20);
    } else {
      const attackX = worldW - margin - actionR * 1.28;
      const attackY = worldH - margin - actionR * 1.12;
      const dashX = attackX - (actionR * 1.95 + gap);
      const dashY = attackY - (actionR * 0.55 + gap * 0.25);
      const skill1X = attackX - (actionR * 3.45 + gap * 2.0);
      const skill1Y = attackY + skillR * 0.08;
      const skill2X = attackX - (actionR * 2.0 + gap);
      const skill2Y = attackY - (actionR * 1.9 + gap * 1.2);

      this._placeCircleButton(this.touchButtons.attack, attackX, attackY, actionR, actionHitR, 24);
      this._placeCircleButton(this.touchButtons.dash, dashX, dashY, actionR * 0.9, actionHitR, 18);
      this._placeCircleButton(this.touchButtons.skill1, skill1X, skill1Y, skillR, skillHitR, 20);
      this._placeCircleButton(this.touchButtons.skill2, skill2X, skill2Y, skillR, skillHitR, 20);
    }

    const hintFont = Math.max(12, Math.round(toWorld(Math.min(16, minScreen * 0.03))));
    this.hint.setPosition(worldW / 2, worldH - margin * 0.7);
    this.hint.setFontSize(hintFont);
    this.hint.setAlpha(portrait ? 0.88 : 0.78);
  }

  _placeCircleButton(button, x, y, visualRadius, hitRadius, fontScreenPx) {
    if (!button) return;

    button.visual.setPosition(x, y).setRadius(visualRadius);
    button.hit.setPosition(x, y).setRadius(hitRadius);
    button.text.setPosition(x, y);

    const { toWorld } = this._getViewportMetrics();
    const fontSize = Math.max(12, Math.round(toWorld(fontScreenPx)));
    button.text.setFontSize(fontSize);
    button.visual.setStrokeStyle(Math.max(2, Math.round(visualRadius * 0.08)), button.name === 'attack' ? 0xffd9e6 : 0xe3cfff, 0.74);
  }

  getMoveVector() {
    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown || this.touch.left) x -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown || this.touch.right) x += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown || this.touch.up) y -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown || this.touch.down) y += 1;

    const vec = new Phaser.Math.Vector2(x, y);
    if (vec.lengthSq() > 0) vec.normalize();
    return vec;
  }

  consumeAttack() {
    const key = Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    const queued = this.queue.attack;
    this.queue.attack = false;
    return key || queued;
  }

  consumeDash() {
    const key = Phaser.Input.Keyboard.JustDown(this.cursors.shift) || Phaser.Input.Keyboard.JustDown(this.keys.SHIFT);
    const queued = this.queue.dash;
    this.queue.dash = false;
    return key || queued;
  }

  consumeSkill1() {
    const key = Phaser.Input.Keyboard.JustDown(this.keys.F);
    const queued = this.queue.skill1;
    this.queue.skill1 = false;
    return key || queued;
  }

  consumeSkill2() {
    const key = Phaser.Input.Keyboard.JustDown(this.keys.R);
    const queued = this.queue.skill2;
    this.queue.skill2 = false;
    return key || queued;
  }

  destroy() {
    this.scene.scale.off('resize', this._resizeHandler, this);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._windowResizeHandler);
    }

    for (const key of Object.keys(this.touchButtons)) {
      const btn = this.touchButtons[key];
      if (btn?.setState) btn.setState(false);
    }

    for (const item of this.touchUi) {
      if (item?.destroy) item.destroy();
    }
    this.touchUi.length = 0;
    this.touchButtons = {};
  }
}
