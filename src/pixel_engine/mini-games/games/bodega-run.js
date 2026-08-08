/**
 * Concrete Kings: The Block Chronicles
 * Bodega Run - Grid Stealth Mini-Game
 */

let BodegaRunBaseClass;
if (typeof require !== 'undefined') {
  BodegaRunBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  BodegaRunBaseClass = window.MiniGame;
} else {
  BodegaRunBaseClass = class {};
}

class BodegaRun extends BodegaRunBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'bodega_run';
    this.name = 'Bodega Run';
    this.description = 'Collect items in the Bodega without the clerk spotting you!';
    this.triggers = ['map_bodega', 'npc_chen'];
    this.difficulty = 'medium';
    this.durationSeconds = 30;

    // Grid sizing and offsets to center in 1280x720 canvas
    this.gridCols = 10;
    this.gridRows = 8;
    this.cellW = 60;
    this.cellH = 60;
    this.boardW = this.gridCols * this.cellW;
    this.boardH = this.gridRows * this.cellH;
    this.offsetX = Math.floor((1280 - this.boardW) / 2);
    this.offsetY = Math.floor((720 - this.boardH) / 2) + 20;

    // Game variables
    this.playerX = 0;
    this.playerY = 7;
    this.clerkX = 9;
    this.clerkY = 0;
    this.exitX = 9;
    this.exitY = 7;

    this.items = [];
    this.obstacles = new Set();
    this.visionCells = new Set();

    this.clerkGaze = 'LEFT'; // 'LEFT' or 'DOWN'
    this.clerkTimer = 0;
    this.clerkSweepTime = 1500; // Sweep direction every 1.5 seconds (in ms)
    this.alertness = 0; // 0 to 100
    this.alertnessRate = 80; // Alertness increase per second when in vision cone
    this.alertnessDecay = 40; // Alertness decrease per second when safe
    
    this.inputCooldown = 0;
    this.inputCooldownMax = 150; // 150ms step cooldown

    this.isDetected = false;
    this.victory = false;
    this.displayMessage = 'Sneak past the clerk! Grab the items!';

    this.setupMap();
  }

  setupMap() {
    this.obstacles.clear();
    
    // Add vertical shelves as obstacles
    // Shelf 1 (Col 2, Rows 1-3)
    for (let r = 1; r <= 3; r++) this.obstacles.add(`2,${r}`);
    // Shelf 2 (Col 2, Rows 5-7)
    for (let r = 5; r <= 7; r++) this.obstacles.add(`2,${r}`);
    
    // Shelf 3 (Col 5, Rows 1-3)
    for (let r = 1; r <= 3; r++) this.obstacles.add(`5,${r}`);
    // Shelf 4 (Col 5, Rows 5-7)
    for (let r = 5; r <= 7; r++) this.obstacles.add(`5,${r}`);

    // Shelf 5 (Col 8, Rows 2-5)
    for (let r = 2; r <= 5; r++) this.obstacles.add(`8,${r}`);

    // Setup items to collect
    this.items = [
      { x: 2, y: 4, name: 'Chopped Cheese', collected: false },
      { x: 5, y: 4, name: 'Cold Soda', collected: false },
      { x: 8, y: 1, name: 'Hot Chips', collected: false }
    ];
  }

  init(params) {
    super.init(params);
    this.difficulty = params.difficulty || 'medium';
    
    // Adjust timing and alertness rate based on difficulty
    if (this.difficulty === 'easy') {
      this.clerkSweepTime = 2000;
      this.alertnessRate = 50;
    } else if (this.difficulty === 'hard') {
      this.clerkSweepTime = 1000;
      this.alertnessRate = 120;
    } else {
      this.clerkSweepTime = 1500;
      this.alertnessRate = 80;
    }

    if (params.prepItemBonus) this.alertnessRate -= 30;
  }

  start() {
    super.start();
    this.playerX = 0;
    this.playerY = 7;
    this.alertness = 0;
    this.clerkTimer = 0;
    this.clerkGaze = 'LEFT';
    this.victory = false;
    this.isDetected = false;
    this.displayMessage = 'Sneak past the clerk! Grab the items!';
    this.setupMap();
    this.updateVision();
  }

  update(dt) {
    if (this.state === 'play') {
      super.update(dt);

      if (this.inputCooldown > 0) {
        this.inputCooldown = Math.max(0, this.inputCooldown - dt);
      }

      // Update Clerk sweep timer
      this.clerkTimer += dt;
      if (this.clerkTimer >= this.clerkSweepTime) {
        this.clerkTimer = 0;
        this.clerkGaze = this.clerkGaze === 'LEFT' ? 'DOWN' : 'LEFT';
        this.updateVision();
      }

      // Check if player is in clerk vision cone
      const playerPosKey = `${this.playerX},${this.playerY}`;
      const inVision = this.visionCells.has(playerPosKey);

      if (inVision) {
        this.alertness = Math.min(100, this.alertness + (this.alertnessRate * (dt / 1000)));
        this.displayMessage = 'Clerk is looking! GET TO COVER!';
      } else {
        this.alertness = Math.max(0, this.alertness - (this.alertnessDecay * (dt / 1000)));
        if (this.alertness === 0) {
          this.displayMessage = 'Safe. Collect items and get to the exit!';
        }
      }

      // Check for detection loss trigger
      if (this.alertness >= 100) {
        this.triggerFailure();
      }
    }
  }

  updateVision() {
    this.visionCells.clear();
    
    if (this.clerkGaze === 'LEFT') {
      // Raycast left from clerk position (9, 0)
      // Check rows 0, 1, and 2
      for (let r = 0; r <= 2; r++) {
        for (let c = 9; c >= 0; c--) {
          // If shelf blocks, ray stops
          if (this.obstacles.has(`${c},${r}`)) {
            break;
          }
          this.visionCells.add(`${c},${r}`);
        }
      }
    } else if (this.clerkGaze === 'DOWN') {
      // Raycast down from clerk column 9
      // Check columns 9, 8, and 7
      for (let c = 7; c <= 9; c++) {
        for (let r = 0; r < this.gridRows; r++) {
          if (this.obstacles.has(`${c},${r}`)) {
            break;
          }
          this.visionCells.add(`${c},${r}`);
        }
      }
    }
  }

  render(ctx) {
    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.manager && this.manager.ui) {
      // Draw background panel border box
      this.manager.ui.drawRetroBox(240, 100, 800, 520, '#101116', '#2d313d', 4);

      // Draw active grid background tiles
      for (let c = 0; c < this.gridCols; c++) {
        for (let r = 0; r < this.gridRows; r++) {
          const dx = this.offsetX + c * this.cellW;
          const dy = this.offsetY + r * this.cellH;
          
          // Checkerboard tile shading
          ctx.fillStyle = (c + r) % 2 === 0 ? '#181920' : '#101116';
          ctx.fillRect(dx, dy, this.cellW, this.cellH);
          
          // Draw cell borders
          ctx.strokeStyle = '#22252e';
          ctx.lineWidth = 1;
          ctx.strokeRect(dx, dy, this.cellW, this.cellH);
        }
      }

      // Draw Clerk vision cone red overlay
      this.visionCells.forEach(cellKey => {
        const [c, r] = cellKey.split(',').map(Number);
        const dx = this.offsetX + c * this.cellW;
        const dy = this.offsetY + r * this.cellH;
        
        ctx.fillStyle = 'rgba(217, 56, 46, 0.22)';
        ctx.fillRect(dx, dy, this.cellW, this.cellH);
      });

      // Draw Shelves (Obstacles)
      this.obstacles.forEach(obsKey => {
        const [c, r] = obsKey.split(',').map(Number);
        const dx = this.offsetX + c * this.cellW;
        const dy = this.offsetY + r * this.cellH;
        
        // Draw shelf block base
        this.manager.ui.drawRetroBox(dx + 2, dy + 2, this.cellW - 4, this.cellH - 4, '#6e3e14', '#2b0d0d', 2);
        
        // Draw stripes representing products
        ctx.fillStyle = '#ffcd68';
        ctx.fillRect(dx + 8, dy + 10, 44, 4);
        ctx.fillStyle = '#85c4ff';
        ctx.fillRect(dx + 8, dy + 22, 44, 4);
        ctx.fillStyle = '#aa2724';
        ctx.fillRect(dx + 8, dy + 34, 44, 4);
      });

      // Draw Items
      this.items.forEach(item => {
        if (!item.collected) {
          const dx = this.offsetX + item.x * this.cellW;
          const dy = this.offsetY + item.y * this.cellH;
          
          // Pulse scale
          const time = Date.now() / 150;
          const bob = Math.sin(time) * 4;
          
          ctx.fillStyle = '#6fe8d8';
          ctx.beginPath();
          ctx.arc(dx + 30, dy + 30 + bob, 10, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw small glow ring
          ctx.strokeStyle = 'rgba(111, 232, 216, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(dx + 30, dy + 30 + bob, 15, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Draw Exit
      const exDx = this.offsetX + this.exitX * this.cellW;
      const exDy = this.offsetY + this.exitY * this.cellH;
      const allCollected = this.items.every(i => i.collected);
      ctx.fillStyle = allCollected ? '#6fe8d8' : '#2d313d';
      ctx.fillRect(exDx + 10, exDy + 10, 40, 40);
      this.manager.ui.drawText('EXIT', exDx + 30, exDy + 22, { font: 'Press Start 2P', size: '8px', color: allCollected ? '#101116' : '#8b95ab', align: 'center' });

      // Draw Clerk
      const clDx = this.offsetX + this.clerkX * this.cellW;
      const clDy = this.offsetY + this.clerkY * this.cellH;
      this.manager.ui.drawRetroBox(clDx + 8, clDy + 8, 44, 44, '#d9382e', '#2b0d0d', 2);
      this.manager.ui.drawText('CLERK', clDx + 30, clDy + 20, { font: 'Press Start 2P', size: '7px', color: '#f4f7ff', align: 'center' });
      
      // Draw indicator lines for clerk sweep direction
      ctx.fillStyle = '#ffcd68';
      if (this.clerkGaze === 'LEFT') {
        ctx.fillRect(clDx + 4, clDy + 28, 4, 4);
      } else {
        ctx.fillRect(clDx + 28, clDy + 52, 4, 4);
      }

      // Draw Player
      const plDx = this.offsetX + this.playerX * this.cellW;
      const plDy = this.offsetY + this.playerY * this.cellH;
      this.manager.ui.drawRetroBox(plDx + 8, plDy + 8, 44, 44, '#ffcd68', '#6e3e14', 2);
      this.manager.ui.drawText('YOU', plDx + 30, plDy + 20, { font: 'Press Start 2P', size: '8px', color: '#101116', align: 'center' });

      // Title & Alertness Bar
      this.manager.ui.drawText(this.displayMessage, 640, 115, { font: 'VT323', size: '22px', color: this.alertness > 50 ? '#f25438' : '#f4f7ff', align: 'center' });
      
      // Draw alertness meter
      this.manager.ui.drawText('CLERK ALERTNESS:', 340, 600, { font: 'Press Start 2P', size: '10px', color: '#ffcd68' });
      this.manager.ui.drawTimerBar(520, 598, 420, 18, this.alertness / 100, {
        color: this.alertness > 70 ? '#d9382e' : (this.alertness > 35 ? '#ff7a45' : '#6fe8d8')
      });
      this.manager.ui.drawText(`${Math.floor(this.alertness)}%`, 955, 597, { font: 'Press Start 2P', size: '10px', color: '#cbd5ed' });
    }
  }

  handleInput(action) {
    if (this.state === 'lobby' && action === 'confirm') {
      this.start();
      return;
    }

    if (this.state === 'play') {
      if (this.inputCooldown > 0) return;

      let dx = 0;
      let dy = 0;

      if (action === 'up') dy = -1;
      if (action === 'down') dy = 1;
      if (action === 'left') dx = -1;
      if (action === 'right') dx = 1;

      if (dx !== 0 || dy !== 0) {
        const nextX = this.playerX + dx;
        const nextY = this.playerY + dy;

        // Check grid boundary limits
        if (nextX >= 0 && nextX < this.gridCols && nextY >= 0 && nextY < this.gridRows) {
          // Check shelf collision
          const nextKey = `${nextX},${nextY}`;
          if (!this.obstacles.has(nextKey) && !(nextX === this.clerkX && nextY === this.clerkY)) {
            this.playerX = nextX;
            this.playerY = nextY;
            this.inputCooldown = this.inputCooldownMax;
            
            // Check item collection
            this.checkItemCollection();
            
            // Check exit victory
            if (this.playerX === this.exitX && this.playerY === this.exitY) {
              const allCollected = this.items.every(i => i.collected);
              if (allCollected) {
                this.triggerSuccess();
              }
            }
          }
        }
      }
    }
  }

  checkItemCollection() {
    this.items.forEach(item => {
      if (!item.collected && item.x === this.playerX && item.y === this.playerY) {
        item.collected = true;
        this.displayMessage = `Grabbed ${item.name}!`;
        if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
          app.audioEngine.playGoldShimmer();
        }
      }
    });
  }

  triggerSuccess() {
    this.state = 'resolve';
    this.victory = true;
    
    const result = {
      success: true,
      tier: 'success',
      trustDelta: { general: 1 },
      heatDelta: 0,
      cashDelta: this.stake,
      reputationDelta: 1,
      secretsUnlocked: [],
      flagsSet: ['bodega_run_complete'],
      items: ['Chopped Cheese'],
      questUpdates: []
    };
    
    this.resolve(result);
  }

  triggerFailure() {
    this.state = 'resolve';
    this.isDetected = true;

    const result = {
      success: false,
      tier: 'failure',
      trustDelta: { general: -1 },
      heatDelta: 2,
      cashDelta: 0,
      reputationDelta: -1,
      secretsUnlocked: [],
      flagsSet: [],
      items: [],
      questUpdates: []
    };

    this.resolve(result);
  }

  getHUD() {
    const itemsCount = this.items.filter(i => i.collected).length;
    return {
      top: [
        { label: 'MINI GAME', value: this.name },
        { label: 'OBJECTIVE', value: `Items: ${itemsCount}/${this.items.length}` },
        { label: 'EXIT', value: this.items.every(i => i.collected) ? 'UNLOCKED' : 'LOCKED' },
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
    BodegaRun
  };
}

if (typeof window !== 'undefined') {
  window.BodegaRun = BodegaRun;
}
