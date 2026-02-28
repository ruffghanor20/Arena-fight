import Phaser from '../lib/phaser.js';
import {
  DIFFICULTY_DATA,
  DIFFICULTY_TYPES,
  PLAYER_ATTACK_ARC_DEG,
  PLAYER_ATTACK_CD_MS,
  PLAYER_ATTACK_MS,
  PLAYER_ATTACK_RANGE,
  PLAYER_DASH_CD_MS,
  PLAYER_DASH_MS,
  PLAYER_DASH_SPEED,
  PLAYER_INVULN_ON_HIT_MS,
  PLAYER_MAX_HP,
  PLAYER_SPEED,
  SKILL_DATA
} from '../config/constants.js';
import ProgressionSystem from '../systems/ProgressionSystem.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, difficulty = DIFFICULTY_TYPES.HUNTER, profile = null) {
    super(scene, x, y, 'player-dark', 'idle_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.diff = DIFFICULTY_DATA[difficulty] || DIFFICULTY_DATA[DIFFICULTY_TYPES.HUNTER];
    this.profile = ProgressionSystem.getSummary(profile || ProgressionSystem.load());
    this.derived = this.profile.derived;

    this.setCollideWorldBounds(true);
    this.setDrag(900, 900);
    this.setMaxVelocity(620, 620);
    this.setDepth(210);

    this.maxHp = PLAYER_MAX_HP + this.derived.maxHpBonus;
    this.hp = this.maxHp;
    this.isDead = false;

    this.attackActiveUntil = 0;
    this.attackCooldownUntil = 0;
    this.dashUntil = 0;
    this.dashCooldownUntil = 0;
    this.hurtUntil = 0;
    this.invulnerableUntil = 0;
    this.hurtMoveLockUntil = 0;
    this.hitThisSwing = false;
    this.facing = 1;
    this.lastMove = new Phaser.Math.Vector2(1, 0);
    this.isMoving = false;
    this.lastTrailAt = 0;

    this.moveSpeed = PLAYER_SPEED + this.derived.speedBonus;
    this.attackDamage = Math.max(2, Math.round((12 + this.derived.attackBonus) * this.diff.playerDamageMul));
    this.dashCooldownMs = Math.max(220, Math.round(PLAYER_DASH_CD_MS * this.diff.playerDashCdMul * this.derived.dashCdMul));

    this.pendingSkill = null;
    this.pendingSkillUntil = 0;
    this.skillCooldowns = {
      powerSlash: 0,
      arcaneBurst: 0
    };
  }

  update(time, input, audio, feedback) {
    if (this.isDead) {
      this.setVelocity(0, 0);
      this.play('player-dead', true);
      return;
    }

    if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
      this.setPosition(160, 320);
      this.setVelocity(0, 0);
    }

    if (!Number.isFinite(this.body.velocity.x) || !Number.isFinite(this.body.velocity.y)) {
      this.setVelocity(0, 0);
    }

    const move = input.getMoveVector();
    const wantsAttack = input.consumeAttack();
    const wantsDash = input.consumeDash();
    const wantsSkill1 = input.consumeSkill1?.() || false;
    const wantsSkill2 = input.consumeSkill2?.() || false;

    if (move.lengthSq() > 0) {
      this.lastMove.copy(move);
      if (move.x !== 0) {
        this.facing = move.x >= 0 ? 1 : -1;
        this.setFlipX(this.facing < 0);
      }
    }

    if (time < this.hurtMoveLockUntil) {
      this.play('player-hurt', true);
      return;
    }

    if (wantsDash && time >= this.dashCooldownUntil && move.lengthSq() > 0) {
      this.dashUntil = time + PLAYER_DASH_MS;
      this.dashCooldownUntil = time + this.dashCooldownMs;
      this.invulnerableUntil = Math.max(this.invulnerableUntil, this.dashUntil);
      this.setVelocity(move.x * PLAYER_DASH_SPEED, move.y * PLAYER_DASH_SPEED);
      this.play('player-dash', true);
      if (feedback) {
        feedback.spawnBurst(this.x, this.y + 4, 0x89d9ff, 12, 46);
        feedback.afterImage(this, 0x8de9ff, 0.22, 160, 1.06);
        this.lastTrailAt = time;
      }
      audio.play('dash', { volume: 0.46 });
      return;
    }

    if (wantsSkill1 && this._queueSkill('powerSlash', time, audio)) return;
    if (wantsSkill2 && this._queueSkill('arcaneBurst', time, audio)) return;

    if (wantsAttack && time >= this.attackCooldownUntil && time >= this.dashUntil) {
      this.attackActiveUntil = time + PLAYER_ATTACK_MS;
      this.attackCooldownUntil = time + PLAYER_ATTACK_CD_MS;
      this.hitThisSwing = false;
      this.setVelocity(0, 0);
      this.play('player-attack', true);
      audio.play('attack', { volume: 0.58 });
      return;
    }

    if (time < this.dashUntil) {
      this.play('player-dash', true);
      if (feedback && time - this.lastTrailAt > 42) {
        feedback.afterImage(this, 0x6fdcff, 0.16, 110, 1.04);
        this.lastTrailAt = time;
      }
      return;
    }

    if (this.pendingSkill && time > this.pendingSkillUntil) {
      this.pendingSkill = null;
    }

    this.setVelocity(move.x * this.moveSpeed, move.y * this.moveSpeed);
    this.isMoving = move.lengthSq() > 0;

    if (time < this.hurtUntil) {
      this.play('player-hurt', true);
    } else if (time < this.attackActiveUntil || this.pendingSkill) {
      this.play('player-attack', true);
    } else if (this.isMoving) {
      this.play('player-move', true);
    } else {
      this.play('player-idle', true);
    }
  }

  _queueSkill(skillKey, time, audio) {
    if (!this.profile.skillsOwned.includes(skillKey)) return false;
    const skill = SKILL_DATA[skillKey];
    if (!skill) return false;
    if (time < (this.skillCooldowns[skillKey] || 0)) return false;
    if (time < this.dashUntil || time < this.hurtUntil) return false;

    this.pendingSkill = skillKey;
    this.pendingSkillUntil = time + 200;
    this.skillCooldowns[skillKey] = time + skill.cooldownMs;
    this.attackActiveUntil = Math.max(this.attackActiveUntil, time + 140);
    this.attackCooldownUntil = Math.max(this.attackCooldownUntil, time + 220);
    this.setVelocity(0, 0);
    this.play('player-attack', true);
    audio.play('attack', { volume: skillKey === 'arcaneBurst' ? 0.62 : 0.55, rate: skillKey === 'arcaneBurst' ? 0.92 : 1.08 });
    return true;
  }

  tryHitBoss(boss, time, feedback, audio) {
    if (this.isDead || this.hitThisSwing || time > this.attackActiveUntil) return false;
    return this._tryDamageInCone({
      boss,
      time,
      feedback,
      audio,
      range: PLAYER_ATTACK_RANGE,
      arcDeg: PLAYER_ATTACK_ARC_DEG,
      damage: this.attackDamage,
      burstColor: 0xfff0f4,
      arcColor: 0xffd7de,
      scaleX: 24
    }, true);
  }

  tryQueuedSkill(boss, time, feedback, audio) {
    if (!this.pendingSkill || this.isDead) return false;
    if (time > this.pendingSkillUntil) {
      this.pendingSkill = null;
      return false;
    }

    let hit = false;

    if (this.pendingSkill === 'powerSlash') {
      hit = this._tryDamageInCone({
        boss,
        time,
        feedback,
        audio,
        range: PLAYER_ATTACK_RANGE + 42,
        arcDeg: PLAYER_ATTACK_ARC_DEG + 36,
        damage: Math.round(this.attackDamage * 1.9),
        burstColor: 0xfff4c6,
        arcColor: 0xffe699,
        scaleX: 34
      }, false);
      feedback.slashArc(this.x + this.facing * 34, this.y - 6, this.facing < 0, 0xffe3a0);
    } else if (this.pendingSkill === 'arcaneBurst') {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, boss.x, boss.y);
      const burstDamage = Math.round(this.attackDamage * 1.4);
      if (dist <= 126 && boss.takeDamage(burstDamage, time)) {
        hit = true;
        feedback.heavyHit(boss.x, boss.y - 8, burstDamage, 0xc9deff);
        audio.play('hit', { volume: 0.56, rate: 0.9 });
      }
      feedback.spawnBurst(this.x, this.y, 0x9bc5ff, 14, 68);
      feedback.pulse(0xadc8ff, 0.09, 120);
    }

    this.pendingSkill = null;
    return hit;
  }

  _tryDamageInCone({ boss, time, feedback, audio, range, arcDeg, damage, burstColor, arcColor, scaleX }, markBasicSwing) {
    const dx = boss.x - this.x;
    const dy = boss.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return false;

    const dir = new Phaser.Math.Vector2(this.facing, 0);
    const toBoss = new Phaser.Math.Vector2(dx, dy).normalize();
    const dot = Phaser.Math.Clamp(dir.dot(toBoss), -1, 1);
    const angle = Phaser.Math.RadToDeg(Math.acos(dot));
    if (angle > arcDeg * 0.5) return false;

    if (markBasicSwing) this.hitThisSwing = true;
    const landed = boss.takeDamage(damage, time);
    if (!landed) return false;
    feedback.heavyHit(boss.x, boss.y - 8, damage, burstColor);
    feedback.slashArc(this.x + this.facing * scaleX, this.y - 4, this.facing < 0, arcColor);
    audio.play('hit', { volume: 0.5 });
    return true;
  }

  takeDamage(amount, time, sourceX, sourceY) {
    if (this.isDead || time < this.invulnerableUntil) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.hurtUntil = time + 220;
    this.hurtMoveLockUntil = time + 110;
    this.invulnerableUntil = time + PLAYER_INVULN_ON_HIT_MS;
    this.attackActiveUntil = Math.min(this.attackActiveUntil, time);
    this.dashUntil = Math.min(this.dashUntil, time);
    this.pendingSkill = null;
    this.play('player-hurt', true);

    const safeSourceX = Number.isFinite(sourceX) ? sourceX : this.x - this.facing * 12;
    const safeSourceY = Number.isFinite(sourceY) ? sourceY : this.y;
    const knock = new Phaser.Math.Vector2(this.x - safeSourceX, this.y - safeSourceY);
    if (!Number.isFinite(knock.x) || !Number.isFinite(knock.y) || knock.lengthSq() === 0) knock.set(this.facing || 1, 0);
    knock.normalize().scale(150);
    this.setVelocity(knock.x, knock.y);

    if (this.hp <= 0) {
      this.isDead = true;
      this.setVelocity(0, 0);
      this.play('player-dead', true);
    }
    return true;
  }

  getHpRatio() {
    return Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
  }

  getSkillState(time = 0) {
    const entries = Object.values(SKILL_DATA).map((skill) => {
      const owned = this.profile.skillsOwned.includes(skill.key);
      const remain = owned ? Math.max(0, (this.skillCooldowns[skill.key] || 0) - time) : 0;
      return {
        ...skill,
        owned,
        ready: owned && remain <= 0,
        remainMs: remain
      };
    });
    return entries;
  }
}
