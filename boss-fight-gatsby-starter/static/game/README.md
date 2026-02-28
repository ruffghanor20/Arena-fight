# Boss Fight Dark Fantasy Mobile+

Versão evoluída do protótipo de boss fight em Phaser 3 com foco em portfólio.

## Novidades desta iteração

- **3 arenas** com layouts distintos:
  - Pátio do Eclipse
  - Salão Abissal
  - Ruínas Carmesins
- **3 dificuldades**:
  - Story
  - Hunter
  - Nightmare
- **Configurações persistidas no navegador**
  - Som
  - Música
  - Vibração
  - Touch UI
- **Ranking local por combinação**
  - boss + dificuldade + arena
- **Mobile-friendly**
  - controles touch opcionais
  - layout responsivo

## Como rodar

```bash
python -m http.server 5173
```

Depois abra `http://localhost:5173/`

## Controles

### Desktop
- **WASD / Setas**: mover
- **Espaço**: atacar
- **Shift**: dash
- **Enter**: confirmar / reiniciar

### Mobile
- D-pad virtual
- botão **ATK**
- botão **DASH**

## Estrutura

- `src/scenes/` → fluxo de telas
- `src/entities/` → player e bosses
- `src/systems/` → áudio, feedback, input, settings, storage
- `src/ui/` → HUD
- `assets/` → spritesheets, sons e tileset

É um protótipo, mas já tem ossatura de jogo de verdade e margem clara para crescer sem virar um ninho de gambiarras.


## Sistema de Conquistas

- Abra pelo menu com a tecla **K** ou pelo botão **Conquistas**.
- O estado fica salvo em `localStorage`.
- As conquistas são recalculadas automaticamente ao voltar ao menu ou após vitórias.
