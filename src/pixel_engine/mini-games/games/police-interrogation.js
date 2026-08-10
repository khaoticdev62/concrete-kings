/**
 * Concrete Kings: The Block Chronicles
 * Police Interrogation Mini-Game (Wireframe ID: police_interrogation)
 *
 * Manage detective stress, choose statement tactics, reduce charges or flip case with secrets.
 */

let InterrogationBaseClass;
if (typeof require !== 'undefined') {
  InterrogationBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  InterrogationBaseClass = window.MiniGame;
} else {
  InterrogationBaseClass = class {};
}

class PoliceInterrogation extends InterrogationBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'police_interrogation';
    this.name = 'Police Interrogation';
    this.description = 'Hold your ground under pressure! Manage detective suspicion.';
    this.controls = '1: STICK TO ALIBI | 2: USE SECRET RECEIPT';
    this.durationSeconds = 35;
    this.resultNarrative = '';
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'confirm' || action === 'action1') this.chooseTactic('ALIBI');
    if (action === 'action2' || action === 'up') this.chooseTactic('RECEIPT');
  }

  chooseTactic(tactic) {
    if (this.state !== 'play') return;
    this.victory = true;
    this.isFinished = true;
    this.state = 'complete';

    if (tactic === 'ALIBI') {
      this.resultNarrative = 'Alibi held up! Charges dropped, Heat -15.';
      if (this.gameState) {
        this.gameState.heat = Math.max(0, this.gameState.heat - 15);
      }
    } else {
      this.resultNarrative = 'Secret receipt exposed Marquez corrupt ties! Heat -30, Rep +40.';
      if (this.gameState) {
        this.gameState.heat = Math.max(0, this.gameState.heat - 30);
        this.gameState.reputation += 40;
      }
    }

    if (this.manager) {
      this.manager.dispatch('minigame:complete', {
        gameId: this.id,
        victory: true,
        tactic,
        narrative: this.resultNarrative
      });
    }
  }

  render(ctx) {
    if (!this.manager || !this.manager.ui) return;

    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#f25438', 4);
    this.manager.ui.drawText('PRECINCT INTERROGATION ROOM', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#f25438', align: 'center' });
    this.manager.ui.drawText('DETECTIVE DETAILED ACCUSATION — CHOOSE RESPONSE:', 640, 210, { font: 'JetBrains Mono', size: '12px', color: '#ffcd68', align: 'center' });

    const options = [
      { key: '[ 1 ] STICK TO ALIBI', text: 'Maintain strict silence on key details. Charges dropped, Heat -15.' },
      { key: '[ 2 ] FLIP WITH SECRET RECEIPT', text: 'Expose corrupt ties. Heat -30, Rep +40.' }
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
  module.exports = { PoliceInterrogation };
}
if (typeof window !== 'undefined') {
  window.PoliceInterrogation = PoliceInterrogation;
}
