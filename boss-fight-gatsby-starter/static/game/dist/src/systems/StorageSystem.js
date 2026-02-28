import { ARENA_TYPES, DIFFICULTY_TYPES, STORAGE_KEY } from '../config/constants.js';

export default class StorageSystem {
  static _default() {
    return { runs: [] };
  }

  static _normalizeRun(run = {}) {
    return {
      bossType: run.bossType || 'eclipse',
      difficulty: run.difficulty || DIFFICULTY_TYPES.HUNTER,
      arenaType: run.arenaType || ARENA_TYPES.ECLIPSE_COURT,
      timeMs: Math.max(1, Math.floor(run.timeMs || 0)),
      createdAt: run.createdAt || Date.now()
    };
  }

  static _loadRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this._default();
      const parsed = JSON.parse(raw);

      // Migração da versão antiga: { eclipse: [], wraith: [] }
      if (!parsed.runs && (Array.isArray(parsed.eclipse) || Array.isArray(parsed.wraith))) {
        const runs = [];
        for (const bossType of ['eclipse', 'wraith']) {
          const arr = Array.isArray(parsed[bossType]) ? parsed[bossType] : [];
          for (const timeMs of arr) {
            runs.push(this._normalizeRun({
              bossType,
              difficulty: DIFFICULTY_TYPES.HUNTER,
              arenaType: ARENA_TYPES.ECLIPSE_COURT,
              timeMs
            }));
          }
        }
        return { runs };
      }

      const runs = Array.isArray(parsed.runs) ? parsed.runs.map((item) => this._normalizeRun(item)) : [];
      return { runs };
    } catch {
      return this._default();
    }
  }

  static _saveRaw(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage indisponível? Tudo bem, seguimos sem altar de sacrifício.
    }
  }

  static _sameKey(run, bossType, difficulty, arenaType) {
    return run.bossType === bossType
      && run.difficulty === difficulty
      && (arenaType ? run.arenaType === arenaType : true);
  }

  static getTopRuns({ bossType, difficulty = DIFFICULTY_TYPES.HUNTER, arenaType = null, limit = 5 } = {}) {
    const data = this._loadRaw();
    return data.runs
      .filter((run) => (!bossType || run.bossType === bossType)
        && (!difficulty || run.difficulty === difficulty)
        && (!arenaType || run.arenaType === arenaType))
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, limit);
  }

  static getTopTimes(bossType, difficulty = DIFFICULTY_TYPES.HUNTER, arenaType = null) {
    return this.getTopRuns({ bossType, difficulty, arenaType, limit: 5 }).map((item) => item.timeMs);
  }

  static getBestTime(bossType, difficulty = DIFFICULTY_TYPES.HUNTER, arenaType = null) {
    return this.getTopRuns({ bossType, difficulty, arenaType, limit: 1 })[0]?.timeMs ?? null;
  }

  static saveWin(bossType, difficulty, arenaType, timeMs) {
    const data = this._loadRaw();
    const normalized = this._normalizeRun({ bossType, difficulty, arenaType, timeMs });

    const sameKey = data.runs
      .filter((run) => this._sameKey(run, bossType, difficulty, arenaType))
      .concat(normalized)
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, 10);

    const others = data.runs.filter((run) => !this._sameKey(run, bossType, difficulty, arenaType));
    data.runs = others.concat(sameKey).slice(-120);
    this._saveRaw(data);

    return sameKey;
  }

  static getAllRuns() {
    const data = this._loadRaw();
    return data.runs.slice();
  }

  static getOverallTop(limit = 8) {
    const data = this._loadRaw();
    return data.runs.slice().sort((a, b) => a.timeMs - b.timeMs).slice(0, limit);
  }

  static formatMs(ms) {
    const safe = Math.max(0, Math.floor(ms || 0));
    const total = Math.floor(safe / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    const cs = Math.floor((safe % 1000) / 10).toString().padStart(2, '0');
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${cs}`;
  }
}
