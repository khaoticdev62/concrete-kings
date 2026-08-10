/**
 * Concrete Kings: The Block Chronicles
 * Studio Session Mini-Game
 *
 * Help local artist record a track. Wit checks & mixing choices.
 */

let StudioSessionBaseClass;
if (typeof require !== 'undefined') {
  StudioSessionBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  StudioSessionBaseClass = window.MiniGame;
} else {
  StudioSessionBaseClass = class {};
}

class StudioSession extends StudioSessionBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'studio_session';
    this.name = 'Studio Session';
    this.description = 'Engineer the mix! Balance vocals and bass EQ levels.';
    this.controls = '1: BUMP BASS | 2: AUTOTUNE VOCALS | 3: DISS MIX';
    this.durationSeconds = 25;
    this.resultNarrative = '';
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'confirm' || action === 'action1') this.chooseOption('BASS');
    if (action === 'action2') this.chooseOption('AUTOTUNE');
    if (action === 'up') this.chooseOption('DISS');
  }

  chooseOption(choice) {
    if (this.state !== 'play') return;
    this.victory = true;
    this.isFinished = true;
    this.state = 'complete';

    if (choice === 'BASS') {
      this.resultNarrative = 'Heavy club mix finished! Artist Loyalty +25, Street Cred +15.';
      if (this.gameState) {
        this.gameState.streetCred += 15;
        this.gameState.reputation += 10;
      }
    } else if (choice === 'AUTOTUNE') {
      this.resultNarrative = 'Radio-ready melodic hit! Reputation +30, Cash +$100.';
      if (this.gameState) {
        this.gameState.cash += 100;
        this.gameState.reputation += 30;
      }
    } else {
      this.resultNarrative = 'Scathing diss track recorded! Diss Risk High, Heat +15, Rep +40.';
      if (this.gameState) {
        this.gameState.reputation += 40;
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

    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#6fe8d8', 4);
    this.manager.ui.drawText('STUDIO RECORDING SESSION', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#6fe8d8', align: 'center' });
    this.manager.ui.drawText('MIXING CONSOLE ACTIVE — SELECT MASTER DIRECTION:', 640, 210, { font: 'JetBrains Mono', size: '13px', color: '#ffcd68', align: 'center' });

    const options = [
      { key: '[ 1 ] BUMP BASS', text: 'Club mix. Artist Loyalty +25, Cred +15.' },
      { key: '[ 2 ] AUTOTUNE VOCALS', text: 'Radio crossover hit. Rep +30, Cash +$100.' },
      { key: '[ 3 ] DISS MIX', text: 'Raw street diss. Rep +40, Heat +15.' }
    ];

    options.forEach((opt, i) => {
      const y = 260 + (i * 90);
      this.manager.ui.drawRetroBox(280, y, 720, 70, '#151821', '#339488', 2);
      this.manager.ui.drawText(opt.key, 300, y + 16, { font: 'Press Start 2P', size: '10px', color: '#6fe8d8' });
      this.manager.ui.drawText(opt.text, 300, y + 42, { font: 'JetBrains Mono', size: '12px', color: '#cbd5ed' });
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StudioSession };
}
if (typeof window !== 'undefined') {
  window.StudioSession = StudioSession;
}
