import Phaser from '../lib/phaser.js';
import { BOSS_DATA, DIFFICULTY_DATA, DIFFICULTY_TYPES } from '../config/constants.js';
import AttackPatternSystem from '../systems/AttackPatternSystem.js';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, bossType, difficulty = DIFFICULTY_TYPES.HUNTER, playerLevel = 1) {
    const data = BOSS_DATA[bossType];
    super(scene, x, y, data.texture, 'idle_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.bossType = bossType;
    this.bossDef = data;
    this.diffKey = difficulty;
    this.diff = DIFFICULTY_DATA[difficulty] || DIFFICULTY_DATA[DIFFICULTY_TYPES.HUNTER];
    this.patterns = new AttackPatternSystem(bossType, difficulty);

    this.setCollideWorldBounds(true);
    this.setDepth(220);
    this.setMaxVelocity(420, 420);

    this.level = Math.max(1, Math.floor(playerLevel) + (this.diff.bossLevelBonus || 0));
    this.levelScale = 1 + (this.level - 1) * 0.085;
    this.damageScale = this.diff.bossDamageMul * (1 + (this.level - 1) * 0.06);
    this.cooldownScale = Math.max(0.76, 1 - (this.level - 1) * 0.018);

    this.maxHp = Math.max(20, Math.round(data.maxHp * this.diff.bossHpMul * this.levelScale));
    this.hp = this.maxHp;
    this.speed = data.speed * this.diff.bossSpeedMul * (1 + (this.level - 1) * 0.022);
    this.enraged = false;
    this.isDead = false;
    this.state = 'chase';
    this.currentPattern = null;
    this.stateUntil = 0;
    this.attackCooldownUntil = 900;
    this.hurtUntil = 0;
    this.invulnerableUntil = 0;
    this.chargeVector = new Phaser.Math.Vector2(0, 0);
    this.chargeUntil = 0;
    this.chargeHitDone = false;
    this.lastTrailAt = 0;

    this.telegraph = scene.add.graphics().setDepth(180);
  }

  update(time, player, audio, feedback) {
    if (this.isDead) {
      this.setVelocity(0, 0);
      this.telegraph.clear();
      this.play(this._anim('dead'), true);
      return;
    }

    if (!this.enraged && this.hp <= this.maxHp * 0.5) {
      this.enraged = true;
      this.speed *= 1.15;
      this.attackCooldownUntil = Math.min(this.attackCooldownUntil, time + 300);
      audio.play('enrage', { volume: 0.5 });
      feedback.pulse(0xff99ff, 0.16, 180);
    }

    if (time < this.hurtUntil) {
      this.setVelocity(0, 0);
      this.play(this._anim('hurt'), true);
      return;
    }

    if (this.state === 'telegraph') {
      this._drawTelegraph(player);
      this.setVelocity(0, 0);
      this.play(this._anim(this.currentPattern === 'charge' ? 'telegraph' : this.enraged ? 'enraged' : 'telegraph'), true);
      if (time >= this.stateUntil) {
        this.telegraph.clear();
        this._executePattern(time, player, audio, feedback);
      }
      return;
    }

    if (this.state === 'charge') {
      this.play(this._anim('charge'), true);
      this.setVelocity(this.chargeVector.x * 350, this.chargeVector.y * 350);
      if (time - this.lastTrailAt > 52) {
        const tint = this.bossType === 'wraith' ? 0xa4cfff : 0xffb0c8;
        feedback.afterImage(this, tint, 0.18, 140, 1.05);
        this.lastTrailAt = time;
      }
      if (!this.chargeHitDone && Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) < 72) {
        this.chargeHitDone = true;
        const damage = this._scaledDamage(20);
        if (player.takeDamage(damage, time, this.x, this.y)) {
          audio.play('hit', { volume: 0.62 });
          feedback.playerHurt(player.x, player.y - 6, damage);
        }
      }
      if (time >= this.chargeUntil) {
        this.state = 'recover';
        this.stateUntil = time + 360 * this.diff.bossCooldownMul * this.cooldownScale;
        this.setVelocity(0, 0);
      }
      return;
    }

    if (this.state === 'recover') {
      this.setVelocity(0, 0);
      this.play(this.enraged ? this._anim('enraged') : this._anim('idle'), true);
      if (time >= this.stateUntil) {
        this.state = 'chase';
      }
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (time >= this.attackCooldownUntil && dist <= Math.max(250, this.bossDef.approachRange + 50)) {
      this._startPattern(time, player, audio);
      return;
    }

    const vec = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
    if (dist > this.bossDef.approachRange) {
      vec.normalize();
      this.setVelocity(vec.x * this.speed, vec.y * this.speed);
      if (vec.x !== 0) this.setFlipX(vec.x < 0);
      this.play(this._anim('move'), true);
    } else {
      this.setVelocity(0, 0);
      this.play(this.enraged ? this._anim('enraged') : this._anim('idle'), true);
    }
  }

  takeDamage(amount, time) {
    if (this.isDead || time < this.invulnerableUntil) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.hurtUntil = time + 180;
    this.invulnerableUntil = time + 140;
    if (this.hp <= 0) {
      this.isDead = true;
      this.state = 'dead';
      this.setVelocity(0, 0);
      this.telegraph.clear();
      this.play(this._anim('dead'), true);
    }
    return true;
  }

  getHpRatio() {
    return Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
  }

  _scaledDamage(base) {
    return Math.max(1, Math.round(base * this.damageScale));
  }

  _anim(state) {
    const prefix = this.bossType === 'wraith' ? 'wraith' : 'eclipse';
    return `${prefix}-${state}`;
  }

  _startPattern(time, player, audio) {
    this.currentPattern = this.patterns.pick(this.enraged);
    const cfg = this.patterns.getConfig(this.currentPattern, this.enraged);
    this.state = 'telegraph';
    this.stateUntil = time + cfg.telegraph * this.diff.bossTelegraphMul * this.cooldownScale;
    this.setVelocity(0, 0);

    if (player.x !== this.x) this.setFlipX(player.x < this.x);
    if (this.currentPattern === 'charge') {
      this.chargeVector.set(player.x - this.x, player.y - this.y).normalize();
      if (this.chargeVector.lengthSq() === 0) this.chargeVector.set(this.flipX ? -1 : 1, 0);
    }

    audio.play('telegraph', { volume: 0.42 });
  }

  _executePattern(time, player, audio, feedback) {
    const cfg = this.patterns.getConfig(this.currentPattern, this.enraged);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const doPlayerHit = (baseDamage) => {
      const damage = this._scaledDamage(baseDamage);
      if (player.takeDamage(damage, time, this.x, this.y)) {
        feedback.playerHurt(player.x, player.y - 6, damage);
        audio.play('hit', { volume: 0.58 });
      }
    };

    switch (this.currentPattern) {
      case 'slash': {
        this.play(this._anim('attack'), true);
        feedback.slashArc(this.x + (this.flipX ? -20 : 20), this.y, this.flipX, 0xffc3d4);
        audio.play('boss-slash', { volume: 0.58 });
        if (dist <= cfg.reach) doPlayerHit(cfg.damage);
        this.state = 'recover';
        this.stateUntil = time + cfg.recover * this.diff.bossCooldownMul * this.cooldownScale;
        break;
      }
      case 'charge': {
        this.play(this._anim('charge'), true);
        this.state = 'charge';
        this.chargeUntil = time + cfg.rushMs * this.cooldownScale;
        this.chargeHitDone = false;
    this.lastTrailAt = 0;
        audio.play('boss-charge', { volume: 0.62 });
        break;
      }
      case 'nova': {
        this.play(this._anim('attack'), true);
        feedback.spawnBurst(this.x, this.y, 0xdd99ff, 14, 70);
        feedback.pulse(0xffccff, 0.13, 140);
        audio.play('boss-nova', { volume: 0.6 });
        if (dist <= cfg.reach) doPlayerHit(cfg.damage);
        this.state = 'recover';
        this.stateUntil = time + cfg.recover * this.diff.bossCooldownMul * this.cooldownScale;
        break;
      }
      case 'sickle': {
        this.play(this._anim('attack'), true);
        feedback.slashArc(this.x + (this.flipX ? -30 : 30), this.y, this.flipX, 0xd3d0ff);
        audio.play('boss-sickle', { volume: 0.56 });
        if (dist <= cfg.reach) doPlayerHit(cfg.damage);
        this.state = 'recover';
        this.stateUntil = time + cfg.recover * this.diff.bossCooldownMul * this.cooldownScale;
        break;
      }
      case 'rift': {
        const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
        this.x = player.x + Math.cos(angle) * 70;
        this.y = player.y + Math.sin(angle) * 70;
        this.setFlipX(player.x < this.x);
        feedback.spawnBurst(this.x, this.y, 0x99caff, 10, 52);
        this.play(this._anim('attack'), true);
        audio.play('boss-rift', { volume: 0.56 });
        if (Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= cfg.reach) doPlayerHit(cfg.damage);
        this.state = 'recover';
        this.stateUntil = time + cfg.recover * this.diff.bossCooldownMul * this.cooldownScale;
        break;
      }
      case 'shadeBurst': {
        this.play(this._anim('telegraph'), true);
        feedback.spawnBurst(this.x, this.y, 0x89a6ff, 18, 92);
        audio.play('boss-shade', { volume: 0.54 });
        if (dist <= cfg.reach) doPlayerHit(cfg.damage);
        this.scene.time.delayedCall(120, () => {
          if (!this.scene.scene.isActive()) return;
          feedback.spawnBurst(this.x, this.y, 0xb4c2ff, 14, 78);
          if (!player.isDead && Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= cfg.reach - 20) {
            const followup = this._scaledDamage(6);
            if (player.takeDamage(followup, this.scene.time.now, this.x, this.y)) {
              feedback.playerHurt(player.x, player.y - 6, followup);
            }
          }
        });
        this.state = 'recover';
        this.stateUntil = time + cfg.recover * this.diff.bossCooldownMul * this.cooldownScale;
        break;
      }
      default:
        this.state = 'recover';
        this.stateUntil = time + 350;
    }

    this.attackCooldownUntil = time + (this.enraged ? 920 : 1180) * this.diff.bossCooldownMul * this.cooldownScale;
  }

  _drawTelegraph(player) {
    this.telegraph.clear();
    this.telegraph.lineStyle(2, this.bossType === 'wraith' ? 0x93b9ff : 0xff9fc1, 0.65);
    this.telegraph.fillStyle(this.bossType === 'wraith' ? 0x5577cc : 0xaa3355, 0.12);

    const cfg = this.patterns.getConfig(this.currentPattern, this.enraged);

    if (this.currentPattern === 'charge') {
      const endX = this.x + this.chargeVector.x * 160;
      const endY = this.y + this.chargeVector.y * 160;
      this.telegraph.lineBetween(this.x, this.y, endX, endY);
      this.telegraph.strokeCircle(endX, endY, 30);
    } else if (this.currentPattern === 'nova' || this.currentPattern === 'shadeBurst') {
      this.telegraph.fillCircle(this.x, this.y, cfg.reach);
      this.telegraph.strokeCircle(this.x, this.y, cfg.reach);
    } else if (this.currentPattern === 'rift') {
      this.telegraph.strokeCircle(player.x, player.y, 74);
      this.telegraph.lineBetween(this.x, this.y, player.x, player.y);
    } else {
      const angle = this.flipX ? Math.PI : 0;
      this.telegraph.slice(this.x, this.y, cfg.reach, angle - 0.5, angle + 0.5, false);
      this.telegraph.fillPath();
      this.telegraph.strokePath();
    }
  }
}
