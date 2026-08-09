/**
 * Concrete Kings: The Block Chronicles
 * Street Dice Mini-Game
 */

let StreetDiceBaseClass;
if (typeof require !== 'undefined') {
  StreetDiceBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  StreetDiceBaseClass = window.MiniGame;
} else {
  // Safe mock fallback for class declaration parsing
  StreetDiceBaseClass = class {};
}

class StreetDice extends StreetDiceBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'street_dice';
    this.name = 'Street Dice';
    this.description = 'Roll high. Win cash. Keep respect.';
    this.triggers = ['map_corner', 'npc_tbone'];
    this.difficulty = 'medium';
    this.durationSeconds = 30;
    
    // Dice specific states
    this.roll1 = null;
    this.roll2 = null;
    this.opponentRoll1 = null;
    this.opponentRoll2 = null;
    
    this.rollSum = null;
    this.opponentRollSum = null;
    
    this.rollTimeMax = 1500; // 1.5 seconds roll animation
    this.rollTimeElapsed = 0;
    
    this.witModifier = 5; // Default WIT stat
    this.dc = 12; // Difficulty Class
    this.stake = 20; // Cash/StreetCred stake
    
    this.result = null;
    this.displayMessage = '';
  }

  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.dc = params.dc || 12;

    // Retrieve WIT stat from player origin if available
    this.witModifier = (this.gameState && this.gameState.wit) || 0;

    if (params.prepItemBonus) this.witModifier += 3;
  }

  start() {
    super.start();
    this.roll1 = null;
    this.roll2 = null;
    this.opponentRoll1 = null;
    this.opponentRoll2 = null;
    this.rollSum = null;
    this.opponentRollSum = null;
    this.rollTimeElapsed = 0;
    this.result = null;
    this.displayMessage = 'Press ENTER to roll the dice!';
  }

  update(dt) {
    if (this.state === 'play') {
      super.update(dt);
      
      // If dice are rolling, accumulate time
      if (this.rollTimeElapsed > 0) {
        this.rollTimeElapsed = Math.min(this.rollTimeMax, this.rollTimeElapsed + dt);
        if (this.rollTimeElapsed >= this.rollTimeMax) {
          this.finishRoll();
        }
      }
    }
  }

  render(ctx) {
    // Clear virtual canvas bounds
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw dark green pool table felt as background area
    // Center card-box layout: 700x380 centered at (290, 150)
    if (this.manager && this.manager.ui) {
      this.manager.ui.drawRetroBox(290, 150, 700, 380, '#174540', '#2d313d', 4);
      
      // Draw felt shadow lines/accents
      ctx.strokeStyle = '#246961';
      ctx.lineWidth = 2;
      ctx.strokeRect(300, 160, 680, 360);

      // Title & stake
      this.manager.ui.drawText('STREET DICE CORNER', 640, 180, { font: 'Press Start 2P', size: '18px', color: '#ffcd68', align: 'center' });
      this.manager.ui.drawText(`Stake: $${this.stake} | DC: ${this.dc} | WIT Bonus: +${this.witModifier}`, 640, 215, { font: 'VT323', size: '22px', color: '#85c4ff', align: 'center' });

      // If in lobby, show prompt
      if (this.state === 'lobby') {
        this.manager.ui.drawText('STREET RULES:', 340, 270, { font: 'Press Start 2P', size: '10px', color: '#ffcd68' });
        this.manager.ui.drawText('- You roll 2d10 and add your WIT modifier.', 340, 300, { font: 'VT323', size: '20px', color: '#cbd5ed' });
        this.manager.ui.drawText(`- Beat T-Bone\'s roll sum to win the $${this.stake} stake.`, 340, 330, { font: 'VT323', size: '20px', color: '#cbd5ed' });
        this.manager.ui.drawText('- Lose, and T-Bone mocks you and takes your cash.', 340, 360, { font: 'VT323', size: '20px', color: '#cbd5ed' });
        
        this.manager.ui.drawText('[ PRESS ENTER TO START ]', 640, 440, { font: 'Press Start 2P', size: '12px', color: '#6fe8d8', align: 'center' });
      }

      // If active play / rolling / resolved
      if (this.state === 'play' || this.state === 'resolve' || this.state === 'reward') {
        // Draw player partition
        this.manager.ui.drawText('YOUR HAND', 450, 260, { font: 'Press Start 2P', size: '10px', color: '#ffc475', align: 'center' });
        this.drawDiceFrame(ctx, 410, 290, this.roll1, this.roll2, 'player');

        // Draw T-Bone partition
        this.manager.ui.drawText("T-BONE\'S HAND", 830, 260, { font: 'Press Start 2P', size: '10px', color: '#d9382e', align: 'center' });
        this.drawDiceFrame(ctx, 790, 290, this.opponentRoll1, this.opponentRoll2, 'opponent');

        // Draw status or result banner
        this.manager.ui.drawText(this.displayMessage, 640, 435, { font: 'VT323', size: '24px', color: '#f4f7ff', align: 'center' });

        if (this.state === 'reward') {
          this.manager.ui.drawText('[ PRESS ENTER TO EXIT ]', 640, 480, { font: 'Press Start 2P', size: '10px', color: '#6fe8d8', align: 'center' });
        } else if (this.state === 'play' && this.rollTimeElapsed === 0) {
          this.manager.ui.drawText('[ PRESS SPACE TO ROLL ]', 640, 480, { font: 'Press Start 2P', size: '10px', color: '#ffcd68', align: 'center' });
        }
      }
    }
  }

  drawDiceFrame(ctx, x, y, r1, r2, side) {
    const isRolling = this.rollTimeElapsed > 0 && this.rollTimeElapsed < this.rollTimeMax;
    
    // Standard dice plate box dimensions: 80x80 each
    const drawDie = (dx, dy, value) => {
      // 4-frame animation logic for rolling
      let displayVal = value;
      if (isRolling) {
        // Shuffle random values 1 to 10
        displayVal = Math.floor(Math.random() * 10) + 1;
        // Apply slight offset bobbing
        const offsets = [-2, 0, 2, -1];
        const bob = offsets[this.frameIndex];
        dx += bob;
        dy += bob;
      }

      // Draw die base plate
      ctx.fillStyle = '#f4f7ff';
      ctx.strokeStyle = '#2d313d';
      ctx.lineWidth = 3;
      ctx.fillRect(dx, dy, 70, 70);
      ctx.strokeRect(dx, dy, 70, 70);

      // Render die text (number value)
      if (displayVal !== null) {
        ctx.fillStyle = '#101116';
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(displayVal), dx + 35, dy + 35);
      } else {
        ctx.fillStyle = '#666e82';
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', dx + 35, dy + 35);
      }
    };

    drawDie(x, y, r1);
    drawDie(x + 90, y, r2);
  }

  handleInput(action) {
    if (this.state === 'lobby' && action === 'confirm') {
      this.start();
      return;
    }
    
    if (this.state === 'play' && action === 'confirm' && this.rollTimeElapsed === 0) {
      this.triggerRoll();
      return;
    }

    if (this.state === 'reward' && action === 'confirm') {
      this.exitGame();
      return;
    }
  }

  triggerRoll() {
    this.rollTimeElapsed = 1;
    this.displayMessage = 'Tumbling dice...';
    if (this.animator && typeof this.animator.play === 'function') {
      this.animator.play('roll');
    }
    if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
      app.audioEngine.playDiceRoll();
    }
  }

  finishRoll() {
    this.rollTimeElapsed = 0;
    
    // Seed rolls if not already mocked by test
    if (this.roll1 === null || this.roll1 === undefined) this.roll1 = Math.floor(Math.random() * 10) + 1;
    if (this.roll2 === null || this.roll2 === undefined) this.roll2 = Math.floor(Math.random() * 10) + 1;
    
    if (this.opponentRoll1 === null || this.opponentRoll1 === undefined) this.opponentRoll1 = Math.floor(Math.random() * 10) + 1;
    if (this.opponentRoll2 === null || this.opponentRoll2 === undefined) this.opponentRoll2 = Math.floor(Math.random() * 10) + 1;

    this.rollSum = this.roll1 + this.roll2 + this.witModifier;
    this.opponentRollSum = this.opponentRoll1 + this.opponentRoll2;

    const won = this.rollSum >= this.opponentRollSum;
    this.state = 'resolve';

    if (won) {
      this.displayMessage = `You rolled: ${this.roll1}+${this.roll2}+WIT(${this.witModifier}) = ${this.rollSum}! T-Bone: ${this.opponentRollSum}. YOU WIN!`;
      this.result = {
        success: true,
        tier: 'success',
        trustDelta: { general: 1 },
        heatDelta: 0,
        cashDelta: this.stake,
        reputationDelta: 1,
        secretsUnlocked: [],
        flagsSet: [],
        items: [],
        questUpdates: []
      };
    } else {
      this.displayMessage = `You rolled: ${this.roll1}+${this.roll2}+WIT(${this.witModifier}) = ${this.rollSum}. T-Bone: ${this.opponentRollSum}. YOU LOSE!`;
      this.result = {
        success: false,
        tier: 'failure',
        trustDelta: { general: -1 },
        heatDelta: 1,
        cashDelta: -this.stake,
        reputationDelta: -1,
        secretsUnlocked: [],
        flagsSet: [],
        items: [],
        questUpdates: []
      };
    }

    this.state = 'reward';
  }

  exitGame() {
    if (this.result) {
      this.resolve(this.result);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    StreetDice
  };
}

if (typeof window !== 'undefined') {
  window.StreetDice = StreetDice;
}
