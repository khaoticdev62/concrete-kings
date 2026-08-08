/**
 * Concrete Kings: The Block Chronicles
 * Haircut Challenge - Timing Rhythm Mini-Game
 */

let HaircutChallengeBaseClass;
if (typeof require !== 'undefined') {
  HaircutChallengeBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  HaircutChallengeBaseClass = window.MiniGame;
} else {
  HaircutChallengeBaseClass = class {};
}

class HaircutChallenge extends HaircutChallengeBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'haircut_challenge';
    this.name = 'Haircut Challenge';
    this.description = 'Stop the indicator in the zone to execute a clean trim!';
    this.triggers = ['map_barber_shop', 'npc_barber'];
    this.difficulty = 'medium';
    this.durationSeconds = 40;

    // Timing bar variables
    this.barX = 390;
    this.barY = 380;
    this.barW = 500;
    this.barH = 30;

    // Cursor position and speed
    this.cursorPos = 0; // 0 to 1 range (0 = left edge, 1 = right edge)
    this.cursorDirection = 1; // 1 = moving right, -1 = moving left
    this.cursorSpeed = 0.5; // fraction of bar width swept per second
    
    // Target zone parameters (fraction of bar width)
    this.targetCenter = 0.5; // Middle of the bar
    this.goodWidth = 0.3; // Width of GOOD zone (e.g. 0.35 to 0.65)
    this.perfectWidth = 0.08; // Width of PERFECT zone (e.g. 0.46 to 0.54)

    // Game loop statistics
    this.customers = [
      { type: 'Fade', request: '"Just a trim, keep it clean."', score: null, message: '' },
      { type: 'Waves', request: '"Line it up, sharp as a razor."', score: null, message: '' },
      { type: 'Braids', request: '"Neat sections, taper the edges."', score: null, message: '' }
    ];
    this.currentCustomerIdx = 0;
    
    this.scoreMap = {
      'PERFECT': 100,
      'GOOD': 50,
      'MISS': 0
    };
    
    this.displayMessage = 'Press SPACE to lock the cut!';
    this.lastActionTime = 0;
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

    // Adjust indicator speed based on difficulty level
    if (this.difficulty === 'easy') {
      this.cursorSpeed = 0.4;
      this.goodWidth = 0.4;
      this.perfectWidth = 0.12;
    } else if (this.difficulty === 'hard') {
      this.cursorSpeed = 0.7;
      this.goodWidth = 0.25;
      this.perfectWidth = 0.06;
    } else {
      this.cursorSpeed = 0.5;
      this.goodWidth = 0.3;
      this.perfectWidth = 0.08;
    }

    if (params.prepItemBonus) {
      this.goodWidth += 0.06;
      this.perfectWidth += 0.03;
    }
  }

  start() {
    super.start();
    this.currentCustomerIdx = 0;
    this.cursorPos = 0;
    this.cursorDirection = 1;
    this.victory = false;
    this.displayMessage = 'Press SPACE to lock the cut!';
    this.feedbackMessage = '';
    this.feedbackTimer = 0;
    
    this.customers.forEach(c => {
      c.score = null;
      c.message = '';
    });
  }

  update(dt) {
    if (this.state === 'play') {
      super.update(dt);

      // Update timing cursor position (linear ping-pong)
      this.cursorPos += this.cursorDirection * this.cursorSpeed * (dt / 1000);
      
      if (this.cursorPos >= 1.0) {
        this.cursorPos = 1.0;
        this.cursorDirection = -1;
      } else if (this.cursorPos <= 0.0) {
        this.cursorPos = 0.0;
        this.cursorDirection = 1;
      }

      // Update feedback display timer
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
      this.manager.ui.drawText('BARBER LINEUP CHALLENGE', 640, 120, { font: 'Press Start 2P', size: '18px', color: '#ffcd68', align: 'center' });

      // Customer bobbing head preview block (Y=170 to Y=330)
      this.drawCustomerHead(ctx, 640, 240);

      // Current Customer details
      const cust = this.customers[this.currentCustomerIdx];
      if (cust) {
        this.manager.ui.drawText(`CUSTOMER ${this.currentCustomerIdx + 1}/3: ${cust.type}`, 640, 315, { font: 'Press Start 2P', size: '10px', color: '#85c4ff', align: 'center' });
        this.manager.ui.drawText(cust.request, 640, 340, { font: 'VT323', size: '22px', color: '#cbd5ed', align: 'center' });
      }

      // Render Bar Background
      this.manager.ui.drawRetroBox(this.barX, this.barY, this.barW, this.barH, '#22252e', '#2d313d', 2);

      // GOOD zone coordinates
      const goodLeft = this.barX + (this.targetCenter - this.goodWidth / 2) * this.barW;
      const goodWidthPx = this.goodWidth * this.barW;
      ctx.fillStyle = 'rgba(39, 79, 128, 0.4)'; // Cool Tones dark blue overlay
      ctx.fillRect(goodLeft, this.barY + 2, goodWidthPx, this.barH - 4);

      // PERFECT zone coordinates
      const perfectLeft = this.barX + (this.targetCenter - this.perfectWidth / 2) * this.barW;
      const perfectWidthPx = this.perfectWidth * this.barW;
      ctx.fillStyle = 'rgba(111, 232, 216, 0.65)'; // Cyan perfect zone
      ctx.fillRect(perfectLeft, this.barY + 2, perfectWidthPx, this.barH - 4);

      // Draw Zone borders
      ctx.strokeStyle = '#2d313d';
      ctx.lineWidth = 1;
      ctx.strokeRect(goodLeft, this.barY, goodWidthPx, this.barH);
      ctx.strokeRect(perfectLeft, this.barY, perfectWidthPx, this.barH);

      // Draw Cursor indicator
      const cursorX = this.barX + this.cursorPos * this.barW;
      ctx.fillStyle = '#f4f7ff';
      ctx.fillRect(cursorX - 3, this.barY - 6, 6, this.barH + 12);
      
      // Draw small guide triangles over cursor
      ctx.strokeStyle = '#f4f7ff';
      ctx.beginPath();
      ctx.moveTo(cursorX - 6, this.barY - 6);
      ctx.lineTo(cursorX + 6, this.barY - 6);
      ctx.lineTo(cursorX, this.barY - 1);
      ctx.closePath();
      ctx.fill();

      // Draw Score logs / customer badges at bottom
      let xOffset = 340;
      this.customers.forEach((c, idx) => {
        const isCurrent = idx === this.currentCustomerIdx;
        const color = isCurrent ? '#ffcd68' : '#8b95ab';
        const label = `C${idx + 1}: ${c.score !== null ? c.score : '?'}`;
        
        this.manager.ui.drawText(label, xOffset, 445, { font: 'Press Start 2P', size: '10px', color: color });
        
        let scoreLabel = 'WAITING';
        let scoreCol = '#8b95ab';
        if (c.score !== null) {
          scoreLabel = c.message;
          scoreCol = scoreLabel === 'PERFECT' ? '#6fe8d8' : (scoreLabel === 'GOOD' ? '#85c4ff' : '#d9382e');
        }
        this.manager.ui.drawText(scoreLabel, xOffset, 468, { font: 'VT323', size: '18px', color: scoreCol });
        
        xOffset += 220;
      });

      // Render center screen prompt / feedback
      if (this.feedbackMessage) {
        this.manager.ui.drawText(this.feedbackMessage, 640, 500, { font: 'Press Start 2P', size: '12px', color: this.feedbackColor, align: 'center' });
      } else {
        this.manager.ui.drawText(this.displayMessage, 640, 500, { font: 'VT323', size: '20px', color: '#8b95ab', align: 'center' });
      }
      
      if (this.state === 'reward') {
        this.manager.ui.drawText('[ PRESS ENTER TO EXIT ]', 640, 525, { font: 'Press Start 2P', size: '10px', color: '#6fe8d8', align: 'center' });
      } else {
        this.manager.ui.drawText('[ PRESS SPACE TO CLIP ]', 640, 525, { font: 'Press Start 2P', size: '10px', color: '#ffcd68', align: 'center' });
      }
    }
  }

  drawCustomerHead(ctx, cx, cy) {
    // Face plate
    ctx.fillStyle = '#eb8e52'; // Skin warm tone
    ctx.fillRect(cx - 30, cy - 30, 60, 60);

    // Eyes
    ctx.fillStyle = '#101116';
    ctx.fillRect(cx - 16, cy - 10, 8, 6);
    ctx.fillRect(cx + 8, cy - 10, 8, 6);

    // Dynamic bobbing hair based on active index
    const bob = Math.sin(Date.now() / 150) * 3;
    ctx.fillStyle = '#101116'; // Hair Charcoal
    ctx.fillRect(cx - 34, cy - 44 + bob, 68, 16); // Afro/cap top
    
    // Draw neck
    ctx.fillStyle = '#be6436'; // Neck shading
    ctx.fillRect(cx - 10, cy + 30, 20, 16);

    // Draw shirt collar
    ctx.fillStyle = '#366ba6'; // Blue shirt
    ctx.fillRect(cx - 24, cy + 44, 48, 10);
  }

  handleInput(action) {
    if (this.state === 'lobby' && action === 'confirm') {
      this.start();
      return;
    }

    if (this.state === 'play' && action === 'confirm') {
      this.triggerCut();
      return;
    }

    if (this.state === 'reward' && action === 'confirm') {
      this.exitGame();
      return;
    }
  }

  triggerCut() {
    // Check timing boundaries
    const dist = Math.abs(this.cursorPos - this.targetCenter);
    
    let accuracy = 'MISS';
    if (dist <= this.perfectWidth / 2) {
      accuracy = 'PERFECT';
      this.feedbackColor = '#6fe8d8';
    } else if (dist <= this.goodWidth / 2) {
      accuracy = 'GOOD';
      this.feedbackColor = '#85c4ff';
    } else {
      accuracy = 'MISS';
      this.feedbackColor = '#d9382e';
    }

    // Apply score logs
    const scoreVal = this.scoreMap[accuracy];
    const cust = this.customers[this.currentCustomerIdx];
    cust.score = scoreVal;
    cust.message = accuracy;

    // Visual/audio feedback triggers
    this.feedbackMessage = `${accuracy}!`;
    this.feedbackTimer = 800; // Show feedback text for 800ms
    if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
      if (accuracy === 'PERFECT') {
        app.audioEngine.playGoldShimmer();
      } else if (accuracy === 'GOOD') {
        app.audioEngine.playCardFlip();
      }
    }

    // Switch to next customer or resolve game
    if (this.currentCustomerIdx < this.customers.length - 1) {
      this.currentCustomerIdx++;
      // Randomize targetCenter slightly to keep game dynamic!
      this.targetCenter = 0.35 + Math.random() * 0.3; // keeps center between 0.35 and 0.65
      // Reset cursor position to start
      this.cursorPos = 0;
      this.cursorDirection = 1;
    } else {
      this.resolveCuts();
    }
  }

  resolveCuts() {
    const totalScore = this.customers.reduce((sum, c) => sum + (c.score || 0), 0);
    
    this.state = 'resolve';
    
    let success = false;
    let tier = 'failure';
    let trustDelta = { general: -1 };
    let heatDelta = 1;
    let cashDelta = 0;
    let reputationDelta = -1;

    if (totalScore >= 250) {
      success = true;
      tier = 'critical_success';
      trustDelta = { general: 2 };
      heatDelta = 0;
      cashDelta = Math.floor(this.stake * 1.5);
      reputationDelta = 2;
      this.displayMessage = `Lineup Cleanliness: ${totalScore}/300! EXCELLENT FADE!`;
    } else if (totalScore >= 150) {
      success = true;
      tier = 'success';
      trustDelta = { general: 1 };
      heatDelta = 0;
      cashDelta = this.stake;
      reputationDelta = 1;
      this.displayMessage = `Lineup Cleanliness: ${totalScore}/300! Good job!`;
    } else if (totalScore >= 100) {
      success = true;
      tier = 'partial';
      trustDelta = { general: 0 };
      heatDelta = 0;
      cashDelta = Math.floor(this.stake * 0.5);
      reputationDelta = 0;
      this.displayMessage = `Lineup Cleanliness: ${totalScore}/300! Serviceable cut.`;
    } else {
      success = false;
      tier = 'failure';
      trustDelta = { general: -1 };
      heatDelta = 2;
      cashDelta = 0;
      reputationDelta = -1;
      this.displayMessage = `Lineup Cleanliness: ${totalScore}/300! Pushed back hairline!`;
    }

    this.victory = success;
    
    this.result = {
      success,
      tier,
      trustDelta,
      heatDelta,
      cashDelta,
      reputationDelta,
      secretsUnlocked: [],
      flagsSet: ['haircut_challenge_complete'],
      items: [],
      questUpdates: []
    };

    this.state = 'reward';
  }

  exitGame() {
    if (this.result) {
      this.resolve(this.result);
    }
  }

  getHUD() {
    const totalScore = this.customers.reduce((sum, c) => sum + (c.score || 0), 0);
    return {
      top: [
        { label: 'MINI GAME', value: this.name },
        { label: 'SCORE', value: `${totalScore}/300` },
        { label: 'CUSTOMER', value: `${this.currentCustomerIdx + 1}/3` },
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
    HaircutChallenge
  };
}

if (typeof window !== 'undefined') {
  window.HaircutChallenge = HaircutChallenge;
}
