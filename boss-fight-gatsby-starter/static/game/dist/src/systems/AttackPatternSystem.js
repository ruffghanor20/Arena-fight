import Phaser from '../lib/phaser.js';
import { DIFFICULTY_DATA, DIFFICULTY_TYPES } from '../config/constants.js';

export default class AttackPatternSystem {
  constructor(bossType, difficulty = DIFFICULTY_TYPES.HUNTER) {
    this.bossType = bossType;
    this.diff = DIFFICULTY_DATA[difficulty] || DIFFICULTY_DATA[DIFFICULTY_TYPES.HUNTER];
  }

  pick(enraged = false) {
    const base = this.bossType === 'wraith'
      ? ['sickle', 'rift', 'shadeBurst']
      : ['slash', 'charge', 'nova'];

    const pool = enraged ? base.concat(base[Phaser.Math.Between(0, base.length - 1)]) : base;
    return pool[Phaser.Math.Between(0, pool.length - 1)];
  }

  getConfig(pattern, enraged = false) {
    const speedMul = (enraged ? 0.88 : 1) * this.diff.bossCooldownMul;
    const teleMul = (enraged ? 0.82 : 1) * this.diff.bossTelegraphMul;
    const dmgMul = this.diff.bossDamageMul;

    const table = {
      slash: { telegraph: 620 * teleMul, recover: 440 * speedMul, reach: 112, damage: Math.round(16 * dmgMul) },
      charge: { telegraph: 720 * teleMul, recover: 520 * speedMul, reach: 96, damage: Math.round(20 * dmgMul), rushMs: 320 },
      nova: { telegraph: 900 * teleMul, recover: 560 * speedMul, reach: 150, damage: Math.round(14 * dmgMul) },
      sickle: { telegraph: 560 * teleMul, recover: 420 * speedMul, reach: 220, damage: Math.round(14 * dmgMul) },
      rift: { telegraph: 740 * teleMul, recover: 480 * speedMul, reach: 88, damage: Math.round(18 * dmgMul) },
      shadeBurst: { telegraph: 820 * teleMul, recover: 520 * speedMul, reach: 170, damage: Math.round(13 * dmgMul) }
    };
    return table[pattern];
  }
}
