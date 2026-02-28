import {
  BOSS_DATA,
  DIFFICULTY_DATA,
  DIFFICULTY_TYPES,
  PROGRESSION_KEY,
  SKILL_DATA,
  WEAPON_TIERS,
  WEAPON_TIER_ORDER
} from '../config/constants.js';

const STARTING_PROFILE = {
  level: 1,
  xp: 0,
  coins: 30,
  stats: { str: 0, vit: 0, agi: 0 },
  weaponTier: 'simple',
  skillsOwned: []
};

export default class ProgressionSystem {
  static _default() {
    return JSON.parse(JSON.stringify(STARTING_PROFILE));
  }

  static _normalize(raw = {}) {
    const stats = raw.stats || {};
    const weaponTier = WEAPON_TIERS[raw.weaponTier] ? raw.weaponTier : 'simple';
    const skillsOwned = Array.isArray(raw.skillsOwned)
      ? raw.skillsOwned.filter((key) => SKILL_DATA[key])
      : [];

    return {
      level: Math.max(1, Math.floor(raw.level || 1)),
      xp: Math.max(0, Math.floor(raw.xp || 0)),
      coins: Math.max(0, Math.floor(raw.coins ?? STARTING_PROFILE.coins)),
      stats: {
        str: Math.max(0, Math.floor(stats.str || 0)),
        vit: Math.max(0, Math.floor(stats.vit || 0)),
        agi: Math.max(0, Math.floor(stats.agi || 0))
      },
      weaponTier,
      skillsOwned: [...new Set(skillsOwned)]
    };
  }

  static load() {
    try {
      const raw = localStorage.getItem(PROGRESSION_KEY);
      if (!raw) return this._normalize(this._default());
      return this._normalize(JSON.parse(raw));
    } catch {
      return this._normalize(this._default());
    }
  }

  static save(profile = {}) {
    const normalized = this._normalize(profile);
    try {
      localStorage.setItem(PROGRESSION_KEY, JSON.stringify(normalized));
    } catch {
      // localStorage às vezes desmaia. A aventura continua.
    }
    return normalized;
  }

  static getXpToNext(level = 1) {
    const safe = Math.max(1, Math.floor(level));
    return 70 + (safe - 1) * 35;
  }

  static getWeaponData(profile = this.load()) {
    return WEAPON_TIERS[profile.weaponTier] || WEAPON_TIERS.simple;
  }

  static getNextWeaponData(profile = this.load()) {
    const currentIndex = WEAPON_TIER_ORDER.indexOf(profile.weaponTier);
    const nextKey = WEAPON_TIER_ORDER[currentIndex + 1];
    return nextKey ? WEAPON_TIERS[nextKey] : null;
  }

  static getPlayerDerived(profile = this.load()) {
    const weapon = this.getWeaponData(profile);
    return {
      maxHpBonus: profile.stats.vit * 14,
      attackBonus: profile.stats.str * 2 + weapon.attackBonus,
      speedBonus: profile.stats.agi * 5 + weapon.speedBonus,
      dashCdMul: Math.max(0.72, 1 - profile.stats.agi * 0.018),
      weapon
    };
  }

  static getBossLevel(profile = this.load(), difficulty = DIFFICULTY_TYPES.HUNTER) {
    const diff = DIFFICULTY_DATA[difficulty] || DIFFICULTY_DATA[DIFFICULTY_TYPES.HUNTER];
    return Math.max(1, profile.level + (diff.bossLevelBonus || 0));
  }

  static getStatCost(statKey, profile = this.load()) {
    const current = profile.stats?.[statKey] || 0;
    return 24 + current * 18;
  }

  static buyStat(statKey) {
    if (!['str', 'vit', 'agi'].includes(statKey)) {
      return { ok: false, message: 'Atributo inválido.' };
    }

    const profile = this.load();
    const cost = this.getStatCost(statKey, profile);
    if (profile.coins < cost) {
      return { ok: false, message: 'Moedas insuficientes.' };
    }

    profile.coins -= cost;
    profile.stats[statKey] += 1;
    const saved = this.save(profile);
    return {
      ok: true,
      message: `+1 ${statKey.toUpperCase()} por ${cost} moedas.`,
      cost,
      profile: saved
    };
  }

  static buyNextWeapon() {
    const profile = this.load();
    const next = this.getNextWeaponData(profile);
    if (!next) {
      return { ok: false, message: 'Arma já está no tier máximo.' };
    }
    if (profile.level < next.minLevel) {
      return { ok: false, message: `Requer nível ${next.minLevel}.` };
    }
    if (profile.coins < next.price) {
      return { ok: false, message: 'Moedas insuficientes.' };
    }

    profile.coins -= next.price;
    profile.weaponTier = next.key;
    const saved = this.save(profile);
    return {
      ok: true,
      message: `${next.name} equipada.`,
      cost: next.price,
      profile: saved
    };
  }

  static buySkill(skillKey) {
    const skill = SKILL_DATA[skillKey];
    if (!skill) return { ok: false, message: 'Skill inválida.' };

    const profile = this.load();
    if (profile.skillsOwned.includes(skillKey)) {
      return { ok: false, message: 'Skill já desbloqueada.' };
    }
    if (profile.level < skill.minLevel) {
      return { ok: false, message: `Requer nível ${skill.minLevel}.` };
    }
    if (profile.coins < skill.price) {
      return { ok: false, message: 'Moedas insuficientes.' };
    }

    profile.coins -= skill.price;
    profile.skillsOwned.push(skillKey);
    const saved = this.save(profile);
    return {
      ok: true,
      message: `${skill.name} desbloqueada.`,
      cost: skill.price,
      profile: saved
    };
  }

  static addBossRewards({ bossType, difficulty = DIFFICULTY_TYPES.HUNTER, timeMs = 0, bossLevel = 1 } = {}) {
    const profile = this.load();
    const boss = BOSS_DATA[bossType] || BOSS_DATA.eclipse;
    const diff = DIFFICULTY_DATA[difficulty] || DIFFICULTY_DATA[DIFFICULTY_TYPES.HUNTER];

    const fastBonus = timeMs > 0 && timeMs <= 45000 ? 1.1 : timeMs > 0 && timeMs <= 75000 ? 1.04 : 1;
    const levelMul = 1 + Math.max(0, bossLevel - 1) * 0.07;

    const xp = Math.max(10, Math.round(boss.rewardXp * diff.rewardMul * levelMul * fastBonus));
    const coins = Math.max(8, Math.round(boss.rewardCoins * diff.rewardMul * levelMul));

    profile.coins += coins;
    profile.xp += xp;

    let levelUps = 0;
    while (profile.xp >= this.getXpToNext(profile.level)) {
      profile.xp -= this.getXpToNext(profile.level);
      profile.level += 1;
      levelUps += 1;
    }

    const saved = this.save(profile);
    return {
      xp,
      coins,
      bossLevel,
      levelUps,
      newLevel: saved.level,
      profile: saved
    };
  }

  static getSummary(profile = this.load()) {
    const normalized = this._normalize(profile);
    const weapon = this.getWeaponData(normalized);
    const nextWeapon = this.getNextWeaponData(normalized);
    return {
      ...normalized,
      xpToNext: this.getXpToNext(normalized.level),
      weapon,
      nextWeapon,
      derived: this.getPlayerDerived(normalized),
      skillEntries: Object.values(SKILL_DATA).map((skill) => ({
        ...skill,
        owned: normalized.skillsOwned.includes(skill.key)
      }))
    };
  }
}
