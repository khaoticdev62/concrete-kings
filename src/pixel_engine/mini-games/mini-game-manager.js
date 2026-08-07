/**
 * Concrete Kings: The Block Chronicles
 * Mini-Game Manager System
 */

let MiniGameStateClass;
let MiniGameLoopClass;
let MiniGameInputClass;
let MiniGameUIClass;

if (typeof require !== 'undefined') {
  MiniGameStateClass = require('./mini-game-state.js').MiniGameState;
  MiniGameLoopClass = require('./mini-game-loop.js').MiniGameLoop;
  MiniGameInputClass = require('./mini-game-input.js').MiniGameInput;
  MiniGameUIClass = require('./mini-game-ui.js').MiniGameUI;
} else {
  MiniGameStateClass = typeof MiniGameState !== 'undefined' ? MiniGameState : null;
  MiniGameLoopClass = typeof MiniGameLoop !== 'undefined' ? MiniGameLoop : null;
  MiniGameInputClass = typeof MiniGameInput !== 'undefined' ? MiniGameInput : null;
  MiniGameUIClass = typeof MiniGameUI !== 'undefined' ? MiniGameUI : null;
}

class MiniGameManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.registry = {};
    this.activeGame = null;
    this.gameState = null;
    this.isActive = false;
    
    // Instantiate loop, input, UI elements
    if (MiniGameLoopClass) this.loop = new MiniGameLoopClass();
    if (MiniGameInputClass) this.input = new MiniGameInputClass();
    if (MiniGameUIClass) this.ui = new MiniGameUIClass(canvas);
  }

  registerGame(id, gameClass) {
    this.registry[id] = gameClass;
  }

  start(gameId, params = {}) {
    if (!this.registry[gameId]) {
      console.warn(`MiniGameManager: Game '${gameId}' is not registered.`);
      return false;
    }

    // Stop any running loop
    this.stop();

    this.gameState = new MiniGameStateClass();
    // Copy active variables from narrative engine and human player
    if (typeof app !== 'undefined') {
      const me = app.game ? app.game.players[app.humanIndex] : null;
      this.gameState.loadFromEngine(app.storyEngine, me);
    }

    const GameClass = this.registry[gameId];
    this.activeGame = new GameClass(this, this.canvas, this.ui.virtualCtx, this.gameState);
    this.activeGame.init(params);

    this.isActive = true;
    if (typeof app !== 'undefined') {
      app.miniGameActive = true;
    }

    // Mount canvas visible
    this.canvas.style.display = 'block';
    this.ui.resize();

    // Start input capturing
    this.input.listen();

    // Start requestAnimationFrame loop
    this.loop.start(
      (dt) => this.update(dt),
      () => this.render()
    );

    // Call custom hook inside game
    this.activeGame.start();

    return true;
  }

  update(dt) {
    if (!this.activeGame) return;

    this.input.update();

    // Map inputs to abstract triggers
    const actions = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'action1', 'action2', 'pause'];
    actions.forEach(act => {
      if (this.input.justPressed(act)) {
        this.activeGame.handleInput(act);
      }
    });

    this.activeGame.update(dt);
  }

  render() {
    if (!this.activeGame || !this.ui) return;

    this.ui.clear();

    // Render underlying active game mechanics
    this.activeGame.render(this.ui.virtualCtx);

    // Render standard layout HUD bounds
    this.drawHUD(this.activeGame.getHUD());

    // Blit scaled
    this.ui.present();
  }

  drawHUD(hud) {
    if (!hud || !this.ui) return;

    // Draw top black bar box: 1280x54 at Y=0
    this.ui.drawRetroBox(0, 0, 1280, 54, '#101116', '#2d313d', 2);
    
    if (hud.top) {
      let xOffset = 24;
      hud.top.forEach(item => {
        const labelUpper = String(item.label).toUpperCase();
        let valColor = '#ffcd68';
        if (labelUpper.includes('HEAT')) {
          valColor = '#f25438';
        } else if (labelUpper.includes('REP')) {
          valColor = '#47e589';
        } else if (labelUpper.includes('NAME') || labelUpper.includes('PLAYER')) {
          valColor = '#ffffff';
        }

        this.ui.drawText(`${item.label}:`, xOffset, 18, { font: 'Press Start 2P', size: '10px', color: '#8b95ab' });
        
        // Push value label past the key string
        const valX = xOffset + (item.label.length * 10) + 12;
        this.ui.drawText(String(item.value), valX, 12, { font: 'VT323', size: '22px', color: valColor });
        
        xOffset += 300;
      });
    }

    // Draw bottom bar box: 1280x54 at Y=666
    this.ui.drawRetroBox(0, 666, 1280, 54, '#101116', '#2d313d', 2);
    if (hud.bottom) {
      let xOffset = 24;
      hud.bottom.forEach(item => {
        this.ui.drawText(`${item.label}:`, xOffset, 684, { font: 'Press Start 2P', size: '10px', color: '#8b95ab' });
        
        const valX = xOffset + (item.label.length * 10) + 12;
        this.ui.drawText(String(item.value), valX, 678, { font: 'VT323', size: '22px', color: '#6fe8d8' });
        
        xOffset += 300;
      });
    }
  }

  dispatch(eventType, payload) {
    if (eventType === 'minigame:complete') {
      // Dispatches complete details, cleanup systems
      this.stop();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('minigame:complete', { detail: payload }));
      }
    }
  }

  stop() {
    this.isActive = false;
    if (typeof app !== 'undefined') {
      app.miniGameActive = false;
    }

    if (this.loop) this.loop.stop();
    if (this.input) this.input.stopListening();
    
    if (this.activeGame) {
      this.activeGame.cleanup();
      this.activeGame = null;
    }

    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MiniGameManager
  };
}

if (typeof window !== 'undefined') {
  window.MiniGameManager = MiniGameManager;
}
