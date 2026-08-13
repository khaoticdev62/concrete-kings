/**
 * Concrete Kings: Dynamic Narrative Map — Event Bus (PRD §100)
 *
 * Decoupled pub/sub so map systems communicate via named events instead of
 * tight coupling. Events defined in §100:
 *   location_state_changed, character_moved, relationship_changed,
 *   rumor_created, scenario_created, scenario_expired, scenario_completed,
 *   world_event_started, world_event_ended, time_advanced, scene_started,
 *   scene_completed, plus internal map_* events.
 *
 * Engine-agnostic (no DOM). Used by both state and the AudioDirector.
 */
class DMEventBus {
  constructor() {
    this._handlers = new Map(); // event -> Set<fn>
    this._history = [];          // recent events (capped) for debugging/tests
    this._cap = 200;
  }

  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(fn);
    return () => this.off(event, fn);
  }

  once(event, fn) {
    const off = this.on(event, (payload) => { off(); fn(payload); });
    return off;
  }

  off(event, fn) {
    const set = this._handlers.get(event);
    if (set) set.delete(fn);
  }

  emit(event, payload) {
    const set = this._handlers.get(event);
    if (set) set.forEach(fn => { try { fn(payload); } catch (e) { /* handler errors must not break emitters */ } });
    this._history.push({ event, payload, t: Date.now() });
    if (this._history.length > this._cap) this._history.shift();
    return this;
  }

  clear() { this._handlers.clear(); }

  recent(n) { return this._history.slice(-(n || this._cap)); }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DMEventBus };
}
if (typeof window !== 'undefined') {
  window.DMEventBus = DMEventBus;
}
