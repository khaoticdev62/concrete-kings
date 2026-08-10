/**
 * Concrete Kings: The Block Chronicles
 * Block Territory Mini-Game
 *
 * Node-connection map mini-game revealing who controls street locations.
 */

let BlockTerritoryBaseClass;
if (typeof require !== 'undefined') {
  BlockTerritoryBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  BlockTerritoryBaseClass = window.MiniGame;
} else {
  BlockTerritoryBaseClass = class {};
}

class BlockTerritory extends BlockTerritoryBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'block_territory';
    this.name = 'Block Territory';
    this.description = 'Map out territory control nodes across 125th Street!';
    this.controls = '1: BARBERSHOP NODE | 2: BODEGA NODE | 3: BOOTLEG DVD NODE';
    this.durationSeconds = 25;
    this.resultNarrative = '';
  }

  handleInput(action) {
    if (this.state !== 'play') return;
    if (action === 'confirm' || action === 'action1') this.chooseNode('BARBERSHOP');
    if (action === 'action2') this.chooseNode('BODEGA');
    if (action === 'up') this.chooseNode('BOOTLEG');
  }

  chooseNode(nodeType) {
    if (this.state !== 'play') return;
    this.victory = true;
    this.isFinished = true;
    this.state = 'complete';

    if (nodeType === 'BARBERSHOP') {
      this.resultNarrative = 'Barbershop node secured! Ray Trust +1, Block Cred +20.';
      if (this.gameState) {
        this.gameState.streetCred += 20;
      }
    } else if (nodeType === 'BODEGA') {
      this.resultNarrative = 'Bodega supply line secured! Cash +$80, Chen Trust +1.';
      if (this.gameState) {
        this.gameState.cash += 80;
      }
    } else {
      this.resultNarrative = 'Bootleg DVD node tapped! Meme Unlocked: "Uncle Panther 4K", Cash +$120, Heat +5.';
      if (this.gameState) {
        this.gameState.cash += 120;
        this.gameState.heat += 5;
      }
    }

    if (this.manager) {
      this.manager.dispatch('minigame:complete', {
        gameId: this.id,
        victory: true,
        nodeType,
        narrative: this.resultNarrative
      });
    }
  }

  render(ctx) {
    if (!this.manager || !this.manager.ui) return;

    this.manager.ui.drawRetroBox(240, 140, 800, 440, '#101116', '#ffcd68', 4);
    this.manager.ui.drawText('BLOCK TERRITORY CONTROL MAP', 640, 170, { font: 'Press Start 2P', size: '18px', color: '#ffcd68', align: 'center' });
    this.manager.ui.drawText('SELECT TERRITORY NODE TO SECURE:', 640, 210, { font: 'JetBrains Mono', size: '13px', color: '#6fe8d8', align: 'center' });

    const options = [
      { key: '[ 1 ] BARBERSHOP NODE', text: 'Ray’s Sanctuary. Trust +1, Cred +20.' },
      { key: '[ 2 ] BODEGA NODE', text: 'Mr. Chen’s Supply Hub. Cash +$80.' },
      { key: '[ 3 ] BOOTLEG DVD NODE', text: 'Uncle Panther 4K Hustle. Cash +$120, Heat +5.' }
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
  module.exports = { BlockTerritory };
}
if (typeof window !== 'undefined') {
  window.BlockTerritory = BlockTerritory;
}
