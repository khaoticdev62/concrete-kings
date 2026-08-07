/**
 * Concrete Kings: The Block Chronicles
 * Mini-Game Input System
 */

class MiniGameInput {
  constructor() {
    this.keys = {};
    this.actions = {
      up: false,
      down: false,
      left: false,
      right: false,
      confirm: false,
      cancel: false,
      action1: false,
      action2: false,
      pause: false
    };

    // Abstract action mapping
    this.keyMap = {
      'arrowup': 'up', 'w': 'up',
      'arrowdown': 'down', 's': 'down',
      'arrowleft': 'left', 'a': 'left',
      'arrowright': 'right', 'd': 'right',
      'enter': 'confirm', ' ': 'confirm',
      'escape': 'cancel', 'backspace': 'cancel',
      'e': 'action1', 'x': 'action1',
      'q': 'action2', 'y': 'action2'
    };

    this.gamepadDeadzone = 0.2;
    this.lastActions = { ...this.actions };
    
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
  }

  listen() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  stopListening() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.reset();
  }

  reset() {
    this.keys = {};
    for (let key in this.actions) {
      this.actions[key] = false;
      this.lastActions[key] = false;
    }
  }

  onKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = true;
    
    // Abstract map lookup
    const action = this.keyMap[key];
    if (action) {
      this.actions[action] = true;
      
      // Prevent browser default behavior for navigation keys when playing
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter', 'escape'].includes(key)) {
        e.preventDefault();
      }
    }
  }

  onKeyUp(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = false;

    const action = this.keyMap[key];
    if (action) {
      this.actions[action] = false;
    }
  }

  /**
   * Poll gamepads and update action maps (called inside requestAnimationFrame loop)
   */
  update() {
    // Save last frame actions for edge detection (justPressed)
    this.lastActions = { ...this.actions };

    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    
    for (let gp of gamepads) {
      if (!gp) continue;

      // D-Pad buttons mapping
      const dpadUp = gp.buttons[12]?.pressed;
      const dpadDown = gp.buttons[13]?.pressed;
      const dpadLeft = gp.buttons[14]?.pressed;
      const dpadRight = gp.buttons[15]?.pressed;

      // Action buttons mapping (A = 0, B = 1, X = 2, Y = 3)
      const btnA = gp.buttons[0]?.pressed;
      const btnB = gp.buttons[1]?.pressed;
      const btnX = gp.buttons[2]?.pressed;
      const btnY = gp.buttons[3]?.pressed;
      const btnStart = gp.buttons[9]?.pressed;

      // Analog stick mapping (Left stick axes 0 and 1)
      const axisX = gp.axes[0];
      const axisY = gp.axes[1];

      // Update abstract actions
      this.actions.up = this.actions.up || dpadUp || (axisY < -this.gamepadDeadzone);
      this.actions.down = this.actions.down || dpadDown || (axisY > this.gamepadDeadzone);
      this.actions.left = this.actions.left || dpadLeft || (axisX < -this.gamepadDeadzone);
      this.actions.right = this.actions.right || dpadRight || (axisX > this.gamepadDeadzone);
      
      this.actions.confirm = this.actions.confirm || btnA;
      this.actions.cancel = this.actions.cancel || btnB;
      this.actions.action1 = this.actions.action1 || btnX;
      this.actions.action2 = this.actions.action2 || btnY;
      this.actions.pause = this.actions.pause || btnStart;
    }
  }

  isPressed(action) {
    return !!this.actions[action];
  }

  justPressed(action) {
    return !!this.actions[action] && !this.lastActions[action];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MiniGameInput
  };
}

if (typeof window !== 'undefined') {
  window.MiniGameInput = MiniGameInput;
}
