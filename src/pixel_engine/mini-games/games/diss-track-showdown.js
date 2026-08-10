/**
 * Concrete Kings: The Block Chronicles
 * Diss Track Showdown Mini-Game
 *
 * Choose punchlines against rival NPCs for immediate heat/rep shifts and delayed response tracks.
 */

let DissTrackBaseClass;
if (typeof require !== 'undefined') {
  DissTrackBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  DissTrackBaseClass = window.MiniGame;
} else {
  DissTrackBaseClass = class {};
}

const PUNCHLINES = [
  { text: '"Your hairline retired before you did!"', type: 'ROAST', rep: 30, heat: 5, meme: 'HAIRLINE MEME' },
  { text: '"You bought that chain on layaway at the bodega!"', type: 'FINANCE', rep: 20, heat: 0, meme: 'BODEGA CHAIN' },
  { text: '"I saw your cousin return your shoes to pay rent!"', type: 'PERSONAL', rep: 40, heat: 15, meme: 'SHOES RETURNED' }
];

class DissTrackShowdown extends DissTrackBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'diss_track_showdown';
    this.name = 'Diss Track Showdown';
    this.description = 'Select the ultimate punchline to roast your rival on the block!';
    this.controls = '1/2/3 OR CLICK: CHOOSE PUNCHLINE';
    this.durationSeconds = 25;

    this.selectedLine = null;
    this.resultNarrative = '';
  }

  init(params) {
    super.init(params);
    this.selectedLine = null;
  }

  start() {
    super.start();
    this.selectedLine = null;
  }

  selectPunchline(idx) {
    if (this.state !== 'play') return;
    const line = PUNCHLINES[idx];
    if (!line) return;

    this.selectedLine = line;
    this.victory = true;
    this.isFinished = true;
    this.state = 'complete';

    this.resultNarrative = `You dropped: ${line.text} Block Meme: ${line.meme}! Rep +${line.rep}, Heat +${line.heat}.`;

    if (this.gameState) {
      this.gameState.reputation += line.rep;
      this.gameState.heat += line.heat;
    }

    if (this.manager) {
      this.manager.dispatch('minigame:complete', {
        gameId: this.id,
        victory: true,
        punchline: line.text,
        meme: line.meme,
        narrative: this.resultNarrative
      });
    }
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'action1' || action === 'confirm') this.selectPunchline(0);
    if (action === 'action2') this.selectPunchline(1);
    if (action === 'up') this.selectPunchline(2);
  }

  render(ctx) {
    if (!this.manager || !this.manager.ui) return;

    // Background panel
    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#f25438', 4);

    // Header
    this.manager.ui.drawText('DISS TRACK SHOWDOWN', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#f25438', align: 'center' });
    this.manager.ui.drawText('CHOOSE YOUR PUNCHLINE:', 640, 210, { font: 'Press Start 2P', size: '11px', color: '#ffcd68', align: 'center' });

    // Render 3 Punchline Cards
    PUNCHLINES.forEach((line, i) => {
      const y = 260 + (i * 90);
      this.manager.ui.drawRetroBox(280, y, 720, 70, '#151821', '#339488', 2);
      this.manager.ui.drawText(`[ ${i + 1} ] ${line.text}`, 300, y + 16, { font: 'JetBrains Mono', size: '14px', color: '#cbd5ed' });
      this.manager.ui.drawText(`TYPE: ${line.type} | REP: +${line.rep} | HEAT: +${line.heat}`, 300, y + 42, { font: 'Press Start 2P', size: '8px', color: '#6fe8d8' });
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DissTrackShowdown, PUNCHLINES };
}
if (typeof window !== 'undefined') {
  window.DissTrackShowdown = DissTrackShowdown;
}
