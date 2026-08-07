/**
 * Concrete Kings: The Block Chronicles
 * Mini-Game Base Class & Common API
 */

class MiniGame {
  constructor(manager, canvas, ctx, gameState) {
    this.manager = manager;
    this.canvas = canvas;
    this.ctx = ctx;
    this.gameState = gameState; // Instance of MiniGameState
    this.id = 'base_game';
    this.name = 'Base Mini Game';
    this.description = 'Base description';
    this.triggers = [];
    this.difficulty = 'medium';
    this.durationSeconds = 30;
    this.state = 'lobby'; // lobby, play, resolve, reward, exit
    this.frameAge = 0;
    this.frameIndex = 0;
    this.timeRemaining = 30;
  }

  /**
   * Initializes the game with dynamic parameters (NPC, location, DC, base rewards)
   */
  init(params) {
    this.npc = params.npc || { id: 'unknown', name: 'Stranger' };
    this.location = params.location || 'Unknown location';
    this.difficulty = params.difficulty || 'medium';
    this.durationSeconds = params.durationSeconds || this.durationSeconds;
    this.timeRemaining = this.durationSeconds;
  }

  /**
   * Triggers the transition to start playing
   */
  start() {
    this.state = 'play';
    this.frameAge = 0;
    this.frameIndex = 0;
    this.timeRemaining = this.durationSeconds;
    if (this.manager && typeof this.manager.dispatch === 'function') {
      this.manager.dispatch('minigame:start', { id: this.id });
    }
  }

  /**
   * Main game loop tick update (delta time dt in ms)
   */
  update(dt) {
    if (this.state !== 'play') return;

    this.timeRemaining = Math.max(0, this.timeRemaining - (dt / 1000));
    this.frameAge += dt;
    
    // Strict 4-frame animation budget (120ms frame duration = 8.3 FPS approximation or similar)
    const frameDuration = 120; // ms
    this.frameIndex = Math.floor(this.frameAge / frameDuration) % 4;

    if (this.timeRemaining <= 0) {
      this.autoResolve();
    }
  }

  /**
   * Renders the mini-game onto the overlay virtual canvas
   */
  render(ctx) {
    // Clear canvas bounds (layer 2-5 clear)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Handle mapped input actions
   */
  handleInput(action, value) {
    if (this.state === 'lobby' && action === 'confirm') {
      this.start();
    }
  }

  /**
   * Triggers resolve screen
   */
  resolve(result) {
    this.state = 'resolve';
    this.result = result;
    if (this.manager && typeof this.manager.dispatch === 'function') {
      this.manager.dispatch('minigame:complete', result);
    }
  }

  /**
   * Safe fallback for timer runout
   */
  autoResolve() {
    const result = {
      success: false,
      tier: 'failure',
      trustDelta: {},
      heatDelta: 1,
      cashDelta: 0,
      reputationDelta: -1,
      secretsUnlocked: [],
      flagsSet: [],
      items: [],
      questUpdates: []
    };
    this.resolve(result);
  }

  /**
   * Reset intervals, listeners, etc.
   */
  cleanup() {}

  /**
   * Returns a HUD structure object for the UI overlay
   */
  getHUD() {
    return {
      top: [
        { label: 'MINI GAME', value: this.name },
        { label: 'NPC', value: this.npc ? this.npc.name : 'None' },
        { label: 'LOCATION', value: this.location },
        { label: 'TIME', value: Math.ceil(this.timeRemaining) + 's' }
      ],
      bottom: [
        { label: 'STATUS', value: this.state.toUpperCase() },
        { label: 'DIFFICULTY', value: this.difficulty.toUpperCase() }
      ]
    };
  }
}

class MiniGameState {
  constructor() {
    this.heat = 0;
    this.trust = {};
    this.cash = 0;
    this.reputation = 0;
    this.wit = 0;
    this.soul = 0;
    this.str = 0;
    this.secrets = [];
    this.inventory = [];
    this.history = [];
    this.origin = '';
  }

  /**
   * Load active player statistics from primary engine states
   */
  loadFromEngine(storyEngine, player) {
    if (storyEngine) {
      this.heat = storyEngine.heat || 0;
      this.secrets = [...(storyEngine.secrets || [])];
      // Sync flat storyEngine trust
      this.trust['general'] = storyEngine.trust || 0;
    }
    if (player) {
      if (player.stats) {
        this.cash = player.stats.streetCred || 0;
        this.reputation = player.stats.reputation || 0;
      }
      if (player.attributes) {
        this.wit = player.attributes.wit || 0;
        this.soul = player.attributes.soul || 0;
        this.str = player.attributes.str || 0;
      }
      this.origin = player.origin || '';
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MiniGame,
    MiniGameState
  };
}

if (typeof window !== 'undefined') {
  window.MiniGame = MiniGame;
  window.MiniGameState = MiniGameState;
}
