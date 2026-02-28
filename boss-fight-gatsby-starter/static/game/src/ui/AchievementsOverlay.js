import AchievementSystem from '../systems/AchievementSystem.js';

export default class AchievementsOverlay {
  constructor() {
    this.root = null;
    this.grid = null;
    this.progressBar = null;
    this.progressText = null;
    this.progressPercent = null;
    this.toast = null;
    this.visible = false;
    this._toastTimer = null;
  }

  ensure() {
    if (this.root) return;
    const root = document.createElement('div');
    root.className = 'achv-overlay hidden';
    root.innerHTML = `
      <div class="achv-shell">
        <section class="achv-hero">
          <div>
            <h2>Crônicas das Conquistas</h2>
            <p>Relicário persistente de feitos. Clique numa badge para alternar manualmente durante os testes.</p>
          </div>
          <button class="achv-close" data-action="close">Fechar</button>
        </section>
        <section class="achv-toolbar">
          <div class="achv-actions">
            <button data-action="next">Forjar próxima</button>
            <button data-action="all">Desbloquear todas</button>
            <button data-action="reset">Selar todas</button>
          </div>
          <div class="achv-stats">
            <div class="achv-stats-top">
              <span data-role="progress-text">0 / 25 despertas</span>
              <span data-role="progress-percent">0%</span>
            </div>
            <div class="achv-progress-track"><div class="achv-progress-bar" data-role="progress-bar"></div></div>
          </div>
        </section>
        <div class="achv-grid" data-role="grid"></div>
      </div>
      <div class="achv-toast" data-role="toast"></div>
    `;
    document.body.appendChild(root);
    this.root = root;
    this.grid = root.querySelector('[data-role="grid"]');
    this.progressBar = root.querySelector('[data-role="progress-bar"]');
    this.progressText = root.querySelector('[data-role="progress-text"]');
    this.progressPercent = root.querySelector('[data-role="progress-percent"]');
    this.toast = root.querySelector('[data-role="toast"]');

    root.addEventListener('click', (e) => {
      const action = e.target?.dataset?.action;
      if (action === 'close') this.hide();
      if (action === 'next') {
        const item = AchievementSystem.unlockNext();
        this.refresh();
        this.showToast(item ? `Nova conquista forjada: ${item.name}` : 'Todas as conquistas já despertaram.');
      }
      if (action === 'all') {
        AchievementSystem.unlockAll();
        this.refresh();
        this.showToast('Todas as conquistas foram despertadas.');
      }
      if (action === 'reset') {
        AchievementSystem.clearState();
        this.refresh();
        this.showToast('Todas as conquistas foram seladas.');
      }
      const card = e.target.closest?.('.achv-card');
      if (card) {
        const id = Number(card.dataset.id);
        const state = AchievementSystem.loadState();
        state[id] = !state[id];
        AchievementSystem.saveState(state);
        this.refresh();
        const item = AchievementSystem.getItems().find((a) => a.id === id);
        this.showToast(state[id] ? `Conquista despertada: ${item.name}` : `Conquista selada: ${item.name}`);
      }
      if (e.target === root) this.hide();
    });
  }

  show(profile = null) {
    this.ensure();
    if (profile) AchievementSystem.recompute(profile);
    this.refresh(profile);
    this.root.classList.remove('hidden');
    this.visible = true;
  }

  hide() {
    if (!this.root) return;
    this.root.classList.add('hidden');
    this.visible = false;
  }

  toggle(profile = null) {
    if (this.visible) this.hide(); else this.show(profile);
  }

  refresh(profile = null) {
    this.ensure();
    if (profile) AchievementSystem.recompute(profile);
    const items = AchievementSystem.getItems(profile || undefined);
    const progress = AchievementSystem.getProgress(profile || undefined);
    this.grid.innerHTML = items.map((a) => `
      <article class="achv-card ${a.rarity} ${a.unlocked ? 'unlocked' : 'locked'}" data-id="${a.id}">
        <div class="achv-id">#${String(a.id).padStart(2, '0')}</div>
        <div class="achv-sigil">${a.icon}</div>
        <h3>${a.name}</h3>
        <p class="achv-condition">${a.condition}</p>
        <div class="achv-footer">
          <span class="achv-tag">${a.rarityLabel}</span>
          <span class="achv-tag state ${a.unlocked ? 'on' : 'off'}">${a.unlocked ? 'Desperta' : 'Selada'}</span>
        </div>
      </article>
    `).join('');
    this.progressBar.style.width = `${progress.percent}%`;
    this.progressText.textContent = `${progress.unlocked} / ${progress.total} despertas`;
    this.progressPercent.textContent = `${progress.percent}%`;
  }

  showToast(message) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toast?.classList.remove('show'), 2200);
  }
}
