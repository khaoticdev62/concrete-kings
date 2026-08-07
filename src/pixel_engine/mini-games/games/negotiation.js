/**
 * Concrete Kings: The Block Chronicles
 * Negotiation Challenge - Social Argument Selection Mini-Game
 */

let BaseGameClass;
if (typeof require !== 'undefined') {
  BaseGameClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  BaseGameClass = window.MiniGame;
} else {
  BaseGameClass = class {};
}

class Negotiation extends BaseGameClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'negotiation';
    this.name = 'Negotiation';
    this.description = 'Select the right arguments to lower Mr. Chens resistance and close the trade deal!';
    this.triggers = ['npc_merchant', 'shop_deal'];
    this.difficulty = 'medium';
    this.durationSeconds = 40;

    // Resistance meter variables
    this.resistance = 100;
    this.maxResistance = 100;
    this.resistanceW = 400;
    this.resistanceH = 16;
    this.resistanceX = 440;
    this.resistanceY = 190;

    // Round configuration
    this.maxRounds = 3;
    this.currentRound = 0;

    // NPC Statements and options per round
    this.roundsData = [
      {
        npcQuote: '"You want this rare mixtape? It cost me a lot to source. No discount!"',
        weakness: 'LOGIC',
        options: [
          { type: 'LOGIC', label: 'Logic', text: '"The demand is low now. Wholesale prices fell 20%."', damage: 45, cost: 0, penalty: 0 },
          { type: 'CHARM', label: 'Charm', text: '"A merchant of your stature doesn\'t sweat small change."', damage: 25, cost: 0, penalty: 0 },
          { type: 'LEVERAGE', label: 'Leverage', text: '"Drop the price or I mention your unlicensed vendor status."', damage: 30, cost: 0, penalty: 1 },
          { type: 'BRIBE', label: 'Bribe', text: '"Let me slip you an extra $5 on the side."', damage: 35, cost: 5, penalty: 0 }
        ]
      },
      {
        npcQuote: '"Mixtapes are gold around here. Everybody wants it. Why should I sell to you?"',
        weakness: 'CHARM',
        options: [
          { type: 'LOGIC', label: 'Logic', text: '"I purchase cards here daily. Customer lifetime value is key."', damage: 20, cost: 0, penalty: 0 },
          { type: 'CHARM', label: 'Charm', text: '"Your shop is the heart of the block. I want to represent you."', damage: 50, cost: 0, penalty: 0 },
          { type: 'LEVERAGE', label: 'Leverage', text: '"Marcus down the block has this mixtape cheaper right now."', damage: 35, cost: 0, penalty: 0 },
          { type: 'BRIBE', label: 'Bribe', text: '"Take this cold soda and $5, call it a transaction fee."', damage: 30, cost: 5, penalty: 0 }
        ]
      },
      {
        npcQuote: '"Still, profit margins are tight. Give me a real reason to drop the price."',
        weakness: 'LEVERAGE',
        options: [
          { type: 'LOGIC', label: 'Logic', text: '"Lower price leads to word-of-mouth promotion for you."', damage: 25, cost: 0, penalty: 0 },
          { type: 'CHARM', label: 'Charm', text: '"You\'ve got the best collection. Let\'s make this fair deal."', damage: 30, cost: 0, penalty: 0 },
          { type: 'LEVERAGE', label: 'Leverage', text: '"I know about the card stock you bought off-book last week."', damage: 55, cost: 0, penalty: 2 },
          { type: 'BRIBE', label: 'Bribe', text: '"Here is $10 cash on top, let\'s seal the deal."', damage: 45, cost: 10, penalty: 0 }
        ]
      }
    ];

    this.selectedOptionIdx = 0;
    
    this.displayMessage = 'Choose the best argument type! Use Left/Right and SPACE.';
    this.feedbackMessage = '';
    this.feedbackTimer = 0;
    this.feedbackColor = '#f4f7ff';

    this.stake = 20;
    this.victory = false;
    this.result = null;
  }

  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.difficulty = params.difficulty || 'medium';

    if (this.difficulty === 'easy') {
      this.resistance = 80;
      this.maxResistance = 80;
      this.durationSeconds = 50;
    } else if (this.difficulty === 'hard') {
      this.resistance = 120;
      this.maxResistance = 120;
      this.durationSeconds = 30;
    } else {
      this.resistance = 100;
      this.maxResistance = 100;
      this.durationSeconds = 40;
    }
  }

  start() {
    super.start();
    this.currentRound = 0;
    this.selectedOptionIdx = 0;
    this.victory = false;
    this.displayMessage = 'Choose the best argument type! Use Left/Right and SPACE.';
    this.feedbackMessage = '';
    this.feedbackTimer = 0;

    // Reset resistance to start max values
    this.resistance = this.maxResistance;
  }

  update(dt) {
    if (this.state === 'play') {
      super.update(dt);

      if (this.feedbackTimer > 0) {
        this.feedbackTimer = Math.max(0, this.feedbackTimer - dt);
        if (this.feedbackTimer === 0) {
          this.feedbackMessage = '';
        }
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.manager && this.manager.ui) {
      // Draw background layout border box
      this.manager.ui.drawRetroBox(240, 100, 800, 520, '#101116', '#2d313d', 4);

      // Title header
      this.manager.ui.drawText('TRADE DEAL NEGOTIATION', 640, 125, { font: 'Press Start 2P', size: '16px', color: '#ffcd68', align: 'center' });

      // Draw Merchant Block Avatar (Left panel)
      this.drawMerchantAvatar(ctx, 340, 240);

      // Resistance Meter Bar (Right panel)
      this.manager.ui.drawText('MERCHANT RESISTANCE', this.resistanceX, this.resistanceY - 12, { font: 'Press Start 2P', size: '10px', color: '#85c4ff' });
      this.manager.ui.drawRetroBox(this.resistanceX, this.resistanceY, this.resistanceW, this.resistanceH, '#22252e', '#2d313d', 2);
      
      const fillW = Math.max(0, (this.resistance / this.maxResistance) * (this.resistanceW - 4));
      ctx.fillStyle = this.resistance > 50 ? '#d9382e' : (this.resistance > 20 ? '#ffcd68' : '#6fe8d8');
      ctx.fillRect(this.resistanceX + 2, this.resistanceY + 2, fillW, this.resistanceH - 4);

      this.manager.ui.drawText(`${Math.ceil(this.resistance)}%`, this.resistanceX + this.resistanceW + 15, this.resistanceY + 12, { font: 'VT323', size: '20px', color: '#cbd5ed' });

      // Round counter
      this.manager.ui.drawText(`ROUND ${this.currentRound + 1}/${this.maxRounds}`, this.resistanceX, this.resistanceY + 45, { font: 'Press Start 2P', size: '9px', color: '#ffcd68' });

      // Dialog Speech bubble for merchant's quote
      const roundData = this.roundsData[this.currentRound];
      if (roundData) {
        this.manager.ui.drawText(roundData.npcQuote, this.resistanceX, this.resistanceY + 75, { font: 'VT323', size: '22px', color: '#cbd5ed', maxW: 420 });
      }

      // Render 4 options cards horizontally (Y=380 to Y=480)
      const startCardX = 265;
      const cardSpacing = 190;
      const cardW = 180;
      const cardH = 95;

      if (roundData) {
        roundData.options.forEach((opt, idx) => {
          const isSelected = idx === this.selectedOptionIdx;
          const cardX = startCardX + idx * cardSpacing;
          const cardY = 385;

          const borderColor = isSelected ? '#ffcd68' : '#2d313d';
          const bgColor = isSelected ? '#1c1e24' : '#101116';

          // Draw Card base
          this.manager.ui.drawRetroBox(cardX, cardY, cardW, cardH, bgColor, borderColor, 2);

          // Card Label / Button
          const labelCol = opt.type === 'LOGIC' ? '#85c4ff' : (opt.type === 'CHARM' ? '#6fe8d8' : (opt.type === 'LEVERAGE' ? '#ffcd68' : '#eb8e52'));
          const keyHint = `[${['A','B','C','D'][idx]}] `;
          this.manager.ui.drawText(keyHint + opt.label, cardX + 10, cardY + 22, { font: 'Press Start 2P', size: '9px', color: labelCol });

          // Card Quote Text (Multi-line wrap)
          this.manager.ui.drawText(opt.text, cardX + 10, cardY + 44, { font: 'VT323', size: '15px', color: '#8b95ab', maxW: cardW - 20 });
        });
      }

      // Render center screen prompt / feedback
      if (this.feedbackMessage) {
        this.manager.ui.drawText(this.feedbackMessage, 640, 505, { font: 'Press Start 2P', size: '11px', color: this.feedbackColor, align: 'center' });
      } else {
        this.manager.ui.drawText(this.displayMessage, 640, 505, { font: 'VT323', size: '18px', color: '#8b95ab', align: 'center' });
      }

      if (this.state === 'reward') {
        this.manager.ui.drawText('[ PRESS ENTER TO EXIT ]', 640, 528, { font: 'Press Start 2P', size: '10px', color: '#6fe8d8', align: 'center' });
      } else {
        this.manager.ui.drawText('[A/D] MOVE   [SPACE] SELECT ARGUMENT', 640, 528, { font: 'Press Start 2P', size: '10px', color: '#ffcd68', align: 'center' });
      }
    }
  }

  drawMerchantAvatar(ctx, cx, cy) {
    // Suit/jacket shoulders
    ctx.fillStyle = '#2d313d'; // Grey jacket
    ctx.fillRect(cx - 40, cy + 30, 80, 40);

    // Shirt collar
    ctx.fillStyle = '#cbd5ed'; // White shirt
    ctx.fillRect(cx - 15, cy + 30, 30, 15);

    // Face Plate
    ctx.fillStyle = '#eb8e52'; // Skin warm tone
    ctx.fillRect(cx - 30, cy - 30, 60, 60);

    // Hair/Glasses (Mr. Chen look)
    ctx.fillStyle = '#101116'; // Black hair
    ctx.fillRect(cx - 33, cy - 38, 66, 12); // Haircap
    
    // Glasses frames
    ctx.strokeStyle = '#ffcd68'; // Gold wire frames
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 20, cy - 10, 16, 12);
    ctx.strokeRect(cx + 4, cy - 10, 16, 12);
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 4);
    ctx.lineTo(cx + 4, cy - 4);
    ctx.stroke();

    // Mustache
    ctx.fillStyle = '#101116';
    ctx.fillRect(cx - 16, cy + 12, 32, 6);
  }

  handleInput(action) {
    if (this.state === 'lobby' && action === 'confirm') {
      this.start();
      return;
    }

    if (this.state === 'play') {
      if (action === 'left') {
        this.selectedOptionIdx = Math.max(0, this.selectedOptionIdx - 1);
        if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
          app.audioEngine.playCardFlip();
        }
        return;
      }
      if (action === 'right') {
        this.selectedOptionIdx = Math.min(3, this.selectedOptionIdx + 1);
        if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
          app.audioEngine.playCardFlip();
        }
        return;
      }
      if (action === 'confirm') {
        this.executeArgument();
        return;
      }
    }

    if (this.state === 'reward' && action === 'confirm') {
      this.exitGame();
      return;
    }
  }

  executeArgument() {
    const roundData = this.roundsData[this.currentRound];
    if (!roundData) return;

    const opt = roundData.options[this.selectedOptionIdx];
    if (!opt) return;

    // Check stat modifiers
    let checkBonus = 0;
    if (this.gameState) {
      if (opt.type === 'LOGIC' && this.gameState.wit) {
        checkBonus = Math.floor(this.gameState.wit * 2.5);
      } else if (opt.type === 'CHARM' && this.gameState.reputation) {
        checkBonus = Math.floor(this.gameState.reputation * 1.5);
      }
    }

    // Weakness matching doubles effectiveness!
    const isWeakness = opt.type === roundData.weakness;
    const baseDamage = opt.damage + checkBonus;
    const damage = isWeakness ? baseDamage * 2 : Math.floor(baseDamage * 0.6);

    // Apply Resistance reduction
    this.resistance = Math.max(0, this.resistance - damage);

    // Apply argument feedback
    if (isWeakness) {
      this.feedbackMessage = `EFFECTIVE! -${damage} Resistance!`;
      this.feedbackColor = '#6fe8d8';
    } else {
      this.feedbackMessage = `RESISTED! -${damage} Resistance.`;
      this.feedbackColor = '#ffcd68';
    }
    this.feedbackTimer = 1000;

    // Play sounds
    if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
      if (isWeakness) {
        app.audioEngine.playGoldShimmer();
      } else {
        app.audioEngine.playCardFlip();
      }
    }

    // Process penalties or round shift
    if (opt.penalty > 0 && this.gameState) {
      // Leverage increases story heat
      this.gameState.heat = (this.gameState.heat || 0) + opt.penalty;
    }

    if (this.resistance <= 0) {
      this.triggerSuccess();
    } else if (this.currentRound < this.maxRounds - 1) {
      this.currentRound++;
      this.selectedOptionIdx = 0;
    } else {
      this.triggerFailure();
    }
  }

  triggerSuccess() {
    this.state = 'resolve';
    this.victory = true;

    // Critical success if completed in fewer rounds
    const roundsUsed = this.currentRound + 1;
    const isCritical = roundsUsed < this.maxRounds;

    this.result = {
      success: true,
      tier: isCritical ? 'critical_success' : 'success',
      trustDelta: { general: isCritical ? 2 : 1 },
      heatDelta: 0,
      cashDelta: this.stake,
      reputationDelta: isCritical ? 2 : 1,
      secretsUnlocked: isCritical ? ['wholesale_mixtape_leak'] : [],
      flagsSet: ['negotiated_mixtape_deal'],
      items: ['Discount Coupon'],
      questUpdates: []
    };

    this.resolve(this.result);
    this.state = 'reward';
    this.displayMessage = isCritical ? 'Mixtape deal cleared! Outstanding profit!' : 'Deal negotiated successfully.';
  }

  triggerFailure() {
    this.state = 'resolve';
    this.victory = false;

    this.result = {
      success: false,
      tier: 'failure',
      trustDelta: { general: -1 },
      heatDelta: 1,
      cashDelta: 0,
      reputationDelta: -1,
      secretsUnlocked: [],
      flagsSet: [],
      items: [],
      questUpdates: []
    };

    this.resolve(this.result);
    this.state = 'reward';
    this.displayMessage = 'Merchant walked away. Deal failed!';
  }

  exitGame() {
    if (this.result) {
      this.resolve(this.result);
    }
  }

  getHUD() {
    return {
      top: [
        { label: 'MINI GAME', value: this.name },
        { label: 'ROUND', value: `${this.currentRound + 1}/${this.maxRounds}` },
        { label: 'RESISTANCE', value: `${Math.ceil(this.resistance)}%` },
        { label: 'TIME', value: Math.ceil(this.timeRemaining) + 's' }
      ],
      bottom: [
        { label: 'STATUS', value: this.state.toUpperCase() },
        { label: 'DIFFICULTY', value: this.difficulty.toUpperCase() }
      ]
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Negotiation
  };
}

if (typeof window !== 'undefined') {
  window.Negotiation = Negotiation;
}
