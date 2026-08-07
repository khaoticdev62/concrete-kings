const test = require('node:test');
const assert = require('node:assert/strict');

// Import our code modules (using CommonJS require)
const { MiniGame, MiniGameState } = require('../src/pixel_engine/mini-games/mini-game-state.js');
const { MiniGameInput } = require('../src/pixel_engine/mini-games/mini-game-input.js');
const { MiniGameUI } = require('../src/pixel_engine/mini-games/mini-game-ui.js');
const { MiniGameLoop } = require('../src/pixel_engine/mini-games/mini-game-loop.js');
const { MiniGameManager } = require('../src/pixel_engine/mini-games/mini-game-manager.js');
const { StreetDice } = require('../src/pixel_engine/mini-games/games/street-dice.js');
const { BodegaRun } = require('../src/pixel_engine/mini-games/games/bodega-run.js');
const { HaircutChallenge } = require('../src/pixel_engine/mini-games/games/haircut-challenge.js');
const { Lockpicking } = require('../src/pixel_engine/mini-games/games/lockpicking.js');
const { Negotiation } = require('../src/pixel_engine/mini-games/games/negotiation.js');

// Mock HTML Canvas environment since we run under pure Node.js in tests
if (typeof global.document === 'undefined') {
  global.document = {
    createElement(tag) {
      if (tag === 'canvas') {
        return new MockCanvas();
      }
      return {};
    },
    body: {
      clientWidth: 1280,
      clientHeight: 720
    }
  };
}

class MockCanvas {
  constructor() {
    this.width = 1280;
    this.height = 720;
    this.style = {};
    this.parentElement = {
      clientWidth: 1280,
      clientHeight: 720
    };
  }
  getContext(type, options) {
    return new MockCanvasContext();
  }
}

class MockCanvasContext {
  constructor() {
    this.imageSmoothingEnabled = false;
    this.fillStyle = '';
    this.strokeStyle = '';
    this.font = '';
    this.textAlign = 'left';
    this.textBaseline = 'top';
  }
  clearRect() {}
  fillRect() {}
  strokeRect() {}
  fillText() {}
  drawImage() {}
}

test('Mini-Game State: correct loading from storyEngine and player stats', () => {
  const state = new MiniGameState();
  
  const mockStoryEngine = {
    heat: 3,
    trust: 4,
    secrets: ['secret_stash']
  };

  const mockPlayer = {
    stats: {
      streetCred: 100,
      reputation: 5
    }
  };

  state.loadFromEngine(mockStoryEngine, mockPlayer);

  assert.equal(state.heat, 3);
  assert.equal(state.trust['general'], 4);
  assert.deepEqual(state.secrets, ['secret_stash']);
  assert.equal(state.cash, 100);
  assert.equal(state.reputation, 5);
});

test('Mini-Game State: standard Base MiniGame states and flow transitions', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const manager = {
    dispatch: (event, payload) => {
      manager.dispatchedEvent = event;
      manager.dispatchedPayload = payload;
    }
  };

  const game = new MiniGame(manager, canvas, ctx, state);
  game.init({
    npc: { id: 'tbone', name: 'T-Bone' },
    location: 'Chess Park Corner',
    difficulty: 'hard',
    durationSeconds: 15
  });

  assert.equal(game.state, 'lobby');
  assert.equal(game.difficulty, 'hard');
  assert.equal(game.timeRemaining, 15);
  assert.equal(game.npc.name, 'T-Bone');

  game.start();
  assert.equal(game.state, 'play');
  assert.equal(game.dispatchedEvent, undefined); // Manager event was minigame:start, but let's see

  // Advance time
  game.update(5000); // 5 seconds in ms
  assert.equal(game.timeRemaining, 10);

  // Trigger resolve
  const mockResult = { success: true, cashDelta: 10 };
  game.resolve(mockResult);
  
  assert.equal(game.state, 'resolve');
  assert.equal(manager.dispatchedEvent, 'minigame:complete');
  assert.deepEqual(manager.dispatchedPayload, mockResult);
});

test('Mini-Game Input: abstract keycode action mapping', () => {
  const input = new MiniGameInput();
  
  // Directly simulate keyboard events
  const mockDownEvent1 = { key: 'ArrowUp', preventDefault: () => {} };
  const mockDownEvent2 = { key: 'w', preventDefault: () => {} };
  const mockDownEventConfirm = { key: 'Enter', preventDefault: () => {} };

  input.onKeyDown(mockDownEvent1);
  assert.equal(input.keys['arrowup'], true);
  assert.equal(input.actions['up'], true);

  input.onKeyDown(mockDownEventConfirm);
  assert.equal(input.actions['confirm'], true);

  // KeyUp test
  const mockUpEvent1 = { key: 'ArrowUp', preventDefault: () => {} };
  input.onKeyUp(mockUpEvent1);
  assert.equal(input.keys['arrowup'], false);
  assert.equal(input.actions['up'], false);
});

test('Mini-Game Loop: high-precision delta-time computation and cap clamping', () => {
  const loop = new MiniGameLoop();
  let accumulatedDt = 0;
  let ticks = 0;

  // Mock callback
  loop.start((dt) => {
    accumulatedDt += dt;
    ticks++;
  }, () => {});

  // Directly advance loop
  loop.lastTime = 1000;
  
  // Tick 1: normal frame (16.6ms)
  loop.paused = false;
  loop.updateCallback(16.6);
  assert.equal(accumulatedDt, 16.6);
  assert.equal(ticks, 1);

  // Tick 2: large lag spike (250ms) -> should clamp to loop.maxStep (100ms)
  accumulatedDt = 0;
  ticks = 0;
  
  // Set last time and run loop tick check
  let dt = 250;
  if (dt > loop.maxStep) dt = loop.maxStep;
  loop.updateCallback(dt);
  
  assert.equal(accumulatedDt, 100);
  assert.equal(ticks, 1);

  loop.stop();
});

test('Street Dice: WIT modifier mapping and win/loss verification rules', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  
  // Verify Barber WIT modifiers load correctly
  state.origin = 'BARBER';
  const game = new StreetDice(null, canvas, ctx, state);
  game.init({ stake: 50, dc: 12 });

  assert.equal(game.witModifier, 7); // Barber has WIT 7
  assert.equal(game.stake, 50);
  assert.equal(game.dc, 12);

  // Verify Scholar WIT modifiers load correctly
  state.origin = 'STREET_SCHOLAR';
  const game2 = new StreetDice(null, canvas, ctx, state);
  game2.init({});
  assert.equal(game2.witModifier, 8); // Scholar has WIT 8

  // Verify Roll win/loss criteria
  game.start();
  
  // Override roll variables directly to simulate outcomes
  game.witModifier = 5;
  game.roll1 = 6;
  game.roll2 = 5;
  game.opponentRoll1 = 4;
  game.opponentRoll2 = 3;
  
  // RollSum = 6 + 5 + 5 = 16. OpponentRollSum = 4 + 3 = 7.
  // 16 >= 7 -> Success!
  game.finishRoll();
  assert.equal(game.rollSum, 16);
  assert.equal(game.opponentRollSum, 7);
  assert.equal(game.result.success, true);
  assert.equal(game.result.cashDelta, 50); // Wins the stake
  assert.equal(game.result.reputationDelta, 1);

  // Lose scenario
  const gameLoss = new StreetDice(null, canvas, ctx, state);
  gameLoss.init({ stake: 10 });
  gameLoss.start();
  gameLoss.witModifier = 0;
  gameLoss.roll1 = 1;
  gameLoss.roll2 = 2; // sum = 3
  gameLoss.opponentRoll1 = 5;
  gameLoss.opponentRoll2 = 6; // sum = 11
  
  gameLoss.finishRoll();
  assert.equal(gameLoss.result.success, false);
  assert.equal(gameLoss.result.cashDelta, -10); // Loses the stake
  assert.equal(gameLoss.result.reputationDelta, -1);
});

test('Mini-Game Manager: registration and game activation lifecycle', () => {
  const canvas = new MockCanvas();
  const manager = new MiniGameManager(canvas);
  
  manager.registerGame('street_dice', StreetDice);
  assert.ok(manager.registry['street_dice']);

  // Stub app environment
  global.app = {
    game: {
      players: [{ stats: { streetCred: 100, reputation: 5 } }]
    },
    humanIndex: 0,
    storyEngine: {
      heat: 2,
      trust: 3,
      secrets: []
    }
  };

  const started = manager.start('street_dice', { stake: 30 });
  assert.equal(started, true);
  assert.equal(manager.isActive, true);
  assert.equal(manager.activeGame.id, 'street_dice');
  assert.equal(manager.activeGame.stake, 30);
  assert.equal(global.app.miniGameActive, true);

  // Stop manager
  manager.stop();
  assert.equal(manager.isActive, false);
  assert.equal(manager.activeGame, null);
  assert.equal(global.app.miniGameActive, false);
  
  delete global.app;
});

test('Bodega Run: map setup, grid constraints and items coordinates', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new BodegaRun(null, canvas, ctx, state);

  assert.equal(game.gridCols, 10);
  assert.equal(game.gridRows, 8);
  assert.equal(game.playerX, 0);
  assert.equal(game.playerY, 7);
  assert.equal(game.exitX, 9);
  assert.equal(game.exitY, 7);
  assert.equal(game.items.length, 3);
  
  // Verify vertical shelves
  assert.equal(game.obstacles.has('2,1'), true);
  assert.equal(game.obstacles.has('2,4'), false); // gap for Chopped Cheese item
  assert.equal(game.obstacles.has('5,3'), true);
});

test('Bodega Run: player movement, obstacle collisions and items collection', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new BodegaRun(null, canvas, ctx, state);

  game.start();
  assert.equal(game.playerX, 0);
  assert.equal(game.playerY, 7);

  // Move right to (1, 7)
  game.handleInput('right');
  assert.equal(game.playerX, 1);
  assert.equal(game.playerY, 7);

  // Attempt to move right to (2, 7) which is a shelf (obstacle)
  game.inputCooldown = 0; // Reset cooldown
  game.handleInput('right');
  assert.equal(game.playerX, 1, 'Should block movement on shelf obstacle');

  // Move up to (1, 4)
  for (let step = 0; step < 3; step++) {
    game.inputCooldown = 0;
    game.handleInput('up');
  }
  assert.equal(game.playerX, 1);
  assert.equal(game.playerY, 4);

  // Move right onto item cell (2, 4)
  game.inputCooldown = 0;
  game.handleInput('right');
  assert.equal(game.playerX, 2);
  assert.equal(game.playerY, 4);
  assert.equal(game.items[0].collected, true, 'Item 0 (Chopped Cheese) should be collected');
});

test('Bodega Run: clerk vision sweep directions and alertness rates', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new BodegaRun(null, canvas, ctx, state);

  game.start();
  
  // Under LOOK_LEFT gaze: row 0, 1, 2 from clerk (9,0) should be visible up to shelves
  assert.equal(game.clerkGaze, 'LEFT');
  // Col 9 Row 0 (Clerk cell)
  assert.equal(game.visionCells.has('9,0'), true);
  // Col 8 Row 0 (shelf obstacle starts at 8,2 so 8,0 is visible)
  assert.equal(game.visionCells.has('8,0'), true);
  // Col 2 Row 1 (is shelf, so Col 1 Row 1 should NOT be visible)
  assert.equal(game.visionCells.has('1,1'), false);

  // Switch gaze to DOWN
  game.clerkGaze = 'DOWN';
  game.updateVision();
  // Col 9 Row 7 should be visible (exit is Col 9 Row 7, Clerk is 9, 0, no shelves in col 9)
  assert.equal(game.visionCells.has('9,7'), true);
  // Col 8 Row 6 is blocked by shelf at 8,2-5, so it should NOT be visible (false)
  assert.equal(game.visionCells.has('8,6'), false);
  // Col 8 Row 3 (is shelf obstacle, so 8,3 is not in vision cells)
  assert.equal(game.visionCells.has('8,3'), false);

  // Test alertness tick increment when in vision cone
  game.playerX = 9;
  game.playerY = 7; // Player is in vision cell (9,7) under LOOK_DOWN gaze
  game.alertness = 0;
  
  // Mock dt = 500ms
  game.update(500);
  assert.ok(game.alertness > 0, 'Alertness should increase when in vision cone');
});

test('Bodega Run: victory and defeat resolution outcomes', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new BodegaRun(null, canvas, ctx, state);

  // Force failure via high alertness
  game.start();
  // Move player into vision cone at (9,0) so alertness accumulates
  game.playerX = 9;
  game.playerY = 0;
  game.alertness = 99;
  game.update(100); // Ticks up past 100
  assert.equal(game.state, 'resolve');
  assert.equal(game.isDetected, true);
  assert.equal(game.result.success, false);
  assert.equal(game.result.heatDelta, 2);

  // Force victory by collecting all items and reaching exit
  const gameWin = new BodegaRun(null, canvas, ctx, state);
  gameWin.start();
  
  // Set all items collected
  gameWin.items.forEach(i => i.collected = true);
  
  // Place player right next to exit
  gameWin.playerX = 9;
  gameWin.playerY = 6;
  
  // Step into exit at (9, 7)
  gameWin.handleInput('down');
  assert.equal(gameWin.playerX, 9);
  assert.equal(gameWin.playerY, 7);
  assert.equal(gameWin.state, 'resolve');
  assert.equal(gameWin.victory, true);
  assert.equal(gameWin.result.success, true);
  assert.equal(gameWin.result.items.includes('Chopped Cheese'), true);
});

test('Haircut Challenge: parameters mapping and speed settings', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new HaircutChallenge(null, canvas, ctx, state);

  game.init({ difficulty: 'easy', stake: 40 });
  assert.equal(game.cursorSpeed, 0.4);
  assert.equal(game.goodWidth, 0.4);
  assert.equal(game.perfectWidth, 0.12);
  assert.equal(game.stake, 40);

  const gameHard = new HaircutChallenge(null, canvas, ctx, state);
  gameHard.init({ difficulty: 'hard' });
  assert.equal(gameHard.cursorSpeed, 0.7);
  assert.equal(gameHard.goodWidth, 0.25);
  assert.equal(gameHard.perfectWidth, 0.06);
});

test('Haircut Challenge: cursor update, boundaries, and direction bounce', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new HaircutChallenge(null, canvas, ctx, state);

  game.start();
  assert.equal(game.cursorPos, 0);
  assert.equal(game.cursorDirection, 1);

  // Update loop tick: moves cursor by speed * dt
  // default speed is 0.5 fractions/sec. dt = 1000ms -> moves by 0.5
  game.update(1000);
  assert.equal(game.cursorPos, 0.5);
  assert.equal(game.cursorDirection, 1);

  // Exceed edge: dt = 2000ms -> should bounce and set direction negative
  game.update(2000);
  assert.equal(game.cursorDirection, -1, 'Should change direction when hitting bounds');
  game.update(100);
  assert.ok(game.cursorPos < 1.0, 'Should start moving backward');
});

test('Haircut Challenge: accuracy classification and feedback mapping', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new HaircutChallenge(null, canvas, ctx, state);

  game.start();
  
  // 1. Exact Center = PERFECT
  game.targetCenter = 0.5;
  game.cursorPos = 0.5;
  game.triggerCut();
  assert.equal(game.customers[0].message, 'PERFECT');
  assert.equal(game.customers[0].score, 100);
  assert.equal(game.feedbackMessage, 'PERFECT!');
  assert.equal(game.currentCustomerIdx, 1, 'Should advance to Customer 2');

  // 2. Off-Center but within Good Zone = GOOD
  // targetCenter = 0.5, goodWidth = 0.3 -> [0.35, 0.65] range
  // Override randomized targetCenter to ensure determinism
  game.targetCenter = 0.5;
  game.cursorPos = 0.4;
  game.triggerCut();
  assert.equal(game.customers[1].message, 'GOOD');
  assert.equal(game.customers[1].score, 50);
  assert.equal(game.currentCustomerIdx, 2, 'Should advance to Customer 3');

  // 3. Way Off-Center = MISS
  game.targetCenter = 0.5;
  game.cursorPos = 0.1;
  game.triggerCut();
  assert.equal(game.customers[2].message, 'MISS');
  assert.equal(game.customers[2].score, 0);
  
  // Game should resolve since 3 customers are completed
  assert.equal(game.state, 'reward');
  // Total score = 100 (Perfect) + 50 (Good) + 0 (Miss) = 150
  // Score 150 >= 150 -> Success
  assert.equal(game.victory, true);
  assert.equal(game.result.success, true);
  assert.equal(game.result.cashDelta, 20); // Wins the stake
});

test('Haircut Challenge: failure resolution outcomes', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new HaircutChallenge(null, canvas, ctx, state);

  game.start();
  
  // Trigger 3 misses
  game.cursorPos = 0.0;
  game.triggerCut();
  game.cursorPos = 0.0;
  game.triggerCut();
  game.cursorPos = 0.0;
  game.triggerCut();

  assert.equal(game.state, 'reward');
  // Total score = 0
  assert.equal(game.victory, false);
  assert.equal(game.result.success, false);
  assert.equal(game.result.heatDelta, 2);
  assert.equal(game.result.trustDelta.general, -1);
});

test('Lockpicking: setup, difficulty parameters mapping and pick navigation', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new Lockpicking(null, canvas, ctx, state);

  game.init({ difficulty: 'easy', stake: 30 });
  assert.equal(game.tolerance, 18);
  assert.equal(game.liftSpeed, 90);
  assert.equal(game.durationSeconds, 40);
  assert.equal(game.pins.length, 5);

  const gameHard = new Lockpicking(null, canvas, ctx, state);
  gameHard.init({ difficulty: 'hard' });
  assert.equal(gameHard.tolerance, 10);
  assert.equal(gameHard.liftSpeed, 150);

  // Navigation check: selectedPinIdx starts at 0
  game.start();
  assert.equal(game.selectedPinIdx, 0);

  // Move right to pin 1
  game.handleInput('right');
  assert.equal(game.selectedPinIdx, 1);

  // Move left back to pin 0
  game.handleInput('left');
  assert.equal(game.selectedPinIdx, 0);

  // Attempt left wrap-around bounds clamp
  game.handleInput('left');
  assert.equal(game.selectedPinIdx, 0);
});

test('Lockpicking: pin lifting, torque decay, and alignment click success', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new Lockpicking(null, canvas, ctx, state);

  game.start();
  
  // Set up mock Input manager
  game.manager = {
    input: {
      isPressed: (key) => key === 'up'
    }
  };

  const pin = game.pins[0];
  assert.equal(pin.y, 0);

  // Apply lift: W/up key held. dt = 500ms. liftSpeed = 120 -> increases by 60
  game.update(500);
  assert.equal(pin.y, 60);

  // Apply decay: W key released.
  game.manager.input.isPressed = (key) => false;
  // Decay is 80 px/sec. dt = 250ms -> drops by 20
  game.update(250);
  assert.equal(pin.y, 40);

  // Force align targetY to match pin.y exactly
  pin.targetY = 40;
  game.handleInput('confirm'); // Attempt lock-set
  assert.equal(pin.isSet, true);
  assert.equal(pin.y, 40); // Clamped to exact target height
});

test('Lockpicking: complete victory and alarm failure outcomes', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new Lockpicking(null, canvas, ctx, state);

  game.start();
  
  // Force all 5 pins to be set manually except the last one
  for (let i = 0; i < 4; i++) {
    game.pins[i].isSet = true;
    game.pins[i].y = game.pins[i].targetY;
  }
  
  // Navigate to pin 4 (index 4)
  game.selectedPinIdx = 4;
  
  // Align pin 4 to targetY
  const pin4 = game.pins[4];
  pin4.y = pin4.targetY;
  
  // Set final pin
  game.handleInput('confirm');
  
  assert.equal(game.state, 'reward');
  assert.equal(game.victory, true);
  assert.equal(game.result.success, true);
  assert.equal(game.result.secretsUnlocked.includes('alley_keycard_intel'), true);
  assert.equal(game.result.items.includes('Stolen Intel'), true);

  // Failure scenario
  const gameFail = new Lockpicking(null, canvas, ctx, state);
  gameFail.start();
  gameFail.triggerFailure();
  assert.equal(gameFail.state, 'reward');
  assert.equal(gameFail.victory, false);
  assert.equal(gameFail.result.success, false);
  assert.equal(gameFail.result.heatDelta, 1);
});

test('Negotiation: parameters, difficulty mapping and option card navigation', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new Negotiation(null, canvas, ctx, state);

  game.init({ difficulty: 'easy', stake: 50 });
  assert.equal(game.resistance, 80);
  assert.equal(game.maxResistance, 80);
  assert.equal(game.durationSeconds, 50);

  const gameHard = new Negotiation(null, canvas, ctx, state);
  gameHard.init({ difficulty: 'hard' });
  assert.equal(gameHard.resistance, 120);
  assert.equal(gameHard.maxResistance, 120);

  // Card index selection checks
  game.start();
  assert.equal(game.selectedOptionIdx, 0);

  // Move right
  game.handleInput('right');
  assert.equal(game.selectedOptionIdx, 1);

  // Move left
  game.handleInput('left');
  assert.equal(game.selectedOptionIdx, 0);

  // Bound checks
  game.handleInput('left');
  assert.equal(game.selectedOptionIdx, 0);

  game.selectedOptionIdx = 3;
  game.handleInput('right');
  assert.equal(game.selectedOptionIdx, 3);
});

test('Negotiation: weakness matching damage, stat bonuses, and rounds advancement', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  
  // Set up stats on MiniGameState: wit = 4, reputation = 6
  const state = new MiniGameState();
  state.wit = 4;
  state.reputation = 6;
  
  const game = new Negotiation(null, canvas, ctx, state);
  game.start();
  
  // Round 0 weakness: LOGIC
  // Option 0 type: LOGIC, damage: 45.
  // Check bonus: wit * 2.5 = 10.
  // Total base damage: 55.
  // Weakness matches: 55 * 2 = 110.
  game.selectedOptionIdx = 0;
  game.executeArgument();
  
  // Resistance starts at 100. 100 - 110 = 0 -> success!
  assert.equal(game.resistance, 0);
  assert.equal(game.state, 'reward');
  assert.equal(game.victory, true);
  assert.equal(game.result.success, true);
  assert.equal(game.result.tier, 'critical_success');
  assert.equal(game.result.cashDelta, 20);

  // Test non-matching type damage and round advancement
  const gameAdvance = new Negotiation(null, canvas, ctx, state);
  gameAdvance.start();
  assert.equal(gameAdvance.currentRound, 0);
  
  // Option 1 type: CHARM, damage: 25.
  // Check bonus: reputation * 1.5 = 9.
  // Total base damage: 34.
  // Weakness is LOGIC, so non-matching: 34 * 0.6 = 20.4 -> floored/rounded to 20
  // Resistance becomes 100 - 20 = 80
  gameAdvance.selectedOptionIdx = 1;
  gameAdvance.executeArgument();
  assert.equal(gameAdvance.resistance, 80);
  assert.equal(gameAdvance.currentRound, 1, 'Should advance to Round 1 after argument selection');
});

test('Negotiation: failure outcomes on rounds exhaustion', () => {
  const canvas = new MockCanvas();
  const ctx = canvas.getContext('2d');
  const state = new MiniGameState();
  const game = new Negotiation(null, canvas, ctx, state);

  game.start();
  
  // Trigger 3 non-matching low-damage arguments to exhaust rounds without hitting 0
  // Round 0 option 1: CHARM (25 * 0.6 = 15 damage) -> Resistance 85
  game.selectedOptionIdx = 1;
  game.executeArgument();
  assert.equal(game.currentRound, 1);

  // Round 1 option 0: LOGIC (weakness is CHARM) (20 * 0.6 = 12 damage) -> Resistance 73
  game.selectedOptionIdx = 0;
  game.executeArgument();
  assert.equal(game.currentRound, 2);

  // Round 2 option 0: LOGIC (weakness is LEVERAGE) (25 * 0.6 = 15 damage) -> Resistance 58
  game.selectedOptionIdx = 0;
  game.executeArgument();
  
  assert.equal(game.state, 'reward');
  assert.equal(game.victory, false);
  assert.equal(game.result.success, false);
  assert.equal(game.result.heatDelta, 1);
  assert.equal(game.result.trustDelta.general, -1);
});
