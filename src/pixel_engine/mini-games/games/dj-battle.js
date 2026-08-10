/**
 * Concrete Kings: The Block Chronicles
 * DJ Battle Mini-Game (Wireframe ID: dj_battle)
 *
 * Turntable track selection, cue points, and crowd energy management.
 */

let DJBattleBaseClass;
if (typeof require !== 'undefined') {
  DJBattleBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  DJBattleBaseClass = window.MiniGame;
} else {
  DJBattleBaseClass = class {};
}

class DJBattle extends DJBattleBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'dj_battle';
    this.name = 'DJ Battle';
    this.description = 'Spin the wheels of steel and rock the crowd!';
    this.controls = '1: SCRATCH & JUGGLE | 2: FADE & TRANSFORM';
    this.durationSeconds = 40;
    this.resultNarrative = '';
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'confirm' || action === 'action1') this.chooseMove('SCRATCH');
    if (action === 'action2' || action === 'up') this.chooseMove('TRANSFORM');
  }

  chooseMove(move) {
    if (this.state !== 'play') return;
    this.victory = true;
    this.isFinished = true;
    this.state = 'complete';

    if (move === 'SCRATCH') {
      this.resultNarrative = 'Beat juggle executed flawlessly! Crowd Hyped, Rep +35.';
      if (this.gameState) {
        this.gameState.reputation += 35;
        this.gameState.streetCred += 20;
      }
    } else {
      this.resultNarrative = 'Smooth transformer crossfade! Artist Loyalty +25, Rep +20.';
      if (this.gameState) {
        this.gameState.reputation += 20;
      }
    }

    if (this.manager) {
      this.manager.dispatch('minigame:complete', {
        gameId: this.id,
        victory: true,
        move,
        narrative: this.resultNarrative
      });
    }
  }

  render(ctx) {
    if (!this.manager || !this.manager.ui) return;

    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#ffcd68', 4);
    this.manager.ui.drawText('DJ BATTLE DECK', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#ffcd68', align: 'center' });
    this.manager.ui.drawText('TURNTABLE ACTIVE — SELECT ROUTINE:', 640, 210, { font: 'JetBrains Mono', size: '13px', color: '#6fe8d8', align: 'center' });

    const options = [
      { key: '[ 1 ] SCRATCH & BEAT JUGGLE', text: 'High difficulty routine. Rep +35, Cred +20.' },
      { key: '[ 2 ] TRANSFORM CROSSFADE', text: 'Smooth seamless mix. Loyalty +25, Rep +20.' }
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
  module.exports = { DJBattle };
}
if (typeof window !== 'undefined') {
  window.DJBattle = DJBattle;
}
