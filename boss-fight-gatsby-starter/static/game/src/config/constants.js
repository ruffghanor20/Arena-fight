export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;
export const TILE_SIZE = 32;

export const PLAYER_FRAME = { width: 48, height: 48 };
export const BOSS_FRAME = { width: 80, height: 80 };

export const PLAYER_MAX_HP = 100;
export const PLAYER_SPEED = 230;
export const PLAYER_DASH_SPEED = 520;
export const PLAYER_DASH_MS = 170;
export const PLAYER_DASH_CD_MS = 720;
export const PLAYER_ATTACK_MS = 180;
export const PLAYER_ATTACK_CD_MS = 280;
export const PLAYER_ATTACK_RANGE = 92;
export const PLAYER_ATTACK_ARC_DEG = 95;
export const PLAYER_INVULN_ON_HIT_MS = 350;

export const BOSS_TYPES = {
  ECLIPSE: 'eclipse',
  WRAITH: 'wraith'
};

export const BOSS_DATA = {
  eclipse: {
    name: 'Rei do Eclipse',
    texture: 'boss-eclipse',
    rewardXp: 48,
    rewardCoins: 34,
    maxHp: 180,
    speed: 138,
    approachRange: 180,
    patterns: ['slash', 'charge', 'nova']
  },
  wraith: {
    name: 'Sussurro Abissal',
    texture: 'boss-wraith',
    rewardXp: 54,
    rewardCoins: 38,
    maxHp: 165,
    speed: 152,
    approachRange: 210,
    patterns: ['sickle', 'rift', 'shadeBurst']
  }
};

export const ARENA_TYPES = {
  ECLIPSE_COURT: 'eclipseCourt',
  ABYSS_HALL: 'abyssHall',
  CRIMSON_RUINS: 'crimsonRuins'
};

export const ARENA_DATA = {
  eclipseCourt: {
    name: 'Pátio do Eclipse',
    subtitle: 'sigilos, brasas e pedra violeta',
    accentColor: 0xca8bf7,
    textColor: '#f4dfff',
    overlayColor: 0x4a1636,
    overlayAlpha: 0.06,
    ellipseColor: 0x7a2c5b,
    ellipseAlpha: 0.08,
    frames: {
      floor: [0, 1],
      wall: 2,
      pillar: 3,
      trim: 4,
      sigil: 5,
      accent: [6, 7]
    }
  },
  abyssHall: {
    name: 'Salão Abissal',
    subtitle: 'pedra fria, água negra e runas azuis',
    accentColor: 0x8dc4ff,
    textColor: '#d9ecff',
    overlayColor: 0x112a46,
    overlayAlpha: 0.06,
    ellipseColor: 0x184f76,
    ellipseAlpha: 0.08,
    frames: {
      floor: [8, 9],
      wall: 10,
      pillar: 11,
      trim: 12,
      sigil: 13,
      accent: [14, 15]
    }
  },
  crimsonRuins: {
    name: 'Ruínas Carmesins',
    subtitle: 'mossas quentes, musgo e pedra rachada',
    accentColor: 0xf29a73,
    textColor: '#ffe5d6',
    overlayColor: 0x472010,
    overlayAlpha: 0.06,
    ellipseColor: 0x8a3b22,
    ellipseAlpha: 0.08,
    frames: {
      floor: [16, 17],
      wall: 18,
      pillar: 19,
      trim: 20,
      sigil: 21,
      accent: [22, 23]
    }
  }
};

export const DIFFICULTY_TYPES = {
  STORY: 'story',
  HUNTER: 'hunter',
  NIGHTMARE: 'nightmare'
};

export const DIFFICULTY_DATA = {
  story: {
    name: 'Story',
    description: 'Mais margem para errar, menos punição.',
    accentColor: 0x7fd6b1,
    bossHpMul: 0.86,
    bossDamageMul: 0.82,
    bossSpeedMul: 0.93,
    bossCooldownMul: 1.08,
    bossTelegraphMul: 1.06,
    playerDamageMul: 1.15,
    playerDashCdMul: 0.9,
    rewardMul: 0.92,
    bossLevelBonus: 0
  },
  hunter: {
    name: 'Hunter',
    description: 'O equilíbrio honesto.',
    accentColor: 0xe7c56b,
    bossHpMul: 1,
    bossDamageMul: 1,
    bossSpeedMul: 1,
    bossCooldownMul: 1,
    bossTelegraphMul: 1,
    playerDamageMul: 1,
    playerDashCdMul: 1,
    rewardMul: 1,
    bossLevelBonus: 1
  },
  nightmare: {
    name: 'Nightmare',
    description: 'Menos perdão, mais dentes.',
    accentColor: 0xf06b82,
    bossHpMul: 1.16,
    bossDamageMul: 1.24,
    bossSpeedMul: 1.12,
    bossCooldownMul: 0.9,
    bossTelegraphMul: 0.9,
    playerDamageMul: 0.95,
    playerDashCdMul: 1.1,
    rewardMul: 1.16,
    bossLevelBonus: 2
  }
};

export const DEFAULT_SETTINGS = {
  sfx: true,
  music: true,
  vibration: true,
  touch: true
};

export const WEAPON_TIER_ORDER = ['simple', 'advanced', 'magic', 'legendary'];

export const WEAPON_TIERS = {
  simple: {
    key: 'simple',
    name: 'Simples',
    price: 0,
    minLevel: 1,
    attackBonus: 0,
    speedBonus: 0,
    color: '#d8d0dd'
  },
  advanced: {
    key: 'advanced',
    name: 'Avançada',
    price: 90,
    minLevel: 2,
    attackBonus: 4,
    speedBonus: 4,
    color: '#a8f0cc'
  },
  magic: {
    key: 'magic',
    name: 'Mágica',
    price: 220,
    minLevel: 4,
    attackBonus: 9,
    speedBonus: 8,
    color: '#8fd1ff'
  },
  legendary: {
    key: 'legendary',
    name: 'Lendária',
    price: 430,
    minLevel: 7,
    attackBonus: 16,
    speedBonus: 12,
    color: '#ffd97f'
  }
};

export const SKILL_DATA = {
  powerSlash: {
    key: 'powerSlash',
    slot: 1,
    inputLabel: 'F',
    name: 'Golpe Rúnico',
    shortName: 'Rúnico',
    price: 120,
    minLevel: 2,
    cooldownMs: 4200,
    description: 'Cone pesado com dano alto.'
  },
  arcaneBurst: {
    key: 'arcaneBurst',
    slot: 2,
    inputLabel: 'R',
    name: 'Explosão Etérea',
    shortName: 'Etérea',
    price: 210,
    minLevel: 4,
    cooldownMs: 6400,
    description: 'Burst radial para punir aproximações.'
  }
};

export const STORAGE_KEY = 'ruffghanor_boss_rank_v3';
export const SETTINGS_KEY = 'ruffghanor_boss_settings_v1';
export const PROGRESSION_KEY = 'ruffghanor_boss_progress_v1';
