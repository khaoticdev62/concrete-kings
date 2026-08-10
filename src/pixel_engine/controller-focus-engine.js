/**
 * Concrete Kings: The Block Chronicles
 * Controller Focus Graph & Accessibility Ring Engine (Spec Sections 9, 57-59)
 *
 * Implements a 2D focus navigation graph for D-Pad/Keyboard controller navigation,
 * customizable accessibility focus rings, and remappable controller keybindings.
 */

const DEFAULT_CONTROLLER_MAP = {
  NAV_UP: 'ArrowUp',
  NAV_DOWN: 'ArrowDown',
  NAV_LEFT: 'ArrowLeft',
  NAV_RIGHT: 'ArrowRight',
  SELECT: 'KeyA',
  CANCEL: 'KeyB',
  INSPECT: 'KeyX',
  DETAILS: 'KeyY',
  CYCLE_LEFT: 'KeyLB',
  CYCLE_RIGHT: 'KeyRB',
  PREVIEW: 'KeyLT',
  QUICK_SUBMIT: 'KeyRT',
  CHRONICLE: 'KeyView',
  PAUSE: 'KeyMenu'
};

class ControllerFocusEngine {
  constructor(options = {}) {
    this.keybindings = { ...DEFAULT_CONTROLLER_MAP, ...(options.keybindings || {}) };
    this.accessibility = {
      focusRingWidth: 4,
      highContrastColor: '#ffcd68',
      reduceMotion: false,
      enableAudioTicks: true,
      ...(options.accessibility || {})
    };
    this.focusGraph = new Map();
    this.currentFocusId = null;
  }

  registerNode(id, nodeConfig = {}) {
    this.focusGraph.set(id, {
      id,
      up: nodeConfig.up || null,
      down: nodeConfig.down || null,
      left: nodeConfig.left || null,
      right: nodeConfig.right || null,
      elementId: nodeConfig.elementId || id,
      label: nodeConfig.label || id
    });

    if (!this.currentFocusId) {
      this.currentFocusId = id;
    }
  }

  setFocus(id) {
    if (this.focusGraph.has(id)) {
      const prev = this.currentFocusId;
      this.currentFocusId = id;
      return { previousId: prev, currentId: id, node: this.focusGraph.get(id) };
    }
    return null;
  }

  moveFocus(direction) {
    if (!this.currentFocusId || !this.focusGraph.has(this.currentFocusId)) return null;

    const currentNode = this.focusGraph.get(this.currentFocusId);
    const dirKey = (direction || '').toLowerCase();
    const nextId = currentNode[dirKey];

    if (nextId && this.focusGraph.has(nextId)) {
      return this.setFocus(nextId);
    }

    return null;
  }

  remapKey(action, newKey) {
    if (this.keybindings[action] !== undefined) {
      this.keybindings[action] = newKey;
      return true;
    }
    return false;
  }

  getFocusRingStyle() {
    return {
      outline: `${this.accessibility.focusRingWidth}px solid ${this.accessibility.highContrastColor}`,
      outlineOffset: '3px',
      boxShadow: `0 0 10px ${this.accessibility.highContrastColor}`
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ControllerFocusEngine, DEFAULT_CONTROLLER_MAP };
}
if (typeof window !== 'undefined') {
  window.ControllerFocusEngine = ControllerFocusEngine;
  window.DEFAULT_CONTROLLER_MAP = DEFAULT_CONTROLLER_MAP;
}
