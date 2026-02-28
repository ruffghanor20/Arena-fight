import ProgressionSystem from './ProgressionSystem.js';
import StorageSystem from './StorageSystem.js';

const STORAGE_KEY = 'rpg-achievements-state-v1';

export const ACHIEVEMENTS = [
  { id: 1, rarity: 'bronze', icon: '☠', name: 'Primeiro Sangue', condition: 'Vencer 1 boss.', check: (c) => c.totalWins >= 1 },
  { id: 2, rarity: 'bronze', icon: '⚔', name: 'Caçador Iniciado', condition: 'Vencer 3 bosses.', check: (c) => c.totalWins >= 3 },
  { id: 3, rarity: 'silver', icon: '✦', name: 'Veterano do Vale', condition: 'Vencer 10 bosses.', check: (c) => c.totalWins >= 10 },
  { id: 4, rarity: 'bronze', icon: 'V', name: 'Nível 5', condition: 'Atingir nível 5.', check: (c) => c.level >= 5 },
  { id: 5, rarity: 'silver', icon: 'X', name: 'Nível 10', condition: 'Atingir nível 10.', check: (c) => c.level >= 10 },
  { id: 6, rarity: 'gold', icon: 'XXV', name: 'Nível 25', condition: 'Atingir nível 25.', check: (c) => c.level >= 25 },
  { id: 7, rarity: 'bronze', icon: '◈', name: 'Bolsa Cheia', condition: 'Acumular 1.000 moedas.', check: (c) => c.coins >= 1000 },
  { id: 8, rarity: 'gold', icon: '◉', name: 'Senhor do Ouro', condition: 'Acumular 5.000 moedas.', check: (c) => c.coins >= 5000 },
  { id: 9, rarity: 'silver', icon: '🗡', name: 'Aço Desperto', condition: 'Ter arma avançada.', check: (c) => ['advanced','magical','legendary'].includes(c.weaponTier) },
  { id:10, rarity: 'gold', icon: '✶', name: 'Arma Arcana', condition: 'Ter arma mágica.', check: (c) => ['magical','legendary'].includes(c.weaponTier) },
  { id:11, rarity: 'legendary', icon: '👑', name: 'Lâmina Lendária', condition: 'Ter arma lendária.', check: (c) => c.weaponTier === 'legendary' },
  { id:12, rarity: 'silver', icon: 'F', name: 'Golpe Rúnico', condition: 'Desbloquear Golpe Rúnico.', check: (c) => c.skillsOwned.includes('runeStrike') },
  { id:13, rarity: 'silver', icon: 'R', name: 'Explosão Etérea', condition: 'Desbloquear Explosão Etérea.', check: (c) => c.skillsOwned.includes('etherBurst') },
  { id:14, rarity: 'gold', icon: '✹', name: 'Mestre das Skills', condition: 'Desbloquear as duas skills.', check: (c) => c.skillsOwned.includes('runeStrike') && c.skillsOwned.includes('etherBurst') },
  { id:15, rarity: 'silver', icon: '✊', name: 'Força 10', condition: 'Ter 10 de força.', check: (c) => c.str >= 10 },
  { id:16, rarity: 'gold', icon: '🜂', name: 'Força 20', condition: 'Ter 20 de força.', check: (c) => c.str >= 20 },
  { id:17, rarity: 'silver', icon: '❤', name: 'Vitalidade 10', condition: 'Ter 10 de vitalidade.', check: (c) => c.vit >= 10 },
  { id:18, rarity: 'gold', icon: '🛡', name: 'Vitalidade 20', condition: 'Ter 20 de vitalidade.', check: (c) => c.vit >= 20 },
  { id:19, rarity: 'silver', icon: '➶', name: 'Agilidade 10', condition: 'Ter 10 de agilidade.', check: (c) => c.agi >= 10 },
  { id:20, rarity: 'gold', icon: '☄', name: 'Agilidade 20', condition: 'Ter 20 de agilidade.', check: (c) => c.agi >= 20 },
  { id:21, rarity: 'silver', icon: '☀', name: 'Algoz do Eclipse', condition: 'Vencer o Rei do Eclipse.', check: (c) => c.byBoss.eclipse >= 1 },
  { id:22, rarity: 'silver', icon: '☾', name: 'Caçador do Abismo', condition: 'Vencer o Sussurro Abissal.', check: (c) => c.byBoss.wraith >= 1 },
  { id:23, rarity: 'gold', icon: '⛧', name: 'Dupla Ruína', condition: 'Vencer ambos os bosses.', check: (c) => c.byBoss.eclipse >= 1 && c.byBoss.wraith >= 1 },
  { id:24, rarity: 'infernal', icon: '♆', name: 'Pesadelo Superado', condition: 'Vencer 1 boss no Nightmare.', check: (c) => c.nightmareWins >= 1 },
  { id:25, rarity: 'legendary', icon: '✵', name: 'Mito do Vale', condition: 'Nível 20, arma lendária e ambos os bosses derrotados.', check: (c) => c.level >= 20 && c.weaponTier === 'legendary' && c.byBoss.eclipse >= 1 && c.byBoss.wraith >= 1 }
];

function rarityLabel(rarity) {
  const labels = { bronze: 'Bronze', silver: 'Prata', gold: 'Ouro', infernal: 'Infernal', legendary: 'Lendária' };
  return labels[rarity] || rarity;
}

export default class AchievementSystem {
  static _loadRoot() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  static _saveRoot(root) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(root)); } catch {}
  }

  static getProfileKey() {
    return 'default';
  }

  static loadState(profileKey = this.getProfileKey()) {
    const root = this._loadRoot();
    return root[profileKey] && typeof root[profileKey] === 'object' ? root[profileKey] : {};
  }

  static saveState(state, profileKey = this.getProfileKey()) {
    const root = this._loadRoot();
    root[profileKey] = state || {};
    this._saveRoot(root);
    return root[profileKey];
  }

  static clearState(profileKey = this.getProfileKey()) {
    return this.saveState({}, profileKey);
  }

  static isUnlocked(id, profileKey = this.getProfileKey()) {
    const state = this.loadState(profileKey);
    return !!state[id];
  }

  static getContext(profile = ProgressionSystem.load()) {
    const p = ProgressionSystem.getSummary(profile);
    const runs = StorageSystem.getAllRuns();
    const byBoss = { eclipse: 0, wraith: 0 };
    let nightmareWins = 0;
    for (const run of runs) {
      byBoss[run.bossType] = (byBoss[run.bossType] || 0) + 1;
      if (run.difficulty === 'nightmare') nightmareWins += 1;
    }
    return {
      level: p.level,
      coins: p.coins,
      weaponTier: p.weaponTier,
      skillsOwned: p.skillsOwned || [],
      str: p.stats.str,
      vit: p.stats.vit,
      agi: p.stats.agi,
      totalWins: runs.length,
      nightmareWins,
      byBoss
    };
  }

  static recompute(profile = ProgressionSystem.load()) {
    const profileKey = this.getProfileKey();
    const prev = this.loadState(profileKey);
    const next = { ...prev };
    const ctx = this.getContext(profile);
    const newlyUnlocked = [];

    for (const a of ACHIEVEMENTS) {
      if (!next[a.id] && a.check(ctx)) {
        next[a.id] = true;
        newlyUnlocked.push(a);
      }
    }

    this.saveState(next, profileKey);
    return { state: next, newlyUnlocked, context: ctx };
  }

  static getItems(profile = ProgressionSystem.load()) {
    const { state } = this.recompute(profile);
    return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: !!state[a.id], rarityLabel: rarityLabel(a.rarity) }));
  }

  static getProgress(profile = ProgressionSystem.load()) {
    const items = this.getItems(profile);
    const unlocked = items.filter((a) => a.unlocked).length;
    const total = items.length;
    return { unlocked, total, percent: total ? Math.round((unlocked / total) * 100) : 0 };
  }

  static unlockNext(profile = ProgressionSystem.load()) {
    const profileKey = this.getProfileKey();
    const state = this.loadState(profileKey);
    const next = ACHIEVEMENTS.find((a) => !state[a.id]);
    if (!next) return null;
    state[next.id] = true;
    this.saveState(state, profileKey);
    return next;
  }

  static unlockAll() {
    const profileKey = this.getProfileKey();
    const state = {};
    for (const a of ACHIEVEMENTS) state[a.id] = true;
    this.saveState(state, profileKey);
    return state;
  }
}
