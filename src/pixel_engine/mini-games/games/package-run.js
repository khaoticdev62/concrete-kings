/**
 * Concrete Kings: The Block Chronicles
 * Package Run Mini-Game
 *
 * Timed route navigation through territory while avoiding police heat and rival blocks.
 */

let PackageRunBaseClass;
if (typeof require !== 'undefined') {
  PackageRunBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  PackageRunBaseClass = window.MiniGame;
} else {
  PackageRunBaseClass = class {};
}

class PackageRun extends PackageRunBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'package_run';
    this.name = 'Package Run';
    this.description = 'Deliver the package before heat catches up! Choose safe routes.';
    this.controls = '← / → : CHOOSE ROUTE';
    this.durationSeconds = 25;

    this.distance = 0; // 0 to 100
    this.heat = 20;
    this.timer = 15; // seconds
    this.resultNarrative = '';
  }

  init(params) {
    super.init(params);
    this.distance = 0;
    this.heat = 20;
    this.timer = 15;
  }

  start() {
    super.start();
    this.distance = 0;
    this.heat = 20;
    this.timer = 15;
  }

  update(dt) {
    if (this.state === 'play') {
      super.update(dt);
      this.timer -= (dt / 1000);
      if (this.timer <= 0) {
        this.finishRun(false);
      }
    }
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'left' || action === 'action1') {
      // Safe route: slower, lower heat
      this.distance += 25;
      this.heat = Math.max(0, this.heat - 5);
      this.checkCompletion();
    } else if (action === 'right' || action === 'action2') {
      // Fast route: faster, higher heat
      this.distance += 40;
      this.heat += 15;
      this.checkCompletion();
    }
  }

  checkCompletion() {
    if (this.distance >= 100) {
      this.finishRun(true);
    } else if (this.heat >= 100) {
      this.finishRun(false);
    }
  }

  finishRun(success) {
    this.victory = success;
    this.isFinished = true;
    this.state = 'complete';

    if (this.victory) {
      this.resultNarrative = `Package delivered safely! Cash +$100, Street Cred +15.`;
      if (this.gameState) {
        this.gameState.cash += 100;
        this.gameState.streetCred += 15;
      }
    } else {
      this.resultNarrative = `The drop was intercepted or timed out! Heat +20.`;
      if (this.gameState) {
        this.gameState.heat += 20;
      }
    }

    if (this.manager) {
      this.manager.dispatch('minigame:complete', {
        gameId: this.id,
        victory: this.victory,
        distance: this.distance,
        heat: this.heat,
        narrative: this.resultNarrative
      });
    }
  }

  render(ctx) {
    if (!this.manager || !this.manager.ui) return;

    // Background panel
    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#339488', 4);

    // Header
    this.manager.ui.drawText('PACKAGE RUN', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#6fe8d8', align: 'center' });

    // Meters
    this.manager.ui.drawText(`DELIVERY DISTANCE: ${Math.min(100, this.distance)}%`, 300, 220, { font: 'Press Start 2P', size: '10px', color: '#6fe8d8' });
    this.manager.ui.drawTimerBar(300, 240, 680, 20, Math.min(1, this.distance / 100), { color: '#6fe8d8', bg: '#151821', border: '#339488' });

    this.manager.ui.drawText(`HEAT LEVEL: ${this.heat}%`, 300, 280, { font: 'Press Start 2P', size: '10px', color: '#f25438' });
    this.manager.ui.drawTimerBar(300, 300, 680, 20, Math.min(1, this.heat / 100), { color: '#f25438', bg: '#151821', border: '#7a1d1c' });

    // Options
    this.manager.ui.drawRetroBox(300, 360, 320, 140, '#151821', '#339488', 2);
    this.manager.ui.drawText('[ ← ] ALLEY ROUTE', 460, 390, { font: 'Press Start 2P', size: '10px', color: '#6fe8d8', align: 'center' });
    this.manager.ui.drawText('Safe & Steady', 460, 420, { font: 'JetBrains Mono', size: '12px', color: '#cbd5ed', align: 'center' });
    this.manager.ui.drawText('Heat -5 | Dist +25%', 460, 450, { font: 'JetBrains Mono', size: '10px', color: '#8b95ab', align: 'center' });

    this.manager.ui.drawRetroBox(660, 360, 320, 140, '#151821', '#f25438', 2);
    this.manager.ui.drawText('[ → ] MAIN AVENUE', 820, 390, { font: 'Press Start 2P', size: '10px', color: '#f25438', align: 'center' });
    this.manager.ui.drawText('Fast & High Risk', 820, 420, { font: 'JetBrains Mono', size: '12px', color: '#cbd5ed', align: 'center' });
    this.manager.ui.drawText('Heat +15 | Dist +40%', 820, 450, { font: 'JetBrains Mono', size: '10px', color: '#8b95ab', align: 'center' });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PackageRun };
}
if (typeof window !== 'undefined') {
  window.PackageRun = PackageRun;
}
