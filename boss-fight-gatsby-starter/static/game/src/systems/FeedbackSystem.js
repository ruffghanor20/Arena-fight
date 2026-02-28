import Phaser from '../lib/phaser.js';

export default class FeedbackSystem {
  constructor(scene, settings = {}) {
    this.scene = scene;
    this.settings = settings;
    this.flash = null;
    this.vignette = null;
  }

  init() {
    const { width, height } = this.scene.scale;
    this.flash = this.scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0)
      .setScrollFactor(0)
      .setDepth(900);
    this.vignette = this.scene.add.rectangle(width / 2, height / 2, width, height, 0xaa1133, 0)
      .setScrollFactor(0)
      .setDepth(899);
  }

  _vibrate(pattern) {
    if (!this.settings.vibration) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (_) {
      // melhor ignorar drama do navegador do que travar o combate
    }
  }

  pulse(color = 0xffffff, alpha = 0.14, duration = 110) {
    if (!this.flash) return;
    this.flash.setFillStyle(color, alpha);
    this.flash.setAlpha(alpha);
    this.scene.tweens.killTweensOf(this.flash);
    this.scene.tweens.add({
      targets: this.flash,
      alpha: 0,
      duration,
      ease: 'Quad.Out'
    });
  }

  afterImage(sprite, tint = 0xffffff, alpha = 0.2, duration = 140, scaleMult = 1.04) {
    if (!sprite?.texture?.key || !sprite?.frame) return;
    const ghost = this.scene.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name ?? sprite.frame.textureFrame)
      .setDepth((sprite.depth || 250) - 1)
      .setAlpha(alpha)
      .setScale(sprite.scaleX || 1, sprite.scaleY || 1)
      .setFlipX(!!sprite.flipX)
      .setTint(tint);

    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: (sprite.scaleX || 1) * scaleMult,
      scaleY: (sprite.scaleY || 1) * scaleMult,
      duration,
      ease: 'Quad.Out',
      onComplete: () => ghost.destroy()
    });
  }

  impactRing(x, y, color = 0xffffff, radius = 18, duration = 220, width = 2) {
    const ring = this.scene.add.circle(x, y, radius, color, 0)
      .setStrokeStyle(width, color, 0.55)
      .setDepth(316)
      .setScale(0.4);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy()
    });
  }

  heavyHit(x, y, amount = 0, color = 0xffffff) {
    this.scene.cameras.main.shake(95, 0.0038);
    this.pulse(color, 0.18, 130);
    this.spawnBurst(x, y, color, 14, 52);
    this.impactRing(x, y, color, 16, 220, 2);
    this._vibrate(12);
    if (amount) this.damageText(x, y - 24, amount, '#fff5ff');
  }

  playerHurt(x, y, amount = 0) {
    this.scene.cameras.main.shake(110, 0.0044);
    this.pulse(0xffd2df, 0.14, 110);
    this._vibrate([16, 30, 24]);
    if (this.vignette) {
      this.vignette.setAlpha(0.14);
      this.scene.tweens.killTweensOf(this.vignette);
      this.scene.tweens.add({ targets: this.vignette, alpha: 0, duration: 210 });
    }
    this.spawnBurst(x, y, 0xff768f, 11, 56);
    this.impactRing(x, y, 0xff8fa4, 14, 200, 2);
    if (amount) this.damageText(x, y - 24, amount, '#ffb2c4');
  }

  spawnBurst(x, y, tint = 0xffffff, count = 8, spread = 34) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.28, 0.28);
      const dist = Phaser.Math.Between(spread * 0.45, spread);
      const size = Phaser.Math.Between(2, 4);
      const isShard = i % 3 === 0;
      const p = isShard
        ? this.scene.add.rectangle(x, y, size + 2, size, tint, 0.88).setDepth(320).setRotation(angle)
        : this.scene.add.circle(x, y, size, tint, 0.92).setDepth(320);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.18,
        scaleY: 0.18,
        duration: Phaser.Math.Between(180, 280),
        ease: 'Cubic.Out',
        onComplete: () => p.destroy()
      });
    }
  }

  slashArc(x, y, flip = false, tint = 0xffdddd) {
    const start = flip ? 155 : -35;
    const end = flip ? 330 : 145;
    const arcBack = this.scene.add.arc(x, y, 52, start, end, false, tint, 0.06)
      .setDepth(314)
      .setScale(0.6);
    arcBack.setStrokeStyle(4, tint, 0.14);

    const arcFront = this.scene.add.arc(x, y, 46, start, end, false, tint, 0.16)
      .setDepth(315)
      .setScale(0.65);
    arcFront.setStrokeStyle(2, tint, 0.72);

    const streak = this.scene.add.rectangle(x + (flip ? -4 : 4), y, 34, 6, tint, 0.28)
      .setDepth(316)
      .setRotation(Phaser.Math.DegToRad(flip ? 165 : 15))
      .setScale(0.55, 0.8);

    this.scene.tweens.add({
      targets: [arcBack, arcFront, streak],
      scaleX: '+=0.62',
      scaleY: '+=0.42',
      alpha: 0,
      duration: 180,
      ease: 'Quad.Out',
      onComplete: () => {
        arcBack.destroy();
        arcFront.destroy();
        streak.destroy();
      }
    });
  }

  damageText(x, y, amount, color = '#ffffff') {
    const t = this.scene.add.text(x, y, `-${amount}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color,
      stroke: '#120c1c',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(350);

    this.scene.tweens.add({
      targets: t,
      y: y - 30,
      alpha: 0,
      scale: 1.12,
      duration: 440,
      ease: 'Quad.Out',
      onComplete: () => t.destroy()
    });
  }
}
