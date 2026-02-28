import { DEFAULT_SETTINGS, SETTINGS_KEY } from '../config/constants.js';

export default class SettingsSystem {
  static _normalize(raw = {}) {
    return {
      sfx: raw.sfx !== false,
      music: raw.music !== false,
      vibration: raw.vibration !== false,
      touch: raw.touch !== false
    };
  }

  static load() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return this._normalize(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  static save(settings) {
    const normalized = this._normalize(settings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    } catch {
      // localStorage às vezes resolve praticar sabotagem passiva.
    }
    return normalized;
  }

  static set(partial = {}) {
    const next = { ...this.load(), ...partial };
    return this.save(next);
  }

  static toggle(key) {
    const current = this.load();
    if (!(key in current)) return current;
    current[key] = !current[key];
    return this.save(current);
  }
}
