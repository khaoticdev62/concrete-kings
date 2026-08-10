/**
 * Concrete Kings: The Block Chronicles
 * Sample Clearance Mini-Game
 *
 * Find vinyl/tape samples, choose whether to clear, alter, or risk them.
 */

let SampleClearanceBaseClass;
if (typeof require !== 'undefined') {
  SampleClearanceBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  SampleClearanceBaseClass = window.MiniGame;
} else {
  SampleClearanceBaseClass = class {};
}

class SampleClearance extends SampleClearanceBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'sample_clearance';
    this.name = 'Sample Clearance';
    this.description = 'Flip the sample! Choose how to handle the original vinyl.';
    this.controls = '1: CLEAR (LEGAL) | 2: CHOP & ALTER | 3: RISK IT (BOOTLEG)';
    this.durationSeconds = 25;
    this.resultNarrative = '';
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'confirm' || action === 'action1') this.chooseOption('CLEAR');
    if (action === 'action2') this.chooseOption('ALTER');
    if (action === 'up') this.chooseOption('RISK');
  }

  chooseOption(choice) {
    if (this.state !== 'play') return;
    this.victory = true;
    this.isFinished = true;
    this.state = 'complete';

    if (choice === 'CLEAR') {
      this.resultNarrative = 'Sample cleared legally! Cash -$50, Reputation +30.';
      if (this.gameState) {
        this.gameState.cash = Math.max(0, this.gameState.cash - 50);
        this.gameState.reputation += 30;
      }
    } else if (choice === 'ALTER') {
      this.resultNarrative = 'Chopped & flipped! Reputation +20, Zero Heat.';
      if (this.gameState) {
        this.gameState.reputation += 20;
      }
    } else {
      this.resultNarrative = 'Bootleg dropped! Cash +$150, Heat +15.';
      if (this.gameState) {
        this.gameState.cash += 150;
        this.gameState.heat += 15;
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

    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#ffcd68', 4);
    this.manager.ui.drawText('SAMPLE CLEARANCE', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#ffcd68', align: 'center' });
    this.manager.ui.drawText('VINYL SAMPLE DISCOVERED: "1978 SOUL BREAK"', 640, 210, { font: 'JetBrains Mono', size: '14px', color: '#6fe8d8', align: 'center' });

    const options = [
      { key: '[ 1 ] CLEAR (LEGAL)', text: 'Pay clearance fee. Cash -$50, Rep +30.' },
      { key: '[ 2 ] CHOP & ALTER', text: 'Filter & speed up. Rep +20, Zero Heat.' },
      { key: '[ 3 ] RISK IT (BOOTLEG)', text: 'Drop uncleared. Cash +$150, Heat +15.' }
    ];

    options.forEach((opt, i) => {
      const y = 260 + (i * 90);
      this.manager.ui.drawRetroBox(280, y, 720, 70, '#151821', '#339488', 2);
      this.manager.ui.drawText(opt.key, 300, y + 16, { font: 'Press Start 2P', size: '10px', color: '#ffcd68' });
      this.manager.ui.drawText(opt.text, 300, y + 42, { font: 'JetBrains Mono', size: '12px', color: '#cbd5ed' });
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SampleClearance };
}
if (typeof window !== 'undefined') {
  window.SampleClearance = SampleClearance;
}
