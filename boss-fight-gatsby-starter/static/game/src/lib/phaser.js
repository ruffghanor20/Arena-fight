const PhaserRef = window.Phaser;

if (!PhaserRef) {
  const text = document.getElementById('boot-text');
  const fill = document.getElementById('boot-fill');
  if (text) text.textContent = 'Phaser não carregou. Verifique a internet/CDN.';
  if (fill) fill.style.width = '100%';
  throw new Error('Phaser global não encontrado. A CDN pode estar bloqueada.');
}

export default PhaserRef;
