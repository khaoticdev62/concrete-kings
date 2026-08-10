/**
 * Concrete Kings: The Block Chronicles
 * Graffiti Tagging Mini-Game (Wireframe ID: graffiti_tagging)
 *
 * Spray wall canvas, manage paint meter and watch meter before police arrive.
 */

let GraffitiTaggingBaseClass;
if (typeof require !== 'undefined') {
  GraffitiTaggingBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  GraffitiTaggingBaseClass = window.MiniGame;
} else {
  GraffitiTaggingBaseClass = class {};
}

class GraffitiTagging extends GraffitiTaggingBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'graffiti_tagging';
    this.name = 'Graffiti Tagging';
    this.description = 'Claim territory with spray paint before police arrive!';
    this.controls = '1: WILDSTYLE TAG | 2: BLOCKBUSTER THROWUP';
    this.durationSeconds = 30;
    this.resultNarrative = '';
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'confirm' || action === 'action1') this.chooseStyle('WILDSTYLE');
    if (action === 'action2' || action === 'up') this.chooseStyle('BLOCKBUSTER');
  }

  chooseStyle(style) {
    if (this.state !== 'play') return;
    this.victory = true;
    this.isFinished = true;
    this.state = 'complete';

    if (style === 'WILDSTYLE') {
      this.resultNarrative = 'Wildstyle burner finished! Street Rep +30, Territory Claimed.';
      if (this.gameState) {
        this.gameState.reputation += 30;
        this.gameState.streetCred += 15;
      }
    } else {
      this.resultNarrative = 'Quick blockbuster throwup dropped! Heat -5, Rep +15.';
      if (this.gameState) {
        this.gameState.reputation += 15;
        this.gameState.heat = Math.max(0, this.gameState.heat - 5);
      }
    }

    if (this.manager) {
      this.manager.dispatch('minigame:complete', {
        gameId: this.id,
        victory: true,
        style,
        narrative: this.resultNarrative
      });
    }
  }

  render(ctx) {
    if (!this.manager || !this.manager.ui) return;

    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#6fe8d8', 4);
    this.manager.ui.drawText('GRAFFITI TAGGING', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#6fe8d8', align: 'center' });
    this.manager.ui.drawText('BRICK CANVAS — CHOOSE SPRAY STYLE:', 640, 210, { font: 'JetBrains Mono', size: '13px', color: '#ffcd68', align: 'center' });

    const options = [
      { key: '[ 1 ] WILDSTYLE BURNER', text: 'Complex 3D lettering. High style, Rep +30, Cred +15.' },
      { key: '[ 2 ] BLOCKBUSTER THROWUP', text: 'Fast two-color fill. Quick completion. Rep +15, Heat -5.' }
    ];

    options.forEach((opt, i) => {
      const y = 270 + (i * 110);
      this.manager.ui.drawRetroBox(280, y, 720, 85, '#151821', '#339488', 2);
      this.manager.ui.drawText(opt.key, 300, y + 20, { font: 'Press Start 2P', size: '11px', color: '#6fe8d8' });
      this.manager.ui.drawText(opt.text, 300, y + 50, { font: 'JetBrains Mono', size: '13px', color: '#cbd5ed' });
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GraffitiTagging };
}
if (typeof window !== 'undefined') {
  window.GraffitiTagging = GraffitiTagging;
}
