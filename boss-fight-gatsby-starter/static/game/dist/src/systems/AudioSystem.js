export default class AudioSystem {
  constructor(scene, settings = {}) {
    this.scene = scene;
    this.settings = settings;
    this.music = null;
    this.musicKey = null;
  }

  updateSettings(settings = {}) {
    this.settings = settings;
    if (!this.settings.music) this.stopMusic();
    if (this.music) this.music.setVolume(this.settings.music ? 0.26 : 0);
  }

  play(key, config = {}) {
    if (!this.settings.sfx) return;
    if (!this.scene.cache.audio.exists(key)) return;
    this.scene.sound.play(key, { volume: 0.55, ...config });
  }

  startMusic(bossType) {
    const nextKey = bossType === 'wraith' ? 'music-wraith' : 'music-eclipse';
    if (!this.settings.music) {
      this.stopMusic();
      return;
    }
    if (this.musicKey === nextKey && this.music?.isPlaying) return;
    this.stopMusic();
    if (!this.scene.cache.audio.exists(nextKey)) return;
    this.musicKey = nextKey;
    this.music = this.scene.sound.add(nextKey, { loop: true, volume: 0.26 });
    this.music.play();
  }

  stopMusic() {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
    }
    this.music = null;
    this.musicKey = null;
  }
}
