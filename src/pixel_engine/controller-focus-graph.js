/**
 * Concrete Kings: The Block Chronicles
 * Controller Focus Graph & Focus Memory Engine (Spec v3.0)
 *
 * Implements predictable D-pad/keyboard spatial navigation, visible 3px focus outlines,
 * and focus memory stack (restoring focus to the element that opened an overlay).
 */

class ControllerFocusGraph {
  constructor(options = {}) {
    this.nodes = new Map();
    this.currentFocusId = null;
    this.focusStack = [];
    this.onFocusChange = options.onFocusChange || null;
  }

  registerNode(id, element, neighbors = {}) {
    this.nodes.set(id, {
      id,
      element,
      neighbors: {
        up: neighbors.up || null,
        down: neighbors.down || null,
        left: neighbors.left || null,
        right: neighbors.right || null
      }
    });

    // Default focus to first node if none active
    if (!this.currentFocusId) {
      this.setFocus(id);
    }
  }

  unregisterNode(id) {
    if (this.currentFocusId === id) {
      this.currentFocusId = null;
    }
    this.nodes.delete(id);
  }

  clear() {
    if (this.currentFocusId) {
      const current = this.nodes.get(this.currentFocusId);
      if (current && current.element && current.element.classList) {
        current.element.classList.remove('controller-focused');
      }
    }
    this.nodes.clear();
    this.currentFocusId = null;
    this.focusStack = [];
  }

  setFocus(id) {
    const node = this.nodes.get(id);
    if (!node) return false;

    if (this.currentFocusId) {
      const prev = this.nodes.get(this.currentFocusId);
      if (prev && prev.element && prev.element.classList) {
        prev.element.classList.remove('controller-focused');
      }
    }

    this.currentFocusId = id;
    if (node.element) {
      if (node.element.classList) node.element.classList.add('controller-focused');
      if (typeof node.element.focus === 'function') node.element.focus();
    }

    if (typeof this.onFocusChange === 'function') {
      this.onFocusChange(node);
    }

    return true;
  }

  move(direction) { // 'up', 'down', 'left', 'right'
    if (!this.currentFocusId) return false;
    const current = this.nodes.get(this.currentFocusId);
    if (!current) return false;

    const targetId = current.neighbors[direction.toLowerCase()];
    if (targetId && this.nodes.has(targetId)) {
      return this.setFocus(targetId);
    }
    return false;
  }

  pushFocusState() {
    if (this.currentFocusId) {
      this.focusStack.push(this.currentFocusId);
    }
  }

  popFocusState() {
    if (this.focusStack.length > 0) {
      const previousId = this.focusStack.pop();
      if (this.nodes.has(previousId)) {
        this.setFocus(previousId);
        return true;
      }
    }
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ControllerFocusGraph };
}
if (typeof window !== 'undefined') {
  window.ControllerFocusGraph = ControllerFocusGraph;
}
