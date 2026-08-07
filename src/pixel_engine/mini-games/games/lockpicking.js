/**
 * Concrete Kings: The Block Chronicles
 * Lockpicking Challenge - Timing & Skill Mini-Game
 */

let LockpickingBaseClass;
if (typeof require !== 'undefined') {
  LockpickingBaseClass = require('../mini-game-state.js').MiniGame;
} else if (typeof window !== 'undefined' && window.MiniGame) {
  LockpickingBaseClass = window.MiniGame;
} else {
  LockpickingBaseClass = class {};
}

class Lockpicking extends LockpickingBaseClass {
  constructor(manager, canvas, ctx, gameState) {
    super(manager, canvas, ctx, gameState);
    this.id = 'lockpicking';
    this.name = 'Lockpicking';
    this.description = 'Align all 5 tumbler pins with the shear line to pick the lock!';
    this.triggers = ['map_locked_door'];
    this.difficulty = 'hard';
    this.durationSeconds = 30;

    // Cylinder rendering bounds
    this.cylinderX = 340;
    this.cylinderY = 160;
    this.cylinderW = 600;
    this.cylinderH = 220;

    // Pin channels settings
    this.pinsCount = 5;
    this.pins = [];
    this.selectedPinIdx = 0;

    // Lift and torque parameters
    this.liftSpeed = 120; // Pixels per second when W is pressed
    this.maxLift = 160; // Max height pin can be lifted
    this.tolerance = 12; // Pixel alignment tolerance for shear line success

    this.displayMessage = 'Align the pin and press SPACE to lock it!';
    this.feedbackMessage = '';
    this.feedbackTimer = 0;
    this.feedbackColor = '#f4f7ff';

    this.stake = 20;
    this.victory = false;
    this.result = null;

    this.setupPins();
  }

  setupPins() {
    this.pins = [];
    const spacing = 100;
    const startX = this.cylinderX + 100;

    for (let i = 0; i < this.pinsCount; i++) {
      // targetY is the target height from bottom where pin aligns with shear line
      // targetY ranges between 35 and 135 pixels
      const targetY = 35 + Math.floor(Math.random() * 100);
      
      this.pins.push({
        x: startX + i * spacing,
        y: 0, // current lifted height
        targetY: targetY,
        isSet: false,
        shakeOffset: 0
      });
    }
  }

  init(params) {
    super.init(params);
    this.stake = params.stake || 20;
    this.difficulty = params.difficulty || 'hard';

    // Scale parameter checks
    if (this.difficulty === 'easy') {
      this.tolerance = 18;
      this.liftSpeed = 90;
      this.durationSeconds = 40;
    } else if (this.difficulty === 'hard') {
      this.tolerance = 10;
      this.liftSpeed = 150;
      this.durationSeconds = 25;
    } else {
      this.tolerance = 14;
      this.liftSpeed = 120;
      this.durationSeconds = 30;
    }
    
    this.setupPins();
  }

  start() {
    super.start();
    this.selectedPinIdx = 0;
    this.victory = false;
    this.displayMessage = 'Align the pin and press SPACE to lock it!';
    this.feedbackMessage = '';
    this.feedbackTimer = 0;
    
    this.setupPins();
  }

  update(dt) {
    if (this.state === 'play') {
      super.update(dt);

      // Handle continuous lift if up/W key is pressed/held
      if (this.manager && this.manager.input && this.manager.input.isPressed) {
        if (this.manager.input.isPressed('up')) {
          this.applyLift(dt);
        } else {
          this.applyDecay(dt);
        }
      }

      // Update shake offsets and timers
      this.pins.forEach(pin => {
        if (pin.shakeOffset > 0) {
          pin.shakeOffset = Math.max(0, pin.shakeOffset - (dt / 10));
        }
      });

      if (this.feedbackTimer > 0) {
        this.feedbackTimer = Math.max(0, this.feedbackTimer - dt);
        if (this.feedbackTimer === 0) {
          this.feedbackMessage = '';
        }
      }
    }
  }

  applyLift(dt) {
    const pin = this.pins[this.selectedPinIdx];
    if (pin && !pin.isSet) {
      pin.y = Math.min(this.maxLift, pin.y + this.liftSpeed * (dt / 1000));
    }
  }

  applyDecay(dt) {
    // If not holding up/W, pins that are not set slowly sink back down
    this.pins.forEach(pin => {
      if (!pin.isSet && pin.y > 0) {
        pin.y = Math.max(0, pin.y - 80 * (dt / 1000));
      }
    });
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.manager && this.manager.ui) {
      // Draw background layout border box
      this.manager.ui.drawRetroBox(240, 100, 800, 520, '#101116', '#2d313d', 4);

      // Title header
      this.manager.ui.drawText('LOCKPICKING SECURITY BYPASS', 640, 125, { font: 'Press Start 2P', size: '16px', color: '#ffcd68', align: 'center' });

      // Draw Main Cylinder housing Block
      this.manager.ui.drawRetroBox(this.cylinderX, this.cylinderY, this.cylinderW, this.cylinderH, '#1c1e24', '#3c4252', 3);

      // Draw horizontal Shear Line across cylinder housing (ambient guide)
      ctx.strokeStyle = 'rgba(255, 205, 104, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.cylinderX, this.cylinderY + 110);
      ctx.lineTo(this.cylinderX + this.cylinderW, this.cylinderY + 110);
      ctx.stroke();

      // Render 5 pin channels
      const channelH = 170;
      const channelW = 20;
      const bottomY = this.cylinderY + 190;

      for (let i = 0; i < this.pinsCount; i++) {
        const pin = this.pins[i];
        const isCurrent = i === this.selectedPinIdx;

        // Draw pin shaft guide
        ctx.fillStyle = '#101116';
        ctx.fillRect(pin.x - channelW / 2, bottomY - channelH, channelW, channelH);

        // Draw Shear Line target zone inside the shaft
        const targetDrawY = bottomY - pin.targetY;
        ctx.fillStyle = pin.isSet ? 'rgba(111, 232, 216, 0.4)' : 'rgba(139, 149, 171, 0.35)';
        ctx.fillRect(pin.x - channelW / 2, targetDrawY - this.tolerance, channelW, this.tolerance * 2);

        // Draw target line notch
        ctx.strokeStyle = pin.isSet ? '#6fe8d8' : '#8b95ab';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pin.x - channelW / 2, targetDrawY);
        ctx.lineTo(pin.x + channelW / 2, targetDrawY);
        ctx.stroke();

        // Draw Pin tumbler block (moves vertically)
        // ShakeOffset adds pixel vibration feedback if lock is picked incorrectly
        const shake = (Math.sin(Date.now() / 20) * pin.shakeOffset);
        const pinDrawY = bottomY - pin.y;
        ctx.fillStyle = pin.isSet ? '#6fe8d8' : (isCurrent ? '#ffcd68' : '#cbd5ed');
        ctx.fillRect(pin.x - (channelW / 2 - 2) + shake, pinDrawY - 30, channelW - 4, 30);

        // Indicator arrows on current pin shaft
        if (isCurrent && this.state === 'play') {
          this.manager.ui.drawText('▲', pin.x, bottomY + 24, { font: 'VT323', size: '20px', color: '#ffcd68', align: 'center' });
        }
      }

      // Draw Lockpick tool representation sliding under the cylinder
      const toolX = this.pins[this.selectedPinIdx].x;
      const toolY = bottomY + 10;
      ctx.strokeStyle = '#d9382e'; // Red metal tool line
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.cylinderX - 20, toolY + 15);
      ctx.lineTo(toolX - 5, toolY + 10);
      ctx.lineTo(toolX, toolY - 15); // Hook tip
      ctx.stroke();

      // Render center screen prompt / feedback
      if (this.feedbackMessage) {
        this.manager.ui.drawText(this.feedbackMessage, 640, 480, { font: 'Press Start 2P', size: '12px', color: this.feedbackColor, align: 'center' });
      } else {
        this.manager.ui.drawText(this.displayMessage, 640, 480, { font: 'VT323', size: '20px', color: '#8b95ab', align: 'center' });
      }

      if (this.state === 'reward') {
        this.manager.ui.drawText('[ PRESS ENTER TO EXIT ]', 640, 510, { font: 'Press Start 2P', size: '10px', color: '#6fe8d8', align: 'center' });
      } else {
        this.manager.ui.drawText('[W] LIFT   [A/D] MOVE   [SPACE] SET PIN', 640, 510, { font: 'Press Start 2P', size: '10px', color: '#ffcd68', align: 'center' });
      }
    }
  }

  handleInput(action) {
    if (this.state === 'lobby' && action === 'confirm') {
      this.start();
      return;
    }

    if (this.state === 'play') {
      if (action === 'left') {
        this.selectedPinIdx = Math.max(0, this.selectedPinIdx - 1);
        if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
          app.audioEngine.playCardFlip();
        }
        return;
      }
      if (action === 'right') {
        this.selectedPinIdx = Math.min(this.pinsCount - 1, this.selectedPinIdx + 1);
        if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
          app.audioEngine.playCardFlip();
        }
        return;
      }
      if (action === 'confirm') {
        this.trySetPin();
        return;
      }
      if (action === 'down') {
        // Reset current pin back to bottom
        const pin = this.pins[this.selectedPinIdx];
        if (pin && !pin.isSet) pin.y = 0;
        return;
      }
    }

    if (this.state === 'reward' && action === 'confirm') {
      this.exitGame();
      return;
    }
  }

  trySetPin() {
    const pin = this.pins[this.selectedPinIdx];
    if (!pin || pin.isSet) return;

    const diff = Math.abs(pin.y - pin.targetY);
    if (diff <= this.tolerance) {
      pin.isSet = true;
      pin.y = pin.targetY; // Lock exact height position
      this.feedbackMessage = 'CLICK! Pin set.';
      this.feedbackColor = '#6fe8d8';
      this.feedbackTimer = 800;

      if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
        app.audioEngine.playGoldShimmer();
      }

      // Check if all lock tumblers are picked successfully
      const allSet = this.pins.every(p => p.isSet);
      if (allSet) {
        this.triggerSuccess();
      }
    } else {
      // Miss: shake tumbler and drop pin back to bottom
      pin.shakeOffset = 6;
      pin.y = 0;
      this.feedbackMessage = 'CLANG! Missed shear line.';
      this.feedbackColor = '#d9382e';
      this.feedbackTimer = 800;

      if (this.manager && this.manager.ui && typeof app !== 'undefined' && app.audioEngine) {
        app.audioEngine.playCardFlip(); // Fail sound
      }
    }
  }

  triggerSuccess() {
    this.state = 'resolve';
    this.victory = true;

    this.result = {
      success: true,
      tier: 'success',
      trustDelta: { general: 1 },
      heatDelta: 0,
      cashDelta: this.stake,
      reputationDelta: 2,
      secretsUnlocked: ['alley_keycard_intel'],
      flagsSet: ['lock_picked_alley'],
      items: ['Stolen Intel'],
      questUpdates: []
    };

    this.resolve(this.result);
    this.state = 'reward';
    this.displayMessage = 'Cylinder rotated! Lock Bypass Successful.';
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
    this.displayMessage = 'Alarms triggered! Lockpicker bypass failed.';
  }

  resolveTimeOverrun() {
    this.triggerFailure();
  }

  exitGame() {
    if (this.result) {
      this.resolve(this.result);
    }
  }

  getHUD() {
    const pinsSetCount = this.pins.filter(p => p.isSet).length;
    return {
      top: [
        { label: 'MINI GAME', value: this.name },
        { label: 'SECURITY', value: `${pinsSetCount}/${this.pinsCount} pins` },
        { label: 'TOLERANCE', value: `±${this.tolerance}px` },
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
    Lockpicking
  };
}

if (typeof window !== 'undefined') {
  window.Lockpicking = Lockpicking;
}
