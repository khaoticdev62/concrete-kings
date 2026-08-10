/**
 * Concrete Kings: The Block Chronicles
 * Stash House Mini-Game
 *
 * Relocate or burn stash under pressure, modifying gang trust & police heat.
 */

let StashHouseBaseClass;
if (typeof require !== 'undefined') {
  StashHouseBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  StashHouseBaseClass = window.MiniGame;
} else {
  StashHouseBaseClass = class {};
}

class StashHouse extends StashHouseBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'stash_house';
    this.name = 'Stash House';
    this.description = 'Sirens in the distance! Move or destroy the stash.';
    this.controls = '1: RELOCATE STASH | 2: BURN THE EVIDENCE';
    this.durationSeconds = 20;
    this.resultNarrative = '';
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'confirm' || action === 'action1') this.chooseOption('RELOCATE');
    if (action === 'action2' || action === 'up') this.chooseOption('BURN');
  }

  chooseOption(choice) {
    if (this.state !== 'play') return;
    this.victory = true;
    this.isFinished = true;
    this.state = 'complete';

    if (choice === 'RELOCATE') {
      this.resultNarrative = 'Stash moved across town! Gang Trust +20, Heat +10.';
      if (this.gameState) {
        this.gameState.heat += 10;
        this.gameState.streetCred += 20;
      }
    } else {
      this.resultNarrative = 'Stash burned! Heat -20, Gang Trust -10.';
      if (this.gameState) {
        this.gameState.heat = Math.max(0, this.gameState.heat - 20);
      }
    }

    if (this.manager) {
      this.manager.dispatch('minigame:complete', {
        gameId: this.id,
        victory: true,
        choice,
        narrative: this.resultNarrative
      });
    }
  }

  render(ctx) {
    if (!this.manager || !this.manager.ui) return;

    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#f25438', 4);
    this.manager.ui.drawText('STASH HOUSE CRISIS', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#f25438', align: 'center' });
    this.manager.ui.drawText('POLICE SIRENS APPROACHING IN 2 MINUTES', 640, 210, { font: 'JetBrains Mono', size: '14px', color: '#ffcd68', align: 'center' });

    const options = [
      { key: '[ 1 ] RELOCATE STASH', text: 'Move goods to secondary basement. Trust +20, Heat +10.' },
      { key: '[ 2 ] BURN THE EVIDENCE', text: 'Light it up. Zero evidence left. Heat -20, Trust -10.' }
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
  module.exports = { StashHouse };
}
if (typeof window !== 'undefined') {
  window.StashHouse = StashHouse;
}
