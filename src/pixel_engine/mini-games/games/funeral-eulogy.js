/**
 * Concrete Kings: The Block Chronicles
 * Funeral Eulogy Mini-Game
 *
 * Choose street eulogy vs church eulogy, balancing gang respect and community trust.
 */

let FuneralEulogyBaseClass;
if (typeof require !== 'undefined') {
  FuneralEulogyBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  FuneralEulogyBaseClass = window.MiniGame;
} else {
  FuneralEulogyBaseClass = class {};
}

class FuneralEulogy extends FuneralEulogyBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'funeral_eulogy';
    this.name = 'Funeral Eulogy';
    this.description = 'Honor the fallen legend. Choose your eulogy tone.';
    this.controls = '1: STREET EULOGY | 2: CHURCH EULOGY';
    this.durationSeconds = 25;
    this.resultNarrative = '';
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'confirm' || action === 'action1') this.chooseOption('STREET');
    if (action === 'action2' || action === 'up') this.chooseOption('CHURCH');
  }

  chooseOption(choice) {
    if (this.state !== 'play') return;
    this.victory = true;
    this.isFinished = true;
    this.state = 'complete';

    if (choice === 'STREET') {
      this.resultNarrative = 'Raw street eulogy delivered! Gang Respect +30, Heat +5.';
      if (this.gameState) {
        this.gameState.reputation += 30;
        this.gameState.heat += 5;
      }
    } else {
      this.resultNarrative = 'Solemn church eulogy delivered! Community Trust +30, Heat -10.';
      if (this.gameState) {
        this.gameState.reputation += 20;
        this.gameState.heat = Math.max(0, this.gameState.heat - 10);
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

    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#cbd5ed', 4);
    this.manager.ui.drawText('HARLEM MEMORIAL SERVICE', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#cbd5ed', align: 'center' });
    this.manager.ui.drawText('CHOOSE YOUR SPEECH AT THE PULPIT:', 640, 210, { font: 'JetBrains Mono', size: '13px', color: '#ffcd68', align: 'center' });

    const options = [
      { key: '[ 1 ] STREET EULOGY', text: 'Honor their code and street legacy. Gang Respect +30, Heat +5.' },
      { key: '[ 2 ] CHURCH EULOGY', text: 'Focus on peace and community healing. Community Trust +30, Heat -10.' }
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
  module.exports = { FuneralEulogy };
}
if (typeof window !== 'undefined') {
  window.FuneralEulogy = FuneralEulogy;
}
