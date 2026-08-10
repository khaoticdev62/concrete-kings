/**
 * Concrete Kings: The Block Chronicles
 * Freestyle Cipher Mini-Game
 *
 * 3-round rap battle using card submission rhythm & wit/soul/str stats.
 */

let FreestyleCipherBaseClass;
if (typeof require !== 'undefined') {
  FreestyleCipherBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  FreestyleCipherBaseClass = window.MiniGame;
} else {
  FreestyleCipherBaseClass = class {};
}

class FreestyleCipher extends FreestyleCipherBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'freestyle_cipher';
    this.name = 'Freestyle Cipher';
    this.description = '3-round rap battle! Match the beat rhythm to earn crowd respect.';
    this.controls = 'SPACE / CLICK: DROP BARS';
    this.durationSeconds = 30;

    this.round = 1;
    this.totalRounds = 3;
    this.crowdHeat = 50; // 0 to 100
    this.barTiming = 0;
    this.targetZone = { start: 0.4, end: 0.6 };
    this.score = 0;
    this.resultNarrative = '';
  }

  init(params) {
    super.init(params);
    this.round = 1;
    this.crowdHeat = 50;
    this.score = 0;
    this.barTiming = 0;
  }

  start() {
    super.start();
    this.round = 1;
    this.crowdHeat = 50;
    this.score = 0;
  }

  update(dt) {
    if (this.state === 'play') {
      super.update(dt);
      this.barTiming += (dt / 1000) * 0.8;
      if (this.barTiming > 1) {
        this.barTiming = 0;
      }
    }
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'confirm' || action === 'action1') {
      // Check timing
      if (this.barTiming >= this.targetZone.start && this.barTiming <= this.targetZone.end) {
        this.crowdHeat = Math.min(100, this.crowdHeat + 20);
        this.score += 100;
      } else {
        this.crowdHeat = Math.max(0, this.crowdHeat - 15);
      }

      this.round += 1;
      this.barTiming = 0;

      if (this.round > this.totalRounds) {
        this.finishBattle();
      }
    }
  }

  finishBattle() {
    this.victory = this.crowdHeat >= 50;
    this.isFinished = true;
    this.state = 'complete';

    if (this.victory) {
      this.resultNarrative = `The cipher erupted! Crowd heat reached ${this.crowdHeat}%. Street Rep +25.`;
      if (this.gameState) {
        this.gameState.reputation += 25;
        this.gameState.streetCred += 10;
      }
    } else {
      this.resultNarrative = `The crowd choked your line. Heat dropped to ${this.crowdHeat}%.`;
      if (this.gameState) {
        this.gameState.reputation = Math.max(0, this.gameState.reputation - 10);
      }
    }

    if (this.manager) {
      this.manager.dispatch('minigame:complete', {
        gameId: this.id,
        victory: this.victory,
        score: this.score,
        crowdHeat: this.crowdHeat,
        narrative: this.resultNarrative
      });
    }
  }

  render(ctx) {
    if (!this.manager || !this.manager.ui) return;

    // Background panel
    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#ffcd68', 4);

    // Cipher Header
    this.manager.ui.drawText(`ROUND ${Math.min(this.round, 3)} / 3: FREESTYLE CIPHER`, 640, 170, { font: 'Press Start 2P', size: '16px', color: '#ffcd68', align: 'center' });

    // Crowd Heat Meter
    this.manager.ui.drawText(`CROWD HEAT: ${this.crowdHeat}%`, 640, 220, { font: 'Press Start 2P', size: '12px', color: '#6fe8d8', align: 'center' });
    this.manager.ui.drawTimerBar(340, 245, 600, 24, this.crowdHeat / 100, { color: '#6fe8d8', bg: '#151821', border: '#339488' });

    // Rhythm Timing Bar
    this.manager.ui.drawText('MATCH THE BEAT (PRESS SPACE / CLICK IN GREEN ZONE)', 640, 320, { font: 'Press Start 2P', size: '9px', color: '#cbd5ed', align: 'center' });
    this.manager.ui.drawRetroBox(340, 350, 600, 40, '#151821', '#2d313d', 2);

    // Target zone
    const targetX = 340 + (600 * this.targetZone.start);
    const targetW = 600 * (this.targetZone.end - this.targetZone.start);
    ctx.fillStyle = 'rgba(111, 232, 216, 0.4)';
    ctx.fillRect(targetX, 352, targetW, 36);

    // Moving indicator
    const curX = 340 + (600 * this.barTiming);
    ctx.fillStyle = '#ffcd68';
    ctx.fillRect(curX - 4, 346, 8, 48);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FreestyleCipher };
}
if (typeof window !== 'undefined') {
  window.FreestyleCipher = FreestyleCipher;
}
